import type { HbxAvailabilityHotel, HbxHotelContent } from './hbx.types';
import type { NormalizedRate } from '../../pricing/stayPricing.types';
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

/** A cancellation policy whose charge kicks in at some future cutoff means the rate is
 *  refundable up until that date, non-refundable after — HBX never returns an explicit
 *  boolean, so this is the one place that inference happens. No cancellation policy at
 *  all is treated as "refundability unknown" (`undefined`), never assumed either way. */
function isRefundable(rate: { cancellationPolicies?: Array<{ from: string }> }): boolean | undefined {
  if (!rate.cancellationPolicies || rate.cancellationPolicies.length === 0) return undefined;
  const cutoff = new Date(rate.cancellationPolicies[0].from);
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
        refundable: isRefundable(rate),
        cancellationPolicy: rate.cancellationPolicies?.[0]
          ? { chargeAmount: rate.cancellationPolicies[0].amount, chargeFrom: rate.cancellationPolicies[0].from }
          : undefined,
        roomsRemaining: rate.rooms,
        lastCheckedAt: new Date().toISOString(),
        environment
      });
    }
  }

  return rates;
}
