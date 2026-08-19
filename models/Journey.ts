import mongoose, { Schema, type Document } from 'mongoose';

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
    faqs: [{ question: String, answer: String }]
  },
  { timestamps: true }
);

// Matches getFeaturedPackages()'s default sort so an unfiltered listing reads
// straight off the index instead of an in-memory sort of the full collection.
JourneySchema.index({ featured: -1, createdAt: 1 });
// Supports getPackagesByDestinationSlug()'s lookup.
JourneySchema.index({ destinationSlugs: 1 });

// `models.Journey` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Journey = models.Journey ?? model<JourneyDocument>('Journey', JourneySchema);
