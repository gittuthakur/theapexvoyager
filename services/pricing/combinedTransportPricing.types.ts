import type { TransportRateType } from '@/models/TransportRate';
import type { QuoteRequiredReason } from './transportEstimate.types';

export type NormalizedTransportPricingStatus = 'EXACT_SUPPLIER_RATE' | 'GENERIC_SUPPLIER_ESTIMATE' | 'CALCULATED_ESTIMATE' | 'QUOTE_REQUIRED';

/**
 * Carries both the genuine-supplier-pricing inputs (services/pricing/transportPricing.service.ts)
 * and the calculated-estimate inputs (services/pricing/transportEstimate.service.ts) in one
 * request, since resolveTransportPricing tries the former first and only falls back to the
 * latter when no genuine supplier rate exists (TP3B Section 23). The TP3B fields are
 * optional: a caller that omits them simply never attempts a calculated-estimate fallback.
 */
export interface CombinedTransportPricingQuery {
  vehicleCategory: string;
  travelDate: string;
  rateType: TransportRateType;
  routeId?: string;
  circuitKey?: string;
  serviceRegion?: string;
  tripType?: string;
  rateBasis?: string;
  distanceKm?: number;
  vehicleId?: string;
  travellerCount?: number;
}

export interface NormalizedSupplierRateResult {
  status: 'EXACT_SUPPLIER_RATE' | 'GENERIC_SUPPLIER_ESTIMATE';
  amountMinorUnits: number;
  currency: 'INR';
  rateId: string;
  partnerId: string;
  validFrom: string;
  validTo: string;
  explanation: string;
}

export interface NormalizedQuoteRequiredResult {
  status: 'QUOTE_REQUIRED';
  /** Present only when the calculated-estimate engine ran and itself returned
   *  QUOTE_REQUIRED — absent when the supplier lookup alone was inconclusive and no TP3B
   *  fields were even supplied. */
  reason?: QuoteRequiredReason;
  explanation: string;
}
