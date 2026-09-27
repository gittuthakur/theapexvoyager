import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));

interface FakeDriverAllowance {
  applicable: boolean;
  includedInBaseFare: boolean;
  perDayAmountMinorUnits?: number;
}

interface FakeRule {
  _id: string;
  vehicleCategory: string;
  serviceRegion: string;
  tripType: string;
  rateBasis: string;
  perKmRateMinorUnits: number;
  minimumKmPerDay?: number;
  driverAllowance?: FakeDriverAllowance;
  nightHaltChargeMinorUnits?: number;
  tollStatus: string;
  parkingStatus: string;
  stateTaxStatus: string;
  permitStatus: string;
  validFrom: Date;
  validTo: Date;
  active: boolean;
  sourceType: string;
  updatedAt?: Date;
}

interface FakeVehicle {
  _id: string;
  seats: number;
  mountainSuitable?: boolean;
  remoteRouteSuitable?: boolean;
}

let ruleStore: FakeRule[] = [];
let vehicleStore: FakeVehicle[] = [];
let nextRuleId = 1;

function matchesQuery(doc: Record<string, unknown>, query: Record<string, unknown>): boolean {
  return Object.entries(query).every(([key, condition]) => {
    const actual = doc[key];
    if (condition !== null && typeof condition === 'object' && !(condition instanceof Date)) {
      const cond = condition as Record<string, unknown>;
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

vi.mock('@/models/TransportEstimateRule', async () => {
  const actual = await vi.importActual<typeof import('@/models/TransportEstimateRule')>('@/models/TransportEstimateRule');
  return {
    ...actual,
    TransportEstimateRule: {
      find: vi.fn((query: Record<string, unknown>) => ({
        lean: async () => ruleStore.filter((doc) => matchesQuery(doc as unknown as Record<string, unknown>, query))
      })),
      findOne: vi.fn((query: Record<string, unknown>) => ({
        lean: async () => ruleStore.find((doc) => matchesQuery(doc as unknown as Record<string, unknown>, query)) ?? null
      })),
      create: vi.fn(async (input: Partial<FakeRule>) => {
        const doc: FakeRule = {
          _id: String(nextRuleId++),
          active: true,
          tollStatus: 'UNKNOWN',
          parkingStatus: 'UNKNOWN',
          stateTaxStatus: 'UNKNOWN',
          permitStatus: 'UNKNOWN',
          ...input
        } as FakeRule;
        ruleStore.push(doc);
        return doc;
      })
    }
  };
});

vi.mock('@/models/TransportVehicle', () => ({
  TransportVehicle: {
    findById: vi.fn((id: string) => ({
      lean: async () => vehicleStore.find((doc) => doc._id === id) ?? null
    }))
  }
}));

const { calculateTransportEstimate, createTransportEstimateRule, findOverlappingActiveEstimateRule } = await import('./transportEstimate.service');

function baseRule(overrides: Partial<FakeRule> = {}): FakeRule {
  return {
    _id: String(nextRuleId++),
    vehicleCategory: 'SUV',
    serviceRegion: 'himachal-pradesh',
    tripType: 'ONE_WAY',
    rateBasis: 'PER_KM',
    perKmRateMinorUnits: 1_200,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    active: true,
    sourceType: 'BUSINESS_APPROVED_ESTIMATE',
    tollStatus: 'UNKNOWN',
    parkingStatus: 'UNKNOWN',
    stateTaxStatus: 'UNKNOWN',
    permitStatus: 'UNKNOWN',
    ...overrides
  };
}

const BASE_QUERY = {
  vehicleCategory: 'SUV',
  serviceRegion: 'himachal-pradesh',
  tripType: 'ONE_WAY',
  rateBasis: 'PER_KM',
  travelDate: '2026-06-01',
  distanceKm: 100
};

beforeEach(() => {
  ruleStore = [];
  vehicleStore = [];
  nextRuleId = 1;
});

describe('calculateTransportEstimate — supported trip types produce CALCULATED_ESTIMATE', () => {
  it('ONE_WAY', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, tripType: 'ONE_WAY' });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') expect(result.amountMinorUnits).toBe(120_000);
  });

  it('AIRPORT_TRANSFER', async () => {
    ruleStore.push(baseRule({ tripType: 'AIRPORT_TRANSFER' }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, tripType: 'AIRPORT_TRANSFER' });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
  });

  it('RAILWAY_TRANSFER', async () => {
    ruleStore.push(baseRule({ tripType: 'RAILWAY_TRANSFER' }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, tripType: 'RAILWAY_TRANSFER' });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
  });
});

describe('calculateTransportEstimate — distance', () => {
  it('missing distance -> NO_DISTANCE', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: undefined });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'NO_DISTANCE' });
  });

  it('zero distance -> NO_DISTANCE', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 0 });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'NO_DISTANCE' });
  });

  it('negative distance -> NO_DISTANCE', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: -10 });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'NO_DISTANCE' });
  });
});

