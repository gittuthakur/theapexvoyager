import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

// One document per queried location (e.g. "manali"), storing the normalized tourist-
// attraction results for that Text Search. MongoDB's TTL monitor deletes a document 30
// days after its last `updatedAt` — "the doc is still here" is the freshness check.
export interface DestinationSearchCacheDocument extends Document {
  location: string;
  results: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSearchCacheSchema = new Schema<DestinationSearchCacheDocument>(
  {
    location: { type: String, required: true, unique: true },
    results: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

DestinationSearchCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// `models.DestinationSearchCache` survives Next.js dev hot-reloads — without this
// guard, re-running this module would call `model()` on an already-registered name
// and throw.
export const DestinationSearchCache =
  models.DestinationSearchCache ?? model<DestinationSearchCacheDocument>('DestinationSearchCache', DestinationSearchCacheSchema);
