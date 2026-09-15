import { NextResponse } from 'next/server';
import { getDestinationsForLocation, getDestinationsWithFallback, getCuratedDestinations, DEFAULT_HIMACHAL_LOCATIONS } from '@/lib/destinations';
import { getStaysForDestination, slugify } from '@/lib/stays';
import { isRateLimited } from '@/lib/rateLimit';
import { STAY_TYPES, type StayType } from '@/types/stay';
import type { StayMode } from '@/config/stayLocations.config';

const VALID_STAY_MODES: StayMode[] = ['destination', 'nearby', 'access-base'];

// A real place/state name — letters (incl. accented), digits, spaces and a few
// punctuation marks actually seen in place names ("Jammu & Kashmir", "Sangla-Chitkul").
// Rejects anything else so an arbitrary/garbage string can't be forwarded into a
// Google Places textQuery (lib/googlePlaces.ts) or blow past reasonable size.
const PLACE_NAME_PATTERN = /^[\p{L}\p{N}\s,.'&-]+$/u;
const MAX_PLACE_NAME_LENGTH = 100;

function isValidPlaceName(value: string): boolean {
  return value.length > 0 && value.length <= MAX_PLACE_NAME_LENGTH && PLACE_NAME_PATTERN.test(value);
}

// Google billing protection for the one endpoint that can trigger real Google Places
// calls on a cache miss (lib/stays.ts's getStaysForDestination). Request coalescing
// (lib/requestCoalescing.ts) already caps duplicate Google calls for the *same*
// destination to one in flight; this catches the other risk — a bot/script hammering
// many distinct (and therefore individually uncoalescable) locations from one source.
const STAYS_RATE_LIMIT_PER_MINUTE = 20;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// Underlying results already come from a 30-day-TTL Mongo cache (lib/destinations.ts,
// lib/stays.ts), so this is safe to cache a full day at the HTTP layer too — repeat
// calls for the same query string return from the browser/CDN cache in milliseconds
// instead of round-tripping to this route at all.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
};

// GET /api/destinations                                    -> destinations across the default Himachal locations
// GET /api/destinations?location=Manali                     -> destinations for a single location
// GET /api/destinations?type=stays&location=Manali          -> every stay category (hotel, homestay, cottage, resort, camp, treehouse) for a location
// GET /api/destinations?type=stays&location=Manali&stayType=treehouse -> just one stay category
// GET /api/destinations?type=stays&location=Gulmarg&state=Jammu%20%26%20Kashmir -> stays scoped to the real destination state (defaults to Himachal Pradesh when omitted)
// GET /api/destinations?type=stays&location=Sangla&state=...&stayMode=nearby -> labels matched results "nearby" in the response's meta (see lib/stayLocation.ts) rather than "exact"; never loosens the location-safety filter itself
// GET /api/destinations?type=stays&location=Kaza&destinationSlug=spiti-valley -> caches/reads under the true canonical destination slug rather than slugify(location) — required whenever a destination's primaryStayLocation differs from its own slug (Kaza≠spiti-valley, Sangla≠kinnaur, Guptkashi≠kedarnath, etc.), otherwise several distinct destinations that share one real search location would all collapse onto the same slugify(location)-derived cache bucket instead of each getting their own tagged copy
//
// GET /api/destinations?isPopular=true                       -> the curated homepage "Popular Destinations" set
// GET /api/destinations?region=Himachal%20Pradesh&style=Adventure&season=Summer -> curated catalog, filtered
// This second family reads the static curated config (see lib/destinations.ts's getCuratedDestinations) rather
// than the Google-Places-backed lookups above — it only activates when none of `location`/`type` are present,
// so the existing StaysGrid contract above is untouched.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const location = searchParams.get('location') ?? undefined;
  const state = searchParams.get('state') ?? undefined;

  const isPopularParam = searchParams.get('isPopular');
  const regionParam = searchParams.get('region');
  const styleParam = searchParams.get('style');
  const seasonParam = searchParams.get('season');
  const isCuratedBrowseRequest = !location && !type && (isPopularParam !== null || regionParam || styleParam || seasonParam);

  try {
    if (type === 'stays') {
      if (!location) {
        return NextResponse.json({ error: 'A "location" query parameter is required when type=stays' }, { status: 400 });
      }
      if (!isValidPlaceName(location) || (state && !isValidPlaceName(state))) {
        return NextResponse.json({ error: 'Invalid "location" or "state" query parameter' }, { status: 400 });
      }

      const clientIp = getClientIp(request);
      if (isRateLimited(`stays:${clientIp}`, STAYS_RATE_LIMIT_PER_MINUTE)) {
        return NextResponse.json(
          { error: 'Too many requests — please slow down.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }

      const stayTypeParam = searchParams.get('stayType') as StayType | null;
      const stayTypes = stayTypeParam && STAY_TYPES.includes(stayTypeParam) ? [stayTypeParam] : STAY_TYPES;
      const stayModeParam = searchParams.get('stayMode') as StayMode | null;
      const stayMode = stayModeParam && VALID_STAY_MODES.includes(stayModeParam) ? stayModeParam : undefined;
      // Prefer the caller's real canonical destination slug when it has one (the
      // destination page/StaysGrid always does); fall back to deriving one from the
      // location text only for callers with no actual Destination object (e.g.
      // enrichHotelsWithPlaces, matching a curated Hotel's free-text `location`).
      const destinationSlugParam = searchParams.get('destinationSlug');
      const destinationSlug = destinationSlugParam || slugify(location);
      const { stays, meta } = await getStaysForDestination(destinationSlug, location, stayTypes, state, stayMode);
      return NextResponse.json({ stays, meta }, { status: 200, headers: CACHE_HEADERS });
    }

    if (isCuratedBrowseRequest) {
      let curated = await getCuratedDestinations();
      if (isPopularParam === 'true') curated = curated.filter((destination) => destination.isPopular);
      if (regionParam) curated = curated.filter((destination) => destination.state === regionParam);
      if (styleParam) curated = curated.filter((destination) => destination.travelStyles?.includes(styleParam));
      if (seasonParam) curated = curated.filter((destination) => destination.seasons?.includes(seasonParam));
      curated = [...curated].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
      return NextResponse.json({ destinations: curated }, { status: 200, headers: CACHE_HEADERS });
    }

    const destinations = location ? await getDestinationsForLocation(location) : await getDestinationsWithFallback();
    return NextResponse.json({ destinations, locations: DEFAULT_HIMACHAL_LOCATIONS }, { status: 200, headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to fetch destinations', error);
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
  }
}
