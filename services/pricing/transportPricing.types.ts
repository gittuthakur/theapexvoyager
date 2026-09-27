import type { TransportRateInclusions, TransportRateType } from '@/models/TransportRate';

export type TransportCostStatus = 'EXACT' | 'ESTIMATED' | 'QUOTE_REQUIRED';

/**
 * What a caller must know to price one transport leg or circuit. `routeId` is only
 * meaningful for POINT_TO_POINT/ROUND_TRIP; `circuitKey` is only meaningful for
 * CIRCUIT_FIXED — see calculateTransportCost's own doc comment for exactly how each is
 * used.
 */
export interface TransportCostQuery {
  vehicleCategory: string;
  rateType: TransportRateType;
  /** ISO `YYYY-MM-DD` — the customer's actual travel date, judged against each
   *  candidate rate's own validFrom/validTo (TP2 Section 7), never server "today". */
  travelDate: string;
  routeId?: string;
  circuitKey?: string;
}

export interface TransportCostResult {
  status: TransportCostStatus;
  /** Present only when status is EXACT or ESTIMATED — never a fabricated number when
   *  QUOTE_REQUIRED (TP2 Sections 17/20, an absolute rule). */
  supplierCostMinorUnits?: number;
  currency?: 'INR';
  rateId?: string;
  partnerId?: string;
  rateType?: TransportRateType;
  validFrom?: string;
  validTo?: string;
  includedKm?: number;
  minimumKm?: number;
  extraKmRateMinorUnits?: number;
  driverAllowanceMinorUnits?: number;
  nightChargeMinorUnits?: number;
  inclusions?: TransportRateInclusions;
  /** Always present — the reason for the status, especially important on
   *  QUOTE_REQUIRED, where it's the only information returned. */
  explanation: string;
}
