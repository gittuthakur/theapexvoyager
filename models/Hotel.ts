import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export interface HotelDocument extends Document {
  slug: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating?: number;
  reviewCount?: number;
  category: 'Hotel' | 'Homestay' | 'Resort' | 'Villa' | 'Camp' | 'Treehouse' | 'Farmstay' | 'Hostel' | 'Heritage' | 'GuestHouse';
  description: string;
  images: string[];
  amenities?: string[];
  featured?: boolean;
  verified?: boolean;
  cancellationPolicy?: string;
  mealPlan?: string;
  /** Backfilled by scripts/backfillRegionRefs.ts from `location` — see models/Region.ts. */
  regionId?: Types.ObjectId;
}

const HotelSchema = new Schema<HotelDocument>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    rating: { type: Number },
    reviewCount: { type: Number },
    category: {
      type: String,
      enum: ['Hotel', 'Homestay', 'Resort', 'Villa', 'Camp', 'Treehouse', 'Farmstay', 'Hostel', 'Heritage', 'GuestHouse'],
      required: true
    },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    amenities: { type: [String] },
    featured: { type: Boolean },
    verified: { type: Boolean },
    cancellationPolicy: { type: String },
    mealPlan: { type: String },
    regionId: { type: Schema.Types.ObjectId, ref: 'Region' }
  },
  { timestamps: true }
);

// Matches getHotels()'s default sort (lib/hotels.ts) so an unfiltered listing reads
// straight off the index instead of an in-memory sort of the full collection.
HotelSchema.index({ featured: -1, createdAt: 1 });
// Supports the `category` filter in getHotels().
HotelSchema.index({ category: 1 });
// Supports the Region Hub's per-region stays listing.
HotelSchema.index({ regionId: 1, featured: -1, createdAt: 1 });

// `models.Hotel` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Hotel = models.Hotel ?? model<HotelDocument>('Hotel', HotelSchema);
