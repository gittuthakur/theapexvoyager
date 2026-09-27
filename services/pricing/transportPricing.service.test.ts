import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));

interface FakeRate {
  _id: string;
  partnerId: string;
  vehicleCategory: string;
  rateType: 'POINT_TO_POINT' | 'ROUND_TRIP' | 'CIRCUIT_FIXED';
  routeId?: string;
  circuitKey?: string;
  currency: 'INR';
  supplierCostMinorUnits: number;
  includedKm?: number;
  minimumKm?: number;
  extraKmRateMinorUnits?: number;
  driverAllowanceMinorUnits?: number;
  nightChargeMinorUnits?: number;
  inclusions?: Record<string, boolean>;
  validFrom: Date;
  validTo: Date;
  active: boolean;
  source: string;
  verifiedAt?: Date;
  updatedAt?: Date;
}

interface FakePartner {
  _id: string;
  status: 'pending' | 'verified' | 'active' | 'suspended';
}

interface FakeRoute {
  _id: string;
}

let rateStore: FakeRate[] = [];
let partnerStore: FakePartner[] = [];
let routeStore: FakeRoute[] = [];
let nextRateId = 1;

function matchesQuery(doc: Record<string, unknown>, query: Record<string, unknown>): boolean {
  return Object.entries(query).every(([key, condition]) => {
    const actual = doc[key];
    if (condition !== null && typeof condition === 'object' && !(condition instanceof Date)) {
      const cond = condition as Record<string, unknown>;
      if ('$exists' in cond) {
        const exists = actual !== undefined && actual !== null;
        return exists === cond.$exists;
      }
      if ('$ne' in cond) return String(actual) !== String(cond.$ne);
      if ('$lte' in cond || '$gte' in cond) {
        let ok = true;
        if ('$lte' in cond) ok = ok && (actual as Date) <= (cond.$lte as Date);
        if ('$gte' in cond) ok = ok && (actual as Date) >= (cond.$gte as Date);
        return ok;
      }
      return String(actual) === String(condition);
    }
    return String(actual) === String(condition);
  });
}

vi.mock('@/models/TransportRate', async () => {
  const actual = await vi.importActual<typeof import('@/models/TransportRate')>('@/models/TransportRate');
  return {
    ...actual,
    TransportRate: {
      find: vi.fn((query: Record<string, unknown>) => ({
        lean: async () => rateStore.filter((doc) => matchesQuery(doc as unknown as Record<string, unknown>, query))
      })),
      findOne: vi.fn((query: Record<string, unknown>) => ({
        lean: async () => rateStore.find((doc) => matchesQuery(doc as unknown as Record<string, unknown>, query)) ?? null
      })),
      create: vi.fn(async (input: Partial<FakeRate>) => {
        const doc: FakeRate = {
          _id: String(nextRateId++),
          currency: 'INR',
          active: true,
          ...input
        } as FakeRate;
        rateStore.push(doc);
        return doc;
      })
    }
  };
});

vi.mock('@/models/TransportPartner', () => ({
  TransportPartner: {
    findById: vi.fn((id: string) => ({
      lean: async () => partnerStore.find((doc) => doc._id === id) ?? null
    }))
  }
}));

vi.mock('@/models/TransportRoute', () => ({
  TransportRoute: {
    findById: vi.fn((id: string) => ({
      lean: async () => routeStore.find((doc) => doc._id === id) ?? null
    }))
  }
}));

const { calculateTransportCost, createTransportRate, findOverlappingActiveRate } = await import('./transportPricing.service');

const VERIFIED_PARTNER: FakePartner = { _id: 'partner-verified', status: 'verified' };
const ACTIVE_PARTNER: FakePartner = { _id: 'partner-active', status: 'active' };
const PENDING_PARTNER: FakePartner = { _id: 'partner-pending', status: 'pending' };
const SUSPENDED_PARTNER: FakePartner = { _id: 'partner-suspended', status: 'suspended' };
const ROUTE: FakeRoute = { _id: 'route-shimla-manali' };

function baseRate(overrides: Partial<FakeRate> = {}): FakeRate {
  return {
    _id: String(nextRateId++),
    partnerId: VERIFIED_PARTNER._id,
    vehicleCategory: 'SUV',
    rateType: 'POINT_TO_POINT',
    routeId: ROUTE._id,
    currency: 'INR',
    supplierCostMinorUnits: 450_000,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    active: true,
    source: 'test fixture',
    ...overrides
  };
}

