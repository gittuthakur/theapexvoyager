import { NextResponse } from 'next/server';

// TEMPORARY PRODUCTION DIAGNOSTIC ROUTE — added to trace a live Google Places Text
// Search failure that Vercel's dashboard runtime logs weren't surfacing (see AGENTS.md
// Phase C production diagnostic history). Delete this entire route once the failure is
// resolved — it is not part of the product. It never touches PlaceCache, Hotel, or
// Destination data, never writes anything, and never returns the API key, Mongo URI, or
// any raw request/response header. Mirrors lib/googlePlaces.ts's exact endpoint, header
// names, field mask, and request body shape for a single Text Search call — but is a
// standalone copy rather than an import so this file can be deleted with zero risk to
// the real Stays pipeline.
export const dynamic = 'force-dynamic';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.photos'
].join(',');
const REQUEST_TIMEOUT_MS = 8000;
const DEBUG_QUERY = 'hotels in Manali, Himachal Pradesh';

interface RawGooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{ name: string }>;
}

interface DebugResult {
  runtimeKeyPresent: boolean;
  googleReached: boolean;
  googleHttpStatus: number | null;
  googleErrorStatus: string | null;
  googleErrorMessage: string | null;
  resultCount: number;
  firstResult: {
    name: string | null;
    placeIdPresent: boolean;
    photoPresent: boolean;
    ratingPresent: boolean;
    coordinatesPresent: boolean;
  } | null;
  elapsedMs: number;
  errorName: string | null;
  errorMessage: string | null;
}

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const result: DebugResult = {
    runtimeKeyPresent: Boolean(apiKey),
    googleReached: false,
    googleHttpStatus: null,
    googleErrorStatus: null,
    googleErrorMessage: null,
    resultCount: 0,
    firstResult: null,
    elapsedMs: 0,
    errorName: null,
    errorMessage: null
  };

  if (!apiKey) {
    return jsonNoStore(result);
  }

  const start = Date.now();
  try {
    const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK
      },
      body: JSON.stringify({ textQuery: DEBUG_QUERY, pageSize: 8 }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    result.googleReached = true;
    result.googleHttpStatus = res.status;

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      try {
        const parsed = JSON.parse(bodyText) as { error?: { status?: string; message?: string } };
        result.googleErrorStatus = parsed.error?.status ?? null;
        result.googleErrorMessage = parsed.error?.message ?? null;
      } catch {
        result.googleErrorMessage = bodyText.slice(0, 300) || null;
      }
    } else {
      const data = (await res.json()) as { places?: RawGooglePlace[] };
      const places = data.places ?? [];
      result.resultCount = places.length;
      const first = places[0];
      if (first) {
        result.firstResult = {
          name: first.displayName?.text ?? null,
          placeIdPresent: Boolean(first.id),
          photoPresent: Boolean(first.photos?.length),
          ratingPresent: typeof first.rating === 'number',
          coordinatesPresent: Boolean(first.location)
        };
      }
    }
  } catch (error) {
    result.errorName = error instanceof Error ? error.name : 'UnknownError';
    result.errorMessage = error instanceof Error ? error.message : String(error);
  } finally {
    result.elapsedMs = Date.now() - start;
  }

  return jsonNoStore(result);
}

function jsonNoStore(result: DebugResult) {
  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}
