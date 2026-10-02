import { describe, expect, it } from 'vitest';
import { supplierCoverage, quoteRequest } from './supplierCoverage.service';
import { demoSupplier, demoHotelRate, demoTransportRate } from './supplierLibrary.fixture';
import { SYNTHETIC_JOURNEY } from './journeyCosting.fixture';
describe('route coverage and text-only quote helper', () => {
  const journey = { ...SYNTHETIC_JOURNEY, destinationSlugs: ['auli'], itinerary: [{ day: 1, title: 'Demo A to Demo B', description: 'Optional local vehicle and guide; permit quote pending' }] };
  it('derives missing counts from drafts without inventing suppliers or overnight stays', () => {
    const result = supplierCoverage([journey, { ...journey, journeyId: 'published', status: 'published' }], [], []);
    expect(result.summary).toEqual({ draftJourneys: 1, hotel: 0, transport: 0, fullyCostable: 0, awaitingQuote: 1, expired: 0 });
    expect(result.rows[0].possibleLocalServices).toContain('permit'); expect(result.rows[0].caveat).toContain('not confirmed overnight');
  });
  it('partial legs do not count as whole circuit; rates alone never mean fully costable', () => {
    const hotel = demoHotelRate(); const transport = demoTransportRate();
    const supplier = demoSupplier(); supplier.input.name = 'Test-only real-classification coverage fixture'; supplier.input.dataClassification = 'REAL';
    expect(supplierCoverage([journey], [supplier], [hotel, transport]).summary).toMatchObject({ hotel: 1, transport: 0, fullyCostable: 0 });
    transport.input.transport!.journeySlugs = [journey.journeySlug]; expect(supplierCoverage([journey], [supplier], [hotel, transport]).summary.transport).toBe(1);
    hotel.input.validTo = '2020-01-01'; expect(supplierCoverage([journey], [supplier], [hotel]).summary).toMatchObject({ hotel: 0, expired: 1 });
  });
  it('demo library rates never inflate real draft coverage counts', () => {
    expect(supplierCoverage([journey], [demoSupplier()], [demoHotelRate(), demoTransportRate()]).summary).toMatchObject({ hotel: 0, transport: 0, fullyCostable: 0 });
  });
  it('generates requested hotel and transport questions with unknown km, no contacts and no sending', () => {
    const input = { kind: 'HOTEL' as const, destination: 'Demo', travelFrom: '', travelTo: '', season: '', rooms: 1, adults: 2, children: 0, nights: 0, mealPlan: 'Room plus breakfast', vehicle: 'DEMO Sedan', approximateKm: null };
    const hotel = quoteRequest(journey, input); expect(hotel).toContain('tax inclusion'); expect(hotel).toContain('do not use total tour nights blindly');
    const transport = quoteRequest(journey, { ...input, kind: 'TRANSPORT' }); expect(transport).toContain('Unknown; supplier to quote'); expect(transport).toContain('dead km'); expect(transport).not.toContain('phone');
  });
});
