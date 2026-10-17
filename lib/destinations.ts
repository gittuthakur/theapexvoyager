import { cache } from 'react';
import { connectDB } from '@/lib/mongodb';
import { DestinationSearchCache } from '@/models/DestinationSearchCache';
import { Destination as DestinationModel, type DestinationDocument } from '@/models/Destination';
import { searchDestinations, placeName, placePhotoUrls, type RawGooglePlace } from '@/lib/googlePlaces';
import { photoPersistenceMode } from '@/lib/photoPersistenceMode';
import { logPhotoShadowSummary, summarizePhotoShadow } from '@/lib/photoProvenanceShadow';
import { isRecentFailure, markFailure } from '@/lib/negativeCache';
import { isLocalDevelopment } from '@/lib/env';
import { findDestinationByText } from '@/lib/search/destinationResolver';
import { destinations as mockDestinations } from '@/config/destinations.config';
import { STAY_LOCATION_RULES } from '@/config/stayLocations.config';
import { ExclusionLookupError, getActiveExclusionSet } from '@/services/properties/propertyExclusion.service';
import type { Destination } from '@/types/destination';

export function toDestination(doc: DestinationDocument): Destination {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    description: doc.description,
    toursCount: doc.toursCount,
    image: doc.image,
    link: doc.link,
    region: doc.region,
    state: doc.state,
    regionId: doc.regionId ? String(doc.regionId) : undefined,
    editorialDescription: doc.editorialDescription,
    bestTime: doc.bestTime,
    idealDuration: doc.idealDuration,
    altitude: doc.altitude,
    travelStyles: doc.travelStyles,
    seasons: doc.seasons,
    highlights: doc.highlights,
    places: doc.places,
    experiences: doc.experiences,
    relatedSlugs: doc.relatedSlugs,
    seo: doc.seo,
    isPopular: doc.isPopular,
    priority: doc.priority,
    personality: doc.personality,
    badge: doc.badge,
    popularityScore: doc.popularityScore,
    apexScore: doc.apexScore,
    apexPicks: doc.apexPicks,
    hiddenGems: doc.hiddenGems,
    travelTips: doc.travelTips,
    matchScores: doc.matchScores,
    seasonalNotes: doc.seasonalNotes,
    bestFor: doc.bestFor,
    coordinates: doc.coordinates,
    accessType: doc.accessType,
    registrationInfo: doc.registrationInfo,
    officialAdvisoryUrl: doc.officialAdvisoryUrl,
    accessJourney: doc.accessJourney,
    roadHead: doc.roadHead,
    stayBaseLocations: doc.stayBaseLocations,
    placeId: doc.placeId,
    formattedAddress: doc.formattedAddress,
    photos: doc.photos,
    rating: doc.rating,
    userRatingCount: doc.userRatingCount,
    lastSyncedAt: doc.lastSyncedAt,
    source: doc.source
  };
}

export const DEFAULT_HIMACHAL_LOCATIONS = ['Spiti', 'Manali', 'Shimla', 'Kasol', 'Jibhi', 'Dharamshala'];

function normalizeLocation(location: string): string {
  return location.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Fix A (public Google cost protection): the live Google Text Search below is only ever run for a location
// the site itself already authors — the default Himachal locations, every destination title, and every stay
// location (primary and nearby) in config/stayLocations.config.ts. Any other string is NOT a place this site
// serves, so it can neither spend a Google request nor create a DestinationSearchCache document. That bounds
// both the Google spend and the cache collection to this finite, reviewed set, whatever a caller sends.
let approvedLocationsMemo: Set<string> | undefined;

function approvedLiveSearchLocations(): Set<string> {
  if (!approvedLocationsMemo) {
    const names = [
      ...DEFAULT_HIMACHAL_LOCATIONS,
      ...mockDestinations.map((destination) => destination.title),
      ...STAY_LOCATION_RULES.flatMap((rule) => [rule.primaryStayLocation, ...(rule.nearbyStayLocations ?? [])])
    ];
    approvedLocationsMemo = new Set(names.map(normalizeLocation));
  }
  return approvedLocationsMemo;
}

export function isApprovedLiveSearchLocation(location: string): boolean {
  return approvedLiveSearchLocations().has(normalizeLocation(location));
}

/** Server-side kill switch: GOOGLE_DESTINATION_LIVE_SEARCH=disabled stops every live Google destination search
 *  (an already-cached result is still served, after exclusion filtering). Unset or any other value = enabled, so
 *  it changes nothing in an environment that does not set it. */
export function isLiveDestinationSearchDisabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.GOOGLE_DESTINATION_LIVE_SEARCH?.trim().toLowerCase() === 'disabled';
}

function mapPlaceToDestination(place: RawGooglePlace, location: string): Destination {
  const slug = `${normalizeLocation(location)}-${place.id}`.replace(/[^a-z0-9-]/g, '').slice(0, 80);
  const photos = placePhotoUrls(place);
  return {
    slug,
    title: placeName(place),
    category: location,
    description: place.formattedAddress ?? `A popular place to visit near ${location}, Himachal Pradesh.`,
    toursCount: 0,
    image: photos[0] ?? mockDestinations[0].image,
    placeId: place.id,
    formattedAddress: place.formattedAddress,
    photos,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    lastSyncedAt: new Date().toISOString(),
    source: isLocalDevelopment() ? 'mock' : 'google-places'
  };
}

