import { NextResponse } from 'next/server';
import { getDestinationsForLocation, getDestinationsWithFallback, getCuratedDestinations, DEFAULT_HIMACHAL_LOCATIONS } from '@/lib/destinations';
import { getStaysForDestination, slugify } from '@/lib/stays';
import { STAY_TYPES, type StayType } from '@/types/stay';

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

      const stayTypeParam = searchParams.get('stayType') as StayType | null;
      const stayTypes = stayTypeParam && STAY_TYPES.includes(stayTypeParam) ? [stayTypeParam] : STAY_TYPES;
      const stays = await getStaysForDestination(slugify(location), location, stayTypes, state);
      return NextResponse.json({ stays }, { status: 200, headers: CACHE_HEADERS });
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
