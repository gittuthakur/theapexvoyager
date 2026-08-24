import { searchPlaces, placeName, placePhotoUrls, type RawGooglePlace } from '@/lib/googlePlaces';
import { isLocalDevelopment } from '@/lib/env';
import { getMockPlaces } from '@/lib/mockPlacesData';
import { withGoogleFallback } from './google.errors';
import type { GoogleAttraction, GoogleAttractionsResult } from './google.types';

const EMPTY_RESULT: GoogleAttractionsResult = { attractions: [], attribution: undefined };

function toAttraction(place: RawGooglePlace): GoogleAttraction {
  return {
    id: place.id,
    name: placeName(place),
    photoUrl: placePhotoUrls(place)[0],
    rating: place.rating
  };
}

/**
 * "Nearby to Explore" context for the Region Hub's Travel Guide section — built
 * directly on the existing, working Places client (lib/googlePlaces.ts), not a new
 * HTTP client. Query text is region-neutral (unlike lib/googlePlaces.ts's own
 * Himachal-flavored searchDestinations/searchStays helpers), since this must work for
 * Kashmir and Uttarakhand too. Self-contained against failure via withGoogleFallback —
 * a Google outage always degrades to an empty, silently-hidden section, never an error
 * surfaced to a visitor.
 */
export async function getRegionAttractions(region: { name: string }): Promise<GoogleAttractionsResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (isLocalDevelopment()) {
    console.info(`[dev] Serving mock Places data for "${region.name}" attractions — no Google Places credits spent.`);
    const places = getMockPlaces(region.name);
    return { attractions: places.map(toAttraction), attribution: 'Places data by Google' };
  }

  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY is not set — Region Hub "Nearby to Explore" section will be hidden');
    return EMPTY_RESULT;
  }

  return withGoogleFallback(
    `getRegionAttractions(${region.name})`,
    async () => {
      const places = await searchPlaces(`top tourist attractions in ${region.name}`, apiKey);
      if (places.length === 0) return EMPTY_RESULT;
      return { attractions: places.map(toAttraction), attribution: 'Places data by Google' };
    },
    EMPTY_RESULT
  );
}
