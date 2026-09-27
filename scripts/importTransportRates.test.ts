import { describe, expect, it } from 'vitest';
import { validateRow, type Row } from './importTransportRates';

function validRow(overrides: Partial<Row> = {}): Row {
  return {
    partnerId: 'partner-1',
    vehicleCategory: 'SUV',
    rateType: 'POINT_TO_POINT',
    routeId: 'route-1',
    circuitKey: '',
    journeySlug: '',
    supplierCostRupees: '4500',
    includedKm: '150',
    minimumKm: '',
    extraKmRateRupees: '15',
    driverAllowanceRupees: '',
    nightChargeRupees: '',
    fuelIncluded: 'true',
    driverAllowanceIncluded: '',
    tollParkingIncluded: 'false',
    stateTaxIncluded: '',
    permitIncluded: '',
    nightChargeIncluded: '',
    validFrom: '2026-10-01',
    validTo: '2027-03-31',
    source: 'Phone call with supplier',
    sourceReference: '',
    verifiedBy: '',
    notes: '',
    ...overrides
  };
}

describe('validateRow', () => {
  it('accepts a fully valid point-to-point row and converts rupees to minor units', () => {
    const result = validateRow(validRow());
    expect(result.valid).toBe(true);
    expect(result.input?.supplierCostMinorUnits).toBe(450_000);
    expect(result.input?.extraKmRateMinorUnits).toBe(1_500);
    expect(result.input?.inclusions?.fuelIncluded).toBe(true);
    expect(result.input?.inclusions?.tollParkingIncluded).toBe(false);
    expect(result.input?.inclusions?.driverAllowanceIncluded).toBeUndefined();
  });

  it('accepts a fully valid circuit row', () => {
    const result = validateRow(validRow({ rateType: 'CIRCUIT_FIXED', routeId: '', circuitKey: 'spiti-circuit-shimla-manali' }));
    expect(result.valid).toBe(true);
    expect(result.input?.circuitKey).toBe('spiti-circuit-shimla-manali');
    expect(result.input?.routeId).toBeUndefined();
  });

  it('rejects a missing partnerId', () => {
    const result = validateRow(validRow({ partnerId: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/partnerId/);
  });

  it('rejects an unrecognized vehicleCategory', () => {
    const result = validateRow(validRow({ vehicleCategory: 'Spaceship' }));
    expect(result.valid).toBe(false);
  });

  it('rejects an unrecognized rateType', () => {
    const result = validateRow(validRow({ rateType: 'HOT_AIR_BALLOON' }));
    expect(result.valid).toBe(false);
  });

  it('rejects a CIRCUIT_FIXED row with no circuitKey', () => {
    const result = validateRow(validRow({ rateType: 'CIRCUIT_FIXED', routeId: '', circuitKey: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/circuitKey is required/);
  });

  it('rejects a CIRCUIT_FIXED row that also sets routeId', () => {
    const result = validateRow(validRow({ rateType: 'CIRCUIT_FIXED', circuitKey: 'spiti-circuit-shimla-manali' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/routeId must be blank/);
  });

  it('rejects a missing supplierCostRupees', () => {
    const result = validateRow(validRow({ supplierCostRupees: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/supplierCostRupees/);
  });

  it('rejects a zero or negative supplierCostRupees', () => {
    expect(validateRow(validRow({ supplierCostRupees: '0' })).valid).toBe(false);
    expect(validateRow(validRow({ supplierCostRupees: '-100' })).valid).toBe(false);
  });

  it('rejects a non-numeric supplierCostRupees', () => {
    const result = validateRow(validRow({ supplierCostRupees: 'not-a-number' }));
    expect(result.valid).toBe(false);
  });

  it('rejects an invalid validFrom/validTo', () => {
    expect(validateRow(validRow({ validFrom: 'not-a-date' })).valid).toBe(false);
    expect(validateRow(validRow({ validTo: '' })).valid).toBe(false);
  });

  it('rejects a missing source', () => {
    const result = validateRow(validRow({ source: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/source/);
  });

  it('leaves optional numeric fields undefined when blank, never defaulted to 0', () => {
    const result = validateRow(validRow({ includedKm: '', driverAllowanceRupees: '', nightChargeRupees: '' }));
    expect(result.input?.includedKm).toBeUndefined();
    expect(result.input?.driverAllowanceMinorUnits).toBeUndefined();
    expect(result.input?.nightChargeMinorUnits).toBeUndefined();
  });
});
