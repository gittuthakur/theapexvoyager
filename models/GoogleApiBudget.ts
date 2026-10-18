import mongoose, { Schema, type Document } from 'mongoose';
import { BUDGET_BUCKETS, type BudgetBucket } from '@/lib/googleApiBudget';

const { model, models } = mongoose;

// C4-B2-2 Stage A — DARK. Nothing imports this model at runtime yet (only lib/googleApiBudgetStore.mongo.ts, which nothing imports
// either), so importing it in the app creates no collection and no index. A collection and its TTL index would only come into
// existence if a later, owner-approved stage wires the store in and a database connection is open.
//
// One small document per budget BUCKET per UTC MONTH (see lib/googleApiBudget.ts for the buckets):
//
//   _id        "photo-media|2026-10"                     deterministic: bucket + month, so the same document is always addressed
//   bucket     "photo-media"
//   month      "2026-10"
//   total      41                                         requests counted this month
//   days       { "2026-10-17": 18, "2026-10-18": 23 }    one numeric field per UTC day, so at most 31 fields (bounded growth)
//   expiresAt  <month end + 90 days>                      TTL cleanup
//
// It holds counts only: no credentials, Place IDs, photo names, URLs, query text or visitor data. Limits are not stored (they come
// from configuration), so changing a limit needs no data change.
export const GOOGLE_API_BUDGET_RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
export const BUDGET_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface GoogleApiBudgetDocument extends Document<string> {
  _id: string;
  bucket: BudgetBucket;
  month: string;
  total: number;
  /** `YYYY-MM-DD` (UTC) -> requests counted that day. */
  days: Record<string, number>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** The deterministic document id for a bucket and UTC month, e.g. `photo-media|2026-10`. Throws on an unknown bucket or bad month. */
export function budgetDocumentId(bucket: BudgetBucket, month: string): string {
  if (!(BUDGET_BUCKETS as readonly string[]).includes(bucket)) throw new Error('Unknown budget bucket');
  if (typeof month !== 'string' || !BUDGET_MONTH_PATTERN.test(month)) throw new Error('Invalid budget month');
  return `${bucket}|${month}`;
}

/** When a month's document may be deleted: the first instant after that UTC month, plus the 90-day retention. Throws on a bad month. */
export function budgetExpiresAt(month: string): Date {
  if (typeof month !== 'string' || !BUDGET_MONTH_PATTERN.test(month)) throw new Error('Invalid budget month');
  const [year, monthNumber] = month.split('-').map(Number);
  const nextMonthStart = Date.UTC(year, monthNumber, 1); // monthNumber is 1-based, so this is the first day of the FOLLOWING month
  return new Date(nextMonthStart + GOOGLE_API_BUDGET_RETENTION_DAYS * DAY_MS);
}

export const GoogleApiBudgetSchema = new Schema<GoogleApiBudgetDocument>(
  {
    _id: { type: String, required: true },
    bucket: { type: String, enum: BUDGET_BUCKETS, required: true },
    month: { type: String, required: true, match: BUDGET_MONTH_PATTERN },
    total: { type: Number, default: 0, min: 0 },
    // Mixed on purpose: the store increments `days.<YYYY-MM-DD>` with a dotted $inc, which needs a schema-less object.
    days: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true, minimize: false }
);

// TTL cleanup: MongoDB removes a document once `expiresAt` has passed (expireAfterSeconds: 0 means "exactly at expiresAt").
GoogleApiBudgetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// `models.GoogleApiBudget` survives Next.js dev hot-reloads — without this guard, re-running this module would call `model()` on an
// already-registered name and throw.
export const GoogleApiBudget = models.GoogleApiBudget ?? model<GoogleApiBudgetDocument>('GoogleApiBudget', GoogleApiBudgetSchema);
