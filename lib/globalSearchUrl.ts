import { format } from 'date-fns';
import type { GlobalSearchTab } from '@/config/search.config';
import { resolveChauffeurVehicleParam, urlSlugFromServiceType } from '@/config/transportServiceTypes.config';
import { journeyPreferenceParams, singleDatePreferenceParams } from '@/lib/tripPreferences';

/** Every value the shared search panel can hold; each tab reads only the fields it shows. */
export interface GlobalSearchFields {
  destination: string;
  pickup: string;
  drop: string;
  travelStyle: string;
  season: string;
  dateRange: { checkIn: Date | null; checkOut: Date | null };
  occupancy: { adults: number; children: number };
  date: string;
  time: string;
  participants: number;
  passengers: number;
  travelers: number;
}

export interface GlobalSearchTarget {
  path: string;
  params: Record<string, string | undefined>;
  hash?: string;
}

export interface GlobalSearchResolvers {
  staysPath: string;
  /** Typed place -> a real destination slug (or undefined when it isn't a curated destination). */
  resolveDestinationSlug: (value: string) => string | undefined;
  /** Planning need -> an expert travel style that can actually match (or undefined). */
  resolveExpertTravelStyle: (need: string) => string | undefined;
}

/** Turns a target into the URL the panel navigates to — empty/blank params are dropped and
 *  values trimmed, so an untouched field never puts a blank or "undefined" in the address. */
export function toSearchUrl(target: GlobalSearchTarget): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(target.params)) {
    if (value && value.trim()) query.set(key, value.trim());
  }
  const qs = query.toString();
  return `${target.path}${qs ? `?${qs}` : ''}${target.hash ? `#${target.hash}` : ''}`;
}

/**
 * The single place that maps the search panel's fields to a target page + query params, so the
 * field->URL contract can be tested without a DOM. Which of these params actually FILTER the
 * target page, and which are only saved PREFERENCES, is documented per tab below.
 */
export function buildGlobalSearchTarget(tab: GlobalSearchTab, f: GlobalSearchFields, r: GlobalSearchResolvers): GlobalSearchTarget {
  switch (tab) {
    case 'Destinations':
      // All three filter /destinations.
      return { path: '/destinations', params: { destination: f.destination, style: f.travelStyle, season: f.season } };

    case 'Stays':
      // destination/category filter. checkIn/checkOut/guests are PREFERENCES carried to a stay's
      // detail page — /stays/search has no availability data. Rooms/pets are not offered.
      return {
        path: r.staysPath,
        params: {
          destination: f.destination,
          category: f.travelStyle,
          checkIn: f.dateRange.checkIn ? format(f.dateRange.checkIn, 'yyyy-MM-dd') : undefined,
          checkOut: f.dateRange.checkOut ? format(f.dateRange.checkOut, 'yyyy-MM-dd') : undefined,
          guests: String(f.occupancy.adults + f.occupancy.children)
        }
      };

    case 'Journeys':
      // destination/category filter. Travel dates and travelers are PREFERENCES only.
      return {
        path: '/journeys',
        params: { destination: f.destination, category: f.travelStyle, ...journeyPreferenceParams(f.dateRange, f.occupancy) }
      };

    case 'Experiences':
      // q/category filter. The preferred date and participant count are PREFERENCES only —
      // no capacity or availability constraint is applied.
      return {
        path: '/experiences',
        params: { q: f.destination, category: f.travelStyle, ...singleDatePreferenceParams('participants', f.date, f.participants) },
        hash: 'listing'
      };

    case 'Transport': {
      // A real submission opens focused Search Results Mode (`searched`). The dropdown lists
      // vehicle NAMES but /transport filters on the stored category, so send the category (and
      // open a Group Transport pick under its own service).
      const vehicle = resolveChauffeurVehicleParam(f.travelStyle);
      return {
        path: '/transport',
        params: {
          pickup: f.pickup,
          destination: f.drop,
          date: f.date,
          time: f.time,
          travellers: String(f.passengers),
          vehicle: vehicle.value,
          service: vehicle.serviceType === 'Group Transport' ? urlSlugFromServiceType('Group Transport') : undefined,
          searched: '1'
        }
      };
    }

    case 'Travel Experts': {
      const expertDestinationSlug = r.resolveDestinationSlug(f.destination);
      // destination (a real slug) and travelStyle filter /experts; the date and travelers are
      // PREFERENCES only.
      return {
        path: '/experts',
        params: {
          destination: expertDestinationSlug,
          // A typed place that is not one catalog destination is searched as text (name, role,
          // expertise, linked destinations/regions) instead of being dropped, which would have
          // silently shown every expert.
          q: expertDestinationSlug ? undefined : f.destination.trim() || undefined,
          travelStyle: r.resolveExpertTravelStyle(f.travelStyle),
          ...singleDatePreferenceParams('travelers', f.date, f.travelers)
        }
      };
    }
  }
}
