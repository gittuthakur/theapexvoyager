import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export interface JourneyItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface JourneyStayOption {
  id: string;
  label: string;
  extraPrice: number;
}

export interface JourneyAddOn {
  id: string;
  label: string;
  price: number;
}

export interface JourneySeasonalRate {
  label: string;
  startDate: string;
  endDate: string;
  price: number;
}

export interface JourneyPace {
  id: string;
  label: string;
  description: string;
  priceMultiplier: number;
}

export interface JourneySignatureMoment {
  title: string;
  description: string;
  time?: string;
}

export interface JourneyPick {
  title: string;
  description: string;
}

export interface JourneyApexPicks {
  view?: JourneyPick;
  stay?: JourneyPick;
  experience?: JourneyPick;
  taste?: JourneyPick;
  moment?: JourneyPick;
}

export interface JourneyFaq {
  question: string;
  answer: string;
}

export interface JourneyDocument extends Document {
  slug: string;
  name: string;
  destination: string;
  destinationSlugs?: string[];
  image: string;
  duration: string;
  price: number;
  category: string;
  shortDescription: string;
  highlights: string[];
  itinerary: JourneyItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  stayOptions: JourneyStayOption[];
  addOns: JourneyAddOn[];
  seasonalPricing?: JourneySeasonalRate[];
  featured?: boolean;
  transportOptions?: JourneyStayOption[];
  pace?: JourneyPace[];
  signatureMoments?: JourneySignatureMoment[];
  apexPicks?: JourneyApexPicks;
  faqs?: JourneyFaq[];
  /** Backfilled by scripts/backfillRegionRefs.ts from `destinationSlugs` — see models/Region.ts. */
  regionId?: Types.ObjectId;
  // --- AI-readable content fields (Phase 1 foundation, added 2026-09) ---
  // All optional and deliberately unfilled on the existing 6 journeys — see
  // AGENTS.md/the Phase 1 audit: "do not fabricate values for existing packages."
  // A future journey (or a backfill once real copy is written) can populate any of
  // these; the template only ever renders one when it's actually present.
  /** Free-text town/city the itinerary begins from, e.g. "Chandigarh". */
  startingCity?: string;
  /** Free-text town/city the itinerary ends at, e.g. "Manali". */
  endingCity?: string;
  /** How `price` should be read, e.g. "per person (twin sharing)", "per couple". */
  priceBasis?: string;
  /** Real, descriptive hotel-tier copy distinct from `stayOptions`' bare price labels. */
  hotelCategoryDescription?: string;
  /** Who this journey is genuinely built for, e.g. "Couples and honeymooners". */
  idealTraveller?: string;
  /** Real seasonal guidance, e.g. "March–June and September–November". */
  bestTimeToVisit?: string;
  /** Caveats that don't belong in inclusions/exclusions (altitude, road closures, permits). */
  importantNotes?: string[];
  /** Plain-language description of how booking actually works end to end. */
  bookingProcess?: string;
  // Populated automatically by `{ timestamps: true }` below — declared here only so
  // lib/packages.ts can read doc.updatedAt with type safety.
  createdAt: Date;
  updatedAt: Date;
}

const PickSchema = { title: String, description: String };

const JourneySchema = new Schema<JourneyDocument>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    destinationSlugs: { type: [String] },
    image: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    shortDescription: { type: String, required: true },
    highlights: { type: [String], required: true },
    itinerary: [{ day: Number, title: String, description: String }],
    inclusions: { type: [String], required: true },
    exclusions: { type: [String], required: true },
    stayOptions: [{ id: String, label: String, extraPrice: Number }],
    addOns: [{ id: String, label: String, price: Number }],
    seasonalPricing: [{ label: String, startDate: String, endDate: String, price: Number }],
    featured: { type: Boolean },
    transportOptions: [{ id: String, label: String, extraPrice: Number }],
    pace: [{ id: String, label: String, description: String, priceMultiplier: Number }],
    signatureMoments: [{ title: String, description: String, time: String }],
    apexPicks: {
      view: PickSchema,
      stay: PickSchema,
      experience: PickSchema,
      taste: PickSchema,
      moment: PickSchema
    },
    faqs: [{ question: String, answer: String }],
    regionId: { type: Schema.Types.ObjectId, ref: 'Region' },
    startingCity: { type: String },
    endingCity: { type: String },
    priceBasis: { type: String },
    hotelCategoryDescription: { type: String },
    idealTraveller: { type: String },
    bestTimeToVisit: { type: String },
    importantNotes: { type: [String] },
    bookingProcess: { type: String }
  },
  { timestamps: true }
);

// Matches getFeaturedPackages()'s default sort so an unfiltered listing reads
// straight off the index instead of an in-memory sort of the full collection.
JourneySchema.index({ featured: -1, createdAt: 1 });
// Supports getPackagesByDestinationSlug()'s lookup.
JourneySchema.index({ destinationSlugs: 1 });
// Supports the Region Hub's per-region journeys listing.
JourneySchema.index({ regionId: 1, featured: -1, createdAt: 1 });

// `models.Journey` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Journey = models.Journey ?? model<JourneyDocument>('Journey', JourneySchema);
