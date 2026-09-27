import { describe, expect, it } from 'vitest';
import { validateRow, type Row } from './importTransportEstimateRules';

function validRow(overrides: Partial<Row> = {}): Row {
  return {
    vehicleCategory: 'SUV',
    serviceRegion: 'himachal-pradesh',
    tripType: 'ONE_WAY',
    rateBasis: 'PER_KM',
    perKmRateRupees: '12',
    minimumKmPerDay: '',
    driverAllowanceApplicable: 'true',
    driverAllowanceIncludedInBaseFare: 'false',
    driverAllowancePerDayAmountRupees: '300',
    nightHaltChargeRupees: '',
    tollStatus: 'UNKNOWN',
    parkingStatus: '',
    stateTaxStatus: '',
    permitStatus: '',
    validFrom: '2026-10-01',
    validTo: '2027-03-31',
    sourceType: 'BUSINESS_APPROVED_ESTIMATE',
    sourceName: '',
    sourceReference: '',
    verifiedBy: '',
    notes: '',
    ...overrides
  };
}

describe('validateRow', () => {
  it('accepts a fully valid row and converts rupees to minor units', () => {
    const result = validateRow(validRow());
    expect(result.valid).toBe(true);
    expect(result.input?.perKmRateMinorUnits).toBe(1_200);
    expect(result.input?.driverAllowance?.perDayAmountMinorUnits).toBe(30_000);
  });

  it('accepts a row with no driver allowance concept at all', () => {
    const result = validateRow(validRow({ driverAllowanceApplicable: '', driverAllowanceIncludedInBaseFare: '', driverAllowancePerDayAmountRupees: '' }));
    expect(result.valid).toBe(true);
    expect(result.input?.driverAllowance?.applicable).toBe(false);
    expect(result.input?.driverAllowance?.perDayAmountMinorUnits).toBeUndefined();
  });

  it('accepts driver allowance included in the base fare with no amount', () => {
    const result = validateRow(validRow({ driverAllowanceApplicable: 'true', driverAllowanceIncludedInBaseFare: 'true', driverAllowancePerDayAmountRupees: '' }));
    expect(result.valid).toBe(true);
    expect(result.input?.driverAllowance?.includedInBaseFare).toBe(true);
    expect(result.input?.driverAllowance?.perDayAmountMinorUnits).toBeUndefined();
  });

  it('rejects an unrecognized vehicleCategory', () => {
    expect(validateRow(validRow({ vehicleCategory: 'Spaceship' })).valid).toBe(false);
  });

  it('rejects an unknown serviceRegion', () => {
    expect(validateRow(validRow({ serviceRegion: 'atlantis' })).valid).toBe(false);
  });

  it('rejects an unrecognized tripType', () => {
    expect(validateRow(validRow({ tripType: 'TELEPORT' })).valid).toBe(false);
  });

  it('rejects an unrecognized rateBasis', () => {
    expect(validateRow(validRow({ rateBasis: 'PER_DAY' })).valid).toBe(false);
  });

  it('rejects an unrecognized sourceType', () => {
    expect(validateRow(validRow({ sourceType: 'SUPPLIER' })).valid).toBe(false);
  });

  it('rejects a missing perKmRateRupees', () => {
    const result = validateRow(validRow({ perKmRateRupees: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/perKmRateRupees/);
  });

  it('rejects a zero or negative perKmRateRupees', () => {
    expect(validateRow(validRow({ perKmRateRupees: '0' })).valid).toBe(false);
    expect(validateRow(validRow({ perKmRateRupees: '-5' })).valid).toBe(false);
  });

  it('rejects a non-numeric perKmRateRupees', () => {
    expect(validateRow(validRow({ perKmRateRupees: 'not-a-number' })).valid).toBe(false);
  });

  it('rejects a sub-paise fractional perKmRateRupees', () => {
    const result = validateRow(validRow({ perKmRateRupees: '12.005' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/sub-paise/);
  });

  it('rejects an invalid validFrom/validTo', () => {
    expect(validateRow(validRow({ validFrom: 'not-a-date' })).valid).toBe(false);
    expect(validateRow(validRow({ validTo: '' })).valid).toBe(false);
  });

  it('rejects validTo before validFrom', () => {
    const result = validateRow(validRow({ validFrom: '2026-10-10', validTo: '2026-10-01' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/validTo must be on or after validFrom/);
  });

  it('rejects a driver allowance amount required but missing', () => {
    const result = validateRow(validRow({ driverAllowanceApplicable: 'true', driverAllowanceIncludedInBaseFare: 'false', driverAllowancePerDayAmountRupees: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/driverAllowancePerDayAmountRupees is required/);
  });

  it('rejects a driver allowance amount set while included in base fare (would double-count)', () => {
    const result = validateRow(validRow({ driverAllowanceApplicable: 'true', driverAllowanceIncludedInBaseFare: 'true', driverAllowancePerDayAmountRupees: '300' }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/must be blank/);
  });

  it('rejects an unrecognized component status', () => {
    expect(validateRow(validRow({ tollStatus: 'FREE' })).valid).toBe(false);
  });

  it('leaves optional numeric fields undefined when blank, never defaulted to 0', () => {
    const result = validateRow(validRow({ minimumKmPerDay: '', nightHaltChargeRupees: '' }));
    expect(result.input?.minimumKmPerDay).toBeUndefined();
    expect(result.input?.nightHaltChargeMinorUnits).toBeUndefined();
  });
});
