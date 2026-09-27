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
  deadKmReturnPercent?: number;
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

describe('calculateTransportEstimate — TP3E dead-km component', () => {
  it('backward compatible: no deadKmReturnPercent set behaves as 0% (TP3B/TP3C parity)', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.deadKmComponentKm).toBe(0);
      expect(result.effectiveBillableKm).toBe(115);
      expect(result.minimumKmApplied).toBe(false);
      expect(result.distanceKm).toBe(115); // genuine route distance, never mutated
    }
  });

  it('explicit deadKmReturnPercent: 0 behaves identically to unset', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 0 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') expect(result.effectiveBillableKm).toBe(115);
  });

  it('exposes a fractional dead-km component without rounding it (documented example: 115km @ 25%)', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 25, perKmRateMinorUnits: 1_300 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.deadKmComponentKm).toBeCloseTo(28.75, 10);
      expect(result.effectiveBillableKm).toBeCloseTo(143.75, 10);
      expect(result.distanceKm).toBe(115); // route distance itself stays exact, untouched
      expect(Number.isInteger(result.amountMinorUnits)).toBe(true); // money still integer-safe
      expect(result.amountMinorUnits).toBe(Math.round(143.75 * 1_300));
    }
  });

  it('never mutates the genuine route distance regardless of the dead-km percent applied', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 60 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 240 });
    expect(result.status).toBe('CALCULATED_ESTIMATE');
    if (result.status === 'CALCULATED_ESTIMATE') expect(result.distanceKm).toBe(240);
  });
});

describe('calculateTransportEstimate — TP3E minimum-km interaction scenarios', () => {
  it('A. 115km, 0% dead-km, no minimum => 115 effective km', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.effectiveBillableKm).toBe(115);
      expect(result.minimumKmApplied).toBe(false);
    } else throw new Error('expected CALCULATED_ESTIMATE');
  });

  it('B. 115km, 25% dead-km, no minimum => 143.75 pre-floor km, no minimum applied', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 25 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.effectiveBillableKm).toBeCloseTo(143.75, 10);
      expect(result.minimumKmApplied).toBe(false);
    } else throw new Error('expected CALCULATED_ESTIMATE');
  });

  it('C. 115km, 25% dead-km, 200km minimum => 200 effective km, minimum applied = true', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 25, minimumKmPerDay: 200 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.effectiveBillableKm).toBe(200);
      expect(result.minimumKmApplied).toBe(true);
    } else throw new Error('expected CALCULATED_ESTIMATE');
  });

  it('D. 240km, 25% dead-km, 200km minimum => 300 effective km, minimum applied = false', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 25, minimumKmPerDay: 200 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 240 });
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.effectiveBillableKm).toBe(300);
      expect(result.minimumKmApplied).toBe(false);
    } else throw new Error('expected CALCULATED_ESTIMATE');
  });

  it('E. minimum larger than pre-floor distance => minimum wins and is flagged applied', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 0, minimumKmPerDay: 500 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.effectiveBillableKm).toBe(500);
      expect(result.minimumKmApplied).toBe(true);
    } else throw new Error('expected CALCULATED_ESTIMATE');
  });

  it('F. minimum smaller than pre-floor distance => pre-floor distance wins, not flagged applied', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 25, minimumKmPerDay: 50 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    if (result.status === 'CALCULATED_ESTIMATE') {
      expect(result.effectiveBillableKm).toBeCloseTo(143.75, 10);
      expect(result.minimumKmApplied).toBe(false);
    } else throw new Error('expected CALCULATED_ESTIMATE');
  });

  it('G. deadKmReturnPercent = 0 explicit => identical to unset', async () => {
    ruleStore.push(baseRule({ deadKmReturnPercent: 0 }));
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    if (result.status === 'CALCULATED_ESTIMATE') expect(result.deadKmComponentKm).toBe(0);
    else throw new Error('expected CALCULATED_ESTIMATE');
  });

  it('H. deadKmReturnPercent unset => identical to explicit 0', async () => {
    ruleStore.push(baseRule());
    const result = await calculateTransportEstimate({ ...BASE_QUERY, distanceKm: 115 });
    if (result.status === 'CALCULATED_ESTIMATE') expect(result.deadKmComponentKm).toBe(0);
    else throw new Error('expected CALCULATED_ESTIMATE');
  });
});

