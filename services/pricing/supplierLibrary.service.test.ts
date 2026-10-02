import { describe, expect, it } from 'vitest';
import { emptyRate, validateSupplier, validateRate, rateValidity, makeSnapshot, snapshotFinancials, snapshotWarnings, matchingRates } from './supplierLibrary.service';
import { demoSupplier, demoHotelRate, demoTransportRate, demoSelection } from './supplierLibrary.fixture';
import { emptyCosting, emptyLine, calculateJourneyCosting } from './journeyCosting.service';
import { SYNTHETIC_JOURNEY } from './journeyCosting.fixture';
describe('supplier domain and reusable rate snapshots', () => {
  it('validates supplier contacts/status and rejects verification/DB field injection', () => {
    const input = demoSupplier().input; expect(() => validateSupplier(input)).not.toThrow();
    for (const patch of [{ phone: 'abc' }, { email: 'invalid' }, { status: 'VERIFIED' }, { name: '' }, { verificationStatus: 'VERIFIED' }, { $set: { status: 'ACTIVE' } }]) expect(() => validateSupplier({ ...input, ...patch })).toThrow();
  });
  it('requires valid dates, enums, currency and structured quoted amounts', () => {
    const r = demoHotelRate().input; expect(() => validateRate(r)).not.toThrow();
    for (const patch of [{ validFrom: '2026-02-30' }, { validTo: '2020-01-01' }, { currency: 'USD' }, { supplierId: 'not-an-id' }, { confirmationStatus: 'VERIFIED' }, { amount: 5 }]) expect(() => validateRate({ ...r, ...patch })).toThrow();
    for (const n of [-1, NaN, Infinity, null]) expect(() => validateRate({ ...r, hotel: { ...r.hotel!, doubleOccupancyRate: n } })).toThrow();
  });
  it.each([['2026-09-01', '2026-09-30', 'EXPIRED'], ['2026-11-01', '2026-12-31', 'FUTURE'], ['2026-01-01', '2026-10-15', 'EXPIRING_SOON'], ['2026-01-01', '2026-12-31', 'ACTIVE']] as const)('validity %s–%s = %s', (validFrom, validTo, expected) => expect(rateValidity({ validFrom, validTo }, '2026-10-02')).toBe(expected));
  it('explicit selection rejects inactive, expired, mismatched and uncovered rates', () => {
    const supplier = demoSupplier(); const rate = demoHotelRate(); const selection = demoSelection();
    supplier.input.status = 'INACTIVE'; expect(() => makeSnapshot(supplier, rate, selection)).toThrow('active'); supplier.input.status = 'ACTIVE';
    expect(() => makeSnapshot(supplier, rate, { ...selection, category: 'transportCosts' })).toThrow('category');
    expect(() => makeSnapshot(supplier, rate, { ...selection, travelFrom: '2020-01-01' })).toThrow('cover'); rate.input.validTo = '2020-01-01'; expect(() => makeSnapshot(supplier, rate, selection)).toThrow();
  });
  it('hotel snapshot preserves meal inclusion, occupancy and supplements; master edits do not refresh it', () => {
    const rate = demoHotelRate(); rate.input.hotel!.mandatorySupplement = 100; rate.input.hotel!.weekendSupplement = 200; rate.input.hotel!.extraAdultRate = 500;
    const snapshot = makeSnapshot(demoSupplier(), rate, { ...demoSelection(), rooms: 2, weekendNights: 1, extraAdults: 1 });
    rate.input.hotel!.doubleOccupancyRate = 2500; expect(snapshot.snapshotRate.hotel!.doubleOccupancyRate).toBe(2000);
    const fields = snapshotFinancials(snapshot); expect(fields.supplements).toEqual([{ label: 'Mandatory supplement / room-night', quantity: 6, unitCost: 100 }, { label: 'Weekend supplement / room-night', quantity: 2, unitCost: 200 }, { label: 'Extra adult / night', quantity: 3, unitCost: 500 }]);
    expect(snapshotWarnings(snapshot).join(' ')).toContain('Room plus breakfast');
  });
  it('rejects unquoted occupancy/child costs and minimum stay violations', () => {
    const rate = demoHotelRate(); const supplier = demoSupplier();
    expect(() => snapshotFinancials(makeSnapshot(supplier, rate, { ...demoSelection(), occupancy: 'single' }))).toThrow('occupancy');
    expect(() => snapshotFinancials(makeSnapshot(supplier, rate, { ...demoSelection(), childrenWithBed: 1 }))).toThrow('guest');
    rate.input.hotel!.minimumStay = 4; expect(() => snapshotFinancials(makeSnapshot(supplier, rate, demoSelection()))).toThrow('minimum');
  });
  it.each(['TRANSPORT_PER_KM', 'TRANSPORT_PER_DAY', 'TRANSPORT_FIXED_ROUTE'] as const)('transport %s is supplier-only with allowances and explicit policies', category => {
    const r = demoTransportRate(); r.input = { ...emptyRate(r.input.supplierId, category), destination: 'auli', validFrom: '2026-01-01', validTo: '2099-12-31' };
    Object.assign(r.input.transport!, { vehicleType: 'DEMO Sedan', ratePerKm: 10, ratePerDay: 2000, fixedRouteAmount: 4000, minimumKmPerDay: 100, driverAllowance: 200, deadKmPolicy: 'SEPARATE_RATE', deadKmRate: 5 });
    const s = { ...demoSelection(), category: 'transportCosts' as const, quantity: category === 'TRANSPORT_PER_KM' ? 50 : category === 'TRANSPORT_PER_DAY' ? 2 : 1, days: 2, deadKm: 10 };
    const fields = snapshotFinancials(makeSnapshot(demoSupplier(), r, s)); expect(fields.quantity).toBe(category === 'TRANSPORT_PER_KM' ? 200 : s.quantity); expect(fields.supplements).toContainEqual({ label: 'Dead km', quantity: 10, unitCost: 5 }); expect(fields.supplements).toContainEqual({ label: 'Driver allowance / day', quantity: 2, unitCost: 200 });
  });
  it('activity/local service rates are not default inclusions', () => {
    const r = demoHotelRate(); r.input = { ...emptyRate(r.input.supplierId, 'ACTIVITY'), destination: 'auli', validFrom: '2026-01-01', validTo: '2099-12-31' }; Object.assign(r.input.service!, { activityName: 'DEMO optional', costBasis: 'PER_PERSON', rate: 100 }); validateRate(r.input);
    const fields = snapshotFinancials(makeSnapshot(demoSupplier(), r, { ...demoSelection(), category: 'activityCosts' })); expect(fields.costBasis).toBe('PER_PERSON'); expect(emptyLine('activity', 'activityCosts').includedInPackage).toBe(false);
    expect(() => validateRate({ ...r.input, service: { ...r.input.service!, includedByDefault: true } })).toThrow();
  });
  it('suggestions match exact destination/category/date and never pick a cheapest winner', () => {
    const a = demoHotelRate(); const b = structuredClone(a); b.id = '00000000-0000-0000-0000-000000000099'; b.input.hotel!.doubleOccupancyRate = 1;
    expect(matchingRates([a, b], [demoSupplier()], { destination: 'AULI' })).toEqual([]);
    expect(matchingRates([a, b], [demoSupplier()], { destination: 'auli', category: 'hotelCosts', travelFrom: '2026-10-10', travelTo: '2026-10-13' }).map(r => r.id)).toEqual([a.id, b.id]);
  });
  it('manual costing stays compatible, quoted supplier snapshots block strict review, and financial edits are rejected', () => {
    const input = emptyCosting(SYNTHETIC_JOURNEY); const snapshot = makeSnapshot(demoSupplier(), demoHotelRate(), demoSelection());
    input.hotelCosts = [{ ...emptyLine('hotel', 'hotelCosts'), label: 'DEMO', ...snapshotFinancials(snapshot), supplierRateSnapshot: snapshot }];
    expect(calculateJourneyCosting(input).subtotal).toBe(6000); expect(calculateJourneyCosting(input).reviewBlockers.join(' ')).toContain('Supplier confirmation');
    input.hotelCosts[0].unitCost = 999; expect(() => calculateJourneyCosting(input)).toThrow('financial');
    input.hotelCosts[0].supplierRateSnapshot = null; expect(calculateJourneyCosting(input).subtotal).toBe(2997);
  });
  it('expired snapshots remain calculable history and block review, not deleted', () => {
    const rate = demoHotelRate(); rate.input.validFrom = '2020-01-01'; rate.input.validTo = '2020-12-31';
    const snapshot = makeSnapshot(demoSupplier(), rate, { ...demoSelection(), travelFrom: '2020-06-01', travelTo: '2020-06-04' }, '2020-06-01');
    expect(snapshotWarnings(snapshot, '2026-10-02')).toContain('Supplier snapshot expired');
  });
  it('prevents a matching hotel-included breakfast charge; separate stay dates and linked zero-cost meals remain valid', () => {
    const input = emptyCosting(SYNTHETIC_JOURNEY); const snapshot = makeSnapshot(demoSupplier(), demoHotelRate(), demoSelection());
    input.hotelCosts = [{ ...emptyLine('hotel', 'hotelCosts'), label: 'DEMO', ...snapshotFinancials(snapshot), supplierRateSnapshot: snapshot }];
    input.mealCosts = [{ ...emptyLine('breakfast', 'mealCosts'), label: 'Buffet', mealType: 'breakfast', unitCost: 100 }];
    expect(() => calculateJourneyCosting(input)).toThrow('already included');
    input.mealCosts[0].date = '2026-10-20'; expect(calculateJourneyCosting(input).categories.mealCosts).toBe(100);
    Object.assign(input.mealCosts[0], { date: '', costBasis: 'INCLUDED_IN_HOTEL', includedHotelId: 'hotel', unitCost: 0 }); expect(calculateJourneyCosting(input).categories.mealCosts).toBe(0);
  });
});
