import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface ReviewDocument extends Document {
  destinationSlug?: string;
  author: string;
  location?: string;
  rating: number;
  quote: string;
  tripTitle?: string;
  tripDate?: string;
  verified?: boolean;
  source?: {
    label: string;
    url: string;
  };
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    destinationSlug: { type: String },
    author: { type: String, required: true },
    location: { type: String },
    rating: { type: Number, required: true },
    quote: { type: String, required: true },
    tripTitle: { type: String },
    tripDate: { type: String },
    verified: { type: Boolean },
    source: {
      label: { type: String },
      url: { type: String }
    }
  },
  { timestamps: true }
);

// Supports lib/reviews.ts's per-destination lookups on the /destinations/[slug] page.
ReviewSchema.index({ destinationSlug: 1 });

// `models.Review` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Review = models.Review ?? model<ReviewDocument>('Review', ReviewSchema);
