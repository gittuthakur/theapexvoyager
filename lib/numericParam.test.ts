import { describe, expect, it } from 'vitest';
import { parseNonNegativeNumberParam } from '@/lib/numericParam';

describe('parseNonNegativeNumberParam (Transport maxPrice / minSeats)', () => {
  it('treats an absent or blank param as not supplied (never invalid)', () => {
    for (const raw of [undefined, '', '   ']) expect(parseNonNegativeNumberParam(raw)).toEqual({ invalid: false });
  });
  it('accepts real non-negative numbers, including 0 and decimals', () => {
    expect(parseNonNegativeNumberParam('4')).toEqual({ value: 4, invalid: false });
    expect(parseNonNegativeNumberParam('2500.5')).toEqual({ value: 2500.5, invalid: false });
    expect(parseNonNegativeNumberParam('0')).toEqual({ value: 0, invalid: false });
  });
  it('flags every supplied-but-not-a-real-number value as invalid, with no value', () => {
    for (const raw of ['abc', '-1', '-0.5', 'Infinity', '-Infinity', 'NaN', '1e999', '12abc']) {
      expect(parseNonNegativeNumberParam(raw), raw).toEqual({ invalid: true });
    }
  });
});
