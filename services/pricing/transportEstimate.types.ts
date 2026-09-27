import type { TransportEstimateComponentStatus, TransportEstimateSourceType } from '@/models/TransportEstimateRule';

/**
 * QUOTE_REQUIRED is a first-class normal result, not an exception path (TP3B Section 22)
 * — every reason below is returned by services/pricing/transportEstimate.service.ts for
 * an ordinary, expected situation, never thrown as a server error.
 */
export const QUOTE_REQUIRED_REASONS = [
  'NO_DISTANCE',
  'NO_ESTIMATE_RULE',
  'RULE_EXPIRED',
  'RULE_NOT_YET_VALID',
  'RULE_INACTIVE',
  'UNSUPPORTED_TRIP_TYPE',
  'UNSUPPORTED_RATE_BASIS',
  'UNSUPPORTED_VEHICLE',
  'UNKNOWN_REGION',
  'SPECIAL_VEHICLE',
  'REMOTE_ROUTE',
  'CAPACITY_MISMATCH',
  'AMBIGUOUS_RULE',
  'INVALID_INPUT'
] as const;
export type QuoteRequiredReason = (typeof QUOTE_REQUIRED_REASONS)[number];

/**
 * What a caller must know to ask for one TP3B calculated transport estimate.
 * `distanceKm` must be an already-approved road distance from a caller's own
 * TransportRoute/contract (TP3B Section 10) — this service never computes, infers, or
 * calls out for one. `vehicleId`/`travellerCount` are optional: when given, the specific
 * TransportVehicle's capacity and special/remote flags are checked (TP3B Sections 14/15).
 */
export interface TransportEstimateQuery {
  vehicleCategory: string;
  serviceRegion: string;
  tripType: string;
  rateBasis: string;
  /** ISO `YYYY-MM-DD` — the customer's actual travel date, judged against each candidate
   *  rule's own validFrom/validTo, never server "today". */
  travelDate: string;
  distanceKm?: number;
  vehicleId?: string;
  travellerCount?: number;
}

export type TransportEstimateComponentStatusMap = {
  driverAllowance: 'INCLUDED' | 'EXCLUDED';
  nightHalt: 'EXCLUDED';
  toll: TransportEstimateComponentStatus;
  parking: TransportEstimateComponentStatus;
  stateTax: TransportEstimateComponentStatus;
  permit: TransportEstimateComponentStatus;
};

export interface CalculatedEstimateResult {
  status: 'CALCULATED_ESTIMATE';
  /** The final estimated price (base + driver allowance + any explicitly supported fixed
   *  extras — none exist yet), in integer minor units. Rounded exactly once, here, at the
   *  very end — every intermediate km/percentage figure below is kept at full precision
   *  (TP3E Section 5's rounding rule). */
  amountMinorUnits: number;
  currency: 'INR';
  /** The genuine, caller-supplied route distance — NEVER mutated by the dead-km
   *  component below (TP3E Section 2/3). */
  distanceKm: number;
  /** Always 'CALLER_PROVIDED_ROUTE' in TP3B — this service never computes or infers a
   *  distance itself (TP3B Section 10). */
  distanceSource: 'CALLER_PROVIDED_ROUTE';
  /** TP3E — the vehicle return/repositioning distance in km, derived from the rule's
   *  `deadKmReturnPercent` applied to `distanceKm` (0 when the rule doesn't set one —
   *  fully backward compatible with a pre-TP3E rule). Kept at full floating-point
   *  precision, never rounded. */
  deadKmComponentKm: number;
  /** TP3E — `max(distanceKm + deadKmComponentKm, minimumKmPerDay ?? 0)`, the km figure
   *  actually multiplied by `perKmRateMinorUnits`. Full precision, never rounded. */
  effectiveBillableKm: number;
  /** TP3E — true only when the rule's `minimumKmPerDay` floor raised
   *  `effectiveBillableKm` above `distanceKm + deadKmComponentKm`. */
  minimumKmApplied: boolean;
  /** The rule's own ₹/km rate (integer minor units per km), exposed so a future UI can
   *  show the calculation breakdown without recomputing it client-side (TP3E Section 4). */
  perKmRateMinorUnits: number;
  rateRuleId: string;
  rateRuleSource: TransportEstimateSourceType;
  componentStatus: TransportEstimateComponentStatusMap;
  validFrom: string;
  validTo: string;
  /** Always present — a short, customer-safe explanation of how the amount was derived.
   *  Never includes internal notes/sourceReference/verifiedBy (TP3B Section 25). */
  reason: string;
}

export interface QuoteRequiredResult {
  status: 'QUOTE_REQUIRED';
  reason: QuoteRequiredReason;
  explanation: string;
}

export type TransportEstimateResult = CalculatedEstimateResult | QuoteRequiredResult;
