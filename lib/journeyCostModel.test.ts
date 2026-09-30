import { describe, expect, it } from 'vitest';
import { calculateJourneyCost, type JourneyCostInputs } from './journeyCostModel';

function baseInputs(overrides: Partial<JourneyCostInputs> = {}): JourneyCostInputs {
  return {
    hotelCostPerRoomPerNight: 2000,
    transportTotal: 6000,
    travellers: 2,
    rooms: 1,
    nights: 4,
    marginPercent: 0.2,
    ...overrides
  };
}

describe('calculateJourneyCost — arithmetic', () => {
  it('computes accommodationTotal as hotelCostPerRoomPerNight x rooms x nights', () => {
    const result = calculateJourneyCost(baseInputs({ hotelCostPerRoomPerNight: 2000, rooms: 2, nights: 3 }));
    expect(result.accommodationTotal).toBe(2000 * 2 * 3);
  });

  it('computes baseOperationalCost as the sum of every real cost component', () => {
    const result = calculateJourneyCost(
      baseInputs({
        hotelCostPerRoomPerNight: 1000,
        rooms: 1,
        nights: 2, // accommodation = 2000
        transportTotal: 3000,
        mealCostTotal: 1500,
        activitiesCostTotal: 800,
        permitsCostTotal: 200,
        otherOperationalCostTotal: 500
      })
    );
    expect(result.baseOperationalCost).toBe(2000 + 3000 + 1500 + 800 + 200 + 500);
  });

  it('treats every optional cost component as 0 when omitted, not as an error', () => {
    const result = calculateJourneyCost(baseInputs({ hotelCostPerRoomPerNight: 1000, rooms: 1, nights: 1, transportTotal: 500 }));
    expect(result.baseOperationalCost).toBe(1500);
  });

  it('final total is base + buffer + margin + tax, applied in that order', () => {
    const result = calculateJourneyCost(
      baseInputs({
        hotelCostPerRoomPerNight: 1000,
        rooms: 1,
        nights: 1,
        transportTotal: 0,
        operationalBufferPercent: 0.1,
        marginPercent: 0.2,
        taxPercent: 0.05
      })
    );
    const base = 1000;
    const buffer = base * 0.1; // 100
    const margin = (base + buffer) * 0.2; // 220
    const tax = (base + buffer + margin) * 0.05; // 66
    expect(result.bufferAmount).toBeCloseTo(buffer);
    expect(result.marginAmount).toBeCloseTo(margin);
    expect(result.taxAmount).toBeCloseTo(tax);
    expect(result.finalPackageTotal).toBeCloseTo(base + buffer + margin + tax);
  });
});

describe('calculateJourneyCost — per-person calculation', () => {
  it('perPersonCost is baseOperationalCost / travellers, before buffer/margin/tax', () => {
    const result = calculateJourneyCost(
      baseInputs({ hotelCostPerRoomPerNight: 1000, rooms: 1, nights: 1, transportTotal: 1000, travellers: 4, marginPercent: 0.5 })
    );
    expect(result.perPersonCost).toBe(result.baseOperationalCost / 4);
  });

  it('perPersonSellingPrice is finalPackageTotal / travellers', () => {
    const result = calculateJourneyCost(baseInputs({ travellers: 3 }));
    expect(result.perPersonSellingPrice).toBeCloseTo(result.finalPackageTotal / 3);
  });
});

describe('calculateJourneyCost — room/night calculation', () => {
  it('scales accommodation linearly with both rooms and nights independently', () => {
    const oneRoomOneNight = calculateJourneyCost(baseInputs({ hotelCostPerRoomPerNight: 1500, rooms: 1, nights: 1 }));
    const twoRoomsOneNight = calculateJourneyCost(baseInputs({ hotelCostPerRoomPerNight: 1500, rooms: 2, nights: 1 }));
    const oneRoomTwoNights = calculateJourneyCost(baseInputs({ hotelCostPerRoomPerNight: 1500, rooms: 1, nights: 2 }));
    expect(twoRoomsOneNight.accommodationTotal).toBe(oneRoomOneNight.accommodationTotal * 2);
    expect(oneRoomTwoNights.accommodationTotal).toBe(oneRoomOneNight.accommodationTotal * 2);
  });
});

describe('calculateJourneyCost — zero/invalid traveller rejection', () => {
  it('rejects 0 travellers', () => {
    expect(() => calculateJourneyCost(baseInputs({ travellers: 0 }))).toThrow(/travellers/);
  });
  it('rejects negative travellers', () => {
    expect(() => calculateJourneyCost(baseInputs({ travellers: -2 }))).toThrow(/travellers/);
  });
  it('rejects a non-integer traveller count', () => {
    expect(() => calculateJourneyCost(baseInputs({ travellers: 2.5 }))).toThrow(/travellers/);
  });
  it('rejects 0 rooms', () => {
    expect(() => calculateJourneyCost(baseInputs({ rooms: 0 }))).toThrow(/rooms/);
  });
  it('rejects 0 nights', () => {
    expect(() => calculateJourneyCost(baseInputs({ nights: 0 }))).toThrow(/nights/);
  });
  it('rejects a negative supplier cost', () => {
    expect(() => calculateJourneyCost(baseInputs({ transportTotal: -100 }))).toThrow(/transportTotal/);
  });
  it('rejects an unset/invalid margin — there is no default margin', () => {
    expect(() => calculateJourneyCost(baseInputs({ marginPercent: undefined }))).toThrow(/marginPercent/);
  });
  it('rejects a negative margin', () => {
    expect(() => calculateJourneyCost(baseInputs({ marginPercent: -0.1 }))).toThrow(/marginPercent/);
  });
});

describe('calculateJourneyCost — optional tax handling', () => {
  it('applies zero tax when taxPercent is omitted — never assumes a real GST rate', () => {
    const result = calculateJourneyCost(baseInputs({ taxPercent: undefined }));
    expect(result.taxAmount).toBe(0);
  });

  it('applies the given tax rate on top of base + buffer + margin when provided', () => {
    const withoutTax = calculateJourneyCost(baseInputs({ taxPercent: undefined }));
    const withTax = calculateJourneyCost(baseInputs({ taxPercent: 0.18 }));
    expect(withTax.taxAmount).toBeGreaterThan(0);
    expect(withTax.finalPackageTotal).toBeGreaterThan(withoutTax.finalPackageTotal);
  });

  it('rejects a negative tax rate', () => {
    expect(() => calculateJourneyCost(baseInputs({ taxPercent: -0.05 }))).toThrow(/taxPercent/);
  });
});

describe('calculateJourneyCost — buffer/margin handling', () => {
  it('applies zero buffer when operationalBufferPercent is omitted', () => {
    const result = calculateJourneyCost(baseInputs({ operationalBufferPercent: undefined }));
    expect(result.bufferAmount).toBe(0);
  });

  it('margin is applied on top of (base + buffer), not on base alone', () => {
    const result = calculateJourneyCost(
      baseInputs({ hotelCostPerRoomPerNight: 1000, rooms: 1, nights: 1, transportTotal: 0, operationalBufferPercent: 0.5, marginPercent: 0.1 })
    );
    // base=1000, buffer=500, margin should be 10% of 1500 = 150, not 10% of 1000 = 100
    expect(result.marginAmount).toBeCloseTo(150);
  });

  it('rejects a negative buffer', () => {
    expect(() => calculateJourneyCost(baseInputs({ operationalBufferPercent: -0.1 }))).toThrow(/operationalBufferPercent/);
  });
});
