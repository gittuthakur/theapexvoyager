import type { Destination } from './destination';
import type { Experience } from './experience';
import type { TravelPackage } from './package';
import type { TourPackage } from './tour';
import type { HotelPackage } from './hotel';
import type { TransportRoute, VehicleOption } from './transport';
import type { TravelExpert } from './expert';

export type RegionStatus = 'draft' | 'published';

export interface RegionHero {
  eyebrow: string;
  title: string;
  highlightedText?: string;
  subtitle: string;
  image: string;
  mobileImage?: string;
}

export interface RegionOverview {
  description: string;
  bestSeason: string;
  idealDuration: string;
  startingPoint: string;
  climate: string;
}

export interface RegionTravelGuide {
  bestTime: string;
  howToReach: string;
  weather: string;
  localTransport: string;
  permits?: string;
  responsibleTravel?: string;
}

export interface RegionSeo {
  title: string;
  description: string;
  image?: string;
}

/**
 * The MongoDB-backed editorial region profile (models/Region.ts). Deliberately NOT
 * named `Region` — that name is already taken by the static 3-entry `RegionId`-keyed
 * type in types/region.ts, used by lib/regions.ts and unrelated existing filters
 * (config/search.config.ts's regionCategories, config/tripPlanner.config.ts's
 * PLANNER_REGIONS). Keep both — they serve different, unrelated concepts.
 */
export interface RegionProfile {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  cardImage: string;
  showOnHomeHero: boolean;
  hero: RegionHero;
  overview: RegionOverview;
  travelGuide: RegionTravelGuide;
  seo: RegionSeo;
  featured?: boolean;
  sortOrder: number;
  status: RegionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleAttraction {
  id: string;
  name: string;
  photoUrl?: string;
  rating?: number;
  category?: string;
}

export interface GoogleContext {
  attractions: GoogleAttraction[];
  attribution?: string;
}

/** Booking.com Demand API accommodation — see services/providers/booking/booking.types.ts. Never populated until real credentials exist. */
export interface BookingAccommodation {
  id: string;
  name: string;
  photoUrl?: string;
  priceFrom?: number;
  currency?: string;
  providerUrl: string;
  rating?: number;
}

/** Named RegionBookingContext, not BookingContext — that name is already taken by
 *  types/bookingContext.ts's Plan My Journey wizard prefill shape, an unrelated concept. */
export interface RegionBookingContext {
  enabled: boolean;
  accommodations: BookingAccommodation[];
}

export interface RegionHubData {
  region: RegionProfile;
  destinations: Destination[];
  journeys: TravelPackage[];
  tours: TourPackage[];
  curatedStays: HotelPackage[];
  experiences: Experience[];
  transportServices: TransportRoute[];
  transportVehicles: VehicleOption[];
  travelExperts: TravelExpert[];
  googleContext: GoogleContext;
  bookingContext: RegionBookingContext;
}

/** The shape `getHomeHeroRegions()` returns — matches the Home Hero's existing `stateLinks` card shape exactly. */
export interface HomeHeroRegionCard {
  label: string;
  href: string;
  description: string;
  avatar: string;
}
