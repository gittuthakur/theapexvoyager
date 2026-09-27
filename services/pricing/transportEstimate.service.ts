import { connectDB } from '@/lib/mongodb';
import { isValidCalendarDateISO } from '@/lib/dateValidation';
import {
  TransportEstimateRule,
  TRANSPORT_ESTIMATE_VEHICLE_CATEGORIES,
  TRANSPORT_ESTIMATE_SERVICE_REGIONS,
  SUPPORTED_ESTIMATE_TRIP_TYPES,
  TRANSPORT_ESTIMATE_RATE_BASIS,
  type TransportEstimateRuleDocument,
  type TransportEstimateTripType,
  type TransportEstimateRateBasis,
  type TransportEstimateSourceType,
  type TransportEstimateComponentStatus,
  type TransportEstimateDriverAllowance
} from '@/models/TransportEstimateRule';
import { TransportVehicle } from '@/models/TransportVehicle';
import type { TransportRateVehicleCategory } from '@/models/TransportRate';
import type { CalculatedEstimateResult, QuoteRequiredReason, QuoteRequiredResult, TransportEstimateQuery, TransportEstimateResult } from './transportEstimate.types';

/**
 * TP3B — the calculated transport-estimate engine. This is the ONLY place a caller
 * should ever ask for a formula-based transport estimate. It never reads or invents a
 * ₹/km value itself: every number it returns is traced to one approved TransportEstimateRule
 * row. With zero rules in the collection (the expected state right after TP3B ships),
 * every call here returns QUOTE_REQUIRED (TP3B Section 46) — never a demo/fallback price.
 *
 * This is deliberately NOT the combined pricing entry point — see
 * services/pricing/combinedTransportPricing.service.ts for how this composes with the
 * genuine supplier pricing service (services/pricing/transportPricing.service.ts), which
 * always takes precedence over a calculated estimate (TP3B Section 23).
 */

function toISODateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function quoteRequired(reason: QuoteRequiredReason, explanation: string): QuoteRequiredResult {
  return { status: 'QUOTE_REQUIRED', reason, explanation };
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Inclusive-both-ends comparison against the rule's own validity window, using the same
 *  whole-date string-comparison convention services/pricing/transportPricing.service.ts
 *  already uses — never a timezone-sensitive `Date` comparison. */
function isValidOnTravelDate(rule: Pick<TransportEstimateRuleDocument, 'validFrom' | 'validTo'>, travelDate: string): boolean {
  const from = toISODateOnly(new Date(rule.validFrom));
  const to = toISODateOnly(new Date(rule.validTo));
  return travelDate >= from && travelDate <= to;
}

/**
 * THE calculated-estimate entry point. Never returns a fabricated or guessed number:
 * QUOTE_REQUIRED is the only outcome whenever no approved TransportEstimateRule can be
 * established for the exact business key and travel date (TP3B Sections 8/17–22,
 * absolute rules). Server-only — connects to MongoDB directly.
 */
export async function calculateTransportEstimate(query: TransportEstimateQuery): Promise<TransportEstimateResult> {
  if (!query.travelDate || !isValidCalendarDateISO(query.travelDate)) {
    return quoteRequired('INVALID_INPUT', 'travelDate is missing or not a valid calendar date (expected YYYY-MM-DD).');
  }
  if (!query.vehicleCategory || !query.serviceRegion || !query.tripType || !query.rateBasis) {
    return quoteRequired('INVALID_INPUT', 'vehicleCategory, serviceRegion, tripType and rateBasis are all required.');
  }

  if (!SUPPORTED_ESTIMATE_TRIP_TYPES.includes(query.tripType as (typeof SUPPORTED_ESTIMATE_TRIP_TYPES)[number])) {
    return quoteRequired(
      'UNSUPPORTED_TRIP_TYPE',
      `Trip type "${query.tripType}" is not yet approved for calculated estimation — only ${SUPPORTED_ESTIMATE_TRIP_TYPES.join(', ')} are supported.`
    );
  }

  if (!TRANSPORT_ESTIMATE_RATE_BASIS.includes(query.rateBasis as TransportEstimateRateBasis)) {
    return quoteRequired('UNSUPPORTED_RATE_BASIS', `Rate basis "${query.rateBasis}" is not yet supported for calculation.`);
  }

  if (!TRANSPORT_ESTIMATE_VEHICLE_CATEGORIES.includes(query.vehicleCategory as TransportRateVehicleCategory)) {
    return quoteRequired('UNSUPPORTED_VEHICLE', `Vehicle category "${query.vehicleCategory}" is not a recognized category.`);
  }

  if (!TRANSPORT_ESTIMATE_SERVICE_REGIONS.includes(query.serviceRegion)) {
    return quoteRequired('UNKNOWN_REGION', `Service region "${query.serviceRegion}" is not one of the canonical service regions.`);
  }

  // A 4x4 request is always special/remote by category, regardless of whether a broad
  // category rule happens to exist (TP3B Section 14) — checked before any rule lookup.
  if (query.vehicleCategory === '4x4') {
    return quoteRequired('SPECIAL_VEHICLE', 'This vehicle category requires special/remote handling and is never auto-calculated.');
  }

  if (!isPositiveFiniteNumber(query.distanceKm)) {
    return quoteRequired('NO_DISTANCE', 'No valid, positive approved road distance was provided for this request.');
  }

  if (query.vehicleId) {
    await connectDB();
    const vehicle = await TransportVehicle.findById(query.vehicleId).lean<{ seats: number; mountainSuitable?: boolean; remoteRouteSuitable?: boolean } | null>();
    if (!vehicle) {
      return quoteRequired('INVALID_INPUT', `vehicleId "${query.vehicleId}" does not reference an existing vehicle.`);
    }
    if (vehicle.mountainSuitable || vehicle.remoteRouteSuitable) {
      return quoteRequired('REMOTE_ROUTE', 'The requested vehicle is flagged for mountain/remote-route use and is never auto-calculated.');
    }
    if (typeof query.travellerCount === 'number' && vehicle.seats < query.travellerCount) {
      return quoteRequired('CAPACITY_MISMATCH', `Requested vehicle seats (${vehicle.seats}) cannot carry travellerCount (${query.travellerCount}).`);
    }
  }

  await connectDB();
  const candidates = await TransportEstimateRule.find({
    vehicleCategory: query.vehicleCategory,
    serviceRegion: query.serviceRegion,
    tripType: query.tripType,
    rateBasis: query.rateBasis
  }).lean<TransportEstimateRuleDocument[]>();

  if (candidates.length === 0) {
    return quoteRequired('NO_ESTIMATE_RULE', 'No approved TransportEstimateRule exists for this vehicle category, region, trip type and rate basis.');
  }

  const activeCandidates = candidates.filter((rule) => rule.active);
  if (activeCandidates.length === 0) {
    return quoteRequired('RULE_INACTIVE', 'A matching TransportEstimateRule exists but is not active.');
  }

  const validNow = activeCandidates.filter((rule) => isValidOnTravelDate(rule, query.travelDate));
  if (validNow.length === 0) {
    const allExpired = activeCandidates.every((rule) => toISODateOnly(new Date(rule.validTo)) < query.travelDate);
    const allFuture = activeCandidates.every((rule) => toISODateOnly(new Date(rule.validFrom)) > query.travelDate);
    if (allExpired) return quoteRequired('RULE_EXPIRED', 'A matching TransportEstimateRule exists but has expired for this travel date.');
    if (allFuture) return quoteRequired('RULE_NOT_YET_VALID', 'A matching TransportEstimateRule exists but is not yet valid for this travel date.');
    return quoteRequired('NO_ESTIMATE_RULE', 'No matching TransportEstimateRule is valid for this travel date.');
  }

  if (validNow.length > 1) {
    return quoteRequired('AMBIGUOUS_RULE', `${validNow.length} active, valid TransportEstimateRules matched this exact business key — refusing to silently pick one.`);
  }

  return buildCalculatedResult(validNow[0], query.distanceKm);
}

function buildCalculatedResult(rule: TransportEstimateRuleDocument, distanceKm: number): CalculatedEstimateResult {
  const billableKm = Math.max(distanceKm, rule.minimumKmPerDay ?? 0);
  let amountMinorUnits = billableKm * rule.perKmRateMinorUnits;

  const driverAllowance: TransportEstimateDriverAllowance | undefined = rule.driverAllowance;
  const driverAllowanceStatus: 'INCLUDED' | 'EXCLUDED' = driverAllowance?.applicable ? 'INCLUDED' : 'EXCLUDED';
  if (driverAllowance?.applicable && !driverAllowance.includedInBaseFare) {
    amountMinorUnits += driverAllowance.perDayAmountMinorUnits ?? 0;
  }

  return {
    status: 'CALCULATED_ESTIMATE',
    amountMinorUnits: Math.round(amountMinorUnits),
    currency: 'INR',
    distanceKm,
    distanceSource: 'CALLER_PROVIDED_ROUTE',
    rateRuleId: String(rule._id),
    rateRuleSource: rule.sourceType,
    componentStatus: {
      driverAllowance: driverAllowanceStatus,
      nightHalt: 'EXCLUDED',
      toll: rule.tollStatus,
      parking: rule.parkingStatus,
      stateTax: rule.stateTaxStatus,
      permit: rule.permitStatus
    },
    validFrom: toISODateOnly(new Date(rule.validFrom)),
    validTo: toISODateOnly(new Date(rule.validTo)),
    reason: `Calculated transport cost estimate based on an owner-approved rate (${rule.sourceType.replace(/_/g, ' ').toLowerCase()}). Final fare may vary based on route, travel dates, vehicle availability, tolls, permits and supplier confirmation.`
  };
}

export interface CreateTransportEstimateRuleInput {
  vehicleCategory: TransportRateVehicleCategory;
  serviceRegion: string;
  tripType: TransportEstimateTripType;
  rateBasis: TransportEstimateRateBasis;
  perKmRateMinorUnits: number;
  minimumKmPerDay?: number;
  driverAllowance?: TransportEstimateDriverAllowance;
  nightHaltChargeMinorUnits?: number;
  tollStatus?: TransportEstimateComponentStatus;
  parkingStatus?: TransportEstimateComponentStatus;
  stateTaxStatus?: TransportEstimateComponentStatus;
  permitStatus?: TransportEstimateComponentStatus;
  validFrom: Date;
  validTo: Date;
  active?: boolean;
  sourceType: TransportEstimateSourceType;
  sourceName?: string;
  sourceReference?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export type CreateTransportEstimateRuleResult =
  | { created: true; rule: TransportEstimateRuleDocument }
  | { created: false; reason: 'overlapping_active_rule' | 'schema_validation_failed'; detail?: string };

/** Overlap protection Mongo indexes alone cannot express (TP3B Section 9): two active
 *  rules for the same (vehicleCategory, serviceRegion, tripType, rateBasis) identity must
 *  never have overlapping validity windows — mirrors
 *  services/pricing/transportPricing.service.ts's findOverlappingActiveRate exactly. */
export async function findOverlappingActiveEstimateRule(input: {
  vehicleCategory: string;
  serviceRegion: string;
  tripType: string;
  rateBasis: string;
  validFrom: Date;
  validTo: Date;
  excludeRuleId?: string;
}): Promise<TransportEstimateRuleDocument | null> {
  await connectDB();

  const query: Record<string, unknown> = {
    active: true,
    vehicleCategory: input.vehicleCategory,
    serviceRegion: input.serviceRegion,
    tripType: input.tripType,
    rateBasis: input.rateBasis,
    validFrom: { $lte: input.validTo },
    validTo: { $gte: input.validFrom }
  };

  if (input.excludeRuleId) {
    query._id = { $ne: input.excludeRuleId };
  }

  return TransportEstimateRule.findOne(query).lean<TransportEstimateRuleDocument | null>();
}

/**
 * The safe write path (TP3B Section 27) — the only way a TransportEstimateRule document
 * should ever be created. Not exposed through any public API; called only from
 * scripts/importTransportEstimateRules.ts, and never run against production during TP3B
 * itself (TP3B Section 29).
 */
export async function createTransportEstimateRule(input: CreateTransportEstimateRuleInput): Promise<CreateTransportEstimateRuleResult> {
  await connectDB();

  const overlap = await findOverlappingActiveEstimateRule({
    vehicleCategory: input.vehicleCategory,
    serviceRegion: input.serviceRegion,
    tripType: input.tripType,
    rateBasis: input.rateBasis,
    validFrom: input.validFrom,
    validTo: input.validTo
  });
  if (overlap) return { created: false, reason: 'overlapping_active_rule' };

  try {
    const rule = await TransportEstimateRule.create(input);
    return { created: true, rule };
  } catch (error) {
    return { created: false, reason: 'schema_validation_failed', detail: error instanceof Error ? error.message : String(error) };
  }
}