/** `unavailable` is true only when the owner-exclusion list could not be read: Google-sourced results are then
 *  withheld entirely (fail closed) — never returned, never written to the cache — and callers must not cache it. */
export interface DestinationsLookup {
  destinations: Destination[];
  unavailable?: boolean;
}

export async function getDestinationsForLocationResult(location: string, options: { liveSearch?: boolean } = {}): Promise<DestinationsLookup> {
  const liveSearch = options.liveSearch ?? true;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const needle = normalizeLocation(location);
  // A blank needle would match every title (`''` is a substring of everything), so it matches nothing instead.
  const mockFallback = (): DestinationsLookup => ({
    destinations: needle
      ? mockDestinations.filter((destination) => destination.title.toLowerCase().includes(needle) || destination.slug.includes(needle))
      : []
  });

  // Not a location this site authors: no Google call, no cache read or write (a legacy cache document for an
  // arbitrary string must not be served either) — the same safe curated-only answer a failed lookup gives.
  if (!isApprovedLiveSearchLocation(location)) return mockFallback();

  if (!apiKey) {
    console.warn(`GOOGLE_PLACES_API_KEY is not set — using mock destination data for "${location}"`);
    return mockFallback();
  }

  // The owner-exclusion list is read BEFORE any Google spend or cache access. If it cannot be read, nothing from
  // Google is shown or stored.
  let excluded: Set<string>;
  try {
    excluded = await getActiveExclusionSet('google');
  } catch (error) {
    if (error instanceof ExclusionLookupError) return { destinations: [], unavailable: true };
    throw error;
  }
  const visible = (items: Destination[]): Destination[] => items.filter((item) => !item.placeId || !excluded.has(item.placeId));

  await connectDB();

  const key = normalizeLocation(location);
  const failureKey = `destination:${key}`;

  try {
    const cached = await DestinationSearchCache.findOne({ location: key }).lean();
    // A document cached before a property was excluded is filtered on every read too.
    if (cached) return { destinations: Array.isArray(cached.results) ? visible(cached.results as Destination[]) : [] };

    if (!liveSearch || isLiveDestinationSearchDisabled()) return mockFallback();
    if (isRecentFailure(failureKey)) return mockFallback();

    const rawPlaces = await searchDestinations(location, apiKey);
    // Only the filtered list is ever written, so an excluded place is never persisted by this path.
    const mapped = visible(rawPlaces.map((place) => mapPlaceToDestination(place, location)));
    // Shadow monitoring (opt-in, default off): ONE numbers-only log line about the photo values about to be cached. Nothing about the
    // cache write, the returned destinations or any response changes, and this public path exposes no statistics.
    try {
      if (photoPersistenceMode(process.env) === 'shadow') logPhotoShadowSummary('destination-search', summarizePhotoShadow(mapped.map((destination) => destination.photos)));
    } catch {
      // Monitoring must never turn a good search into the mock-data fallback: ignore any failure and continue exactly as in legacy mode.
    }
    await DestinationSearchCache.findOneAndUpdate({ location: key }, { location: key, results: mapped }, { upsert: true });
    return { destinations: mapped };
  } catch (error) {
    console.error(`Failed to fetch destinations for "${location}" from Google Places — falling back to mock data`, error);
    markFailure(failureKey);
    return mockFallback();
  }
}

export async function getDestinationsForLocation(location: string): Promise<Destination[]> {
  return (await getDestinationsForLocationResult(location)).destinations;
}

export async function getDestinationsWithFallbackResult(): Promise<DestinationsLookup> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.warn('GOOGLE_PLACES_API_KEY is not set — using static mock destinations');
    return { destinations: mockDestinations };
  }

  try {
    const results = await Promise.all(DEFAULT_HIMACHAL_LOCATIONS.map((location) => getDestinationsForLocationResult(location)));
    if (results.some((result) => result.unavailable)) return { destinations: [], unavailable: true };
    const flattened = results.flatMap((result) => result.destinations);
    return { destinations: flattened.length > 0 ? flattened : mockDestinations };
  } catch (error) {
    console.error('Failed to build the Himachal destinations list from Google Places — falling back to mock data', error);
    return { destinations: mockDestinations };
  }
}

export async function getDestinationsWithFallback(): Promise<Destination[]> {
  return (await getDestinationsWithFallbackResult()).destinations;
}

