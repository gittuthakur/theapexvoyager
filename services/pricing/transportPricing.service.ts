import { connectDB } from '@/lib/mongodb';
import { isValidCalendarDateISO } from '@/lib/dateValidation';
import { TransportRate, type TransportRateDocument, type TransportRateType, type TransportRateVehicleCategory } from '@/models/TransportRate';
import { TransportPartner } from '@/models/TransportPartner';
import { TransportRoute } from '@/models/TransportRoute';
import type { TransportCostQuery, TransportCostResult } from './transportPricing.types';

/**
 * The Transport supplier-rate pricing service — TP2's isolated, server-side pricing
 * foundation. This is the ONLY place a caller should ever ask "what does this transport
 * leg/circuit cost", and the only place TransportRate.supplierCostMinorUnits is ever
 * read for a pricing decision. Nothing here is wired into Journey pricing, Trip Planner
 * pricing, or any public API yet (TP2 Sections 23/24/25) — this collection is empty
 * today, so calculateTransportCost only ever returns QUOTE_REQUIRED until a real
 * supplier rate is entered through createTransportRate below.
 *
 * Circuit-identity design decision (TP2 Section 13): a CIRCUIT_FIXED rate is identified
 * by a free-text `circuitKey` (e.g. "spiti-circuit-shimla-manali"), not a structured
 * stop list and not a required Journey link. This is the smallest design that avoids
 * duplicate/ambiguous rates (one key = one itinerary), stays human-manageable (staff can
 * assign a key when entering a supplier quote, no route-planning engine needed), and
 * still supports a later Journey-integration phase (a Journey can carry an optional
 * `journeySlug` on the rate purely as collection-priority metadata) — without coupling
 * all Transport pricing to Journeys, since `circuitKey` never depends on one existing.
 */

// Mirrors lib/transportPartners.ts's getVerifiedPartners() exactly — a 'pending' or
// 'suspended' partner's rates must never be treated as usable, regardless of how
// otherwise-valid the rate row itself looks (TP2 Section 14).
const ELIGIBLE_PARTNER_STATUSES = ['verified', 'active'];

function isPositiveFiniteInteger(value: number): boolean {
  return Number.isInteger(value) && Number.isFinite(value) && value > 0;
}

function toISODateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Inclusive-both-ends comparison against the rate's own validity window, using the same
 *  whole-date string-comparison convention lib/pricing.ts's seasonal pricing and
 *  lib/dateValidation.ts already use — never a timezone-sensitive `Date` comparison. */
function isValidOnTravelDate(rate: Pick<TransportRateDocument, 'validFrom' | 'validTo'>, travelDate: string): boolean {
  const from = toISODateOnly(new Date(rate.validFrom));
  const to = toISODateOnly(new Date(rate.validTo));
  return travelDate >= from && travelDate <= to;
}

async function isPartnerEligible(partnerId: unknown): Promise<boolean> {
  const partner = await TransportPartner.findById(partnerId).lean<{ status: string } | null>();
  return !!partner && ELIGIBLE_PARTNER_STATUSES.includes(partner.status);
}

interface MatchOptions {
  vehicleCategory: string;
  rateType: TransportRateType;
  routeId?: string;
  circuitKey?: string;
  /** true = only rows with no routeId set (the ESTIMATED candidate pool for
   *  POINT_TO_POINT/ROUND_TRIP); false/omitted with a routeId = the EXACT candidate pool
   *  for that specific route. */
  genericRouteOnly?: boolean;
}

/** Every row this returns has already passed: active, a positive/finite supplierCost, an
 *  eligible partner, and validity on the given travel date — a caller never has to
 *  re-check any of those. */
async function findEligibleRates(opts: MatchOptions, travelDate: string): Promise<TransportRateDocument[]> {
  await connectDB();

  const query: Record<string, unknown> = {
    active: true,
    vehicleCategory: opts.vehicleCategory,
    rateType: opts.rateType
  };

  if (opts.rateType === 'CIRCUIT_FIXED') {
    query.circuitKey = opts.circuitKey;
  } else if (opts.genericRouteOnly) {
    query.routeId = { $exists: false };
  } else if (opts.routeId) {
    query.routeId = opts.routeId;
  } else {
    // Caller must be explicit about which candidate pool it wants — an unscoped query
    // that could accidentally match every rate for a vehicle category is never run.
    return [];
  }

  const candidates = await TransportRate.find(query).lean<TransportRateDocument[]>();

  const eligible: TransportRateDocument[] = [];
  for (const rate of candidates) {
    if (!isPositiveFiniteInteger(rate.supplierCostMinorUnits)) continue;
    if (!isValidOnTravelDate(rate, travelDate)) continue;
    // Candidate lists are small (one supplier's rates for one category/route), and
    // eligibility depends on each row's own partnerId, so this isn't parallelized.
    if (!(await isPartnerEligible(rate.partnerId))) continue;
    eligible.push(rate);
  }
  return eligible;
}

