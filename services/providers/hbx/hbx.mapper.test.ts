import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mapHbxAvailabilityToRates, mapHbxHotelContentToSummary } from './hbx.mapper';
import type { HbxAvailabilityHotel, HbxHotelContent } from './hbx.types';

describe('mapHbxHotelContentToSummary', () => {
  it('maps a well-formed row', () => {
    const raw: HbxHotelContent = { code: 142378, name: { content: 'Club Mahindra Snowpeaks Resorts' }, destinationCode: 'IN6', zoneCode: 1, categoryCode: '3EST', coordinates: { latitude: 32.21, longitude: 77.2 } };
    expect(mapHbxHotelContentToSummary(raw)).toEqual({
      hbxCode: 142378,
      name: 'Club Mahindra Snowpeaks Resorts',
      destinationCode: 'IN6',
      zoneCode: 1,
      categoryCode: '3EST',
      latitude: 32.21,
      longitude: 77.2
    });
  });

  it('falls back to a safe placeholder name instead of throwing on missing name data', () => {
    const raw = { code: 1, destinationCode: 'IN6' } as unknown as HbxHotelContent;
    expect(mapHbxHotelContentToSummary(raw).name).toBe('Unnamed property');
  });

  it('reads coordinates from the real HBX nested `coordinates` object, not flat fields — regression test for the 2026-09-24 Phase-3 mapping-validation bug', () => {
    const raw: HbxHotelContent = { code: 140802, name: { content: 'Woodville Palace' }, destinationCode: 'SLV', coordinates: { latitude: 31.08754, longitude: 77.17934 } };
    const summary = mapHbxHotelContentToSummary(raw);
    expect(summary.latitude).toBe(31.08754);
    expect(summary.longitude).toBe(77.17934);
  });

  it('leaves latitude/longitude undefined (not NaN or 0) when HBX omits `coordinates` entirely', () => {
    const raw: HbxHotelContent = { code: 1, name: { content: 'No Coords Hotel' }, destinationCode: 'SLV' };
    const summary = mapHbxHotelContentToSummary(raw);
    expect(summary.latitude).toBeUndefined();
    expect(summary.longitude).toBeUndefined();
  });
});

describe('mapHbxAvailabilityToRates', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });

  afterEach(() => {
    delete process.env.HOTELBEDS_API_BASE_URL;
  });

  const baseHotel: HbxAvailabilityHotel = {
    code: 142378,
    currency: 'EUR',
    rooms: [
      {
        code: 'DBL.SU',
        name: 'double superior',
        rates: [
          { net: '188.54', boardName: 'BED AND BREAKFAST', rateType: 'BOOKABLE', rooms: 1, cancellationPolicies: [{ amount: '188.54', from: '2099-01-01T23:59:00+05:30' }] }
        ]
      }
    ]
  };

  it('flattens rooms/rates into normalized rates, tagged with the current HBX environment', () => {
    const rates = mapHbxAvailabilityToRates(baseHotel, 2);
    expect(rates).toHaveLength(1);
    expect(rates[0]).toMatchObject({
      provider: 'hbx',
      providerHotelId: '142378',
      currency: 'EUR',
      totalStayPrice: 188.54,
      nightCount: 2,
      displayPerNight: 94.27,
      environment: 'test',
      refundable: true,
      roomsRemaining: 1
    });
  });

  it('infers non-refundable once the cancellation cutoff has passed', () => {
    const hotel: HbxAvailabilityHotel = {
      ...baseHotel,
      rooms: [{ ...baseHotel.rooms[0], rates: [{ ...baseHotel.rooms[0].rates[0], cancellationPolicies: [{ amount: '188.54', from: '2020-01-01T00:00:00+05:30' }] }] }]
    };
    expect(mapHbxAvailabilityToRates(hotel, 2)[0].refundable).toBe(false);
  });

  it('leaves refundable undefined when no cancellation policy is present, never guessing', () => {
    const hotel: HbxAvailabilityHotel = {
      ...baseHotel,
      rooms: [{ ...baseHotel.rooms[0], rates: [{ net: '100', rateType: 'BOOKABLE' }] }]
    };
    expect(mapHbxAvailabilityToRates(hotel, 2)[0].refundable).toBeUndefined();
  });

  it('skips a malformed rate (non-numeric net) instead of throwing', () => {
    const hotel: HbxAvailabilityHotel = {
      ...baseHotel,
      rooms: [{ ...baseHotel.rooms[0], rates: [{ net: 'not-a-number' }, baseHotel.rooms[0].rates[0]] }]
    };
    expect(() => mapHbxAvailabilityToRates(hotel, 2)).not.toThrow();
    expect(mapHbxAvailabilityToRates(hotel, 2)).toHaveLength(1);
  });

  it('handles a hotel with no rooms at all', () => {
    const hotel: HbxAvailabilityHotel = { code: 1, currency: 'EUR', rooms: [] };
    expect(mapHbxAvailabilityToRates(hotel, 2)).toEqual([]);
  });
});
