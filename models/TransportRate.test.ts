import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { TransportRate, TRANSPORT_RATE_TYPES, TRANSPORT_RATE_VEHICLE_CATEGORIES } from './TransportRate';

// Every test here uses Mongoose's own `validate()` — pure offline schema-level
// validation with no MongoDB connection, no network call, and (per TP2's brief) never a
// real write. No `.save()`/`.create()` call appears anywhere below.
async function getValidationError(doc: InstanceType<typeof TransportRate>): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error as mongoose.Error.ValidationError;
  }
}

const PARTNER_ID = new mongoose.Types.ObjectId();
const ROUTE_ID = new mongoose.Types.ObjectId();

function validPointToPointData(overrides: Record<string, unknown> = {}) {
  return {
    partnerId: PARTNER_ID,
    vehicleCategory: 'SUV',
    rateType: 'POINT_TO_POINT',
    routeId: ROUTE_ID,
    supplierCostMinorUnits: 450_000,
    validFrom: new Date('2026-10-01T00:00:00.000Z'),
    validTo: new Date('2027-03-31T00:00:00.000Z'),
    source: 'Phone call with supplier, confirmed via WhatsApp on 2026-10-02',
    ...overrides
  };
}

function validCircuitData(overrides: Record<string, unknown> = {}) {
  return {
    partnerId: PARTNER_ID,
    vehicleCategory: 'SUV',
    rateType: 'CIRCUIT_FIXED',
    circuitKey: 'spiti-circuit-shimla-manali',
    supplierCostMinorUnits: 3_500_000,
    validFrom: new Date('2026-06-01T00:00:00.000Z'),
    validTo: new Date('2026-10-15T00:00:00.000Z'),
    source: 'Written quote from supplier, on file',
    ...overrides
  };
}

