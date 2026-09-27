import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveTransportPricing } = vi.hoisted(() => ({ resolveTransportPricing: vi.fn() }));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/services/pricing/combinedTransportPricing.service', () => ({ resolveTransportPricing }));

interface FakeRoute {
  _id: string;
  distanceKm?: number;
  active: boolean;
  regionId?: string;
}

let routeStore: Record<string, FakeRoute> = {};
let regionStore: Record<string, { slug: string }> = {};

vi.mock('@/models/TransportRoute', () => ({
  TransportRoute: {
    findById: vi.fn((id: string) => ({ lean: async () => routeStore[id] ?? null }))
  }
}));

vi.mock('@/models/Region', () => ({
  Region: {
    findById: vi.fn((id: string) => ({ lean: async () => regionStore[id] ?? null }))
  }
}));

const { GET } = await import('./route');

const ROUTE: FakeRoute = { _id: 'route-1', distanceKm: 115, active: true, regionId: 'region-1' };

function request(params: Record<string, string>) {
  const url = new URL('https://test.invalid/api/transport/price');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new Request(url);
}

const VALID_PARAMS = { routeId: 'route-1', vehicleCategory: 'Sedan', tripType: 'One Way', travelDate: '2026-10-15' };

beforeEach(() => {
  resolveTransportPricing.mockReset();
  routeStore = { 'route-1': ROUTE };
  regionStore = { 'region-1': { slug: 'himachal-pradesh' } };
});

describe('GET /api/transport/price — input validation', () => {
  it('missing routeId -> QUOTE_REQUIRED, never calls the resolver', async () => {
    const { routeId: _r, ...rest } = VALID_PARAMS;
    const response = await GET(request(rest));
    const body = await response.json();
    expect(body).toEqual({ status: 'QUOTE_REQUIRED', message: 'Get Custom Quote' });
    expect(resolveTransportPricing).not.toHaveBeenCalled();
  });

  it('missing vehicleCategory -> QUOTE_REQUIRED', async () => {
    const { vehicleCategory: _v, ...rest } = VALID_PARAMS;
    const body = await (await GET(request(rest))).json();
    expect(body.status).toBe('QUOTE_REQUIRED');
  });

  it('invalid travelDate -> QUOTE_REQUIRED', async () => {
    const body = await (await GET(request({ ...VALID_PARAMS, travelDate: '2026-02-30' }))).json();
    expect(body.status).toBe('QUOTE_REQUIRED');
  });

  it('unrecognized tripType label -> QUOTE_REQUIRED', async () => {
    const body = await (await GET(request({ ...VALID_PARAMS, tripType: 'Teleport' }))).json();
    expect(body.status).toBe('QUOTE_REQUIRED');
  });
});

describe('GET /api/transport/price — route safety', () => {
  it('unknown routeId -> QUOTE_REQUIRED, never invents a distance', async () => {
    const body = await (await GET(request({ ...VALID_PARAMS, routeId: 'not-real' }))).json();
    expect(body.status).toBe('QUOTE_REQUIRED');
    expect(resolveTransportPricing).not.toHaveBeenCalled();
  });

  it('a route with no distanceKm -> QUOTE_REQUIRED', async () => {
    routeStore['route-2'] = { _id: 'route-2', active: true };
    const body = await (await GET(request({ ...VALID_PARAMS, routeId: 'route-2' }))).json();
    expect(body.status).toBe('QUOTE_REQUIRED');
  });

  it('an inactive route -> QUOTE_REQUIRED', async () => {
    routeStore['route-3'] = { _id: 'route-3', distanceKm: 100, active: false };
    const body = await (await GET(request({ ...VALID_PARAMS, routeId: 'route-3' }))).json();
    expect(body.status).toBe('QUOTE_REQUIRED');
  });
});

