import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fix A: the no-type /api/destinations branch (the Google-backed destination lookup). The destinations library is
// mocked — these tests prove the route's own validation, rate limiting, caching headers and failure handling, and that
// an invalid or abusive request never reaches a Google-capable function. The real rate limiter is used on purpose.
const m = vi.hoisted(() => ({ forLocation: vi.fn(), withFallback: vi.fn(), curated: vi.fn(), staysForDestination: vi.fn() }));

vi.mock('@/lib/destinations', () => ({
  getDestinationsForLocationResult: m.forLocation,
  getDestinationsWithFallbackResult: m.withFallback,
  getCuratedDestinations: m.curated,
  DEFAULT_HIMACHAL_LOCATIONS: ['Manali']
}));
vi.mock('@/lib/stays', () => ({ getStaysForDestination: m.staysForDestination, slugify: (s: string) => s.toLowerCase() }));

const { GET } = await import('./route');

let ipCounter = 0;
const call = (qs: string, ip = `10.0.0.${(ipCounter += 1)}`) => GET(new Request(`https://test.invalid/api/destinations${qs}`, { headers: { 'x-forwarded-for': ip } }));

beforeEach(() => {
  vi.resetAllMocks();
  m.forLocation.mockResolvedValue({ destinations: [{ slug: 'a', placeId: 'p-ok' }] });
  m.withFallback.mockResolvedValue({ destinations: [{ slug: 'a', placeId: 'p-ok' }] });
  m.curated.mockResolvedValue([{ slug: 'manali', isPopular: true, priority: 1 }]);
});

describe('GET /api/destinations?location= — input validation', () => {
  it.each([
    ['markup', '?location=%3Cscript%3Ealert(1)%3C%2Fscript%3E'],
    ['query-injection characters', '?location=Manali%3B%20DROP'],
    ['over 100 characters', `?location=${'a'.repeat(101)}`],
    ['control characters', '?location=Man%00ali'],
    ['an emoji-only value', '?location=%F0%9F%98%80']
  ])('rejects %s with 400 and never reaches a lookup', async (_label, qs) => {
    const response = await call(qs);

    expect(response.status).toBe(400);
    expect(m.forLocation).not.toHaveBeenCalled();
    expect(m.withFallback).not.toHaveBeenCalled();
  });

  it('also validates when a non-stays `type` is supplied (that combination reaches the same branch)', async () => {
    const response = await call('?type=other&location=%3Cb%3E');

    expect(response.status).toBe(400);
    expect(m.forLocation).not.toHaveBeenCalled();
  });

  it('accepts real place names, including accents and punctuation', async () => {
    for (const name of ['Manali', 'Mcleod Ganj', 'Sangla-Chitkul', 'Jammu & Kashmir', 'Kasol']) {
      const response = await call(`?location=${encodeURIComponent(name)}`);
      expect(response.status, name).toBe(200);
    }
    expect(m.forLocation).toHaveBeenCalledTimes(5);
  });

  it('an empty `location` still falls back to the default-locations list, as before', async () => {
    const response = await call('?location=');

    expect(response.status).toBe(200);
    expect(m.withFallback).toHaveBeenCalledTimes(1);
    expect(m.forLocation).not.toHaveBeenCalled();
  });
});

describe('GET /api/destinations?location= — rate limiting', () => {
  it('limits one source to 30 lookups a minute and returns 429 with Retry-After, without calling the lookup again', async () => {
    const ip = '203.0.113.77';
    for (let index = 0; index < 30; index += 1) {
      expect((await call('?location=Manali', ip)).status).toBe(200);
    }
    const limited = await call('?location=Manali', ip);

    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
    expect(limited.headers.get('cache-control')).toBe('no-store');
    expect(m.forLocation).toHaveBeenCalledTimes(30);
  });

  it('rotating a spoofed x-forwarded-for does not evade the limit while the platform address is fixed', async () => {
    const platformIp = '198.51.100.55';
    const callSpoofed = (spoof: string) =>
      GET(new Request('https://test.invalid/api/destinations?location=Manali', { headers: { 'x-vercel-forwarded-for': platformIp, 'x-forwarded-for': spoof } }));
    for (let index = 0; index < 30; index += 1) {
      expect((await callSpoofed(`6.6.${index}.1`)).status).toBe(200);
    }

    expect((await callSpoofed('7.7.7.7')).status).toBe(429);
    expect(m.forLocation).toHaveBeenCalledTimes(30);
  });

  it('prepending spoofed entries to x-forwarded-for does not create a fresh bucket when there is no platform header', async () => {
    const callSpoofed = (spoof: string) =>
      GET(new Request('https://test.invalid/api/destinations?location=Manali', { headers: { 'x-forwarded-for': `${spoof}, 192.0.2.44` } }));
    for (let index = 0; index < 30; index += 1) {
      expect((await callSpoofed(`8.8.${index}.1`)).status).toBe(200);
    }

    expect((await callSpoofed('9.9.9.9')).status).toBe(429);
  });

  it('requests with no usable address header all share the "unknown" bucket rather than escaping the limit', async () => {
    const callBare = () => GET(new Request('https://test.invalid/api/destinations?location=Manali'));
    const statuses: number[] = [];
    for (let index = 0; index < 32; index += 1) statuses.push((await callBare()).status);

    expect(statuses.slice(0, 30).every((status) => status === 200)).toBe(true);
    expect(statuses.slice(30)).toEqual([429, 429]);
  });

  it('a different source is not affected by another source being limited', async () => {
    expect((await call('?location=Manali', '203.0.113.200')).status).toBe(200);
  });
});

describe('GET /api/destinations?location= — caching and exclusion safety', () => {
  it('never caches a Google-sourced destination response publicly', async () => {
    const response = await call('?location=Manali');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect((await response.json()).destinations).toHaveLength(1);
  });

  it('the default-locations response is not publicly cached either', async () => {
    const response = await call('');

    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('returns 503, uncached and with no destinations, when the exclusion list could not be read', async () => {
    m.forLocation.mockResolvedValue({ destinations: [], unavailable: true });

    const response = await call('?location=Manali');

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'DESTINATIONS_TEMPORARILY_UNAVAILABLE' });
  });

  it('the same 503 applies to the default-locations list', async () => {
    m.withFallback.mockResolvedValue({ destinations: [], unavailable: true });

    const response = await call('');

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});

describe('unchanged siblings', () => {
  it('the curated browse branch keeps its public cache header and makes no Google-capable call', async () => {
    const response = await call('?isPopular=true');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(m.forLocation).not.toHaveBeenCalled();
    expect(m.withFallback).not.toHaveBeenCalled();
  });

  it('the stays branch is untouched: still private, no-store, and still calls only the cache-backed stays reader', async () => {
    m.staysForDestination.mockResolvedValue({ stays: [{ placeId: 'a' }], meta: [] });

    const response = await call('?type=stays&location=Manali&destinationSlug=manali');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(m.forLocation).not.toHaveBeenCalled();
    expect(m.withFallback).not.toHaveBeenCalled();
  });
});
