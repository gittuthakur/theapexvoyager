import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getConfirmedMappingMock } = vi.hoisted(() => ({ getConfirmedMappingMock: vi.fn() }));
vi.mock('./hotelMappingRegistry.service', () => ({ getConfirmedMapping: getConfirmedMappingMock }));

const { getRawPricingResult, resolvePublicPriceState } = await import('./stayPricing.service');

const ORIGINAL_ENV = { ...process.env };

const AVAILABILITY_RESPONSE = JSON.stringify({
  hotels: {
    hotels: [
      {
        code: 142378,
        currency: 'EUR',
        rooms: [{ code: 'DBL.SU', name: 'double superior', rates: [{ net: '188.54', boardName: 'BB', rateType: 'BOOKABLE', rooms: 1 }] }]
      }
    ]
  }
});

const PUBLIC_QUERY = {
  googlePlaceId: 'ChIJ_real_google_place',
  destinationSlug: 'manali',
  checkIn: '2026-10-10',
  checkOut: '2026-10-12',
  adults: 2,
  children: 0,
  rooms: 1
};

const RAW_QUERY = { ...PUBLIC_QUERY, providerHotelIds: ['142378'] };

const CONFIRMED_MAPPING = { providerHotelId: '142378', status: 'CONFIRMED' as const };

describe('stayPricing.service', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    getConfirmedMappingMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('no mapping -> PRICE_ON_REQUEST, and never calls the provider at all', async () => {
    getConfirmedMappingMock.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const state = await resolvePublicPriceState(PUBLIC_QUERY);

    expect(state).toEqual({ state: 'PRICE_ON_REQUEST' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('THE SAFETY GATE: confirmed mapping + evaluation-environment rate -> PRICE_ON_REQUEST', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
    getConfirmedMappingMock.mockResolvedValue(CONFIRMED_MAPPING);
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(AVAILABILITY_RESPONSE, { status: 200 })));

    const raw = await getRawPricingResult(RAW_QUERY);
    expect(raw.state).toBe('VERIFIED_LIVE_RATE'); // the provider itself did find a rate...

    const publicState = await resolvePublicPriceState(PUBLIC_QUERY);
    expect(publicState.state).toBe('PRICE_ON_REQUEST'); // ...but the public gate downgrades it.
  });

  it('confirmed mapping + production-environment rate -> VERIFIED_LIVE_RATE', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.hotelbeds.com';
    getConfirmedMappingMock.mockResolvedValue(CONFIRMED_MAPPING);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(AVAILABILITY_RESPONSE, { status: 200 })));

    const publicState = await resolvePublicPriceState(PUBLIC_QUERY);
    expect(publicState.state).toBe('VERIFIED_LIVE_RATE');
  });

  it('confirmed mapping but a supplier outage -> PROVIDER_ERROR, never disguised as PRICE_ON_REQUEST', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
    getConfirmedMappingMock.mockResolvedValue(CONFIRMED_MAPPING);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));

    const publicState = await resolvePublicPriceState(PUBLIC_QUERY);
    expect(publicState.state).toBe('PROVIDER_ERROR');
  });

  it('confirmed mapping but no availability for the dates -> UNAVAILABLE', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
    getConfirmedMappingMock.mockResolvedValue(CONFIRMED_MAPPING);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hotels: { hotels: [] } }), { status: 200 })));

    const publicState = await resolvePublicPriceState(PUBLIC_QUERY);
    expect(publicState.state).toBe('UNAVAILABLE');
  });

  it('looks up the mapping keyed on the exact googlePlaceId + provider given', async () => {
    getConfirmedMappingMock.mockResolvedValue(null);
    await resolvePublicPriceState(PUBLIC_QUERY, 'hbx');
    expect(getConfirmedMappingMock).toHaveBeenCalledWith({ googlePlaceId: PUBLIC_QUERY.googlePlaceId, provider: 'hbx' });
  });

  it('returns UNAVAILABLE for an unknown provider id (getRawPricingResult, the diagnostic-only path)', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
    const result = await getRawPricingResult(RAW_QUERY, 'tripjack');
    expect(result).toEqual({ state: 'UNAVAILABLE', rates: [] });
  });
});