describe('TransportRate model — valid shapes', () => {
  it('a fully valid POINT_TO_POINT document passes schema validation', async () => {
    const doc = new TransportRate(validPointToPointData());
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('a fully valid CIRCUIT_FIXED document passes schema validation', async () => {
    const doc = new TransportRate(validCircuitData());
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('a generic (routeId-less) POINT_TO_POINT document is still valid', async () => {
    const { routeId: _routeId, ...rest } = validPointToPointData();
    const doc = new TransportRate(rest);
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('defaults currency to INR and active to true', () => {
    const doc = new TransportRate(validPointToPointData());
    expect(doc.currency).toBe('INR');
    expect(doc.active).toBe(true);
  });

  it('accepts every documented rate type', async () => {
    for (const rateType of TRANSPORT_RATE_TYPES) {
      const base = rateType === 'CIRCUIT_FIXED' ? validCircuitData({ rateType }) : validPointToPointData({ rateType });
      const doc = new TransportRate(base);
      expect(await getValidationError(doc), `rateType ${rateType} should be valid`).toBeUndefined();
    }
  });

  it('accepts every documented vehicle category', async () => {
    for (const vehicleCategory of TRANSPORT_RATE_VEHICLE_CATEGORIES) {
      const doc = new TransportRate(validPointToPointData({ vehicleCategory }));
      expect(await getValidationError(doc), `vehicleCategory ${vehicleCategory} should be valid`).toBeUndefined();
    }
  });
});

describe('TransportRate model — rate-type / identity coupling', () => {
  it('rejects a CIRCUIT_FIXED rate with no circuitKey', async () => {
    const { circuitKey: _circuitKey, ...rest } = validCircuitData();
    const doc = new TransportRate(rest);
    expect((await getValidationError(doc))?.errors.circuitKey).toBeDefined();
  });

  it('rejects a CIRCUIT_FIXED rate that also sets routeId', async () => {
    const doc = new TransportRate(validCircuitData({ routeId: ROUTE_ID }));
    expect((await getValidationError(doc))?.errors.routeId).toBeDefined();
  });

  it('rejects a POINT_TO_POINT rate that sets circuitKey', async () => {
    const doc = new TransportRate(validPointToPointData({ circuitKey: 'should-not-be-set' }));
    expect((await getValidationError(doc))?.errors.circuitKey).toBeDefined();
  });

  it('rejects an undocumented rateType', async () => {
    const doc = new TransportRate(validPointToPointData({ rateType: 'NOT_A_REAL_TYPE' }));
    expect((await getValidationError(doc))?.errors.rateType).toBeDefined();
  });

  it('rejects an undocumented vehicleCategory', async () => {
    const doc = new TransportRate(validPointToPointData({ vehicleCategory: 'Spaceship' }));
    expect((await getValidationError(doc))?.errors.vehicleCategory).toBeDefined();
  });
});

describe('TransportRate model — supplier cost safety', () => {
  it('rejects a zero supplierCostMinorUnits', async () => {
    const doc = new TransportRate(validPointToPointData({ supplierCostMinorUnits: 0 }));
    expect((await getValidationError(doc))?.errors.supplierCostMinorUnits).toBeDefined();
  });

  it('rejects a negative supplierCostMinorUnits', async () => {
    const doc = new TransportRate(validPointToPointData({ supplierCostMinorUnits: -100 }));
    expect((await getValidationError(doc))?.errors.supplierCostMinorUnits).toBeDefined();
  });

  it('rejects a non-integer (float) supplierCostMinorUnits', async () => {
    const doc = new TransportRate(validPointToPointData({ supplierCostMinorUnits: 1000.5 }));
    expect((await getValidationError(doc))?.errors.supplierCostMinorUnits).toBeDefined();
  });

  it('rejects NaN and Infinity supplierCostMinorUnits', async () => {
    const nanDoc = new TransportRate(validPointToPointData({ supplierCostMinorUnits: NaN }));
    expect((await getValidationError(nanDoc))?.errors.supplierCostMinorUnits).toBeDefined();

    const infDoc = new TransportRate(validPointToPointData({ supplierCostMinorUnits: Infinity }));
    expect((await getValidationError(infDoc))?.errors.supplierCostMinorUnits).toBeDefined();
  });

  it('requires supplierCostMinorUnits', async () => {
    const { supplierCostMinorUnits: _cost, ...rest } = validPointToPointData();
    const doc = new TransportRate(rest);
    expect((await getValidationError(doc))?.errors.supplierCostMinorUnits).toBeDefined();
  });
});

describe('TransportRate model — optional cost components', () => {
  it('are omittable without defaulting to a monetary value', () => {
    const doc = new TransportRate(validPointToPointData());
    expect(doc.includedKm).toBeUndefined();
    expect(doc.extraKmRateMinorUnits).toBeUndefined();
    expect(doc.driverAllowanceMinorUnits).toBeUndefined();
    expect(doc.nightChargeMinorUnits).toBeUndefined();
  });

  it('rejects a negative extraKmRateMinorUnits', async () => {
    const doc = new TransportRate(validPointToPointData({ extraKmRateMinorUnits: -1 }));
    expect((await getValidationError(doc))?.errors.extraKmRateMinorUnits).toBeDefined();
  });

  it('leaves inclusion flags undefined (unknown), never defaulted to false', () => {
    const doc = new TransportRate(validPointToPointData());
    expect(doc.inclusions).toBeUndefined();
  });

  it('preserves an explicit false inclusion flag as false, not unknown', () => {
    const doc = new TransportRate(validPointToPointData({ inclusions: { fuelIncluded: false, tollParkingIncluded: true } }));
    expect(doc.inclusions?.fuelIncluded).toBe(false);
    expect(doc.inclusions?.tollParkingIncluded).toBe(true);
    expect(doc.inclusions?.driverAllowanceIncluded).toBeUndefined();
  });
});

describe('TransportRate model — validity window', () => {
  it('rejects validTo before validFrom', async () => {
    const doc = new TransportRate(validPointToPointData({ validFrom: new Date('2026-10-10'), validTo: new Date('2026-10-01') }));
    expect((await getValidationError(doc))?.errors.validTo).toBeDefined();
  });

  it('accepts validTo equal to validFrom (a single-day validity window)', async () => {
    const doc = new TransportRate(validPointToPointData({ validFrom: new Date('2026-10-10'), validTo: new Date('2026-10-10') }));
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('requires both validFrom and validTo', async () => {
    const { validFrom: _f, ...rest } = validPointToPointData();
    const doc = new TransportRate(rest);
    expect((await getValidationError(doc))?.errors.validFrom).toBeDefined();
  });
});

describe('TransportRate model — provenance', () => {
  it('requires a source', async () => {
    const { source: _source, ...rest } = validPointToPointData();
    const doc = new TransportRate(rest);
    expect((await getValidationError(doc))?.errors.source).toBeDefined();
  });

  it('sourceReference/verifiedAt/verifiedBy/notes are all optional', async () => {
    const doc = new TransportRate(validPointToPointData());
    expect(await getValidationError(doc)).toBeUndefined();
    expect(doc.sourceReference).toBeUndefined();
    expect(doc.verifiedAt).toBeUndefined();
    expect(doc.verifiedBy).toBeUndefined();
    expect(doc.notes).toBeUndefined();
  });
});

describe('TransportRate model — indexes', () => {
  it('defines a lookup index on (vehicleCategory, rateType, routeId, active)', () => {
    const indexes = TransportRate.schema.indexes();
    const match = indexes.find(([fields]) => fields.vehicleCategory === 1 && fields.rateType === 1 && fields.routeId === 1 && fields.active === 1);
    expect(match).toBeDefined();
  });

  it('defines a lookup index on (circuitKey, active)', () => {
    const indexes = TransportRate.schema.indexes();
    const match = indexes.find(([fields]) => fields.circuitKey === 1 && fields.active === 1);
    expect(match).toBeDefined();
  });

  it('defines no unique index anywhere (seasonal replacement rates must remain insertable)', () => {
    const indexes = TransportRate.schema.indexes();
    const anyUnique = indexes.some(([, options]) => options?.unique);
    expect(anyUnique).toBe(false);
  });
});

describe('TransportRate model — no customer-price field', () => {
  it('the schema never declares a customerPrice/sellingPrice/markup field (TP2 Section 6)', () => {
    const forbiddenPattern = /customerprice|sellingprice|markup|margin/i;
    const offending = Object.keys(TransportRate.schema.paths).filter((path) => forbiddenPattern.test(path));
    expect(offending).toEqual([]);
  });
});

describe('TransportRate model — hot-reload safety', () => {
  it('is registered on the shared mongoose.models registry (survives a Next.js dev hot-reload)', () => {
    expect(mongoose.models.TransportRate).toBe(TransportRate);
  });
});
