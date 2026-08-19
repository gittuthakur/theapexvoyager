import type { DestinationApexPicks } from './destination';

export interface PackageItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface PackageStayOption {
  id: string;
  label: string;
  /** Flat per-booking upgrade cost. 0 for the included/standard option. */
  extraPrice: number;
}

export interface PackageAddOn {
  id: string;
  label: string;
  /** Flat per-booking cost. */
  price: number;
}

export interface PackageSeasonalRate {
  label: string;
  /** ISO date (YYYY-MM-DD), inclusive. */
  startDate: string;
  /** ISO date (YYYY-MM-DD), inclusive. */
  endDate: string;
  /** Per-person price that applies when a travel date falls in this window. */
  price: number;
}

/** Same {id,label,extraPrice} shape as PackageStayOption — a distinct name for readability where a package's transport-type picker is concerned. */
export type PackageTransportOption = PackageStayOption;

export interface PackagePace {
  id: string;
  label: string;
  description: string;
  /** Applied to the base+stay+add-on subtotal, e.g. 0.9 for a more relaxed, lower-mileage pace. */
  priceMultiplier: number;
}

export interface PackageSignatureMoment {
  title: string;
  description: string;
  /** Optional day-label or time-of-day tag, e.g. "Day 3, Dawn". */
  time?: string;
}

export interface PackageFaq {
  question: string;
  answer: string;
}

export interface TravelPackage {
  slug: string;
  name: string;
  destination: string;
  /** Stable curated-destination relationship; avoids matching display names. */
  destinationSlugs?: string[];
  image: string;
  duration: string;
  /** Default per-person price used when no seasonal rate applies. */
  price: number;
  category: string;
  shortDescription: string;
  highlights: string[];
  itinerary: PackageItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  stayOptions: PackageStayOption[];
  addOns: PackageAddOn[];
  seasonalPricing?: PackageSeasonalRate[];
  featured?: boolean;
  transportOptions?: PackageTransportOption[];
  pace?: PackagePace[];
  signatureMoments?: PackageSignatureMoment[];
  /** Reuses the generic {view,stay,experience,taste,moment} shape built for destinations (types/destination.ts) — no need for a parallel type. */
  apexPicks?: DestinationApexPicks;
  faqs?: PackageFaq[];
}
