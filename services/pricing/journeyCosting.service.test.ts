import { describe, expect, it } from 'vitest';
import { calculateJourneyCosting as calc, emptyCosting, emptyLine, lineFromSupplierTransport, roundStartingPrice, validateCosting } from './journeyCosting.service';
import { syntheticCosting, SYNTHETIC_JOURNEY } from './journeyCosting.fixture';
import type { CostingInput, CostCategory, CostLine } from '../../models/JourneyCosting';
function single(category: CostCategory, patch: Partial<CostLine> = {}): CostingInput { const input = emptyCosting(SYNTHETIC_JOURNEY); input[category] = [{ ...emptyLine('test', category), label: 'Synthetic item', unitCost: 100, includedInPackage: true, ...patch }]; return input; }

describe('internal Journey supplier costing', () => {
  it('demonstrates synthetic costs without optional activity in base', () => {
    const result = calc(syntheticCosting());
    expect(result).toMatchObject({ subtotal: 11200, contingency: 560, costAfterContingency: 11760, sellingTotal: 14112, perPersonSellingPrice: 7056, recommendedStartingPrice: 7999, grossProfit: 2352, grossMarginPercent: 16.67, markupPercent: 20 });
  });
  it.each([2, 4, 6])('independent %i-adult scenario: rooms × nights; meals per person only once', adults => {
    const input = syntheticCosting(); input.adultCount = input.travellerCount = adults; input.roomCount = adults / 2;
    const result = calc(input); expect(result.categories.hotelCosts).toBe(2000 * 3 * adults / 2); expect(result.categories.mealCosts).toBe(200 * 3 * adults); expect(result.categories.transportCosts).toBe(4000);
  });
  it('hotel supplements have explicit quantities and do not inherit room multipliers', () => {
    const input = single('hotelCosts', { quantity: 3, unitCost: 2000, supplements: [{ label: 'Extra bed', quantity: 3, unitCost: 500 }] }); input.roomCount = 2;
    expect(calc(input).subtotal).toBe(13500);
  });
  it.each([['FIXED_ROUTE', 1, 0, 100], ['SUPPLIER_QUOTE', 1, 0, 100], ['PER_KM', 50, 10, 6000], ['PER_DAY', 4, 0, 400]] as const)('transport %s', (costBasis, quantity, deadKm, expected) => expect(calc(single('transportCosts', { costBasis, quantity, deadKm })).subtotal).toBe(expected));
  it('hotel-included meals require hotel linkage and cannot carry extra cost', () => {
    const input = single('hotelCosts'); input.mealCosts = [{ ...emptyLine('meal', 'mealCosts'), label: 'Breakfast', costBasis: 'INCLUDED_IN_HOTEL', includedHotelId: 'test', unitCost: 0 }];
    expect(calc(input).categories.mealCosts).toBe(0); input.mealCosts[0].unitCost = 1; expect(() => calc(input)).toThrow('Hotel-included');
    input.mealCosts[0].unitCost = 0; input.mealCosts[0].includedHotelId = 'missing'; expect(() => calc(input)).toThrow('linked');
  });
  it('optional activities/local access default excluded; explicit inclusion counts', () => {
    const input = emptyCosting(SYNTHETIC_JOURNEY); input.activityCosts = [{ ...emptyLine('gondola', 'activityCosts'), label: 'Demo', unitCost: 500 }]; input.localServiceCosts = [{ ...emptyLine('heli', 'localServiceCosts'), unitCost: 1000 }];
    expect(calc(input).subtotal).toBe(0); input.activityCosts[0].includedInPackage = true; expect(calc(input).subtotal).toBe(500);
  });
  it.each([['FIXED', 100], ['PER_PERSON', 200], ['PER_ROOM', 100]] as const)('permit %s', (costBasis, expected) => expect(calc(single('permitCosts', { costBasis })).subtotal).toBe(expected));
  it('mixed fixed/per-person/per-room/per-day costs and child/single occupancy', () => {
    const input = single('miscCosts', { costBasis: 'FIXED', unitCost: 1000 }); input.adultCount = 1; input.childCount = 1; input.travellerCount = 2;
    input.mealCosts = [{ ...emptyLine('meal', 'mealCosts'), label: 'Meal', costBasis: 'PER_PERSON', unitCost: 100, quantity: 3 }];
    input.hotelCosts = [{ ...emptyLine('room', 'hotelCosts'), label: 'Room', costBasis: 'PER_ROOM', unitCost: 2000 }];
    input.transportCosts = [{ ...emptyLine('cab', 'transportCosts'), label: 'Cab', costBasis: 'PER_DAY', unitCost: 500, quantity: 2 }];
    expect(calc(input).subtotal).toBe(4600);
  });
  it.each([['PERCENT', 5, 500], ['FIXED', 300, 300]] as const)('contingency %s', (mode, value, expected) => { const input = single('miscCosts', { unitCost: 10000 }); input.contingency = { mode, value }; expect(calc(input).contingency).toBe(expected); });
  it('distinguishes 20% markup from 20% gross margin', () => { const input = single('miscCosts', { unitCost: 10000 }); input.pricing.percent = 20; expect(calc(input).sellingTotal).toBe(12000); input.pricing.mode = 'TARGET_GROSS_MARGIN'; expect(calc(input)).toMatchObject({ sellingTotal: 12500, grossMarginPercent: 20, markupPercent: 25 }); });
  it('commission is deducted from pre-tax selling proceeds and solved independently', () => {
    const input = single('miscCosts', { unitCost: 10000 }); input.pricing.percent = 20; input.commission = { mode: 'FIXED', value: 500 };
    expect(calc(input)).toMatchObject({ sellingTotal: 12500, commission: 500, grossProfit: 2000 });
    input.commission = { mode: 'PERCENT', value: 10 }; expect(calc(input).sellingTotal).toBe(13333.34);
    input.pricing.mode = 'TARGET_GROSS_MARGIN'; expect(calc(input).sellingTotal).toBe(14285.72);
  });
  it('tax disabled, exclusive and inclusive; loss is visible but draft remains valid', () => {
    const input = single('miscCosts', { unitCost: 10000 }); input.tax.taxRate = 10;
    expect(calc(input).taxes).toBe(0); input.tax.taxEnabled = true; expect(calc(input)).toMatchObject({ sellingTotal: 11000, netRevenue: 10000, taxes: 1000 });
    input.tax.taxInclusive = true; expect(calc(input).grossProfit).toBeLessThan(0); expect(calc(input).warnings.join(' ')).toContain('LOSS'); expect(() => validateCosting(input)).not.toThrow();
  });
  it('rounding always covers required per-person price including boundaries', () => {
    expect(roundStartingPrice(21642, 'UP_TO_999')).toBe(21999); expect(roundStartingPrice(29410, 'UP_TO_999')).toBe(29999);
    expect(roundStartingPrice(999, 'UP_TO_999')).toBe(999); expect(roundStartingPrice(999.01, 'UP_TO_999')).toBe(1999);
    expect(roundStartingPrice(500, 'UP_TO_499')).toBe(999); expect(roundStartingPrice(101, 'NEAREST_100')).toBe(200);
    for (const rounding of ['NONE', 'NEAREST_100', 'UP_TO_499', 'UP_TO_999'] as const) for (const amount of [0, 0.0000000001, 0.001, 499, 499.001, 999.99, 10000.111]) expect(roundStartingPrice(amount, rounding)).toBeGreaterThanOrEqual(amount);
  });
  it('zero cost produces zero rather than a fabricated starting price', () => expect(calc(emptyCosting(SYNTHETIC_JOURNEY))).toMatchObject({ sellingTotal: 0, recommendedStartingPrice: 0, supplierConfirmationStatus: 'EMPTY' }));
  it.each([-1, NaN, Infinity])('rejects invalid cost %s', cost => expect(() => calc(single('hotelCosts', { unitCost: cost }))).toThrow());
  it('rejects negative quantity, invalid enums/dates/percentages/occupancy and arbitrary fields', () => {
    const invalid = [ { ...single('miscCosts'), roomCount: 0 }, { ...single('miscCosts'), travellerCount: 0 }, { ...single('miscCosts'), validFrom: '2026-02-30' }, { ...single('miscCosts'), currency: 'USD' }, { ...single('miscCosts'), status: 'published' }, { ...single('miscCosts'), tax: { taxEnabled: true, taxLabel: 'Tax', taxRate: -1, taxInclusive: false } } ];
    for (const value of invalid) expect(() => validateCosting(value)).toThrow(); expect(() => calc(single('miscCosts', { quantity: -1 }))).toThrow();
    const input = single('miscCosts'); input.pricing = { mode: 'TARGET_GROSS_MARGIN', percent: 100 }; expect(() => calc(input)).toThrow(); input.pricing.percent = 90; input.commission = { mode: 'PERCENT', value: 10 }; expect(() => calc(input)).toThrow();
    input.pricing = { mode: 'MARKUP_ON_COST', percent: 20 }; input.commission.value = 100; expect(() => calc(input)).toThrow();
  });
  it('expired quotes and blank amounts block review, while rollups never mislabel estimates', () => {
    const input = syntheticCosting(); input.hotelCosts[0].quoteExpires = '2020-01-01'; input.hotelCosts[0].confirmationStatus = 'CONFIRMED'; input.transportCosts[0].confirmationStatus = 'QUOTED'; input.mealCosts[0].unitCost = null;
    const result = calc(input); expect(result.confirmations).toEqual({ CONFIRMED: 1, QUOTED: 1, ESTIMATE: 2 }); expect(result.supplierConfirmationStatus).toBe('ESTIMATE'); expect(result.reviewBlockers.join(' ')).toContain('Expired'); expect(result.reviewBlockers.join(' ')).toContain('Missing cost');
  });
  it('imports supplier TransportRate only, in minor units, without importing public estimates', () => {
    expect(lineFromSupplierTransport({ status: 'EXACT', currency: 'INR', rateId: 'rate', supplierCostMinorUnits: 123400, explanation: '' }, 'cab')).toMatchObject({ unitCost: 1234, confirmationStatus: 'QUOTED' });
    expect(() => lineFromSupplierTransport({ status: 'ESTIMATED', supplierCostMinorUnits: 1300, explanation: '' }, 'cab')).toThrow();
  });
});
