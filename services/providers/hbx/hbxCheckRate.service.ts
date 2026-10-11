import { HBX_SOURCE_MARKET } from '@/config/hbxEnvironment.config';
import { hbxFetch, isHbxConfigured } from './hbx.client';
import { logHbxError } from './hbx.errors';
import { mapHbxAvailabilityToRates } from './hbx.mapper';
import type { HbxCheckRateRequestBody, HbxCheckRateResponse } from './hbx.types';
import type { NormalizedRate } from '../../pricing/stayPricing.types';

const CHECKRATE_PATH = '/hotel-api/1.0/checkrates';

export type CheckRateResult = { ok: true; rate: NormalizedRate } | { ok: false; reason: 'NOT_CONFIGURED' | 'PROVIDER_ERROR' | 'RATE_NO_LONGER_AVAILABLE'; error?: string };

/**
 * Hotelbeds' required revalidation step for any rate whose `rateType === 'RECHECK'`
 * (the certification workflow rule) — takes the exact `rateKey` an Availability response
 * already quoted and re-confirms price/availability/conditions immediately before
 * booking. Never called for a `'BOOKABLE'` rate (see
 * services/pricing/hbxBookingWorkflow.service.ts, the only caller of this function).
 *
 * Deliberately never falls back to the original (pre-CheckRate) rate on any failure —
 * "do not silently substitute another rate" is absolute: any failure here must stop the
 * booking attempt entirely, never proceed with stale/unconfirmed pricing.
 */
export async function checkRate(rateKey: string, nightCount: number): Promise<CheckRateResult> {
  if (!isHbxConfigured()) return { ok: false, reason: 'NOT_CONFIGURED' };

  const body: HbxCheckRateRequestBody = { rooms: [{ rateKey }] };

  try {
    const response = await hbxFetch<HbxCheckRateResponse>(CHECKRATE_PATH, { method: 'POST', body: { ...body, sourceMarket: HBX_SOURCE_MARKET } });
    const rates = mapHbxAvailabilityToRates(response.hotel, nightCount);
    if (rates.length === 0) return { ok: false, reason: 'RATE_NO_LONGER_AVAILABLE' };
    // A CheckRate request names exactly one rateKey — HBX's response should describe
    // exactly that one rate; the first (only) normalized rate is the revalidated result.
    return { ok: true, rate: rates[0] };
  } catch (error) {
    logHbxError('checkRate', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, reason: 'PROVIDER_ERROR', error: message };
  }
}
