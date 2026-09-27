import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import {
  TransportEstimateRule,
  TRANSPORT_ESTIMATE_TRIP_TYPES,
  TRANSPORT_ESTIMATE_RATE_BASIS,
  TRANSPORT_ESTIMATE_SOURCE_TYPES,
  TRANSPORT_ESTIMATE_SERVICE_REGIONS,
  TRANSPORT_ESTIMATE_VEHICLE_CATEGORIES
} from './TransportEstimateRule';

// Every test here uses Mongoose's own `validate()` — pure offline schema-level
// validation with no MongoDB connection, no network call, and never a real write. No
// `.save()`/`.create()` call appears anywhere below (same convention as
// models/TransportRate.test.ts).
async function getValidationError(doc: InstanceType<typeof TransportEstimateRule>): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error as mongoose.Error.ValidationError;
  }
}

function validRuleData(overrides: Record<string, unknown> = {}) {
  return {
    vehicleCategory: 'SUV',
    serviceRegion: 'himachal-pradesh',
    tripType: 'ONE_WAY',
    rateBasis: 'PER_KM',
    perKmRateMinorUnits: 1_200,
    validFrom: new Date('2026-10-01T00:00:00.000Z'),
    validTo: new Date('2027-03-31T00:00:00.000Z'),
    sourceType: 'BUSINESS_APPROVED_ESTIMATE',
    ...overrides
  };
}

