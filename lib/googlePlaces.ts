// Thin client for the Google Places API (New) Text Search + Photo Media endpoints.
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
import type { StayType } from '@/types/stay';
import { isLocalDevelopment } from '@/lib/env';
import { getMockPlaces } from '@/lib/mockPlacesData';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
  'places.types',
  'places.googleMapsUri',
  'places.websiteUri',
  'nextPageToken'
].join(',');

export interface RawGooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  // Standard Text Search (New) field — no separate Place Details call needed for this.
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{ name: string }>;
  types?: string[];
  googleMapsUri?: string;
  websiteUri?: string;
}

const REQUEST_TIMEOUT_MS = 8000;
// Matches what a single grid/carousel actually shows on screen — Google bills and
// serializes per result, so asking for more than we render is pure waste.
const DEFAULT_PAGE_SIZE = 8;
// Text Search (New) caps pageSize at 20; hard ceiling on how many pages
// searchPlacesAllPages will follow via nextPageToken — bounds both Google spend and
// response latency instead of exhausting every page Google is willing to return.
const MAX_PAGES = 3;

interface SearchTextResponse {
  places?: RawGooglePlace[];
  nextPageToken?: string;
}

async function searchTextOnce(
  body: { textQuery?: string; pageToken?: string; pageSize?: number },
  apiKey: string
): Promise<SearchTextResponse> {
  // Fetch has no default timeout — a blocked/slow host would otherwise hang the
  // calling page (getStaysForDestination, getDestinationsForLocation) indefinitely
  // instead of falling back to mock data.
  //
  // `next.revalidate` is the Next.js Data Cache hint the framework itself can use —
  // real request de-duplication/TTL for this endpoint is the Mongo-backed cache in
  // lib/destinations.ts / lib/stays.ts (which also works for the read paths that
  // never go through this fetch at all, e.g. a cache hit). `cache: 'no-store'` and
  // `next.revalidate` are mutually exclusive, so this fetch no longer opts out.
  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK
    },
    body: JSON.stringify(body),
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Google Places searchText failed (${res.status}): ${errBody.slice(0, 300)}`);
  }

  return (await res.json()) as SearchTextResponse;
}

// Exported (in addition to the Himachal-flavored searchDestinations/searchStays below)
// so region-neutral callers — e.g. services/providers/google/googlePlaces.attractions.ts,
// which must work for Kashmir and Uttarakhand too, not just Himachal Pradesh — can
// compose their own query text without duplicating this fetch/timeout/cache logic.
// Single page only — see searchPlacesAllPages for the paginated variant.
export async function searchPlaces(textQuery: string, apiKey: string, pageSize = DEFAULT_PAGE_SIZE): Promise<RawGooglePlace[]> {
  const data = await searchTextOnce({ textQuery, pageSize }, apiKey);
  return data.places ?? [];
}

// Follows `nextPageToken` up to MAX_PAGES — bounded, controlled query expansion (see
// AGENTS.md's 3-state Google Places inventory expansion mission) rather than an
// unbounded loop, so one destination's saturated result set can't blow through Google
// spend or a single page render's latency budget. Stops early the moment a page comes
// back with no token (Google itself has exhausted results) — "saturation reached"
// means either this or MAX_PAGES was hit, and callers should report which.
export async function searchPlacesAllPages(
  textQuery: string,
  apiKey: string,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ places: RawGooglePlace[]; pagesFetched: number; saturated: boolean }> {
  const places: RawGooglePlace[] = [];
  let pageToken: string | undefined;
  let pagesFetched = 0;
  let saturated = false;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    // A page-token request must repeat the original textQuery/pageSize alongside the
    // token — Google (New) rejects a token-only body with "Empty text_query. Request
    // parameters for paging requests must match the initial SearchText request."
    const body = pageToken ? { textQuery, pageSize, pageToken } : { textQuery, pageSize };

    let data: SearchTextResponse;
    try {
      data = await searchTextOnce(body, apiKey);
    } catch (error) {
      // A failure on page 2+ must never discard page 1's already-successful results —
      // stop pagination here and return what was already collected instead of letting
      // the exception propagate and lose it.
      if (page === 0) throw error;
      console.error(`Google Places pagination stopped early on page ${page + 1} for "${textQuery}"`, error);
      break;
    }

    pagesFetched += 1;
    places.push(...(data.places ?? []));

    if (!data.nextPageToken) {
      saturated = true;
      break;
    }
    pageToken = data.nextPageToken;
  }

  return { places, pagesFetched, saturated };
}

export function searchDestinations(location: string, apiKey: string): Promise<RawGooglePlace[]> {
  if (isLocalDevelopment()) {
    console.info(`[dev] Serving mock Places data for "${location}" — no Google Places credits spent.`);
    return Promise.resolve(getMockPlaces(location));
  }
  return searchPlaces(`top tourist attractions in ${location}, Himachal Pradesh`, apiKey);
}

const STAY_TYPE_QUERIES: Record<StayType, string> = {
  hotel: 'hotels and boutique stays',
  homestay: 'homestays and local guesthouses',
  cottage: 'cottages and wooden chalets',
  resort: 'resorts and luxury lodges',
  camp: 'campsites and glamping pods',
  treehouse: 'treehouse stays'
};

// `state` defaults to Himachal Pradesh so every pre-existing caller that doesn't pass
// one (e.g. enrichHotelsWithPlaces, whose curated Hotel catalog is Himachal-only today)
// keeps behaving exactly as before. A caller that knows the real destination state
// (lib/stays.ts's getStaysForDestination, threaded from a Destination's own `state`
// field) should always pass it — otherwise a Jammu & Kashmir/Uttarakhand search like
// "hotels in Gulmarg" silently becomes "hotels in Gulmarg, Himachal Pradesh", which can
// make Google resolve the wrong place entirely.
export interface StaySearchResult {
  places: RawGooglePlace[];
  pagesFetched: number;
  saturated: boolean;
}

export async function searchStays(location: string, stayType: StayType, apiKey: string, state = 'Himachal Pradesh'): Promise<StaySearchResult> {
  if (isLocalDevelopment()) {
    console.info(`[dev] Serving mock Places data for "${stayType}" stays in "${location}" — no Google Places credits spent.`);
    // Every stay type shares the same mock location data, so the place `id`s must be
    // namespaced per stayType here — otherwise all 6 categories resolve to identical
    // ids and StaysGrid's `key={stay.placeId}` collides once results are combined.
    const mockPlaces = getMockPlaces(location, state).map((place) => ({ ...place, id: `${place.id}_${stayType}` }));
    return { places: mockPlaces, pagesFetched: 1, saturated: true };
  }
  return searchPlacesAllPages(`${STAY_TYPE_QUERIES[stayType]} in ${location}, ${state}`, apiKey);
}

// Points at our own proxy (app/api/places/photo/route.ts), never at Google directly —
// the direct media URL requires the API key as a query param, which would otherwise
// ship our billable key to every browser that loads the page. 1200px default gives a
// genuinely "HD" image for card/carousel display rather than a thumbnail.
export function toProxiedPhotoUrl(photoName: string, maxWidthPx = 1200): string {
  return `/api/places/photo?name=${encodeURIComponent(photoName)}&w=${maxWidthPx}`;
}

export function placeName(place: RawGooglePlace): string {
  return place.displayName?.text ?? 'Untitled place';
}

export function placeCoordinates(place: RawGooglePlace): { latitude?: number; longitude?: number } {
  return { latitude: place.location?.latitude, longitude: place.location?.longitude };
}

export function placePhotoUrls(place: RawGooglePlace, maxWidthPx?: number): string[] {
  return (place.photos ?? []).map((photo) => toProxiedPhotoUrl(photo.name, maxWidthPx));
}
