import { connectDB } from '@/lib/mongodb';
import { DestinationSearchCache } from '@/models/DestinationSearchCache';
import { searchDestinations, placeName, placePhotoUrls, type RawGooglePlace } from '@/lib/googlePlaces';
import { isRecentFailure, markFailure } from '@/lib/negativeCache';
import { isLocalDevelopment } from '@/lib/env';
import { destinations as mockDestinations } from '@/config/destinations.config';
import type { Destination } from '@/types/destination';

export const DEFAULT_HIMACHAL_LOCATIONS = ['Spiti', 'Manali', 'Shimla', 'Kasol', 'Jibhi', 'Dharamshala'];

function normalizeLocation(location: string): string {
  return location.trim().toLowerCase();
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

export async function getDestinationsForLocation(location: string): Promise<Destination[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const mockFallback = () =>
    mockDestinations.filter(
      (destination) =>
        destination.title.toLowerCase().includes(normalizeLocation(location)) || destination.slug.includes(normalizeLocation(location))
    );

  if (!apiKey) {
    console.warn(`GOOGLE_PLACES_API_KEY is not set — using mock destination data for "${location}"`);
    return mockFallback();
  }

  await connectDB();

  const failureKey = `destination:${normalizeLocation(location)}`;

  try {
    const cached = await DestinationSearchCache.findOne({ location: normalizeLocation(location) }).lean();
    if (cached) return cached.results as Destination[];

    if (isRecentFailure(failureKey)) return mockFallback();

    const rawPlaces = await searchDestinations(location, apiKey);
    const mapped = rawPlaces.map((place) => mapPlaceToDestination(place, location));
    await DestinationSearchCache.findOneAndUpdate(
      { location: normalizeLocation(location) },
      { location: normalizeLocation(location), results: mapped },
      { upsert: true }
    );
    return mapped;
  } catch (error) {
    console.error(`Failed to fetch destinations for "${location}" from Google Places — falling back to mock data`, error);
    markFailure(failureKey);
    return mockFallback();
  }
}

export async function getDestinationsWithFallback(): Promise<Destination[]> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.warn('GOOGLE_PLACES_API_KEY is not set — using static mock destinations');
    return mockDestinations;
  }

  try {
    const results = await Promise.all(DEFAULT_HIMACHAL_LOCATIONS.map((location) => getDestinationsForLocation(location)));
    const flattened = results.flat();
    return flattened.length > 0 ? flattened : mockDestinations;
  } catch (error) {
    console.error('Failed to build the Himachal destinations list from Google Places — falling back to mock data', error);
    return mockDestinations;
  }
}

// The curated directory (config/destinations.config.ts) — used by the homepage grid,
// the /destinations search page, and as the primary slug lookup below. Synchronous:
// no DB or API dependency, so it's always available even before any Places call runs.
export function getCuratedDestinations(): Destination[] {
  return mockDestinations;
}

export function getCuratedDestinationBySlug(slug: string): Destination | undefined {
  return mockDestinations.find((destination) => destination.slug === slug);
}

export async function getDestinationBySlug(slug: string): Promise<Destination | undefined> {
  const curated = mockDestinations.find((destination) => destination.slug === slug);
  if (curated) return curated;

  // Not one of our curated destinations — try the slug as a location name for a live lookup.
  const guessLocation = slug.replace(/-/g, ' ');
  const results = await getDestinationsForLocation(guessLocation);
  return results[0];
}
