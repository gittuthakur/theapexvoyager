import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export interface TourItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface TourFaq {
  question: string;
  answer: string;
}

export interface TourDocument extends Document {
  slug: string;
  title: string;
  category: string;
  badge?: string;
  location: string;
  price: string;
  priceUnit?: string;
  duration: string;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  description: string;
  image: string;
  destinationSlug?: string;
  featured?: boolean;
  maxGuests?: string;
  difficulty?: string;
  itinerary?: TourItineraryDay[];
  inclusions?: string[];
  exclusions?: string[];
  faqs?: TourFaq[];
  /** Backfilled by scripts/backfillRegionRefs.ts from `destinationSlug` — see models/Region.ts. */
  regionId?: Types.ObjectId;
}

const TourSchema = new Schema<TourDocument>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    badge: { type: String },
    location: { type: String, required: true },
    price: { type: String, required: true },
    priceUnit: { type: String },
    duration: { type: String, required: true },
    rating: { type: Number },
    reviewCount: { type: Number },
    highlights: { type: [String] },
    description: { type: String, required: true },
    image: { type: String, required: true },
    destinationSlug: { type: String },
    featured: { type: Boolean },
    maxGuests: { type: String },
    difficulty: { type: String },
    itinerary: [{ day: Number, title: String, description: String }],
    inclusions: { type: [String] },
    exclusions: { type: [String] },
    faqs: [{ question: String, answer: String }],
    regionId: { type: Schema.Types.ObjectId, ref: 'Region' }
  },
  { timestamps: true }
);

// Matches getTours()'s default sort (lib/tours.ts) so an unfiltered listing reads
// straight off the index instead of an in-memory sort of the full collection.
TourSchema.index({ featured: -1, createdAt: 1 });
// Supports the `destination` filter's destinationSlug clause in getTours().
TourSchema.index({ destinationSlug: 1 });
// Supports the Region Hub's per-region tours listing.
TourSchema.index({ regionId: 1, featured: -1, createdAt: 1 });

// `models.Tour` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Tour = models.Tour ?? model<TourDocument>('Tour', TourSchema);