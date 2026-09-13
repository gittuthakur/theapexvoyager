import { cache } from 'react';
import { connectDB } from '@/lib/mongodb';
import { DestinationSearchCache } from '@/models/DestinationSearchCache';
import { Destination as DestinationModel, type DestinationDocument } from '@/models/Destination';
import { searchDestinations, placeName, placePhotoUrls, type RawGooglePlace } from '@/lib/googlePlaces';
import { isRecentFailure, markFailure } from '@/lib/negativeCache';
import { isLocalDevelopment } from '@/lib/env';
import { destinations as mockDestinations } from '@/config/destinations.config';
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

// The curated directory — lives in MongoDB (see models/Destination.ts, seeded from
// config/destinations.config.ts by scripts/seed.ts). Used by the homepage grid, the
// /destinations search page, the Region Hub, and as the primary slug lookup below.
export async function getCuratedDestinations(): Promise<Destination[]> {
  await connectDB();
  const docs = await DestinationModel.find().sort({ priority: 1 }).lean<DestinationDocument[]>();
  return JSON.parse(JSON.stringify(docs.map(toDestination)));
}

// React's cache() request-memoizes this by `slug` — app/destinations/[slug]/page.tsx's
// generateMetadata and the page component itself both call this independently for the
// same request, and without memoization that would run the same lookup twice.
export const getCuratedDestinationBySlug = cache(async (slug: string): Promise<Destination | undefined> => {
  await connectDB();
  const doc = await DestinationModel.findOne({ slug }).lean<DestinationDocument | null>();
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

export async function getDestinationBySlug(slug: string): Promise<Destination | undefined> {
  const curated = await getCuratedDestinationBySlug(slug);
  if (curated) return curated;

  // Not one of our curated destinations — try the slug as a location name for a live lookup.
  const guessLocation = slug.replace(/-/g, ' ');
  const results = await getDestinationsForLocation(guessLocation);
  return results[0];
}
