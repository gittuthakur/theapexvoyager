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
  // `image`/`price` stay required (not `?`) here deliberately: a TravelPackage only ever
  // exists in application code via lib/packages.ts's getAllPackages()/getPackageBySlug(),
  // both of which query `status: 'published'` only — and models/Journey.ts's pre-validate
  // hook makes it impossible for a published Journey document to lack either. A DRAFT
  // Journey (where these genuinely may be unset) never reaches this type at all.
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
  /** ObjectId (as a string) of the MongoDB Region document this journey belongs to — see models/Region.ts. */
  regionId?: string;
  // --- AI-readable content fields (Phase 1 foundation) — see models/Journey.ts for the
  // full rationale. All optional; the detail page only renders one when it's populated. */
  startingCity?: string;
  endingCity?: string;
  priceBasis?: string;
  hotelCategoryDescription?: string;
  idealTraveller?: string;
  bestTimeToVisit?: string;
  importantNotes?: string[];
  bookingProcess?: string;
  /** ISO timestamp of the underlying document's last update — drives the page's visible
   *  "Last updated" line (see models/Journey.ts's `timestamps: true`). */
  updatedAt?: string;
  /** Always 'published' on any TravelPackage that reaches app code — lib/packages.ts's
   *  functions filter on this at the database query itself, so a draft Journey is never
   *  fetched into this shape at all. Optional here only so existing literals/fixtures
   *  that predate the draft/publish workflow don't need updating. */
  status?: 'draft' | 'published';
}

/** Authoring shape for a NOT-YET-PUBLISHED Journey (config/draftJourneys.config.ts,
 *  scripts/seedDraftJourneys.ts) — `image`/`price` stay required on `TravelPackage`
 *  itself because every *published* Journey is guaranteed to have them (see
 *  models/Journey.ts's pre-validate hook); a draft is explicitly allowed to omit both
 *  rather than carry a fabricated placeholder. `status` is narrowed to 'draft' so this
 *  type can never be mistaken for (or accidentally satisfy) a published one. */
export type DraftTravelPackageInput = Omit<TravelPackage, 'image' | 'price' | 'status'> & {
  image?: string;
  price?: number;
  status: 'draft';
};