/** Deterministic selection when more than one eligible rate matches (TP2 Section 31) —
 *  the most recently verified rate wins, falling back to most recently updated when
 *  neither has been marked verified. Never "cheapest": that would silently prefer an
 *  under-priced or stale entry over a properly verified one. */
function pickBest(rates: TransportRateDocument[]): TransportRateDocument {
  return [...rates].sort((a, b) => {
    const aTime = (a.verifiedAt ?? a.updatedAt)?.getTime() ?? 0;
    const bTime = (b.verifiedAt ?? b.updatedAt)?.getTime() ?? 0;
    return bTime - aTime;
  })[0];
}

function buildResult(status: 'EXACT' | 'ESTIMATED', rate: TransportRateDocument, matchCount: number): TransportCostResult {
  const ambiguityNote = matchCount > 1 ? ` (${matchCount} eligible rates matched; the most recently verified was used.)` : '';
  return {
    status,
    supplierCostMinorUnits: rate.supplierCostMinorUnits,
    currency: rate.currency,
    rateId: String(rate._id),
    partnerId: String(rate.partnerId),
    rateType: rate.rateType,
    validFrom: toISODateOnly(new Date(rate.validFrom)),
    validTo: toISODateOnly(new Date(rate.validTo)),
    includedKm: rate.includedKm,
    minimumKm: rate.minimumKm,
    extraKmRateMinorUnits: rate.extraKmRateMinorUnits,
    driverAllowanceMinorUnits: rate.driverAllowanceMinorUnits,
    nightChargeMinorUnits: rate.nightChargeMinorUnits,
    inclusions: rate.inclusions,
    explanation:
      status === 'EXACT'
        ? `Genuine verified supplier rate found, specific to this ${rate.rateType === 'CIRCUIT_FIXED' ? 'circuit' : 'route'} and vehicle category.${ambiguityNote}`
        : `No route-specific supplier rate found; a genuine verified generic rate for this vehicle category was used instead.${ambiguityNote}`
  };
}

/**
 * THE pricing entry point. Never returns a fabricated or estimated-from-demo-data
 * number: QUOTE_REQUIRED is the only outcome whenever a genuine verified supplier rate
 * cannot be established (TP2 Sections 18–20, absolute rules). Server-only — this
 * function connects to MongoDB directly and must never be imported into client
 * component code.
 */
export async function calculateTransportCost(query: TransportCostQuery): Promise<TransportCostResult> {
  if (!query.travelDate || !isValidCalendarDateISO(query.travelDate)) {
    return { status: 'QUOTE_REQUIRED', explanation: 'travelDate is missing or not a valid calendar date (expected YYYY-MM-DD).' };
  }

  if (query.rateType === 'CIRCUIT_FIXED') {
    if (!query.circuitKey) {
      return { status: 'QUOTE_REQUIRED', explanation: 'CIRCUIT_FIXED requires a circuitKey identifying the itinerary.' };
    }
    const exact = await findEligibleRates({ vehicleCategory: query.vehicleCategory, rateType: query.rateType, circuitKey: query.circuitKey }, query.travelDate);
    if (exact.length > 0) return buildResult('EXACT', pickBest(exact), exact.length);
    return {
      status: 'QUOTE_REQUIRED',
      explanation: `No genuine verified supplier circuit rate found for circuitKey "${query.circuitKey}", vehicle category "${query.vehicleCategory}", valid on ${query.travelDate}.`
    };
  }

  // POINT_TO_POINT / ROUND_TRIP
  if (query.routeId) {
    const exact = await findEligibleRates({ vehicleCategory: query.vehicleCategory, rateType: query.rateType, routeId: query.routeId }, query.travelDate);
    if (exact.length > 0) return buildResult('EXACT', pickBest(exact), exact.length);
  }

  const generic = await findEligibleRates({ vehicleCategory: query.vehicleCategory, rateType: query.rateType, genericRouteOnly: true }, query.travelDate);
  if (generic.length > 0) return buildResult('ESTIMATED', pickBest(generic), generic.length);

  return {
    status: 'QUOTE_REQUIRED',
    explanation: query.routeId
      ? `No genuine verified supplier rate found for this route, and no generic "${query.vehicleCategory}" rate exists either, valid on ${query.travelDate}.`
      : `No genuine verified generic supplier rate found for vehicle category "${query.vehicleCategory}", rate type "${query.rateType}", valid on ${query.travelDate}.`
  };
}

