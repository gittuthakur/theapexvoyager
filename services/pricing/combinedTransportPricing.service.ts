import { calculateTransportCost } from './transportPricing.service';
import { calculateTransportEstimate } from './transportEstimate.service';
import type { TransportCostResult } from './transportPricing.types';
import type { CombinedTransportPricingQuery, NormalizedQuoteRequiredResult, NormalizedSupplierRateResult } from './combinedTransportPricing.types';
import type { CalculatedEstimateResult } from './transportEstimate.types';

/**
 * TP3B — the combined transport-pricing resolver. Preserves TP2's absolute precedence
 * (TP3B Section 23): a genuine supplier rate always wins over a calculated estimate,
 * which always wins over QUOTE_REQUIRED. A TransportEstimateRule can never itself produce
 * EXACT_SUPPLIER_RATE or GENERIC_SUPPLIER_ESTIMATE — those two statuses only ever come
 * from adapting a real services/pricing/transportPricing.service.ts result below; this
 * function never lets a calculated estimate substitute for one.
 *
 * Precedence:
 *   1. valid exact genuine TransportRate      -> EXACT_SUPPLIER_RATE
 *   2. valid generic genuine TransportRate    -> GENERIC_SUPPLIER_ESTIMATE
 *   3. approved calculated TransportEstimateRule -> CALCULATED_ESTIMATE
 *   4. otherwise                              -> QUOTE_REQUIRED
 *
 * Not wired into Journey pricing, Trip Planner pricing, or any public API in TP3B (TP3B
 * Sections 26/31) — a future integration phase will call this after Transport estimation
 * rules are owner-approved and validated. Server-only.
 */

function adaptSupplierResult(status: 'EXACT_SUPPLIER_RATE' | 'GENERIC_SUPPLIER_ESTIMATE', result: TransportCostResult): NormalizedSupplierRateResult {
  return {
    status,
    amountMinorUnits: result.supplierCostMinorUnits as number,
    currency: 'INR',
    rateId: result.rateId as string,
    partnerId: result.partnerId as string,
    validFrom: result.validFrom as string,
    validTo: result.validTo as string,
    explanation: result.explanation
  };
}

export async function resolveTransportPricing(
  query: CombinedTransportPricingQuery
): Promise<NormalizedSupplierRateResult | CalculatedEstimateResult | NormalizedQuoteRequiredResult> {
  const supplierResult = await calculateTransportCost({
    vehicleCategory: query.vehicleCategory,
    rateType: query.rateType,
    travelDate: query.travelDate,
    routeId: query.routeId,
    circuitKey: query.circuitKey
  });

  if (supplierResult.status === 'EXACT') return adaptSupplierResult('EXACT_SUPPLIER_RATE', supplierResult);
  if (supplierResult.status === 'ESTIMATED') return adaptSupplierResult('GENERIC_SUPPLIER_ESTIMATE', supplierResult);

  // supplierResult.status === 'QUOTE_REQUIRED' — a calculated estimate may only be tried
  // when the caller actually supplied the TP3B-specific inputs it needs.
  if (query.serviceRegion && query.tripType && query.rateBasis) {
    const estimateResult = await calculateTransportEstimate({
      vehicleCategory: query.vehicleCategory,
      serviceRegion: query.serviceRegion,
      tripType: query.tripType,
      rateBasis: query.rateBasis,
      travelDate: query.travelDate,
      distanceKm: query.distanceKm,
      vehicleId: query.vehicleId,
      travellerCount: query.travellerCount
    });

    if (estimateResult.status === 'CALCULATED_ESTIMATE') return estimateResult;
    return { status: 'QUOTE_REQUIRED', reason: estimateResult.reason, explanation: estimateResult.explanation };
  }

  return { status: 'QUOTE_REQUIRED', explanation: supplierResult.explanation };
}
