import { connectDB } from '@/lib/mongodb';
import { PlaceCache, type PlaceCacheDocument } from '@/models/PlaceCache';
import { searchStays, placeName, placePhotoUrls, placeCoordinates, type RawGooglePlace } from '@/lib/googlePlaces';
import { isLocalDevelopment } from '@/lib/env';
import { isRecentFailure, markFailure } from '@/lib/negativeCache';
import { classifyPlaceLocation } from '@/lib/placeLocationSafety';
import { STAY_TYPES, type Stay, type StayType } from '@/types/stay';
import type { StayMode } from '@/config/stayLocations.config';
import type { HotelPackage } from '@/types/hotel';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Per-category discovery diagnostics — see AGENTS.md's 3-state Google Places
 *  inventory expansion mission, Table B. Never includes secrets; safe to return from
 *  an API response or log verbatim. */
export interface StayCategoryMeta {
  stayType: StayType;
  fromCache: boolean;
  queried: boolean;
  pagesFetched: number;
  saturated: boolean;
  rawCount: number;
  duplicatesRemoved: number;
  wrongLocationRejected: number;
  finalCount: number;
  error?: string;
}

export interface StaysForDestinationResult {
  stays: Stay[];
  meta: StayCategoryMeta[];
}

function toStay(
  doc: Pick<
    PlaceCacheDocument,
    | 'placeId'
    | 'name'
    | 'slug'
    | 'stayType'
    | 'formattedAddress'
    | 'latitude'
    | 'longitude'
    | 'rating'
    | 'userRatingCount'
    | 'photos'
    | 'customPrice'
    | 'destinationSlug'
    | 'updatedAt'
    | 'types'
    | 'googleMapsUri'
    | 'websiteUri'
    | 'locationClassification'
  >
): Stay {
  return {
    placeId: doc.placeId,
    name: doc.name,
    slug: doc.slug,
    stayType: doc.stayType,
    formattedAddress: doc.formattedAddress,
    latitude: doc.latitude,
    longitude: doc.longitude,
    rating: doc.rating,
    userRatingCount: doc.userRatingCount,
    photos: doc.photos,
    customPrice: doc.customPrice,
    destinationSlug: doc.destinationSlug,
    updatedAt: new Date(doc.updatedAt).toISOString(),
    source: 'google',
    types: doc.types,
    googleMapsUri: doc.googleMapsUri,
    websiteUri: doc.websiteUri,
    locationClassification: doc.locationClassification
  };
}

function toDevStay(place: RawGooglePlace, destinationSlug: string, stayType: StayType): Stay {
  const { latitude, longitude } = placeCoordinates(place);
  return {
    placeId: place.id,
    name: placeName(place),
    slug: `${destinationSlug}-${slugify(placeName(place))}`,
    stayType,
    formattedAddress: place.formattedAddress,
    latitude,
    longitude,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    photos: placePhotoUrls(place),
    destinationSlug,
    updatedAt: new Date().toISOString(),
    source: 'google',
    types: place.types,
    googleMapsUri: place.googleMapsUri,
    websiteUri: place.websiteUri,
    locationClassification: 'exact'
  };
}

