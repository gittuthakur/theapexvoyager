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
  latitude?: number;
  longitude?: number;
  rating?: number;
  userRatingCount?: number;
  photos: string[];
  customPrice?: number;
  destinationSlug: string;
  /** The exact location string this row was fetched for (lib/stays.ts's `location`
   *  param — e.g. "Sangla" for the Kinnaur/Chitkul/Sangla Valley destinations that all
   *  legitimately search the same real town under Phase B's canonical mapping). Part of
   *  the read/write key alongside destinationSlug+stayType so that if a destination's
   *  canonical search location ever changes (as several did in Phase B), old rows fetched
   *  under the previous location text are never silently served as if still valid —
   *  a fresh fetch under the new location text simply misses the cache instead. */
  searchLocation: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceCacheSchema = new Schema<PlaceCacheDocument>(
  {
    placeId: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    stayType: { type: String, enum: STAY_TYPES, required: true },
    formattedAddress: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    rating: { type: Number },
    userRatingCount: { type: Number },
    photos: { type: [String], default: [] },
    customPrice: { type: Number },
    destinationSlug: { type: String, required: true },
    searchLocation: { type: String, required: true }
  },
  { timestamps: true }
);

// NOT unique on `placeId` alone: two different destinations can legitimately search the
// same real town under Phase B's canonical mapping (e.g. Kinnaur and Sangla Valley both
// resolve to "Sangla") and both are entitled to cache the same real Google place under
// their own destinationSlug — a standalone-unique placeId index would let the second
// destination's upsert silently overwrite (and hide from the first destination) a place
// both should independently see.
PlaceCacheSchema.index({ placeId: 1, destinationSlug: 1, stayType: 1 }, { unique: true });
// Supports the read path: PlaceCache.find({ destinationSlug, stayType, searchLocation }).
PlaceCacheSchema.index({ destinationSlug: 1, stayType: 1, searchLocation: 1 });
PlaceCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// `models.PlaceCache` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const PlaceCache = models.PlaceCache ?? model<PlaceCacheDocument>('PlaceCache', PlaceCacheSchema);
