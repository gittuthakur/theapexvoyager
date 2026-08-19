import mongoose, { Schema, type Document } from 'mongoose';
import { STAY_TYPES, type StayType } from '@/types/stay';

const { model, models } = mongoose;

// One document per real-world place (unique on placeId), tagged with which
// destination + accommodation category it was found under. MongoDB's own TTL
// monitor deletes a document 30 days after its last `updatedAt` — so "the doc is
// still in the collection" IS the freshness check; getStaysForDestination()
// (lib/stays.ts) never has to compute an age itself.
export interface PlaceCacheDocument extends Document {
  placeId: string;
  name: string;
  slug: string;
  stayType: StayType;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photos: string[];
  customPrice?: number;
  destinationSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceCacheSchema = new Schema<PlaceCacheDocument>(
  {
    placeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    stayType: { type: String, enum: STAY_TYPES, required: true },
    formattedAddress: { type: String },
    rating: { type: Number },
    userRatingCount: { type: Number },
    photos: { type: [String], default: [] },
    customPrice: { type: Number },
    destinationSlug: { type: String, required: true }
  },
  { timestamps: true }
);

PlaceCacheSchema.index({ destinationSlug: 1, stayType: 1 });
PlaceCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// `models.PlaceCache` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const PlaceCache = models.PlaceCache ?? model<PlaceCacheDocument>('PlaceCache', PlaceCacheSchema);