async function fetchAndCacheStayType(
  destinationSlug: string,
  location: string,
  stayType: StayType,
  apiKey: string,
  state: string | undefined,
  stayMode: StayMode | undefined
): Promise<{ stays: Stay[]; meta: Omit<StayCategoryMeta, 'stayType' | 'fromCache' | 'queried' | 'error'> }> {
  const { places: rawPlaces, pagesFetched, saturated } = await searchStays(location, stayType, apiKey, state);

  // Google's own pagination can occasionally hand back the same place across two
  // pages — dedupe strictly by place.id (never by name) before anything else.
  const seenPlaceIds = new Set<string>();
  const uniquePlaces: RawGooglePlace[] = [];
  let duplicatesRemoved = 0;
  for (const place of rawPlaces) {
    if (seenPlaceIds.has(place.id)) {
      duplicatesRemoved += 1;
      continue;
    }
    seenPlaceIds.add(place.id);
    uniquePlaces.push(place);
  }

  let wrongLocationRejected = 0;
  const docs = uniquePlaces
    .map((place) => {
      const classification = classifyPlaceLocation(place.formattedAddress, location, stayMode);
      return { place, classification };
    })
    .filter(({ classification }) => {
      if (classification === 'wrong-location') {
        wrongLocationRejected += 1;
        return false;
      }
      return true;
    })
    .map(({ place, classification }) => {
      const { latitude, longitude } = placeCoordinates(place);
      return {
        placeId: place.id,
        name: placeName(place),
        slug: `${destinationSlug}-${slugify(placeName(place))}`,
        stayType,
        formattedAddress: place.formattedAddress,
        latitude,
        longitude,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        photos: placePhotoUrls(place),
        destinationSlug,
        searchLocation: location,
        types: place.types,
        googleMapsUri: place.googleMapsUri,
        websiteUri: place.websiteUri,
        locationClassification: classification as 'exact' | 'nearby' | 'access-base'
      };
    });

  await connectDB();
  const saved = await Promise.all(
    // Keyed by (placeId, destinationSlug, stayType) — see models/PlaceCache.ts's index
    // comment: two destinations that legitimately share a real search location (e.g.
    // Kinnaur and Sangla Valley both resolving to "Sangla") must each get their own
    // cached copy of the same real place, never overwrite each other's.
    docs.map((doc) =>
      PlaceCache.findOneAndUpdate(
        { placeId: doc.placeId, destinationSlug: doc.destinationSlug, stayType: doc.stayType },
        doc,
        { upsert: true, returnDocument: 'after' }
      ).lean()
    )
  );

  return {
    stays: saved.filter((doc): doc is NonNullable<typeof doc> => Boolean(doc)).map(toStay),
    meta: {
      pagesFetched,
      saturated,
      rawCount: rawPlaces.length,
      duplicatesRemoved,
      wrongLocationRejected,
      finalCount: docs.length
    }
  };
}