describe('calculateTransportEstimate — rule lookup', () => {
  it('no rule at all -> NO_ESTIMATE_RULE', async () => {
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'NO_ESTIMATE_RULE' });
  });

  it('inactive rule -> RULE_INACTIVE', async () => {
    ruleStore.push(baseRule({ active: false }));
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'RULE_INACTIVE' });
  });

  it('expired rule -> RULE_EXPIRED', async () => {
    ruleStore.push(baseRule({ validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') }));
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'RULE_EXPIRED' });
  });

  it('future rule -> RULE_NOT_YET_VALID', async () => {
    ruleStore.push(baseRule({ validFrom: new Date('2027-01-01'), validTo: new Date('2027-12-31') }));
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'RULE_NOT_YET_VALID' });
  });

  it('ambiguous overlapping active rules -> AMBIGUOUS_RULE', async () => {
    ruleStore.push(baseRule());
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'AMBIGUOUS_RULE' });
  });
});

describe('calculateTransportEstimate — minimum distance behavior', () => {
  it('applies the configured minimum when the approved distance is shorter', async () => {
    ruleStore.push(baseRule({ minimumKmPerDay: 150 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 100 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') expect(result.amountMinorUnits).toBe(150 * 1_200);
  });

  it('uses the actual approved distance when no minimum is configured', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 80 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') expect(result.amountMinorUnits).toBe(80 * 1_200);
  });
});

describe('calculateTransportEstimate — driver allowance', () => {
  it('adds the amount when applicable and not included in base fare', async () => {
    ruleStore.push(baseRule({ driverAllowance: { applicable: true, includedInBaseFare: false, perDayAmountMinorUnits: 30_000 } }));
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.amountMinorUnits).toBe(100 * 1_200 + 30_000);
      expect(result.componentStatus.driverAllowance).toBe('INCLUDED');
    }
  });

  it('does not add anything extra when already included in the base fare, but reports it included', async () => {
    ruleStore.push(baseRule({ driverAllowance: { applicable: true, includedInBaseFare: true } }));
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.amountMinorUnits).toBe(100 * 1_200);
      expect(result.componentStatus.driverAllowance).toBe('INCLUDED');
    }
  });

  it('reports excluded and adds nothing when the rule has no driver allowance at all', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.amountMinorUnits).toBe(100 * 1_200);
      expect(result.componentStatus.driverAllowance).toBe('EXCLUDED');
    }
  });
});

describe('calculateTransportEstimate — toll/parking/tax/permit disclosure', () => {
  it('never invents an amount and always passes through the configured status, defaulting to UNKNOWN', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.componentStatus.toll).toBe('UNKNOWN');
      expect(result.componentStatus.parking).toBe('UNKNOWN');
      expect(result.componentStatus.stateTax).toBe('UNKNOWN');
      expect(result.componentStatus.permit).toBe('UNKNOWN');
      expect(result.componentStatus.nightHalt).toBe('EXCLUDED');
    }
  });

  it('passes through explicitly configured statuses', async () => {
    ruleStore.push(baseRule({ tollStatus: 'AT_ACTUALS', parkingStatus: 'INCLUDED', stateTaxStatus: 'CONFIRMATION_REQUIRED', permitStatus: 'EXCLUDED' }));
    const result = await calculateTransportEstimate(BASE_QUERY);
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.componentStatus.toll).toBe('AT_ACTUALS');
      expect(result.componentStatus.parking).toBe('INCLUDED');
      expect(result.componentStatus.stateTax).toBe('CONFIRMATION_REQUIRED');
      expect(result.componentStatus.permit).toBe('EXCLUDED');
    }
  });
});

describe('calculateTransportEstimate — integer arithmetic', () => {
  it('rounds a fractional-paise result to the nearest integer', async () => {
    ruleStore.push(baseRule({ perKmRateMinorUnits: 333 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 33.3 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') expect(Number.isInteger(result.amountMinorUnits)).toBe(true);
  });
});

describe('calculateTransportEstimate — safety: unsupported trip types always QUOTE_REQUIRED', () => {
  for (const tripType of ['ROUND_TRIP', 'LOCAL', 'MULTI_DAY', 'CIRCUIT', '4X4_SPECIAL']) {
    it(`${tripType} never auto-calculates, even when a matching rule exists`, async () => {
      ruleStore.push(baseRule({ tripType }));
      const result = await calculateTransportEstimate({ ...BASE_QUERY, tripType });
      expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'UNSUPPORTED_TRIP_TYPE' });
    });
  }
});

describe('calculateTransportEstimate — safety: special/remote vehicles', () => {
  it('a 4x4 vehicle category is always QUOTE_REQUIRED (SPECIAL_VEHICLE)', async () => {
    ruleStore.push(baseRule({ vehicleCategory: '4x4' }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleCategory: '4x4' });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'SPECIAL_VEHICLE' });
  });

  it('a mountain-suitable referenced vehicle is QUOTE_REQUIRED (REMOTE_ROUTE)', async () => {
    ruleStore.push(baseRule());
    vehicleStore.push({ _id: 'veh-1', seats: 4, mountainSuitable: true });
    const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleId: 'veh-1' });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'REMOTE_ROUTE' });
  });

  it('a remote-route-suitable referenced vehicle is QUOTE_REQUIRED (REMOTE_ROUTE)', async () => {
    ruleStore.push(baseRule());
    vehicleStore.push({ _id: 'veh-2', seats: 4, remoteRouteSuitable: true });
    const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleId: 'veh-2' });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'REMOTE_ROUTE' });
  });
});

