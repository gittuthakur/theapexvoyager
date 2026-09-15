import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

// One short-lived document per in-flight Google Places cache-miss fetch — see
// lib/requestCoalescing.ts. Its only job is to let a `create()` fail with a duplicate
// key error when a second request (possibly on a different serverless instance) races
// the first for the same (destinationSlug, stayType, searchLocation) key, so only one
// of them ever actually calls Google.
export interface PlaceCacheLockDocument extends Document {
  key: string;
  createdAt: Date;
}

const PlaceCacheLockSchema = new Schema<PlaceCacheLockDocument>(
  {
    key: { type: String, required: true, unique: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Safety-net expiry only — the winning request deletes its own lock document as soon
// as its Google fetch settles (lib/requestCoalescing.ts). This TTL just guarantees a
// lock never survives a crash/timeout mid-fetch and blocks that key forever.
PlaceCacheLockSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });

// `models.PlaceCacheLock` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const PlaceCacheLock = models.PlaceCacheLock ?? model<PlaceCacheLockDocument>('PlaceCacheLock', PlaceCacheLockSchema);
