import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

// One document per invocation of app/api/cron/refresh-stays/route.ts — both the run's
// own audit trail (Part 7 of the Phase 1 cost-control brief: "we need to know
// approximately how many Google requests a refresh cycle makes") and the DB-backed lock
// that prevents two refresh cycles from overlapping (see the unique partial index below).
export interface StaysRefreshRunErrorEntry {
  destinationSlug: string;
  stayType: string;
  message: string;
}

export interface StaysRefreshRunDocument extends Document {
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'partial' | 'failed';
  manifestTagCount: number;
  searchGroupCount: number;
  dueGroupCount: number;
  searchGroupsAttempted: number;
  searchGroupsSkippedForBudget: number;
  destinationsProcessed: number;
  googleRequestCount: number;
  recordsUpserted: number;
  budgetLimited: boolean;
  // Named `runErrors`, not `errors` — Mongoose's own Document type already declares an
  // `errors` property (validation errors), and reusing that name breaks Document's own
  // type contract (TS2430) rather than shadowing it cleanly.
  runErrors: StaysRefreshRunErrorEntry[];
}

const StaysRefreshRunSchema = new Schema<StaysRefreshRunDocument>({
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  status: { type: String, enum: ['running', 'completed', 'partial', 'failed'], required: true },
  manifestTagCount: { type: Number, default: 0 },
  searchGroupCount: { type: Number, default: 0 },
  dueGroupCount: { type: Number, default: 0 },
  searchGroupsAttempted: { type: Number, default: 0 },
  searchGroupsSkippedForBudget: { type: Number, default: 0 },
  destinationsProcessed: { type: Number, default: 0 },
  googleRequestCount: { type: Number, default: 0 },
  recordsUpserted: { type: Number, default: 0 },
  budgetLimited: { type: Boolean, default: false },
  runErrors: [{ destinationSlug: String, stayType: String, message: String }]
});

// At most one 'running' document can ever exist — a second create() attempt while a run
// is in flight fails with a duplicate-key error, which app/api/cron/refresh-stays/route.ts
// treats as "a refresh is already running" and responds 409 rather than starting a second,
// overlapping one. Once a run finishes (status moves to 'completed'/'partial'/'failed'),
// it no longer matches this partial index, so the next scheduled run can start normally.
StaysRefreshRunSchema.index({ status: 1 }, { unique: true, partialFilterExpression: { status: 'running' } });

// `models.StaysRefreshRun` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const StaysRefreshRun = models.StaysRefreshRun ?? model<StaysRefreshRunDocument>('StaysRefreshRun', StaysRefreshRunSchema);
