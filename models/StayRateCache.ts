import mongoose, { Schema, type Document } from 'mongoose';
import type { CancellationPolicy, NormalizedRate, PriceSourceState, StayPricingProviderId } from '@/services/pricing/stayPricing.types';

const { model, models } = mongoose;

/**
 * A short-lived cache of one HBX (or future provider) availability response, keyed on
 * the exact search context that produced it — never a timeless "the hotel's price".
 * Mirrors PlaceCache's TTL-index freshness pattern (models/PlaceCache.ts), but adds an
 * explicit read-time age check in services/pricing/stayRateCache.service.ts as well:
 * price data is more time-sensitive than "which stays exist", and Mongo's TTL monitor
 * only sweeps periodically (not instantly), so "the document still exists" alone is not
 * treated as sufficient proof of freshness here the way it is for PlaceCache.
 *
 * Deliberately stores the RAW provider result (state + rates, including a 'test'/
 * 'unknown' environment tag) — never the already-safety-gated public state. This lets
 * services/pricing/stayPricing.service.ts's two-gate check (confirmed mapping AND
 * production-classified environment) keep being re-evaluated fresh on every read against
 * whatever the CURRENT environment configuration is, without needing to invalidate the
 * cache the moment a config value changes.
 */

export const STAY_RATE_CACHE_TTL_SECONDS = 10 * 60; // 10 minutes — an engineering default for cache staleness, not a business-approved price value. Adjust only this constant to change it.

export interface StayRateCacheDocument extends Document {
  provider: StayPricingProviderId;
  /** Sorted, joined `providerHotelIds` — the exact-set lookup key (an array field would
   *  match on ANY shared element via Mongo's multikey semantics, not the whole set). */
  hotelIdsKey: string;
  providerHotelIds: string[];
  destinationSlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  state: PriceSourceState;
  rates: NormalizedRate[];
  /** Present only when state === 'PROVIDER_ERROR' — a PROVIDER_ERROR result is never
   *  actually written to this collection (services/pricing/stayRateCache.service.ts
   *  deliberately never caches a transient supplier outage), so this field exists for
   *  schema completeness only and should always be empty in practice today. */
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CachedCancellationPolicySchema = new Schema<CancellationPolicy>(
  {
    chargeAmount: { type: String, required: true },
    chargeFrom: { type: String, required: true }
  },
  { _id: false }
);

const CachedNormalizedRateSchema = new Schema<NormalizedRate>(
  {
    provider: { type: String, required: true },
    providerHotelId: { type: String, required: true },
    currency: { type: String, required: true },
    totalStayPrice: { type: Number, required: true },
    nightCount: { type: Number, required: true },
    displayPerNight: { type: Number, required: true },
    roomName: { type: String },
    roomCode: { type: String },
    boardName: { type: String },
    boardCode: { type: String },
    rateKey: { type: String },
    rateType: { type: String },
    refundable: { type: Boolean },
    cancellationPolicies: { type: [CachedCancellationPolicySchema], default: [] },
    roomsRemaining: { type: Number },
    lastCheckedAt: { type: String, required: true },
    environment: { type: String, enum: ['test', 'unknown', 'production'], required: true }
  },
  { _id: false }
);

const StayRateCacheSchema = new Schema<StayRateCacheDocument>(
  {
    provider: { type: String, required: true },
    hotelIdsKey: { type: String, required: true },
    // Mongoose arrays default to `[]` and `required` alone never rejects an empty one —
    // a non-empty check needs an explicit validator instead.
    providerHotelIds: { type: [String], validate: { validator: (value: string[]) => value.length > 0, message: 'providerHotelIds must not be empty' } },
    destinationSlug: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    adults: { type: Number, required: true },
    children: { type: Number, required: true },
    rooms: { type: Number, required: true },
    state: { type: String, enum: ['VERIFIED_LIVE_RATE', 'VERIFIED_MANUAL_RATE', 'PRICE_ON_REQUEST', 'UNAVAILABLE', 'PROVIDER_ERROR'], required: true },
    rates: { type: [CachedNormalizedRateSchema], default: [] },
    error: { type: String }
  },
  { timestamps: true }
);

// The exact search-context identity — one document per (provider, hotel set, dates,
// occupancy). Unique so a repeated write for the same context always updates the same
// row (idempotent) rather than accumulating duplicate rate documents.
StayRateCacheSchema.index({ provider: 1, hotelIdsKey: 1, checkIn: 1, checkOut: 1, adults: 1, children: 1, rooms: 1 }, { unique: true });
// TTL: Mongo deletes a document this long after its last `updatedAt` (bumped on every
// upsert) — see this file's top comment for why a read-time age check is ALSO done.
StayRateCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: STAY_RATE_CACHE_TTL_SECONDS });

// `models.StayRateCache` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const StayRateCache = models.StayRateCache ?? model<StayRateCacheDocument>('StayRateCache', StayRateCacheSchema);
