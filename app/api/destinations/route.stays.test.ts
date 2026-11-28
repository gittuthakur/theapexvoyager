import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStaysForDestinationMock, googleMock } = vi.hoisted(() => ({ getStaysForDestinationMock: vi.fn(), googleMock: vi.fn() }));

vi.mock('@/lib/stays', () => ({ getStaysForDestination: getStaysForDestinationMock, slugify: (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
vi.mock('@/lib/destinations', () => ({
  getDestinationsForLocation: googleMock,
  getDestinationsWithFallback: googleMock,
  getCuratedDestinations: googleMock,
  DEFAULT_HIMACHAL_LOCATIONS: []
}));
vi.mock('@/lib/rateLimit', () => ({ isRateLimited: () => false }));

const { GET } = await import('./route');
const call = (qs: string) => GET(new Request(`https://test.invalid/api/destinations?type=stays&${qs}`, { headers: { 'x-forwarded-for': 'fixture' } }));

beforeEach(() => {
  getStaysForDestinationMock.mockReset();
  googleMock.mockReset();
});

describe('GET /api/destinations?type=stays — exclusion safety', () => {
  it('returns 503 and no stays, uncached, when the exclusion list could not be read', async () => {
    getStaysForDestinationMock.mockResolvedValue({ stays: [], meta: [], unavailable: true });

    const response = await call('location=Manali&destinationSlug=manali');

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'STAYS_TEMPORARILY_UNAVAILABLE' });
  });

  it('never caches a successful stays response publicly, so a new exclusion applies on the next request', async () => {
    getStaysForDestinationMock.mockResolvedValue({ stays: [{ placeId: 'a' }], meta: [] });

    const response = await call('location=Manali&destinationSlug=manali');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect((await response.json()).stays).toHaveLength(1);
  });

  it('display-time mode: the JSON carries no stored photo names but keeps rating, count and Maps link', async () => {
    const stored = ['/api/places/photo?name=places%2FChIJa%2Fphotos%2Fp0&w=1200'];
    getStaysForDestinationMock.mockResolvedValue({
      stays: [{ placeId: 'a', name: 'A', photos: stored, cardPhotoMode: 'display-time', rating: 4.6, userRatingCount: 120, googleMapsUri: 'https://maps.google.com/?cid=1' }],
      meta: []
    });

    const body = await (await call('location=Manali&destinationSlug=manali')).json();

    expect(body.stays[0].photos).toEqual([]);
    expect(JSON.stringify(body)).not.toMatch(/photo\?name|photos%2F/);
    expect(body.stays[0]).toMatchObject({ rating: 4.6, userRatingCount: 120, googleMapsUri: 'https://maps.google.com/?cid=1', cardPhotoMode: 'display-time' });
  });

  it('legacy mode: the JSON is exactly what the library returned (photos untouched)', async () => {
    const stored = ['/api/places/photo?name=places%2FChIJa%2Fphotos%2Fp0&w=1200', '/api/places/photo?name=places%2FChIJa%2Fphotos%2Fp1&w=1200'];
    getStaysForDestinationMock.mockResolvedValue({ stays: [{ placeId: 'a', photos: stored }], meta: [] });

    expect((await (await call('location=Manali&destinationSlug=manali')).json()).stays[0].photos).toEqual(stored);
  });

  it('serves stays from the cache read only (no other destination or provider helper is called)', async () => {
    getStaysForDestinationMock.mockResolvedValue({ stays: [], meta: [] });
    await call('location=Kaza&destinationSlug=spiti-valley');
    expect(googleMock).not.toHaveBeenCalled();
  });
});
