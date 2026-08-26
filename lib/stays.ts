import { connectDB } from '@/lib/mongodb';
import { PlaceCache, type PlaceCacheDocument } from '@/models/PlaceCache';
import { searchStays, placeName, placePhotoUrls, type RawGooglePlace } from '@/lib/googlePlaces';
import { isLocalDevelopment } from '@/lib/env';
import { isRecentFailure, markFailure } from '@/lib/negativeCache';
import { CATEGORY_TO_STAY_TYPE, STAY_TYPES, type Stay, type StayType } from '@/types/stay';
import type { HotelPackage } from '@/types/hotel';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toStay(doc: Pick<PlaceCacheDocument, 'placeId' | 'name' | 'slug' | 'stayType' | 'formattedAddress' | 'rating' | 'userRatingCount' | 'photos' | 'customPrice' | 'destinationSlug' | 'updatedAt'>): Stay {
  return {
    placeId: doc.placeId,
    name: doc.name,
    slug: doc.slug,
    stayType: doc.stayType,
    formattedAddress: doc.formattedAddress,
    rating: doc.rating,
    userRatingCount: doc.userRatingCount,
    photos: doc.photos,
    customPrice: doc.customPrice,
    destinationSlug: doc.destinationSlug,
    updatedAt: new Date(doc.updatedAt).toISOString()
  };
}

function toDevStay(place: RawGooglePlace, destinationSlug: string, stayType: StayType): Stay {
  return {
    placeId: place.id,
    name: placeName(place),
    slug: `${destinationSlug}-${slugify(placeName(place))}`,
    stayType,
    formattedAddress: place.formattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    photos: placePhotoUrls(place),
    destinationSlug,
    updatedAt: new Date().toISOString()
  };
}

async function fetchAndCacheStayType(
  destinationSlug: string,
  location: string,
  stayType: StayType,
  apiKey: string,
  state?: string
): Promise<Stay[]> {
  const rawPlaces = await searchStays(location, stayType, apiKey, state);

  const docs = rawPlaces.map((place: RawGooglePlace) => ({
    placeId: place.id,
    name: placeName(place),
    slug: `${destinationSlug}-${slugify(placeName(place))}`,
    stayType,
    formattedAddress: place.formattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    photos: placePhotoUrls(place),
    destinationSlug
  }));

  await connectDB();
  const saved = await Promise.all(
    docs.map((doc) =>
      PlaceCache.findOneAndUpdate({ placeId: doc.placeId }, doc, { upsert: true, returnDocument: 'after' }).lean()
    )
  );

  return saved.filter((doc): doc is NonNullable<typeof doc> => Boolean(doc)).map(toStay);
}

// Fetches every requested accommodation category for a destination, using the 30-day
// Mongo cache (models/PlaceCache.ts) per (destinationSlug, stayType) pair and only
// calling Google for categories that aren't cached yet. Each category fails
// independently — one broken query never blocks the others or the whole page.
export async function getStaysForDestination(
  destinationSlug: string,
  location: string,
  stayTypes: StayType[] = STAY_TYPES,
  state?: string
): Promise<Stay[]> {
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
      stayTypes.map(async (stayType) => {
        const rawPlaces = await searchStays(location, stayType, apiKey ?? '', state);
        return rawPlaces.map((place) => toDevStay(place, destinationSlug, stayType));
      })
    );
    return perType.flat();
  }

  await connectDB();

  const perType = await Promise.all(
    stayTypes.map(async (stayType) => {
      const cached = await PlaceCache.find({ destinationSlug, stayType }).lean();
      if (cached.length > 0) return cached.map(toStay);

      if (!apiKey) {
        console.warn(`GOOGLE_PLACES_API_KEY is not set — skipping live "${stayType}" search for "${location}"`);
        return [];
      }

      const failureKey = `stay:${destinationSlug}:${stayType}`;
      if (isRecentFailure(failureKey)) return [];

      try {
        return await fetchAndCacheStayType(destinationSlug, location, stayType, apiKey, state);
      } catch (error) {
        console.error(`Failed to fetch "${stayType}" stays for "${location}" from Google Places`, error);
        markFailure(failureKey);
        return [];
      }
    })
  );

  return perType.flat();
}

// Attaches live Google rating/photos to our own bookable HotelPackage listings, matched
// by a loose case-insensitive substring on name (preferring a same-category Stay match)
// — never blocks or throws on a miss.
export async function enrichHotelsWithPlaces(hotels: HotelPackage[]): Promise<HotelPackage[]> {
  if (!process.env.GOOGLE_PLACES_API_KEY || hotels.length === 0) {
    return hotels;
  }

  const locations = Array.from(new Set(hotels.map((hotel) => hotel.location)));

  try {
    const staysByLocation = new Map<string, Stay[]>(
      await Promise.all(
        locations.map(async (location) => [location, await getStaysForDestination(slugify(location), location)] as const)
      )
    );

    return hotels.map((hotel) => {
      const candidates = staysByLocation.get(hotel.location) ?? [];
      const preferredType = CATEGORY_TO_STAY_TYPE[hotel.category];
      const nameMatches = candidates.filter((candidate) => {
        const a = candidate.name.toLowerCase();
        const b = hotel.title.toLowerCase();
        return a.includes(b) || b.includes(a);
      });
      const match = nameMatches.find((candidate) => candidate.stayType === preferredType) ?? nameMatches[0];
      return match ? { ...hotel, places: match } : hotel;
    });
  } catch (error) {
    console.error('Failed to enrich hotels with Google Places data — returning hotels unchanged', error);
    return hotels;
  }
}