beforeEach(() => {
  rateStore = [];
  partnerStore = [VERIFIED_PARTNER, ACTIVE_PARTNER, PENDING_PARTNER, SUSPENDED_PARTNER];
  routeStore = [ROUTE];
  nextRateId = 1;
});

describe('calculateTransportCost — EXACT', () => {
  it('returns EXACT for a route-specific POINT_TO_POINT rate', async () => {
    rateStore.push(baseRate());
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('EXACT');
    expect(result.supplierCostMinorUnits).toBe(450_000);
  });

  it('returns EXACT for a ROUND_TRIP rate', async () => {
    rateStore.push(baseRate({ rateType: 'ROUND_TRIP', supplierCostMinorUnits: 800_000 }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'ROUND_TRIP', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('EXACT');
    expect(result.supplierCostMinorUnits).toBe(800_000);
  });

  it('returns EXACT for a CIRCUIT_FIXED rate matched by circuitKey', async () => {
    rateStore.push(baseRate({ rateType: 'CIRCUIT_FIXED', routeId: undefined, circuitKey: 'spiti-circuit-shimla-manali', supplierCostMinorUnits: 3_500_000 }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'CIRCUIT_FIXED', circuitKey: 'spiti-circuit-shimla-manali', travelDate: '2026-06-01' });
    expect(result.status).toBe('EXACT');
    expect(result.supplierCostMinorUnits).toBe(3_500_000);
  });

  it('preserves inclusion flags and optional cost components on the result', async () => {
    rateStore.push(baseRate({ includedKm: 150, extraKmRateMinorUnits: 1500, inclusions: { fuelIncluded: true, tollParkingIncluded: false } }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.includedKm).toBe(150);
    expect(result.extraKmRateMinorUnits).toBe(1500);
    expect(result.inclusions).toEqual({ fuelIncluded: true, tollParkingIncluded: false });
  });
});

describe('calculateTransportCost — ESTIMATED (generic rate)', () => {
  it('returns ESTIMATED when only a routeId-less generic rate exists', async () => {
    rateStore.push(baseRate({ routeId: undefined, supplierCostMinorUnits: 400_000 }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('ESTIMATED');
    expect(result.supplierCostMinorUnits).toBe(400_000);
  });

  it('prefers an EXACT route-specific rate over a generic one when both exist', async () => {
    rateStore.push(baseRate({ routeId: undefined, supplierCostMinorUnits: 400_000 }));
    rateStore.push(baseRate({ routeId: ROUTE._id, supplierCostMinorUnits: 470_000 }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('EXACT');
    expect(result.supplierCostMinorUnits).toBe(470_000);
  });

  it('returns ESTIMATED when no routeId was even given in the query and a generic rate exists', async () => {
    rateStore.push(baseRate({ routeId: undefined }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', travelDate: '2026-06-01' });
    expect(result.status).toBe('ESTIMATED');
  });
});

describe('calculateTransportCost — QUOTE_REQUIRED', () => {
  it('no rate at all', async () => {
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
    expect(result.supplierCostMinorUnits).toBeUndefined();
  });

  it('an expired rate (travel date after validTo)', async () => {
    rateStore.push(baseRate({ validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('a future rate not yet valid for an earlier travel date', async () => {
    rateStore.push(baseRate({ validFrom: new Date('2027-01-01'), validTo: new Date('2027-12-31') }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('an inactive rate', async () => {
    rateStore.push(baseRate({ active: false }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('an ineligible (pending) supplier', async () => {
    rateStore.push(baseRate({ partnerId: PENDING_PARTNER._id }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('an ineligible (suspended) supplier', async () => {
    rateStore.push(baseRate({ partnerId: SUSPENDED_PARTNER._id }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('an active partner (not just verified) is still eligible', async () => {
    rateStore.push(baseRate({ partnerId: ACTIVE_PARTNER._id }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('EXACT');
  });

  it('a vehicle category mismatch', async () => {
    rateStore.push(baseRate({ vehicleCategory: 'Sedan' }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('a route mismatch (rate exists for a different route only)', async () => {
    rateStore.push(baseRate({ routeId: 'route-delhi-manali' }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('a circuit mismatch (rate exists for a different circuitKey only)', async () => {
    rateStore.push(baseRate({ rateType: 'CIRCUIT_FIXED', routeId: undefined, circuitKey: 'other-circuit' }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'CIRCUIT_FIXED', circuitKey: 'spiti-circuit-shimla-manali', travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('CIRCUIT_FIXED with no circuitKey given in the query', async () => {
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'CIRCUIT_FIXED', travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('an invalid travelDate', async () => {
    rateStore.push(baseRate());
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-02-30' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });

  it('a row with a corrupted (non-positive) supplierCostMinorUnits is never selected, even if otherwise eligible', async () => {
    rateStore.push(baseRate({ supplierCostMinorUnits: 0 }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('QUOTE_REQUIRED');
  });
});

describe('calculateTransportCost — ambiguity / precedence', () => {
  it('picks the most recently verified rate when more than one eligible rate matches, and notes the ambiguity', async () => {
    rateStore.push(baseRate({ supplierCostMinorUnits: 400_000, verifiedAt: new Date('2026-01-01') }));
    rateStore.push(baseRate({ supplierCostMinorUnits: 460_000, verifiedAt: new Date('2026-05-01') }));
    const result = await calculateTransportCost({ vehicleCategory: 'SUV', rateType: 'POINT_TO_POINT', routeId: ROUTE._id, travelDate: '2026-06-01' });
    expect(result.status).toBe('EXACT');
    expect(result.supplierCostMinorUnits).toBe(460_000);
    expect(result.explanation).toMatch(/2 eligible rates matched/);
  });
});

describe('calculateTransportCost — never touches legacy/demo pricing sources', () => {
  it('the service source references only TransportRate/TransportPartner/TransportRoute — never the legacy demo/hardcoded price fields', () => {
    const source = readFileSync(new URL('./transportPricing.service.ts', import.meta.url), 'utf-8');
    expect(source).not.toMatch(/estimatedFromPrice/);
    expect(source).not.toMatch(/startingFare/);
    expect(source).not.toMatch(/extraPrice/);
    expect(source).not.toMatch(/perDayRate/);
  });
});

describe('createTransportRate', () => {
  const validInput = {
    partnerId: VERIFIED_PARTNER._id,
    vehicleCategory: 'SUV' as const,
    rateType: 'POINT_TO_POINT' as const,
    routeId: ROUTE._id,
    supplierCostMinorUnits: 450_000,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    source: 'test fixture'
  };

  it('creates a rate when the partner and route are real and no overlap exists', async () => {
    const result = await createTransportRate(validInput);
    expect(result.created).toBe(true);
  });

  it('refuses when the partner does not exist', async () => {
    const result = await createTransportRate({ ...validInput, partnerId: 'not-a-real-partner' });
    expect(result).toEqual({ created: false, reason: 'invalid_partner' });
  });

  it('refuses when the route does not exist', async () => {
    const result = await createTransportRate({ ...validInput, routeId: 'not-a-real-route' });
    expect(result).toEqual({ created: false, reason: 'invalid_route' });
  });

  it('refuses an overlapping active rate for the same identity', async () => {
    rateStore.push(baseRate({ validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-31') }));
    const result = await createTransportRate(validInput);
    expect(result).toEqual({ created: false, reason: 'overlapping_active_rate' });
  });

  it('allows a non-overlapping seasonal replacement rate for the same identity', async () => {
    rateStore.push(baseRate({ validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') }));
    const result = await createTransportRate(validInput);
    expect(result.created).toBe(true);
  });
});

describe('findOverlappingActiveRate', () => {
  it('finds an overlap when windows intersect', async () => {
    rateStore.push(baseRate({ validFrom: new Date('2026-01-01'), validTo: new Date('2026-06-30') }));
    const overlap = await findOverlappingActiveRate({
      partnerId: VERIFIED_PARTNER._id,
      vehicleCategory: 'SUV',
      rateType: 'POINT_TO_POINT',
      routeId: ROUTE._id,
      validFrom: new Date('2026-06-01'),
      validTo: new Date('2026-12-31')
    });
    expect(overlap).not.toBeNull();
  });

  it('finds no overlap when windows are disjoint', async () => {
    rateStore.push(baseRate({ validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') }));
    const overlap = await findOverlappingActiveRate({
      partnerId: VERIFIED_PARTNER._id,
      vehicleCategory: 'SUV',
      rateType: 'POINT_TO_POINT',
      routeId: ROUTE._id,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31')
    });
    expect(overlap).toBeNull();
  });
});
