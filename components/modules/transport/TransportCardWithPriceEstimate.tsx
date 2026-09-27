'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@/lib/pricing';
import TransportCard, { type TransportCardPriceOverride, type TransportCardProps } from './TransportCard';

export interface TransportCardWithPriceEstimateProps extends Omit<TransportCardProps, 'priceOverride'> {
  /** The exact TransportRoute `_id` this card is being shown for — absent for a custom
   *  (uncatalogued) route, in which case no price fetch is attempted and the card falls
   *  back to its existing static price display, unchanged. */
  routeId?: string;
  /** The Route Booking Popup's own UI trip-type label (e.g. "One Way") — mapped to the
   *  backend's TripType/rateType enums server-side in /api/transport/price. */
  tripType: string;
  /** ISO `YYYY-MM-DD` travel date. */
  travelDate: string;
  travellerCount?: number;
}

interface PriceApiResponse {
  status: 'CALCULATED_ESTIMATE' | 'EXACT_SUPPLIER_RATE' | 'GENERIC_SUPPLIER_ESTIMATE' | 'QUOTE_REQUIRED';
  label?: string;
  amountMinorUnits?: number;
  disclaimer?: string;
}

const PRICED_STATUSES = new Set(['CALCULATED_ESTIMATE', 'EXACT_SUPPLIER_RATE', 'GENERIC_SUPPLIER_ESTIMATE']);

/**
 * TP3F — wraps TransportCard with a route/date-aware price fetched from
 * /api/transport/price. Never computes a price itself (no duplicated pricing logic in
 * client code) — it only translates that endpoint's response into TransportCard's
 * `priceOverride` prop. Falls back to TransportCard's existing static display whenever no
 * routeId/vehicle category/travel date is available (a custom route, or a step before a
 * date has been chosen).
 */
export default function TransportCardWithPriceEstimate({ routeId, tripType, travelDate, travellerCount, vehicle, ...rest }: TransportCardWithPriceEstimateProps) {
  // A custom (uncatalogued) route, or a vehicle with no category, has nothing to price —
  // `fetchedOverride` is only ever set when this is true, and the render below ignores it
  // entirely otherwise, so no effect run for that case ever needs to touch state.
  const canFetchPrice = Boolean(routeId && vehicle.category && travelDate);
  const [fetchedOverride, setFetchedOverride] = useState<TransportCardPriceOverride>({ kind: 'loading' });

  useEffect(() => {
    if (!routeId || !vehicle.category || !travelDate) return;

    let cancelled = false;
    setFetchedOverride({ kind: 'loading' });

    const params = new URLSearchParams({ routeId, vehicleCategory: vehicle.category, tripType, travelDate });
    if (travellerCount) params.set('travellerCount', String(travellerCount));

    fetch(`/api/transport/price?${params.toString()}`)
      .then((response) => response.json() as Promise<PriceApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (PRICED_STATUSES.has(data.status) && typeof data.amountMinorUnits === 'number') {
          setFetchedOverride({
            kind: 'priced',
            label: data.label ?? 'Estimated Fare',
            amountLabel: formatINR(data.amountMinorUnits / 100),
            disclaimer: data.disclaimer
          });
        } else {
          // QUOTE_REQUIRED (or any unrecognized shape) — never show ₹0, a fake price or
          // a stale price (TP3F Section 5).
          setFetchedOverride({ kind: 'quoteRequired' });
        }
      })
      .catch(() => {
        // A network/server failure gets the same safe fallback as a genuine
        // QUOTE_REQUIRED business outcome — never a broken price, never a scary error.
        if (!cancelled) setFetchedOverride({ kind: 'quoteRequired' });
      });

    return () => {
      cancelled = true;
    };
  }, [routeId, vehicle.category, tripType, travelDate, travellerCount]);

  return <TransportCard vehicle={vehicle} priceOverride={canFetchPrice ? fetchedOverride : undefined} {...rest} />;
}