// Fetches every requested accommodation category for a destination, using the 30-day
// Mongo cache (models/PlaceCache.ts) per (destinationSlug, stayType, searchLocation)
// tuple and only calling Google for categories that aren't cached yet. Each category
// fails independently — one broken query never blocks the others or the whole page.
// `stayMode` is optional and purely cosmetic (labels a matched result "exact" / "nearby"
// / "access-base" for reporting) — it never loosens the location-safety check itself.
export async function getStaysForDestination(
  destinationSlug: string,
  location: string,
  stayTypes: StayType[] = STAY_TYPES,
  state?: string,
  stayMode?: StayMode
): Promise<StaysForDestinationResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // Local dev and production read the same MongoDB database (there's no separate dev
  // database), so writing dev's mock Places results into PlaceCache doesn't stay local
  // — it leaks into production for as long as that cache entry lives, and production
  // has no API key to ever refresh/replace it (found via a real "Where to stay" photo
  // 503 on production for a mock-sourced Manali listing). Mock data costs nothing to
  // regenerate, so dev fetches it fresh every time instead of ever touching the shared
  // cache — production's caching behavior below is completely unchanged.
  if (isLocalDevelopment()) {
    const perType = await Promise.all(
      stayTypes.map(async (stayType): Promise<{ stays: Stay[]; meta: StayCategoryMeta }> => {
        const { places: rawPlaces, pagesFetched, saturated } = await searchStays(location, stayType, apiKey ?? '', state);
        const stays = rawPlaces.map((place) => toDevStay(place, destinationSlug, stayType));
        return {
          stays,
          meta: {
            stayType,
            fromCache: false,
            queried: true,
            pagesFetched,
            saturated,
            rawCount: rawPlaces.length,
            duplicatesRemoved: 0,
            wrongLocationRejected: 0,
            finalCount: stays.length
          }
        };
      })
    );
    return { stays: perType.flatMap((r) => r.stays), meta: perType.map((r) => r.meta) };
  }

  await connectDB();

  const perType = await Promise.all(
    stayTypes.map(async (stayType): Promise<{ stays: Stay[]; meta: StayCategoryMeta }> => {
      // `searchLocation` is part of the read key — see models/PlaceCache.ts's field
      // comment — so a destination whose canonical search location changes (as several
      // did in Phase B) never has a stale prior-location row served as if still valid.
      const cached = await PlaceCache.find({ destinationSlug, stayType, searchLocation: location }).lean();
      if (cached.length > 0) {
        const stays = cached.map(toStay);
        return {
          stays,
          meta: {
            stayType,
            fromCache: true,
            queried: false,
            pagesFetched: 0,
            saturated: true,
            rawCount: stays.length,
            duplicatesRemoved: 0,
            wrongLocationRejected: 0,
            finalCount: stays.length
          }
        };
      }

      if (!apiKey) {
        console.warn(`GOOGLE_PLACES_API_KEY is not set — skipping live "${stayType}" search for "${location}"`);
        return {
          stays: [],
          meta: {
            stayType,
            fromCache: false,
            queried: false,
            pagesFetched: 0,
            saturated: false,
            rawCount: 0,
            duplicatesRemoved: 0,
            wrongLocationRejected: 0,
            finalCount: 0,
            error: 'API_KEY_MISSING'
          }
        };
      }

      const failureKey = `stay:${destinationSlug}:${stayType}`;
      if (isRecentFailure(failureKey)) {
        return {
          stays: [],
          meta: {
            stayType,
            fromCache: false,
            queried: false,
            pagesFetched: 0,
            saturated: false,
            rawCount: 0,
            duplicatesRemoved: 0,
            wrongLocationRejected: 0,
            finalCount: 0,
            error: 'NEGATIVE_CACHE'
          }
        };
      }

      try {
        const { stays, meta } = await fetchAndCacheStayType(destinationSlug, location, stayType, apiKey, state, stayMode);
        return { stays, meta: { stayType, fromCache: false, queried: true, ...meta } };
      } catch (error) {
        console.error(`Failed to fetch "${stayType}" stays for "${location}" from Google Places`, error);
        markFailure(failureKey);
        return {
          stays: [],
          meta: {
            stayType,
            fromCache: false,
            queried: true,
            pagesFetched: 0,
            saturated: false,
            rawCount: 0,
            duplicatesRemoved: 0,
            wrongLocationRejected: 0,
            finalCount: 0,
            error: error instanceof Error ? error.message.slice(0, 200) : 'UNKNOWN_ERROR'
          }
        };
      }
    })
  );

  return { stays: perType.flatMap((r) => r.stays), meta: perType.map((r) => r.meta) };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Attaches live Google rating/photos to our own bookable HotelPackage listings, matched
// by an EXACT normalized name match within the same location group only — never a fuzzy
// a.includes(b)||b.includes(a) substring match (see AGENTS.md Phase C section 8: that
// pattern risks attaching one real property's rating/photos to a different hotel with a
// similar name). Hotel has no stored Google Place ID today, so exact-name-within-same-
// location is the strongest identity signal actually available; an ambiguous or absent
// match is left unenriched rather than guessed at. Never blocks or throws on a miss.
export async function enrichHotelsWithPlaces(hotels: HotelPackage[]): Promise<HotelPackage[]> {
  if (!process.env.GOOGLE_PLACES_API_KEY || hotels.length === 0) {
    return hotels;
  }

  const locations = Array.from(new Set(hotels.map((hotel) => hotel.location)));

  try {
    const staysByLocation = new Map<string, Stay[]>(
      await Promise.all(
        locations.map(async (location) => {
          const { stays } = await getStaysForDestination(slugify(location), location);
          return [location, stays] as const;
        })
      )
    );

    return hotels.map((hotel) => {
      const candidates = staysByLocation.get(hotel.location) ?? [];
      const match = candidates.find((candidate) => normalizeName(candidate.name) === normalizeName(hotel.title));
      return match ? { ...hotel, places: match } : hotel;
    });
  } catch (error) {
    console.error('Failed to enrich hotels with Google Places data — returning hotels unchanged', error);
    return hotels;
  }
}
