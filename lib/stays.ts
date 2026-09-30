import { connectDB } from '@/lib/mongodb';
import { PlaceCache, type PlaceCacheDocument } from '@/models/PlaceCache';
import { searchStays, placeName, placePhotoUrls, placeCoordinates, type RawGooglePlace } from '@/lib/googlePlaces';
import { isLocalDevelopment } from '@/lib/env';
import { classifyVerifiedStayType, verifiedStayTypeMongoExpr, hasTreehouseNameEvidence, treehouseNameMongoPattern } from '@/lib/stayClassification';
import { filterOutExcludedPlaces, getActiveExclusionSet, isPropertyExcluded } from '@/services/properties/propertyExclusion.service';
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

// PUBLIC READ PATH — Mongo-only, by construction. This is the one function every real
// visitor/crawler-facing route calls (app/stays/search/page.tsx, app/api/destinations's
// `type=stays` handler, which components/modules/StaysGrid.tsx fetches client-side).
// It reads PlaceCache and PlaceCache alone — there is no code path here that can reach
// Google, so there's nothing for a user-agent check to gate: a bot and a visitor run the
// exact same Mongo-only query. A cache miss (a destination/stayType combo the daily
// refresh job — lib/staysRefresh.ts — hasn't populated yet) returns an honest empty
// result with `error: 'NOT_YET_REFRESHED'`, never a live fallback fetch. Populating
// PlaceCache from Google now happens ONLY in lib/staysRefresh.ts, invoked ONLY by
// app/api/cron/refresh-stays/route.ts on a controlled schedule (see vercel.json) — see
// the Phase 1 Google Places cost-control audit for the full before/after architecture.
// `stayMode` remains part of this function's signature for call-site compatibility, but
// is no longer read here — it only ever affected write-time classification, which now
// happens exclusively in lib/staysRefresh.ts.
export async function getStaysForDestination(
  destinationSlug: string,
  location: string,
  stayTypes: StayType[] = STAY_TYPES,
  _state?: string,
  _stayMode?: StayMode
): Promise<StaysForDestinationResult> {
  // Local dev never reads/writes the shared PlaceCache at all (see the comment this
  // replaced) — it calls searchStays() directly, which itself short-circuits to mock
  // data whenever NODE_ENV is 'development' (lib/googlePlaces.ts), so this still never
  // spends a real Google credit; it's simply not part of the Mongo-only public path this
  // function now guarantees for every other environment.
  if (isLocalDevelopment()) {
    const perType = await Promise.all(
      stayTypes.map(async (stayType): Promise<{ stays: Stay[]; meta: StayCategoryMeta }> => {
        const { places: rawPlaces, pagesFetched, saturated } = await searchStays(location, stayType, '', _state);
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
        // A row can have been cached before its place was ever excluded — filtering only
        // at refresh-write time (lib/staysRefresh.ts) would leave it visible here until
        // the next refresh cycle. Every read of an already-cached row is filtered too, so
        // an exclusion takes effect immediately, not just for future Google refreshes.
        const visibleCached = await filterOutExcludedPlaces('google', cached);
        const stays = visibleCached.map(toStay);
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

      // Honest empty state — the daily refresh job (lib/staysRefresh.ts) hasn't cached
      // this (destinationSlug, stayType, location) combo yet. Never a live Google call
      // from a public request, regardless of who or what is asking.
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
          error: 'NOT_YET_REFRESHED'
        }
      };
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

  // This is a cache-only, whole-collection read — the only way an exclusion can be
  // enforced here is a $match stage against the current active-exclusion set, run before
  // pagination/counting so both stay accurate. Placed first, before every other stage,
  // so an excluded row never survives into the (more expensive) dedupe sort at all.
  const excludedPlaceIds = await getActiveExclusionSet('google');
  const exclusionMatchStage = excludedPlaceIds.size > 0 ? [{ $match: { placeId: { $nin: Array.from(excludedPlaceIds) } } }] : [];

  const [facetResult] = await PlaceCache.aggregate<PlaceCacheFacetResult>([
    ...exclusionMatchStage,
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
  // A property owner's exclusion request must hold even for a direct URL that already
  // exists and is already indexed/bookmarked — never just the listing surfaces. Returns
  // the exact same `null` an unknown/mistyped placeId already returns, so the page's
  // existing notFound() call (app/stays/[...segments]/page.tsx) fires unchanged; an
  // excluded property gets a genuine 404, never a distinguishable "excluded" response
  // that would confirm to a visitor that this specific ID once existed.
  if (await isPropertyExcluded('google', placeId)) return null;

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
