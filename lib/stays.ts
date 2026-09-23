import { connectDB } from '@/lib/mongodb';
import { PlaceCache, type PlaceCacheDocument } from '@/models/PlaceCache';
import { searchStays, placeName, placePhotoUrls, placeCoordinates, type RawGooglePlace } from '@/lib/googlePlaces';
import { isLocalDevelopment } from '@/lib/env';
import { isRecentFailure, markFailure } from '@/lib/negativeCache';
import { coalesce, COALESCE_LOCKED } from '@/lib/requestCoalescing';
import { classifyPlaceLocation } from '@/lib/placeLocationSafety';
import { classifyVerifiedStayType, verifiedStayTypeMongoExpr, hasTreehouseNameEvidence, treehouseNameMongoPattern } from '@/lib/stayClassification';
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

export interface CachedStaysPage {
  stays: Stay[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const CATALOG_PAGE_SIZE = 24;

interface PlaceCacheAggregateDoc {
  placeId: string;
  name: string;
  slug: string;
  stayType: StayType;
  /** Computed in the aggregation pipeline from Google's own `types` — see
   *  lib/stayClassification.ts. The authoritative type; `stayType` above remains
   *  whatever category's search query originally discovered this place. */
  verifiedStayType: StayType;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  userRatingCount?: number;
  photos: string[];
  customPrice?: number;
  destinationSlug: string;
  updatedAt: Date;
  types?: string[];
  googleMapsUri?: string;
  websiteUri?: string;
  locationClassification: 'exact' | 'nearby' | 'access-base';
}

interface PlaceCacheFacetResult {
  data: PlaceCacheAggregateDoc[];
  totalCount: Array<{ count: number }>;
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

      // Coalesced across concurrent requests for the exact same tuple — see
      // lib/requestCoalescing.ts. A request that loses the race never touches Google;
      // it's reported below as 'COALESCED_IN_FLIGHT' rather than an error.
      const coalesceKey = `${destinationSlug}:${stayType}:${location}`;
      try {
        const result = await coalesce(coalesceKey, () =>
          fetchAndCacheStayType(destinationSlug, location, stayType, apiKey, state, stayMode)
        );
        if (result === COALESCE_LOCKED) {
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
              error: 'COALESCED_IN_FLIGHT'
            }
          };
        }
        const { stays, meta } = result;
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

  // Each category above ran its own independent cache-hit/miss check against
  // PlaceCache's (query-provenance) `stayType` field — necessary and unchanged, since
  // that's what decides whether a Google search actually runs for that category. But
  // the raw union of their results can legitimately contain the SAME real place more
  // than once (discovered by 2+ different category queries — e.g. both the "resort"
  // and "cottage" searches for one destination can return the identical property), and
  // each copy's meaning as "an X" is only ever query provenance, not verified identity
  // (see lib/stayClassification.ts). This final pass is what actually decides what the
  // customer sees: one card per real placeId, labeled by its VERIFIED Google-typed
  // category, kept only if that verified category is one the caller actually asked for
  // (`stayTypes` — e.g. a combined /stays/<destination>/treehouses page must never show
  // a property whose real type turned out to be Hotel just because it was cached under
  // a treehouse-category search).
  const rawStays = perType.flatMap((r) => r.stays);
  const dedupedByPlaceId = new Map<string, Stay>();
  for (const stay of rawStays) {
    const existing = dedupedByPlaceId.get(stay.placeId);
    if (!existing) {
      dedupedByPlaceId.set(stay.placeId, stay);
    } else if ((existing.types?.length ?? 0) === 0 && (stay.types?.length ?? 0) > 0) {
      // Prefer whichever cached copy actually has Google's structured `types` — the
      // same real place can have a stale/typeless row from before that field existed
      // (see models/PlaceCache.ts) alongside a fresher, fully-populated one.
      dedupedByPlaceId.set(stay.placeId, stay);
    }
  }
  const requestedTypes = new Set(stayTypes);
  // Treehouse has no structured Google type to verify a PRIMARY classification from
  // (see lib/stayClassification.ts) — it only ever appears as a SECONDARY listing,
  // and only when the caller asked for treehouse alone (a combined
  // /stays/<destination>/treehouses page), never mixed into a general "all types"
  // destination view, where every real property must still render exactly once.
  const treehouseOnlyRequest = requestedTypes.size === 1 && requestedTypes.has('treehouse');
  const verifiedStays = Array.from(dedupedByPlaceId.values()).flatMap((stay): Stay[] => {
    if (treehouseOnlyRequest) {
      return hasTreehouseNameEvidence(stay.name) ? [{ ...stay, stayType: 'treehouse' }] : [];
    }
    const primaryType = classifyVerifiedStayType(stay.types);
    return requestedTypes.has(primaryType) ? [{ ...stay, stayType: primaryType }] : [];
  });

  return { stays: verifiedStays, meta: perType.map((r) => r.meta) };
}

// Cross-destination "browse by category" aggregation — e.g. /stays/hotels, or a
// destination-less /stays/search. Reads ONLY the existing PlaceCache collection —
// never Google, never fetchAndCacheStayType, never the coalescing lock — so opening
// this on any number of cached or uncached destinations always costs 0 Google Places
// calls; there is no per-destination "miss" concept here at all.
//
// The same real Google property can legitimately be cached under more than one
// destinationSlug (see models/PlaceCache.ts's index comment — e.g. Kinnaur and Sangla
// Valley both resolve to the real town "Sangla") AND under more than one stored
// `stayType` (query provenance — the same place can be returned by more than one
// category's search query for the same destination too), so this dedupes by
// `placeId` alone before paginating — one real property must render as exactly one
// card, no matter how many destinations or category searches it's tagged under.
//
// `stayType` narrows to one category when given, but never against the stored,
// query-provenance `stayType` field — always against `verifiedStayType`, computed
// here from Google's own structured `types` (see lib/stayClassification.ts). A place
// cached under a "resort" search query with no real resort-hotel signal in its actual
// Google types (e.g. "KORA SPITI" — real types: hotel, motel, private_guest_room; no
// resort_hotel) must never appear on /stays/resorts just because that query found it.
//
// `stayType: 'treehouse'` is the one exception — Google has no structured type for it
// (see lib/stayClassification.ts), so it matches on explicit "tree house"/"treehouse"
// evidence in the place's own real Google name instead, and the matched place is
// labeled 'treehouse' for this listing regardless of its real primary type elsewhere
// (a genuine secondary classification, not a reclassification — that same property
// still shows its true primary type on /stays/hotels or wherever else it belongs).
//
// Sorted by real, already-stored fields only (rating, then review count, then a
// placeId tiebreak for stable pagination) — never a fabricated ranking — and paginated
// via $skip/$limit inside the aggregation itself so a "browse everything" request
// never has to load the full cache into memory just to show one page of results.
export async function getCachedStaysCatalog(options: { stayType?: StayType; page?: number; pageSize?: number } = {}): Promise<CachedStaysPage> {
  await connectDB();
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = options.pageSize ?? CATALOG_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const isTreehouseRequest = options.stayType === 'treehouse';
  const dedupeSortStage = {
    // Prefer a copy that actually has Google's structured `types` over a stale/typeless
    // row for the same real place (see models/PlaceCache.ts — `types` wasn't always
    // captured), so classification below is never needlessly forced to the fallback.
    hasTypes: -1 as const,
    rating: -1 as const,
    userRatingCount: -1 as const,
    placeId: 1 as const
  };
  const finalSortStage = { rating: -1 as const, userRatingCount: -1 as const, placeId: 1 as const };

  const matchStage = isTreehouseRequest
    ? { $match: { name: { $regex: treehouseNameMongoPattern(), $options: 'i' } } }
    : options.stayType
      ? { $match: { verifiedStayType: options.stayType } }
      : null;

  const [facetResult] = await PlaceCache.aggregate<PlaceCacheFacetResult>([
    {
      $addFields: {
        hasTypes: { $gt: [{ $size: { $ifNull: ['$types', []] } }, 0] },
        verifiedStayType: verifiedStayTypeMongoExpr()
      }
    },
    // Strips every large field (photos, formattedAddress, googleMapsUri, websiteUri,
    // types, ...) before the full-collection dedupe sort below — that sort previously
    // carried whole documents (10-photo-URL arrays included) across ~5,000+ rows and
    // exceeded Mongo's 32MB in-memory sort limit. Only what dedupeSortStage,
    // finalSortStage, and matchStage (the treehouse name-regex or verifiedStayType
    // filter) actually read needs to survive past this point — every other field is
    // restored afterward, per surviving placeId only, by the $lookup rehydration
    // inside $facet.data below. This never changes which duplicate wins the dedupe
    // (that's still decided purely by dedupeSortStage's values, all of which are kept
    // here), which documents match, or their final order.
    { $project: { _id: 1, placeId: 1, name: 1, hasTypes: 1, verifiedStayType: 1, rating: 1, userRatingCount: 1 } },
    // Determines which duplicate `$first` keeps when grouping below.
    { $sort: dedupeSortStage },
    { $group: { _id: '$placeId', doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
    ...(matchStage ? [matchStage] : []),
    // $group does not guarantee output order, so the real sort is this one, after dedup.
    { $sort: finalSortStage },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: pageSize },
          // $lookup/$unwind below are not contractually guaranteed to preserve input
          // document order the way $sort/$group are — so the order finalSortStage just
          // established is captured here as an explicit `rank` (0-based, matching this
          // page's position) while it's still certain, and re-applied after rehydration
          // rather than assumed to survive the lookup.
          { $group: { _id: null, docs: { $push: '$$ROOT' } } },
          { $unwind: { path: '$docs', includeArrayIndex: 'rank' } },
          { $replaceRoot: { newRoot: { $mergeObjects: ['$docs', { rank: '$rank' }] } } },
          // Rehydrates the complete original document — every field the lightweight
          // $project above dropped — but only for this one page's already-deduped,
          // already-filtered placeIds, never the whole collection.
          { $lookup: { from: PlaceCache.collection.name, localField: '_id', foreignField: '_id', as: 'full' } },
          { $unwind: '$full' },
          {
            $replaceRoot: {
              // `full` is the untouched original document; `verifiedStayType` (computed
              // above, not present on the stored document) and `rank` are carried over
              // from the lightweight doc so classification and ordering survive rehydration.
              newRoot: { $mergeObjects: ['$full', { verifiedStayType: '$verifiedStayType', rank: '$rank' }] }
            }
          },
          { $sort: { rank: 1 } },
          { $project: { rank: 0 } }
        ],
        // Counts the lightweight deduped/filtered stream directly — no rehydration
        // needed just to count, so this stays exactly as cheap as before.
        totalCount: [{ $count: 'count' }]
      }
    }
  ]);

  const docs = facetResult?.data ?? [];
  const totalCount = facetResult?.totalCount?.[0]?.count ?? 0;

  return {
    stays: docs.map((doc) => toStay({ ...doc, stayType: isTreehouseRequest ? 'treehouse' : doc.verifiedStayType })),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize))
  };
}

// Powers the property detail page (/stays/property/<placeId>) — a pure PlaceCache
// read, no Google call of any kind. Every field this page shows (name, rating,
// address, photos, types, googleMapsUri, websiteUri) already comes from the Text
// Search response that originally cached this place (see lib/googlePlaces.ts's
// comment: "no separate Place Details call needed for this"), so opening a property
// detail page — cached or not — never triggers new Google spend.
//
// The same real place can have several cached rows (different destinationSlug/
// searchLocation tags — see models/PlaceCache.ts's index comment); this picks the
// one with real Google `types` data when more than one exists (same preference as
// getCachedStaysCatalog's dedupe), then classifies it exactly like every other
// customer-facing Stay (lib/stayClassification.ts) — never trusting whichever
// category query happened to discover this particular cached row.
export async function getStayByPlaceId(placeId: string): Promise<Stay | null> {
  await connectDB();
  const docs = await PlaceCache.find({ placeId }).lean();
  if (docs.length === 0) return null;

  const best =
    docs.find((doc) => (doc.types?.length ?? 0) > 0) ??
    docs.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))[0];

  return toStay({ ...best, stayType: classifyVerifiedStayType(best.types) });
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
