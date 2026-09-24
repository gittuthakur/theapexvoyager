import type { HbxAvailabilityHotel, HbxCancellationPolicy, HbxHotelContent } from './hbx.types';
import type { CancellationPolicy, NormalizedRate } from '../../pricing/stayPricing.types';
import { getHbxEnvironment } from './hbx.client';

export interface HbxHotelSummary {
  hbxCode: number;
  name: string;
  destinationCode: string;
  zoneCode?: number;
  categoryCode?: string;
  latitude?: number;
  longitude?: number;
}

/** Malformed/partial supplier data (missing name, no coordinates, etc.) degrades to
 *  `undefined` fields rather than throwing — one bad row from HBX must never fail the
 *  whole sample. */
export function mapHbxHotelContentToSummary(raw: HbxHotelContent): HbxHotelSummary {
  return {
    hbxCode: raw.code,
    name: raw.name?.content ?? 'Unnamed property',
    destinationCode: raw.destinationCode,
    zoneCode: raw.zoneCode,
    categoryCode: raw.categoryCode,
    latitude: raw.coordinates?.latitude,
    longitude: raw.coordinates?.longitude
  };
}

/** Preserves every tier HBX returned, in source order — never truncated to the first
 *  one (2026-09-24 Phase-7 audit finding: HBX can return multiple tiers, e.g. free ->
 *  50% -> 100%, and only keeping tier [0] silently discarded the rest). A tier missing
 *  either field is dropped rather than passed through malformed; no currency
 *  conversion or amount adjustment happens here — `chargeAmount` is HBX's own string,
 *  verbatim. */
function mapCancellationPolicies(raw?: HbxCancellationPolicy[]): CancellationPolicy[] {
  if (!raw) return [];
  return raw
    .filter((policy) => typeof policy.amount === 'string' && typeof policy.from === 'string')
    .map((policy) => ({ chargeAmount: policy.amount, chargeFrom: policy.from }));
}

/** A cancellation policy whose charge kicks in at some future cutoff means the rate is
 *  refundable up until that date, non-refundable after — HBX never returns an explicit
 *  boolean, so this is the one place that inference happens. Uses the FIRST tier only
 *  (HBX orders tiers chronologically — tier 0 is the earliest/most lenient cutoff,
 *  i.e. "still fully refundable before this date"); this is an unchanged inference rule,
 *  independent of how many tiers are now preserved on the rate itself. No cancellation
 *  policy at all is treated as "refundability unknown" (`undefined`), never assumed
 *  either way. */
function isRefundable(policies: CancellationPolicy[]): boolean | undefined {
  if (policies.length === 0) return undefined;
  const cutoff = new Date(policies[0].chargeFrom);
  if (Number.isNaN(cutoff.getTime())) return undefined;
  return cutoff.getTime() > Date.now();
}

/** Flattens one HBX availability hotel's rooms/rates into the supplier-agnostic
 *  NormalizedRate shape (services/pricing/stayPricing.types.ts). Never throws on a
 *  malformed room/rate — skips it and keeps processing the rest, since one bad rate
 *  must never blank out every other valid one returned in the same response. */
export function mapHbxAvailabilityToRates(hotel: HbxAvailabilityHotel, nightCount: number): NormalizedRate[] {
  const rates: NormalizedRate[] = [];
  const environment = getHbxEnvironment();

  for (const room of hotel.rooms ?? []) {
    for (const rate of room.rates ?? []) {
      const net = Number.parseFloat(rate.net);
      if (!Number.isFinite(net) || net <= 0) continue;

      const cancellationPolicies = mapCancellationPolicies(rate.cancellationPolicies);

      rates.push({
        provider: 'hbx',
        providerHotelId: String(hotel.code),
        currency: hotel.currency,
        totalStayPrice: net,
        nightCount,
        displayPerNight: Math.round((net / nightCount) * 100) / 100,
        roomName: room.name,
        roomCode: room.code,
        boardName: rate.boardName,
        rateType: rate.rateType,
        refundable: isRefundable(cancellationPolicies),
        cancellationPolicies,
        // `rate.allotment` is the supplier's real remaining count — NOT `rate.rooms`,
        // which only echoes the room count the caller requested (see HbxRate's own
        // field doc comments in hbx.types.ts; 2026-09-24 Phase-7 audit finding).
        // Preserved as `undefined` (never 0 or NaN) when HBX omits it or sends
        // something non-numeric.
        roomsRemaining: Number.isFinite(rate.allotment) && (rate.allotment as number) >= 0 ? rate.allotment : undefined,
        lastCheckedAt: new Date().toISOString(),
        environment
      });
    }
  }

  return rates;
}
