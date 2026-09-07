import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export interface ExpertDocument extends Document {
  slug: string;
  name: string;
  role: string;
  profileImage: string;
  bio: string;
  destinationSlugs: string[];
  travelStyles: string[];
  expertise: string[];
  languages?: string[];
  journeySlugs?: string[];
  featured?: boolean;
  active: boolean;
  /** Separate from `active` (soft-delete/pause) — this gates whether an Expert may be
   *  publicly displayed as a real, named, contactable specialist at all. Defaults to
   *  `false` so every currently-seeded profile (illustrative placeholders, not real
   *  staff — see config/experts.config.ts) stays hidden from the public catalogue
   *  without any data migration: existing documents simply lack this field, and a
   *  missing field never satisfies a `{publiclyListed: true}` query regardless of the
   *  schema default below (Mongoose defaults only apply to newly-constructed
   *  documents, never to a query against already-stored data). A future genuine
   *  employee/partner profile must explicitly set this to `true` to appear anywhere
   *  public (lib/experts.ts, /api/booking-requests's `type: 'expert'` branch).
   */
  publiclyListed?: boolean;
  /** Backfilled by scripts/backfillRegionRefs.ts from `destinationSlugs` — an expert may cover more than one region. */
  regionIds?: Types.ObjectId[];
}

const ExpertSchema = new Schema<ExpertDocument>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    profileImage: { type: String, required: true },
    bio: { type: String, required: true },
    destinationSlugs: { type: [String], required: true },
    travelStyles: { type: [String], required: true },
    expertise: { type: [String], required: true },
    languages: { type: [String] },
    journeySlugs: { type: [String] },
    featured: { type: Boolean },
    active: { type: Boolean, required: true, default: true },
    publiclyListed: { type: Boolean, default: false },
    regionIds: { type: [Schema.Types.ObjectId], ref: 'Region' }
  },
  { timestamps: true }
);

// Supports the /experts directory's destination/travel-style/expertise filters
// (see lib/experts.ts) without a full collection scan.
ExpertSchema.index({ active: 1, publiclyListed: 1, featured: -1, createdAt: 1 });
ExpertSchema.index({ destinationSlugs: 1 });
ExpertSchema.index({ travelStyles: 1 });
ExpertSchema.index({ expertise: 1 });
// Supports the Region Hub's per-region experts listing.
ExpertSchema.index({ regionIds: 1, active: 1, featured: -1 });

// `models.Expert` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Expert = models.Expert ?? model<ExpertDocument>('Expert', ExpertSchema);
