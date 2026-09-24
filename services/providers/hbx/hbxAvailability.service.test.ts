import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hbxPricingProvider } from './hbxAvailability.service';

const ORIGINAL_ENV = { ...process.env };

describe('hbxAvailability.service', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('returns UNAVAILABLE (not an error) when HBX is not configured', async () => {
    delete process.env.HOTELBEDS_API_KEY;
    const result = await hbxPricingProvider.getAvailability({
      destinationSlug: 'manali',
      checkIn: '2026-10-10',
      checkOut: '2026-10-12',
      adults: 2,
      children: 0,
      rooms: 1
    });
    expect(result).toMatchObject({ state: 'UNAVAILABLE', rates: [] });
  });

  it('returns UNAVAILABLE for a destination with no verified HBX mapping — never guesses a code', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await hbxPricingProvider.getAvailability({
      destinationSlug: 'kinnaur',
      checkIn: '2026-10-10',
      checkOut: '2026-10-12',
      adults: 2,
      children: 0,
      rooms: 1
    });

    expect(result).toEqual({ state: 'UNAVAILABLE', rates: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('degrades to PROVIDER_ERROR (never throws) on an HBX 5xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Internal error', { status: 500 }))
    );

    const result = await hbxPricingProvider.getAvailability({
      destinationSlug: 'manali',
      checkIn: '2026-10-10',
      checkOut: '2026-10-12',
      adults: 2,
      children: 0,
      rooms: 1,
      providerHotelIds: ['142378']
    });

    expect(result.state).toBe('PROVIDER_ERROR');
    expect(result.rates).toEqual([]);
    expect(result.error).toBeDefined();
  });

  it('returns VERIFIED_LIVE_RATE with normalized rates when HBX returns bookable availability', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            hotels: {
              hotels: [
                {
                  code: 142378,
                  currency: 'EUR',
                  rooms: [{ code: 'DBL.SU', name: 'double superior', rates: [{ net: '188.54', boardName: 'BB', rateType: 'BOOKABLE', rooms: 1 }] }]
                }
              ]
            }
          }),
          { status: 200 }
        )
      )
    );

    const result = await hbxPricingProvider.getAvailability({
      destinationSlug: 'manali',
      checkIn: '2026-10-10',
      checkOut: '2026-10-12',
      adults: 2,
      children: 0,
      rooms: 1,
      providerHotelIds: ['142378']
    });

    expect(result.state).toBe('VERIFIED_LIVE_RATE');
    expect(result.rates).toHaveLength(1);
    expect(result.rates[0].environment).toBe('test');
  });

  it('returns UNAVAILABLE when HBX responds 200 with no hotels available for the dates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hotels: { hotels: [] } }), { status: 200 })));

    const result = await hbxPricingProvider.getAvailability({
      destinationSlug: 'manali',
      checkIn: '2026-10-10',
      checkOut: '2026-10-12',
      adults: 2,
      children: 0,
      rooms: 1,
      providerHotelIds: ['142378']
    });

    expect(result.state).toBe('UNAVAILABLE');
  });
});
