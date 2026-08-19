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
  'places.rating',
  'places.userRatingCount',
  'places.photos'
].join(',');

export interface RawGooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{ name: string }>;
}

const REQUEST_TIMEOUT_MS = 8000;
// Matches what a single grid/carousel actually shows on screen — Google bills and
// serializes per result, so asking for more than we render is pure waste.
const DEFAULT_PAGE_SIZE = 8;

async function searchPlaces(textQuery: string, apiKey: string, pageSize = DEFAULT_PAGE_SIZE): Promise<RawGooglePlace[]> {
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
    body: JSON.stringify({ textQuery, pageSize }),
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Places searchText failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { places?: RawGooglePlace[] };
  return data.places ?? [];
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

export function searchStays(location: string, stayType: StayType, apiKey: string): Promise<RawGooglePlace[]> {
  if (isLocalDevelopment()) {
    console.info(`[dev] Serving mock Places data for "${stayType}" stays in "${location}" — no Google Places credits spent.`);
    // Every stay type shares the same mock location data, so the place `id`s must be
    // namespaced per stayType here — otherwise all 6 categories resolve to identical
    // ids and StaysGrid's `key={stay.placeId}` collides once results are combined.
    const mockPlaces = getMockPlaces(location).map((place) => ({ ...place, id: `${place.id}_${stayType}` }));
    return Promise.resolve(mockPlaces);
  }
  return searchPlaces(`${STAY_TYPE_QUERIES[stayType]} in ${location}, Himachal Pradesh`, apiKey);
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

export function placePhotoUrls(place: RawGooglePlace, maxWidthPx?: number): string[] {
  return (place.photos ?? []).map((photo) => toProxiedPhotoUrl(photo.name, maxWidthPx));
}