describe('calculateTransportEstimate — TP3D six-fixture regression (in-memory only, TEST rates, NOT production-approved)', () => {
  const VEHICLES: Array<{ category: string; perKmRateMinorUnits: number }> = [
    { category: 'Sedan', perKmRateMinorUnits: 1_300 },
    { category: 'SUV', perKmRateMinorUnits: 1_600 },
    { category: 'Tempo Traveller', perKmRateMinorUnits: 2_500 }
  ];
  const ROUTES = [
    { name: 'Chandigarh -> Shimla', distanceKm: 115 },
    { name: 'Chandigarh -> Dharamshala', distanceKm: 240 }
  ];

  it('Scenario 1 (0%, no minimum) reproduces TP3C baseline exactly', async () => {
    for (const vehicle of VEHICLES) {
      ruleStore.push(baseRule({ vehicleCategory: vehicle.category, perKmRateMinorUnits: vehicle.perKmRateMinorUnits }));
    }
    const expected: Record<string, Record<string, number>> = {
      'Chandigarh -> Shimla': { Sedan: 149_500, SUV: 184_000, 'Tempo Traveller': 287_500 },
      'Chandigarh -> Dharamshala': { Sedan: 312_000, SUV: 384_000, 'Tempo Traveller': 600_000 }
    };
    for (const route of ROUTES) {
      for (const vehicle of VEHICLES) {
        const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleCategory: vehicle.category, distanceKm: route.distanceKm });
        expect(result.status).toBe('CALCULATED_ESTIMATE');
        if (result.status === 'CALCULATED_ESTIMATE') expect(result.amountMinorUnits).toBe(expected[route.name][vehicle.category]);
      }
    }
  });

  it('Scenario 2 (25%, no minimum) matches TP3D projections', async () => {
    for (const vehicle of VEHICLES) {
      ruleStore.push(baseRule({ vehicleCategory: vehicle.category, perKmRateMinorUnits: vehicle.perKmRateMinorUnits, deadKmReturnPercent: 25 }));
    }
    const expected: Record<string, Record<string, number>> = {
      'Chandigarh -> Shimla': { Sedan: 186_875, SUV: 230_000, 'Tempo Traveller': 359_375 },
      'Chandigarh -> Dharamshala': { Sedan: 390_000, SUV: 480_000, 'Tempo Traveller': 750_000 }
    };
    for (const route of ROUTES) {
      for (const vehicle of VEHICLES) {
        const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleCategory: vehicle.category, distanceKm: route.distanceKm });
        expect(result.status).toBe('CALCULATED_ESTIMATE');
        if (result.status === 'CALCULATED_ESTIMATE') expect(result.amountMinorUnits).toBe(expected[route.name][vehicle.category]);
      }
    }
  });

  it('Scenario 3 (25% + 200km minimum) matches TP3D projections', async () => {
    for (const vehicle of VEHICLES) {
      ruleStore.push(baseRule({ vehicleCategory: vehicle.category, perKmRateMinorUnits: vehicle.perKmRateMinorUnits, deadKmReturnPercent: 25, minimumKmPerDay: 200 }));
    }
    const expected: Record<string, Record<string, number>> = {
      'Chandigarh -> Shimla': { Sedan: 260_000, SUV: 320_000, 'Tempo Traveller': 500_000 },
      'Chandigarh -> Dharamshala': { Sedan: 390_000, SUV: 480_000, 'Tempo Traveller': 750_000 }
    };
    for (const route of ROUTES) {
      for (const vehicle of VEHICLES) {
        const result = await calculateTransportEstimate({ ...BASE_QUERY, vehicleCategory: vehicle.category, distanceKm: route.distanceKm });
        expect(result.status).toBe('CALCULATED_ESTIMATE');
        if (result.status === 'CALCULATED_ESTIMATE') expect(result.amountMinorUnits).toBe(expected[route.name][vehicle.category]);
      }
    }
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
