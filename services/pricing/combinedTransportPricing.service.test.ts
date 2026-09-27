import { beforeEach, describe, expect, it, vi } from 'vitest';

const calculateTransportCost = vi.fn();
const calculateTransportEstimate = vi.fn();

vi.mock('./transportPricing.service', () => ({ calculateTransportCost }));
vi.mock('./transportEstimate.service', () => ({ calculateTransportEstimate }));

const { resolveTransportPricing } = await import('./combinedTransportPricing.service');

const BASE_QUERY = {
  vehicleCategory: 'SUV',
  travelDate: '2026-06-01',
  rateType: 'POINT_TO_POINT' as const,
  routeId: 'route-1',
  serviceRegion: 'himachal-pradesh',
  tripType: 'ONE_WAY',
  rateBasis: 'PER_KM',
  distanceKm: 100
};

beforeEach(() => {
  calculateTransportCost.mockReset();
  calculateTransportEstimate.mockReset();
});

describe('resolveTransportPricing — precedence', () => {
  it('an EXACT genuine supplier rate beats everything else and never consults the estimate engine', async () => {
    calculateTransportCost.mockResolvedValue({
      status: 'EXACT',
      supplierCostMinorUnits: 470_000,
      rateId: 'rate-1',
      partnerId: 'partner-1',
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      explanation: 'exact'
    });
    const result = await resolveTransportPricing(BASE_QUERY);
    expect(result.status).toBe('EXACT_SUPPLIER_RATE');
    expect(calculateTransportEstimate).not.toHaveBeenCalled();
  });

  it('a generic genuine supplier rate beats a calculated estimate and never consults the estimate engine', async () => {
    calculateTransportCost.mockResolvedValue({
      status: 'ESTIMATED',
      supplierCostMinorUnits: 400_000,
      rateId: 'rate-2',
      partnerId: 'partner-2',
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      explanation: 'generic'
    });
    const result = await resolveTransportPricing(BASE_QUERY);
    expect(result.status).toBe('GENERIC_SUPPLIER_ESTIMATE');
    expect(calculateTransportEstimate).not.toHaveBeenCalled();
  });

  it('a calculated estimate beats QUOTE_REQUIRED when no genuine supplier rate exists', async () => {
    calculateTransportCost.mockResolvedValue({ status: 'QUOTE_REQUIRED', explanation: 'no supplier rate' });
    calculateTransportEstimate.mockResolvedValue({
      status: 'CALCULATED_ESTIMATE',
      amountMinorUnits: 120_000,
      currency: 'INR',
      distanceKm: 100,
      distanceSource: 'CALLER_PROVIDED_ROUTE',
      rateRuleId: 'rule-1',
      rateRuleSource: 'BUSINESS_APPROVED_ESTIMATE',
      componentStatus: { driverAllowance: 'EXCLUDED', nightHalt: 'EXCLUDED', toll: 'UNKNOWN', parking: 'UNKNOWN', stateTax: 'UNKNOWN', permit: 'UNKNOWN' },
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      reason: 'calculated'
    });
    const result = await resolveTransportPricing(BASE_QUERY);
    expect(result.status).toBe('CALCULATED_ESTIMATE');
  });

  it('no genuine rate and no approved estimate rule results in QUOTE_REQUIRED', async () => {
    calculateTransportCost.mockResolvedValue({ status: 'QUOTE_REQUIRED', explanation: 'no supplier rate' });
    calculateTransportEstimate.mockResolvedValue({ status: 'QUOTE_REQUIRED', reason: 'NO_ESTIMATE_RULE', explanation: 'no rule' });
    const result = await resolveTransportPricing(BASE_QUERY);
    expect(result).toEqual({ status: 'QUOTE_REQUIRED', reason: 'NO_ESTIMATE_RULE', explanation: 'no rule' });
  });

  it('never attempts a calculated estimate when the caller supplies no TP3B fields', async () => {
    calculateTransportCost.mockResolvedValue({ status: 'QUOTE_REQUIRED', explanation: 'no supplier rate' });
    const { serviceRegion: _r, tripType: _t, rateBasis: _b, ...supplierOnlyQuery } = BASE_QUERY;
    const result = await resolveTransportPricing(supplierOnlyQuery);
    expect(result.status).toBe('QUOTE_REQUIRED');
    expect(calculateTransportEstimate).not.toHaveBeenCalled();
  });
});

describe('resolveTransportPricing — no fake exactness', () => {
  it('a calculated estimate can never surface as EXACT_SUPPLIER_RATE or GENERIC_SUPPLIER_ESTIMATE', async () => {
    calculateTransportCost.mockResolvedValue({ status: 'QUOTE_REQUIRED', explanation: 'no supplier rate' });
    calculateTransportEstimate.mockResolvedValue({
      status: 'CALCULATED_ESTIMATE',
      amountMinorUnits: 999_999,
      currency: 'INR',
      distanceKm: 100,
      distanceSource: 'CALLER_PROVIDED_ROUTE',
      rateRuleId: 'rule-2',
      rateRuleSource: 'MARKET_REFERENCE',
      componentStatus: { driverAllowance: 'EXCLUDED', nightHalt: 'EXCLUDED', toll: 'UNKNOWN', parking: 'UNKNOWN', stateTax: 'UNKNOWN', permit: 'UNKNOWN' },
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      reason: 'calculated'
    });
    const result = await resolveTransportPricing(BASE_QUERY);
    expect(result.status).not.toBe('EXACT_SUPPLIER_RATE');
    expect(result.status).not.toBe('GENERIC_SUPPLIER_ESTIMATE');
    expect(result.status).toBe('CALCULATED_ESTIMATE');
  });
});
