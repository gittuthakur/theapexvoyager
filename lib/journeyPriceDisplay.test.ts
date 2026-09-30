import { describe, expect, it } from 'vitest';
import { roundForDisplay, buildDisplayPrice, JOURNEY_PRICE_DISCLAIMER } from './journeyPriceDisplay';

describe('roundForDisplay', () => {
  it('performs no rounding at all when roundToNearest is omitted', () => {
    expect(roundForDisplay({ rawCalculatedPrice: 15432.7 })).toBe(15433); // Math.round only, no step
  });

  it('rounds to the given step', () => {
    expect(roundForDisplay({ rawCalculatedPrice: 15432, roundToNearest: 100 })).toBe(15400);
    expect(roundForDisplay({ rawCalculatedPrice: 15460, roundToNearest: 100 })).toBe(15500);
  });

  it('never automatically produces a "psychologically attractive" ending on its own — it only rounds to the caller-given step, nothing else', () => {
    // Rounding 15,432 to the nearest 1000 gives 15,000 — an ordinary round number, not a
    // ...999-style price, because this module has no such special-casing at all.
    expect(roundForDisplay({ rawCalculatedPrice: 15432, roundToNearest: 1000 })).toBe(15000);
  });

  it('rejects a negative raw price', () => {
    expect(() => roundForDisplay({ rawCalculatedPrice: -100 })).toThrow(/rawCalculatedPrice/);
  });

  it('rejects a zero or negative rounding step', () => {
    expect(() => roundForDisplay({ rawCalculatedPrice: 100, roundToNearest: 0 })).toThrow(/roundToNearest/);
    expect(() => roundForDisplay({ rawCalculatedPrice: 100, roundToNearest: -50 })).toThrow(/roundToNearest/);
  });
});

describe('JOURNEY_PRICE_DISCLAIMER', () => {
  it('never implies a guaranteed fixed price', () => {
    expect(JOURNEY_PRICE_DISCLAIMER).toMatch(/indicative/i);
    expect(JOURNEY_PRICE_DISCLAIMER).toMatch(/may vary/i);
    expect(JOURNEY_PRICE_DISCLAIMER.toLowerCase()).not.toContain('guaranteed');
  });
});

describe('buildDisplayPrice', () => {
  it('always starts with ownerApproved: false — never pre-approved by this module', () => {
    const result = buildDisplayPrice({ rawCalculatedPrice: 15432, roundToNearest: 100 });
    expect(result.ownerApproved).toBe(false);
    expect(result.roundedPrice).toBe(15400);
    expect(result.rawCalculatedPrice).toBe(15432);
  });
});