export interface CreateTransportRateInput {
  partnerId: string;
  vehicleCategory: TransportRateVehicleCategory;
  rateType: TransportRateType;
  routeId?: string;
  circuitKey?: string;
  journeySlug?: string;
  supplierCostMinorUnits: number;
  includedKm?: number;
  minimumKm?: number;
  extraKmRateMinorUnits?: number;
  driverAllowanceMinorUnits?: number;
  nightChargeMinorUnits?: number;
  inclusions?: TransportRateDocument['inclusions'];
  validFrom: Date;
  validTo: Date;
  source: string;
  sourceReference?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export type CreateTransportRateResult =
  | { created: true; rate: TransportRateDocument }
  | { created: false; reason: 'invalid_partner' | 'invalid_route' | 'overlapping_active_rate' | 'schema_validation_failed'; detail?: string };

/** Overlap protection Mongo indexes alone cannot express (TP2 Section 30): two active
 *  rates for the same (partner, vehicleCategory, rateType, route-or-circuit identity)
 *  must never have overlapping validity windows — a genuine seasonal replacement rate is
 *  still allowed, as long as its window doesn't overlap an existing active one. */
export async function findOverlappingActiveRate(input: {
  partnerId: string;
  vehicleCategory: string;
  rateType: TransportRateType;
  routeId?: string;
  circuitKey?: string;
  validFrom: Date;
  validTo: Date;
  excludeRateId?: string;
}): Promise<TransportRateDocument | null> {
  await connectDB();

  const query: Record<string, unknown> = {
    active: true,
    partnerId: input.partnerId,
    vehicleCategory: input.vehicleCategory,
    rateType: input.rateType,
    validFrom: { $lte: input.validTo },
    validTo: { $gte: input.validFrom }
  };

  if (input.rateType === 'CIRCUIT_FIXED') {
    query.circuitKey = input.circuitKey;
  } else if (input.routeId) {
    query.routeId = input.routeId;
  } else {
    query.routeId = { $exists: false };
  }

  if (input.excludeRateId) {
    query._id = { $ne: input.excludeRateId };
  }

  return TransportRate.findOne(query).lean<TransportRateDocument | null>();
}

/**
 * The safe write path (TP2 Section 27) — the only way a TransportRate document should
 * ever be created. Not exposed through any public API in TP2; called only from
 * scripts/importTransportRates.ts today. Refuses to write anything the schema itself
 * would reject, anything referencing a nonexistent partner/route, and anything that
 * would overlap an existing active rate for the same identity.
 */
export async function createTransportRate(input: CreateTransportRateInput): Promise<CreateTransportRateResult> {
  await connectDB();

  const partner = await TransportPartner.findById(input.partnerId).lean<{ status: string } | null>();
  if (!partner) return { created: false, reason: 'invalid_partner' };

  if (input.routeId) {
    const route = await TransportRoute.findById(input.routeId).lean();
    if (!route) return { created: false, reason: 'invalid_route' };
  }

  const overlap = await findOverlappingActiveRate({
    partnerId: input.partnerId,
    vehicleCategory: input.vehicleCategory,
    rateType: input.rateType,
    routeId: input.routeId,
    circuitKey: input.circuitKey,
    validFrom: input.validFrom,
    validTo: input.validTo
  });
  if (overlap) return { created: false, reason: 'overlapping_active_rate' };

  try {
    const rate = await TransportRate.create(input);
    return { created: true, rate };
  } catch (error) {
    return { created: false, reason: 'schema_validation_failed', detail: error instanceof Error ? error.message : String(error) };
  }
}