describe('TransportEstimateRule model — valid shapes', () => {
  it('a minimal valid document passes schema validation', async () => {
    const doc = new TransportEstimateRule(validRuleData());
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('defaults active to true and component statuses to UNKNOWN', () => {
    const doc = new TransportEstimateRule(validRuleData());
    expect(doc.active).toBe(true);
    expect(doc.tollStatus).toBe('UNKNOWN');
    expect(doc.parkingStatus).toBe('UNKNOWN');
    expect(doc.stateTaxStatus).toBe('UNKNOWN');
    expect(doc.permitStatus).toBe('UNKNOWN');
  });

  it('accepts every documented vehicle category', async () => {
    for (const vehicleCategory of TRANSPORT_ESTIMATE_VEHICLE_CATEGORIES) {
      const doc = new TransportEstimateRule(validRuleData({ vehicleCategory }));
      expect(await getValidationError(doc), `vehicleCategory ${vehicleCategory} should be valid`).toBeUndefined();
    }
  });

  it('accepts every canonical service region', async () => {
    for (const serviceRegion of TRANSPORT_ESTIMATE_SERVICE_REGIONS) {
      const doc = new TransportEstimateRule(validRuleData({ serviceRegion }));
      expect(await getValidationError(doc), `serviceRegion ${serviceRegion} should be valid`).toBeUndefined();
    }
  });

  it('accepts every documented trip type, including ones the calculator does not compute', async () => {
    for (const tripType of TRANSPORT_ESTIMATE_TRIP_TYPES) {
      const doc = new TransportEstimateRule(validRuleData({ tripType }));
      expect(await getValidationError(doc), `tripType ${tripType} should be valid`).toBeUndefined();
    }
  });

  it('accepts every documented rate basis', async () => {
    for (const rateBasis of TRANSPORT_ESTIMATE_RATE_BASIS) {
      const doc = new TransportEstimateRule(validRuleData({ rateBasis }));
      expect(await getValidationError(doc), `rateBasis ${rateBasis} should be valid`).toBeUndefined();
    }
  });

  it('accepts every documented source type', async () => {
    for (const sourceType of TRANSPORT_ESTIMATE_SOURCE_TYPES) {
      const doc = new TransportEstimateRule(validRuleData({ sourceType }));
      expect(await getValidationError(doc), `sourceType ${sourceType} should be valid`).toBeUndefined();
    }
  });
});

describe('TransportEstimateRule model — required fields', () => {
  it('requires vehicleCategory', async () => {
    const { vehicleCategory: _v, ...rest } = validRuleData();
    const doc = new TransportEstimateRule(rest);
    expect((await getValidationError(doc))?.errors.vehicleCategory).toBeDefined();
  });

  it('requires serviceRegion', async () => {
    const { serviceRegion: _s, ...rest } = validRuleData();
    const doc = new TransportEstimateRule(rest);
    expect((await getValidationError(doc))?.errors.serviceRegion).toBeDefined();
  });

  it('requires tripType', async () => {
    const { tripType: _t, ...rest } = validRuleData();
    const doc = new TransportEstimateRule(rest);
    expect((await getValidationError(doc))?.errors.tripType).toBeDefined();
  });

  it('requires rateBasis', async () => {
    const { rateBasis: _r, ...rest } = validRuleData();
    const doc = new TransportEstimateRule(rest);
    expect((await getValidationError(doc))?.errors.rateBasis).toBeDefined();
  });

  it('requires validFrom and validTo', async () => {
    const { validFrom: _f, ...rest } = validRuleData();
    const doc = new TransportEstimateRule(rest);
    expect((await getValidationError(doc))?.errors.validFrom).toBeDefined();
  });

  it('requires sourceType', async () => {
    const { sourceType: _s, ...rest } = validRuleData();
    const doc = new TransportEstimateRule(rest);
    expect((await getValidationError(doc))?.errors.sourceType).toBeDefined();
  });

  it('rejects an undocumented vehicleCategory', async () => {
    const doc = new TransportEstimateRule(validRuleData({ vehicleCategory: 'Spaceship' }));
    expect((await getValidationError(doc))?.errors.vehicleCategory).toBeDefined();
  });

  it('rejects an unknown serviceRegion', async () => {
    const doc = new TransportEstimateRule(validRuleData({ serviceRegion: 'atlantis' }));
    expect((await getValidationError(doc))?.errors.serviceRegion).toBeDefined();
  });

  it('rejects an undocumented tripType', async () => {
    const doc = new TransportEstimateRule(validRuleData({ tripType: 'TELEPORT' }));
    expect((await getValidationError(doc))?.errors.tripType).toBeDefined();
  });

  it('rejects an undocumented rateBasis', async () => {
    const doc = new TransportEstimateRule(validRuleData({ rateBasis: 'PER_DAY' }));
    expect((await getValidationError(doc))?.errors.rateBasis).toBeDefined();
  });

  it('rejects an undocumented sourceType', async () => {
    const doc = new TransportEstimateRule(validRuleData({ sourceType: 'SUPPLIER' }));
    expect((await getValidationError(doc))?.errors.sourceType).toBeDefined();
  });
});

describe('TransportEstimateRule model — per-km rate safety', () => {
  it('rejects a zero perKmRateMinorUnits', async () => {
    const doc = new TransportEstimateRule(validRuleData({ perKmRateMinorUnits: 0 }));
    expect((await getValidationError(doc))?.errors.perKmRateMinorUnits).toBeDefined();
  });

  it('rejects a negative perKmRateMinorUnits', async () => {
    const doc = new TransportEstimateRule(validRuleData({ perKmRateMinorUnits: -500 }));
    expect((await getValidationError(doc))?.errors.perKmRateMinorUnits).toBeDefined();
  });

  it('rejects a non-integer (float) perKmRateMinorUnits', async () => {
    const doc = new TransportEstimateRule(validRuleData({ perKmRateMinorUnits: 1200.5 }));
    expect((await getValidationError(doc))?.errors.perKmRateMinorUnits).toBeDefined();
  });

  it('requires perKmRateMinorUnits', async () => {
    const { perKmRateMinorUnits: _p, ...rest } = validRuleData();
    const doc = new TransportEstimateRule(rest);
    expect((await getValidationError(doc))?.errors.perKmRateMinorUnits).toBeDefined();
  });
});

describe('TransportEstimateRule model — validity window', () => {
  it('rejects validTo before validFrom', async () => {
    const doc = new TransportEstimateRule(validRuleData({ validFrom: new Date('2026-10-10'), validTo: new Date('2026-10-01') }));
    expect((await getValidationError(doc))?.errors.validTo).toBeDefined();
  });

  it('accepts validTo equal to validFrom (a single-day validity window)', async () => {
    const doc = new TransportEstimateRule(validRuleData({ validFrom: new Date('2026-10-10'), validTo: new Date('2026-10-10') }));
    expect(await getValidationError(doc)).toBeUndefined();
  });
});

describe('TransportEstimateRule model — driver allowance', () => {
  it('is omittable entirely without inventing an amount', () => {
    const doc = new TransportEstimateRule(validRuleData());
    expect(doc.driverAllowance).toBeUndefined();
  });

  it('accepts applicable + includedInBaseFare with no amount', async () => {
    const doc = new TransportEstimateRule(validRuleData({ driverAllowance: { applicable: true, includedInBaseFare: true } }));
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('accepts applicable + not included with a positive integer amount', async () => {
    const doc = new TransportEstimateRule(validRuleData({ driverAllowance: { applicable: true, includedInBaseFare: false, perDayAmountMinorUnits: 50_000 } }));
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('rejects applicable + not included with no amount', async () => {
    const doc = new TransportEstimateRule(validRuleData({ driverAllowance: { applicable: true, includedInBaseFare: false } }));
    expect((await getValidationError(doc))?.errors['driverAllowance.perDayAmountMinorUnits']).toBeDefined();
  });

  it('rejects an amount set while includedInBaseFare is true (would double-count)', async () => {
    const doc = new TransportEstimateRule(
      validRuleData({ driverAllowance: { applicable: true, includedInBaseFare: true, perDayAmountMinorUnits: 50_000 } })
    );
    expect((await getValidationError(doc))?.errors['driverAllowance.perDayAmountMinorUnits']).toBeDefined();
  });

  it('rejects an amount set while not applicable (would invent a charge)', async () => {
    const doc = new TransportEstimateRule(
      validRuleData({ driverAllowance: { applicable: false, includedInBaseFare: false, perDayAmountMinorUnits: 50_000 } })
    );
    expect((await getValidationError(doc))?.errors['driverAllowance.perDayAmountMinorUnits']).toBeDefined();
  });
});

describe('TransportEstimateRule model — no minimum invented', () => {
  it('minimumKmPerDay is omittable', () => {
    const doc = new TransportEstimateRule(validRuleData());
    expect(doc.minimumKmPerDay).toBeUndefined();
  });

  it('rejects a negative minimumKmPerDay', async () => {
    const doc = new TransportEstimateRule(validRuleData({ minimumKmPerDay: -1 }));
    expect((await getValidationError(doc))?.errors.minimumKmPerDay).toBeDefined();
  });
});

describe('TransportEstimateRule model — indexes', () => {
  it('defines a lookup index on (vehicleCategory, serviceRegion, tripType, rateBasis, active)', () => {
    const indexes = TransportEstimateRule.schema.indexes();
    const match = indexes.find(
      ([fields]) => fields.vehicleCategory === 1 && fields.serviceRegion === 1 && fields.tripType === 1 && fields.rateBasis === 1 && fields.active === 1
    );
    expect(match).toBeDefined();
  });

  it('defines no unique index anywhere (seasonal replacement rules must remain insertable)', () => {
    const indexes = TransportEstimateRule.schema.indexes();
    const anyUnique = indexes.some(([, options]) => options?.unique);
    expect(anyUnique).toBe(false);
  });
});

describe('TransportEstimateRule model — no supplier-cost field', () => {
  it('the schema never declares a supplierCost/partnerId/customerPrice/markup field (never blurs into TransportRate)', () => {
    const forbiddenPattern = /suppliercost|partnerid|customerprice|sellingprice|markup|margin/i;
    const offending = Object.keys(TransportEstimateRule.schema.paths).filter((path) => forbiddenPattern.test(path));
    expect(offending).toEqual([]);
  });
});

describe('TransportEstimateRule model — hot-reload safety', () => {
  it('is registered on the shared mongoose.models registry (survives a Next.js dev hot-reload)', () => {
    expect(mongoose.models.TransportEstimateRule).toBe(TransportEstimateRule);
  });
});
