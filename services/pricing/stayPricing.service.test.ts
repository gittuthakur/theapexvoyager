import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRawPricingResult, resolvePublicPriceState } from './stayPricing.service';

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

const QUERY = {
  destinationSlug: 'manali',
  checkIn: '2026-10-10',
  checkOut: '2026-10-12',
  adults: 2,
  children: 0,
  rooms: 1,
  providerHotelIds: ['142378']
};

describe('stayPricing.service', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('THE SAFETY GATE: never surfaces a live rate to a public caller while only evaluation (test) credentials are configured', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
    // A fresh Response per call — this test deliberately calls the pricing layer twice
    // (once raw, once through the public gate), and a Response body can only be read once.
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(AVAILABILITY_RESPONSE, { status: 200 })));

    const raw = await getRawPricingResult(QUERY);
    expect(raw.state).toBe('VERIFIED_LIVE_RATE'); // the provider itself did find a rate...

    const publicState = await resolvePublicPriceState(QUERY);
    expect(publicState.state).toBe('PRICE_ON_REQUEST'); // ...but the public gate downgrades it.
  });

  it('allows VERIFIED_LIVE_RATE through once every returned rate is production-environment', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.hotelbeds.com';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(AVAILABILITY_RESPONSE, { status: 200 })));

    const publicState = await resolvePublicPriceState(QUERY);
    expect(publicState.state).toBe('VERIFIED_LIVE_RATE');
  });

  it('passes PROVIDER_ERROR through unchanged — a supplier outage is never disguised as PRICE_ON_REQUEST', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));

    const publicState = await resolvePublicPriceState(QUERY);
    expect(publicState.state).toBe('PROVIDER_ERROR');
  });

  it('returns UNAVAILABLE for an unknown provider id', async () => {
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
    const result = await getRawPricingResult(QUERY, 'tripjack');
    expect(result).toEqual({ state: 'UNAVAILABLE', rates: [] });
  });
});