describe('GET /api/transport/price — result mapping', () => {
  it('CALCULATED_ESTIMATE maps to the customer-safe label/disclaimer, no internal ids exposed', async () => {
    resolveTransportPricing.mockResolvedValue({
      status: 'CALCULATED_ESTIMATE',
      amountMinorUnits: 195_000,
      currency: 'INR',
      distanceKm: 115,
      rateRuleId: 'should-never-appear',
      reason: 'internal reason text should not leak either'
    });
    const body = await (await GET(request(VALID_PARAMS))).json();
    expect(body).toEqual({
      status: 'CALCULATED_ESTIMATE',
      label: 'Estimated Fare',
      amountMinorUnits: 195_000,
      currency: 'INR',
      distanceKm: 115,
      disclaimer: 'Final fare may vary based on tolls, parking, state taxes, permits and final route confirmation.'
    });
    expect(JSON.stringify(body)).not.toMatch(/rateRuleId|should-never-appear|internal reason/);
  });

  it('EXACT_SUPPLIER_RATE maps to "Confirmed Fare", no internal ids exposed', async () => {
    resolveTransportPricing.mockResolvedValue({ status: 'EXACT_SUPPLIER_RATE', amountMinorUnits: 470_000, currency: 'INR', rateId: 'hidden', partnerId: 'hidden' });
    const body = await (await GET(request(VALID_PARAMS))).json();
    expect(body).toEqual({ status: 'EXACT_SUPPLIER_RATE', label: 'Confirmed Fare', amountMinorUnits: 470_000, currency: 'INR' });
  });

  it('GENERIC_SUPPLIER_ESTIMATE maps to "Estimated Fare"', async () => {
    resolveTransportPricing.mockResolvedValue({ status: 'GENERIC_SUPPLIER_ESTIMATE', amountMinorUnits: 400_000, currency: 'INR' });
    const body = await (await GET(request(VALID_PARAMS))).json();
    expect(body).toEqual({ status: 'GENERIC_SUPPLIER_ESTIMATE', label: 'Estimated Fare', amountMinorUnits: 400_000, currency: 'INR' });
  });

  it('resolver QUOTE_REQUIRED maps to the sanitized fallback, reason never exposed', async () => {
    resolveTransportPricing.mockResolvedValue({ status: 'QUOTE_REQUIRED', reason: 'NO_ESTIMATE_RULE', explanation: 'internal detail' });
    const body = await (await GET(request(VALID_PARAMS))).json();
    expect(body).toEqual({ status: 'QUOTE_REQUIRED', message: 'Get Custom Quote' });
  });

  it('a thrown error still returns the safe QUOTE_REQUIRED fallback, never a broken/partial price', async () => {
    resolveTransportPricing.mockRejectedValue(new Error('boom'));
    const response = await GET(request(VALID_PARAMS));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'QUOTE_REQUIRED', message: 'Get Custom Quote' });
  });
});

describe('GET /api/transport/price — region resolution', () => {
  it('passes the resolved Region.slug as serviceRegion to the resolver', async () => {
    resolveTransportPricing.mockResolvedValue({ status: 'QUOTE_REQUIRED', reason: 'NO_ESTIMATE_RULE', explanation: '' });
    await GET(request(VALID_PARAMS));
    expect(resolveTransportPricing).toHaveBeenCalledWith(expect.objectContaining({ serviceRegion: 'himachal-pradesh', distanceKm: 115, rateType: 'POINT_TO_POINT', tripType: 'ONE_WAY' }));
  });

  it('a route with no region still calls the resolver with serviceRegion undefined (resolver itself returns QUOTE_REQUIRED for that)', async () => {
    routeStore['route-4'] = { _id: 'route-4', distanceKm: 50, active: true };
    resolveTransportPricing.mockResolvedValue({ status: 'QUOTE_REQUIRED', reason: 'UNKNOWN_REGION', explanation: '' });
    await GET(request({ ...VALID_PARAMS, routeId: 'route-4' }));
    expect(resolveTransportPricing).toHaveBeenCalledWith(expect.objectContaining({ serviceRegion: undefined }));
  });
});
