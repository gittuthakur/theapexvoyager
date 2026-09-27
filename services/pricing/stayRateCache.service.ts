import { connectDB } from '@/lib/mongodb';
import { StayRateCache, STAY_RATE_CACHE_TTL_SECONDS, type StayRateCacheDocument } from '@/models/StayRateCache';
import type { StayPricingProviderId, StayPricingQuery, StayPricingResult } from './stayPricing.types';

/**
 * The API → MongoDB cache layer (TP-Stay Section 8/5's freshness contract). Sits between
 * a provider's own `getAvailability()` and stayPricing.service.ts's orchestration — never
 * called directly by any page/component, and never bypasses the provider entirely: a
 * cache miss (or an expired entry) always falls through to a real live call.
 *
 * Deliberately never caches a PROVIDER_ERROR result (a transient supplier outage must
 * not "freeze" every customer into seeing an error for the whole TTL window — the next
 * request should simply retry live), and never caches a sampling-mode query (no explicit
 * `providerHotelIds` — that path is diagnostic/mapping-generation only, low volume, and
 * always wants the truly current sample).
 */

function buildHotelIdsKey(providerHotelIds: string[]): string {
  return [...providerHotelIds].sort().join(',');
}

function isFresh(doc: Pick<StayRateCacheDocument, 'updatedAt'>): boolean {
  const ageMs = Date.now() - new Date(doc.updatedAt).getTime();
  return ageMs < STAY_RATE_CACHE_TTL_SECONDS * 1000;
}

function toResult(doc: StayRateCacheDocument): StayPricingResult {
  return { state: doc.state, rates: doc.rates, error: doc.error };
}

/**
 * Returns a fresh cached result for this exact search context, or `null` on a genuine
 * miss (never found, or found but past the freshness window) — callers must fall
 * through to a live fetch on `null`, never treat it as "unavailable".
 */
export async function getCachedAvailability(query: StayPricingQuery, providerId: StayPricingProviderId): Promise<StayPricingResult | null> {
  if (!query.providerHotelIds || query.providerHotelIds.length === 0) return null;

  await connectDB();
  const hotelIdsKey = buildHotelIdsKey(query.providerHotelIds);

  const doc = await StayRateCache.findOne({
    provider: providerId,
    hotelIdsKey,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    adults: query.adults,
    children: query.children,
    rooms: query.rooms
  }).lean<StayRateCacheDocument | null>();

  if (!doc || !isFresh(doc)) return null;
  return toResult(doc);
}

/**
 * Idempotent upsert on the exact search-context identity — a repeated write for the same
 * context always replaces the same document (never accumulates duplicates), which is
 * also what keeps a re-run of this safe to call as often as needed. A PROVIDER_ERROR
 * result, or a sampling-mode query (no explicit hotel ids), is silently skipped — see
 * this file's top comment for why.
 */
export async function saveCachedAvailability(query: StayPricingQuery, providerId: StayPricingProviderId, result: StayPricingResult): Promise<void> {
  if (!query.providerHotelIds || query.providerHotelIds.length === 0) return;
  if (result.state === 'PROVIDER_ERROR') return;

  await connectDB();
  const hotelIdsKey = buildHotelIdsKey(query.providerHotelIds);

  await StayRateCache.findOneAndUpdate(
    {
      provider: providerId,
      hotelIdsKey,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adults: query.adults,
      children: query.children,
      rooms: query.rooms
    },
    {
      provider: providerId,
      hotelIdsKey,
      providerHotelIds: query.providerHotelIds,
      destinationSlug: query.destinationSlug,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adults: query.adults,
      children: query.children,
      rooms: query.rooms,
      state: result.state,
      rates: result.rates,
      error: result.error
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}
