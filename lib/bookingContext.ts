import { getPackageBySlug } from '@/lib/packages';
import { getTourBySlug } from '@/lib/tours';
import { getCuratedDestinationBySlug, getDestinationBySlug, findDestinationByLocationText } from '@/lib/destinations';
import { getHotelBySlug } from '@/lib/hotels';
import { getExperienceBySlug } from '@/lib/experiences';
import { getVehicleBySlug } from '@/lib/transport';
import { getRegionForState } from '@/lib/regions';
import { getRegionProfileBySlug } from '@/services/regions/regionHub.service';
import { matchesStyle } from '@/lib/travelStyles';
import { getPlannerRegionId } from '@/config/tripPlanner.config';
import { CATEGORY_TO_STAY_TYPE } from '@/types/stay';
import { STAY_AMENITIES } from '@/config/tripPlanner.config';
import type { Destination } from '@/types/destination';
import type { DestinationStyleId } from '@/types/travelStyle';
import type { TravelStyleId, TransportModeId } from '@/types/tripPlanner';
import type { VehicleOption } from '@/types/transport';
import type { BookingContext, BookingSource } from '@/types/bookingContext';

const BOOKING_SOURCES: BookingSource[] = ['journey', 'destination', 'stay', 'experience', 'transport', 'region'];

// Only styles with a safe, literal 1:1 equivalent between the curated Destination
// catalog's 6-style vocabulary (types/travelStyle.ts) and the wizard's own 12-style
// enum (types/tripPlanner.ts) are carried over — 'wellness' has no safe match and is
// deliberately left out rather than guessed.
const DESTINATION_TO_WIZARD_STYLE: Partial<Record<DestinationStyleId, TravelStyleId>> = {
  adventure: 'adventure',
  'slow-travel': 'slow-travel',
  romantic: 'romantic',
  family: 'family',
  offbeat: 'offbeat'
};

function deriveTravelStyleIds(destination: Destination): TravelStyleId[] {
  return (Object.entries(DESTINATION_TO_WIZARD_STYLE) as [DestinationStyleId, TravelStyleId][])
    .filter(([destinationStyleId]) => matchesStyle(destination, destinationStyleId))
    .map(([, wizardStyleId]) => wizardStyleId);
}

/** Shared destination/region normalization — a resolved curated Destination takes
 *  priority; `fallbackRegionName` (e.g. an Experience's own `region` field) is used
 *  only when no Destination could be matched at all, so region still resolves even
 *  without a specific place. */
function buildDestinationFields(destination: Destination | undefined, fallbackRegionName?: string) {
  if (destination) {
    const region = getRegionForState(destination.state);
    return {
      destinationSlug: destination.slug,
      destinationName: destination.title,
      regionId: region?.id,
      plannerRegionId: region ? getPlannerRegionId(region.id) : undefined,
      travelStyleIds: deriveTravelStyleIds(destination)
    };
  }
  if (fallbackRegionName) {
    const region = getRegionForState(fallbackRegionName);
    return { regionId: region?.id, plannerRegionId: region ? getPlannerRegionId(region.id) : undefined };
  }
  return {};
}

const TRANSPORT_MODE_BY_CATEGORY: Partial<Record<NonNullable<VehicleOption['category']>, TransportModeId>> = {
  SUV: 'private-suv',
  'Tempo Traveller': 'tempo-traveller'
};

/**
 * Resolves a `?source=&slug=` pair (as passed by lib/bookingNavigation.ts's
 * buildBookingHref) into a normalized BookingContext against the real catalogs —
 * never fabricates a field it can't find, and never throws: an invalid source, an
 * unknown slug, or a lookup failure all just resolve to `null` so the caller
 * (app/plan-my-journey/page.tsx) can fall back to the wizard's blank default state.
 */
export async function resolveBookingContext(input: { source?: string; slug?: string }): Promise<BookingContext | null> {
  const { source, slug } = input;
  if (!source || !slug || !BOOKING_SOURCES.includes(source as BookingSource)) return null;

  try {
    switch (source as BookingSource) {
      case 'journey': {
        const journey = await getPackageBySlug(slug);
        if (journey) {
          const destination = journey.destinationSlugs?.[0] ? await getCuratedDestinationBySlug(journey.destinationSlugs[0]) : undefined;
          return { source: 'journey', slug, title: journey.name, ...buildDestinationFields(destination) };
        }
        // Tour is a separate catalog (config/*.config.ts-seeded `Tour` collection, not
        // `Journey`) surfaced under the same "journey" booking source — both are real,
        // non-fabricated catalogs, so a tour slug that doesn't match a Journey falls
        // through here rather than failing.
        const tour = await getTourBySlug(slug);
        if (tour) {
          const destination = tour.destinationSlug ? await getCuratedDestinationBySlug(tour.destinationSlug) : undefined;
          return { source: 'journey', slug, title: tour.title, ...buildDestinationFields(destination) };
        }
        return null;
      }

      case 'destination': {
        const destination = (await getCuratedDestinationBySlug(slug)) ?? (await getDestinationBySlug(slug));
        if (!destination) return null;
        return { source: 'destination', slug, title: destination.title, ...buildDestinationFields(destination) };
      }

      case 'stay': {
        const hotel = await getHotelBySlug(slug);
        if (!hotel) return null;
        const destination = await findDestinationByLocationText(hotel.location);
        const stayTypeId = CATEGORY_TO_STAY_TYPE[hotel.category];
        const stayAmenities = hotel.amenities?.filter((amenity) => STAY_AMENITIES.includes(amenity));
        return {
          source: 'stay',
          slug,
          title: hotel.title,
          ...buildDestinationFields(destination),
          stayTypeIds: stayTypeId ? [stayTypeId] : undefined,
          stayAmenities: stayAmenities?.length ? stayAmenities : undefined
        };
      }

      case 'experience': {
        const experience = await getExperienceBySlug(slug);
        if (!experience) return null;
        const destination = await findDestinationByLocationText(experience.location);
        return {
          source: 'experience',
          slug,
          title: experience.title,
          ...buildDestinationFields(destination, destination ? undefined : experience.region)
        };
      }

      case 'transport': {
        const vehicle = await getVehicleBySlug(slug);
        if (!vehicle) return null;
        return {
          source: 'transport',
          slug,
          title: vehicle.name,
          transportModeId: vehicle.category ? TRANSPORT_MODE_BY_CATEGORY[vehicle.category] ?? null : null
        };
      }

      case 'region': {
        const region = await getRegionProfileBySlug(slug);
        if (!region) return null;
        // The new Region Hub's `slug` values ('himachal-pradesh', 'kashmir', 'uttarakhand')
        // were deliberately chosen to equal config/tripPlanner.config.ts's PLANNER_REGIONS
        // ids directly — unlike the OLD static RegionId ('jammu-kashmir'), which needs
        // REGION_ID_TO_PLANNER_REGION_ID's translation. No translation needed here.
        return { source: 'region', slug, title: region.name, regionId: region.slug, plannerRegionId: region.slug };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to resolve booking context for source="${source}" slug="${slug}"`, error);
    return null;
  }
}
