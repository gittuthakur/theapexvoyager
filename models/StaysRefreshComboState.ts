import mongoose, { Schema, type Document } from 'mongoose';
import { STAY_TYPES } from '@/types/stay';

const { model, models } = mongoose;

// Persistent per-(location, state, StayType) search-group state that drives the rotating
// Stays refresh (see lib/staysRefresh.ts) — this collection IS the "cursor": there is no
// separate pointer/index into a destination list, because sorting eligible groups by
// their own `nextEligibleAt` (oldest/never-attempted first) already rotates through every
// configured group over time without hardcoding any calendar date or maintaining a
// second piece of state that could drift out of sync with the manifest.
export interface StaysRefreshComboStateDocument extends Document {
  /** Matches lib/staysRefresh.ts's SearchGroup.key — `${location}|${state}|${stayType}`. */
  groupKey: string;
  location: string;
  state?: string;
  stayType: (typeof STAY_TYPES)[number];
  tier: 'popular' | 'core';
  lastAttemptedAt?: Date;
  lastSuccessAt?: Date;
  /** Raw Google result count from the last successful attempt (before any location-safety
   *  or exclusion filtering) — used only to detect a genuinely empty result, not the
   *  count actually written to PlaceCache. */
  lastRawResultCount?: number;
  consecutiveEmptyResults: number;
  consecutiveFailures: number;
  /** The one field the scheduler actually reads: this group is eligible again once
   *  `now >= nextEligibleAt` (or the field is unset — never attempted). Computed from
   *  FRESHNESS_WINDOW_DAYS / EMPTY_RESULT_BACKOFF_DAYS / FAILURE_BACKOFF_* after every
   *  attempt — see config/staysRefreshManifest.config.ts. */
  nextEligibleAt?: Date;
}

const StaysRefreshComboStateSchema = new Schema<StaysRefreshComboStateDocument>({
  groupKey: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  state: { type: String },
  stayType: { type: String, enum: STAY_TYPES, required: true },
  tier: { type: String, enum: ['popular', 'core'], required: true },
  lastAttemptedAt: { type: Date },
  lastSuccessAt: { type: Date },
  lastRawResultCount: { type: Number },
  consecutiveEmptyResults: { type: Number, default: 0 },
  consecutiveFailures: { type: Number, default: 0 },
  nextEligibleAt: { type: Date }
});

// Supports the scheduler's own read: find groups due now, cheapest-first (oldest
// nextEligibleAt, with "never set" sorting first via a partial index would over-complicate
// this — the query instead treats a missing field as due, handled in application code).
StaysRefreshComboStateSchema.index({ nextEligibleAt: 1 });

// `models.StaysRefreshComboState` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const StaysRefreshComboState =
  models.StaysRefreshComboState ?? model<StaysRefreshComboStateDocument>('StaysRefreshComboState', StaysRefreshComboStateSchema);