// PUBLIC READ PATH — both functions below filter `status: 'published'` at the database
// query itself (Phase 3B), mirroring lib/packages.ts's identical Journey convention.
// This is deliberately the ONE place that rule lives: every public surface (the
// homepage grid, the /destinations listing and search, the Region Hub's per-region
// destination list, a Journey's "Explore the Destination" links, related-destination
// sections, and the public /api/destinations routes) goes through one of these two
// functions, so a draft Destination is structurally unreachable from any of them. See
// proxy.ts for the matching existence-check filter that keeps a draft slug's direct URL
// from soft-404ing instead of cleanly 404ing, and app/sitemap.ts/
// services/regions/regionHub.service.ts for the two remaining direct-query sites that
// don't go through this file at all and carry their own matching filter.
//
// The curated directory — lives in MongoDB (see models/Destination.ts, seeded from
// config/destinations.config.ts by scripts/seed.ts).
export async function getCuratedDestinations(options: { maxTimeMS?: number; projection?: Record<string, 1>; signal?: AbortSignal } = {}): Promise<Destination[]> {
  await connectDB();
  // Optional `projection` (global search): read only the fields search uses. The converters below copy fields one by
  // one and tolerate missing ones, so a projected read is safe. Omitted = every field, as before.
  // Optional server-side time bound (used by the global search API): with `maxTimeMS` set, MongoDB itself abandons
  // a slow read, so it cannot keep consuming database resources after the caller gave up. Omitted = the query is
  // built exactly as before.
  const base = options.projection ? DestinationModel.find({ status: 'published' }, options.projection) : DestinationModel.find({ status: 'published' });
  const query = base.sort({ priority: 1 });
  const bounded = options.maxTimeMS ? query.maxTimeMS(options.maxTimeMS) : query;
  // Optional AbortSignal (global search): the driver cancels the operation when it aborts. Omitted = exactly as before.
  const docs = await (options.signal ? bounded.setOptions({ signal: options.signal } as never) : bounded).lean<DestinationDocument[]>();
  return JSON.parse(JSON.stringify(docs.map(toDestination)));
}

/** Published destinations reduced to slug/title/state — a projection read for callers (stay search/eligibility)
 *  that must not load every destination's full editorial document. */
export async function getPublishedDestinationRefs(options: { maxTimeMS?: number; signal?: AbortSignal } = {}): Promise<Array<{ slug: string; title: string; state?: string }>> {
  await connectDB();
  const query = DestinationModel.find({ status: 'published' }, { slug: 1, title: 1, state: 1 }).sort({ priority: 1 });
  // Optional database time limit and AbortSignal (global search): omitted = exactly as before. Always the published-only filter, never cached.
  const bounded = options.maxTimeMS ? query.maxTimeMS(options.maxTimeMS) : query;
  const docs = await (options.signal ? bounded.setOptions({ signal: options.signal } as never) : bounded).lean<Array<Pick<DestinationDocument, 'slug' | 'title' | 'state'>>>();
  return docs.map((doc) => ({ slug: doc.slug, title: doc.title, state: doc.state }));
}

// React's cache() request-memoizes this by `slug` — app/destinations/[slug]/page.tsx's
// generateMetadata and the page component itself both call this independently for the
// same request, and without memoization that would run the same lookup twice.
export const getCuratedDestinationBySlug = cache(async (slug: string): Promise<Destination | undefined> => {
  await connectDB();
  const doc = await DestinationModel.findOne({ slug, status: 'published' }).lean<DestinationDocument | null>();
  return doc ? JSON.parse(JSON.stringify(toDestination(doc))) : undefined;
});

/**
 * Case-insensitive substring match against the curated destinations' titles — mirrors
 * lib/experiences.ts's getExperiencesByDestination. Used by lib/bookingContext.ts to
 * link a Hotel/Experience (which only carry a free-text `location`, not a destination
 * slug) back to a curated Destination for region/travel-style prefill.
 */
export async function findDestinationByLocationText(text: string): Promise<Destination | undefined> {
  const needle = normalizeLocation(text);
  if (!needle) return undefined;
  const curated = await getCuratedDestinations();
  return curated.find(
    (destination) => needle.includes(destination.title.toLowerCase()) || destination.title.toLowerCase().includes(needle)
  );
}

/**
 * Search-grade resolution of free text (a transport pickup/drop) to ONE published destination. Unlike
 * findDestinationByLocationText it never picks the first of several candidates: ambiguous or unknown
 * text resolves to undefined. Handles verified spelling aliases ("Dharamsala" -> Dharamshala).
 */
export async function resolveCuratedDestinationForSearch(text: string): Promise<Destination | undefined> {
  if (!text.trim()) return undefined;
  return findDestinationByText(await getCuratedDestinations(), text);
}

export async function getDestinationBySlug(slug: string): Promise<Destination | undefined> {
  const curated = await getCuratedDestinationBySlug(slug);
  if (curated) return curated;

  // Not one of our curated destinations. The slug is caller-controlled (it arrives from a public query string via
  // lib/bookingContext.ts), so it may only ever be matched against an already-cached result for an approved
  // location — it can never start a live Google search, and an unknown slug resolves to undefined.
  const guessLocation = slug.replace(/-/g, ' ');
  const { destinations } = await getDestinationsForLocationResult(guessLocation, { liveSearch: false });
  // Only a cached Google-sourced entry (it carries a placeId) counts: the curated-config fallback list is not a
  // match for this slug, and it would otherwise surface an unpublished destination's config title.
  return destinations.find((destination) => destination.placeId);
}