describe('calculateTransportEstimate — safety: capacity', () => {
  it('a vehicle unable to carry travellerCount is QUOTE_REQUIRED (CAPACITY_MISMATCH)', async () => {
    ruleStore.push(baseRule());
    vehicleStore.push({ _id: 'veh-3', seats: 4 });
    const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleId: 'veh-3', travellerCount: 6 });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'CAPACITY_MISMATCH' });
  });

  it('a vehicle that can carry travellerCount still calculates', async () => {
    ruleStore.push(baseRule());
    vehicleStore.push({ _id: 'veh-4', seats: 6 });
    const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleId: 'veh-4', travellerCount: 4 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
  });
});

describe('calculateTransportEstimate — safety: other unsupported input', () => {
  it('unsupported vehicle category -> UNSUPPORTED_VEHICLE', async () => {
    const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleCategory: 'Spaceship' });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'UNSUPPORTED_VEHICLE' });
  });

  it('unknown region -> UNKNOWN_REGION', async () => {
    const result = await calculateTransportEstimate({ ...BASE_QUERY, serviceRegion: 'atlantis' });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'UNKNOWN_REGION' });
  });

  it('unsupported rate basis -> UNSUPPORTED_RATE_BASIS', async () => {
    const result = await calculateTransportEstimate({ ...BASE_QUERY, rateBasis: 'PER_DAY' });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'UNSUPPORTED_RATE_BASIS' });
  });

  it('an invalid travelDate -> INVALID_INPUT', async () => {
    const result = await calculateTransportEstimate({ ...BASE_QUERY, travelDate: '2026-02-30' });
    expect(result).toMatchObject({ status: 'QUOTE_REQUIRED', reason: 'INVALID_INPUT' });
  });
});

describe('calculateTransportEstimate — never falls back to legacy/demo pricing', () => {
  it('the service source references only TransportEstimateRule/TransportVehicle — never legacy demo/hardcoded price fields', () => {
    const source = readFileSync(new URL('./transportEstimate.service.ts', import.meta.url), 'utf-8');
    expect(source).not.toMatch(/estimatedFromPrice/);
    expect(source).not.toMatch(/startingFare/);
    expect(source).not.toMatch(/extraPrice/);
    expect(source).not.toMatch(/perDayRate/);
  });
});

describe('createTransportEstimateRule', () => {
  const validInput = {
    vehicleCategory: 'SUV' as const,
    serviceRegion: 'himachal-pradesh',
    tripType: 'ONE_WAY' as const,
    rateBasis: 'PER_KM' as const,
    perKmRateMinorUnits: 1_200,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    sourceType: 'BUSINESS_APPROVED_ESTIMATE' as const
  };

  it('creates a rule when no overlap exists', async () => {
    const result = await createTransportEstimateRule(validInput);
    expect(result.created).toBe(true);
  });

  it('refuses an overlapping active rule for the same identity', async () => {
    ruleStore.push(baseRule({ validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-31') }));
    const result = await createTransportEstimateRule(validInput);
    expect(result).toEqual({ created: false, reason: 'overlapping_active_rule' });
  });

  it('allows a non-overlapping seasonal replacement rule for the same identity', async () => {
    ruleStore.push(baseRule({ validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') }));
    const result = await createTransportEstimateRule(validInput);
    expect(result.created).toBe(true);
  });
});

describe('findOverlappingActiveEstimateRule', () => {
  it('finds an overlap when windows intersect', async () => {
    ruleStore.push(baseRule({ validFrom: new Date('2026-01-01'), validTo: new Date('2026-06-30') }));
    const overlap = await findOverlappingActiveEstimateRule({
      vehicleCategory: 'SUV',
      serviceRegion: 'himachal-pradesh',
      tripType: 'ONE_WAY',
      rateBasis: 'PER_KM',
      validFrom: new Date('2026-06-01'),
      validTo: new Date('2026-12-31')
    });
    expect(overlap).not.toBeNull();
  });

  it('finds no overlap when windows are disjoint', async () => {
    ruleStore.push(baseRule({ validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31') }));
    const overlap = await findOverlappingActiveEstimateRule({
      vehicleCategory: 'SUV',
      serviceRegion: 'himachal-pradesh',
      tripType: 'ONE_WAY',
      rateBasis: 'PER_KM',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31')
    });
    expect(overlap).toBeNull();
  });
});
