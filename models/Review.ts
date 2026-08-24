import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface ReviewDocument extends Document {
  /** Links a review to a curated destination — omitted for journey-specific or general reviews. */
  destinationSlug?: string;
  /** Links a review to a specific journey/package — omitted for destination-level or general reviews. */
  journeyId?: string;
  customerName: string;
  location?: string;
  rating: number;
  reviewText: string;
  tripTitle?: string;
  tripDate?: string;
  /** The reviewer's identity/trip has been confirmed by our team. */
  verified: boolean;
  /** Cleared for public display — set only after editorial review. */
  approved: boolean;
  source?: {
    label: string;
    url: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    destinationSlug: { type: String },
    journeyId: { type: String },
    customerName: { type: String, required: true },
    location: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    tripTitle: { type: String },
    tripDate: { type: String },
    // Both default to false: a newly submitted review is never public until someone
    // explicitly confirms and approves it (see lib/reviews.ts's public query).
    verified: { type: Boolean, required: true, default: false },
    approved: { type: Boolean, required: true, default: false },
    source: {
      label: { type: String },
      url: { type: String }
    }
  },
  { timestamps: true }
);

// Supports lib/reviews.ts's per-destination/per-journey lookups and its public
// approved+verified query.
ReviewSchema.index({ destinationSlug: 1 });
ReviewSchema.index({ journeyId: 1 });
ReviewSchema.index({ approved: 1, verified: 1 });

// `models.Review` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Review = models.Review ?? model<ReviewDocument>('Review', ReviewSchema);
