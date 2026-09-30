import { describe, expect, it } from 'vitest';
import { roundForDisplay, buildDisplayPrice, buildStartingFromLabel, JOURNEY_PRICE_DISCLAIMER } from './journeyPriceDisplay';

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

describe('buildStartingFromLabel — the public "Starting From ₹XX,XXX per person*" contract (Phase 4, Part 2)', () => {
  it('formats a real price with the exact required shape', () => {
    expect(buildStartingFromLabel(13999)).toBe('Starting From ₹13,999 per person*');
  });

  it('always leads with "Starting From" and ends with the disclaimer asterisk — never a bare, unqualified figure', () => {
    const label = buildStartingFromLabel(21999);
    expect(label.startsWith('Starting From ')).toBe(true);
    expect(label.endsWith('*')).toBe(true);
    expect(label).toMatch(/per person\*$/);
  });

  it('never implies a fixed/guaranteed price and never looks like a crossed-out sale or discount figure', () => {
    const label = buildStartingFromLabel(18999);
    expect(label.toLowerCase()).not.toMatch(/guarantee|fixed|discount|off|sale|mrp/);
  });

  it('rejects a zero, negative, or non-finite price — never fabricates a displayable figure for missing data', () => {
    expect(() => buildStartingFromLabel(0)).toThrow(/price/);
    expect(() => buildStartingFromLabel(-100)).toThrow(/price/);
    expect(() => buildStartingFromLabel(NaN)).toThrow(/price/);
  });
});
