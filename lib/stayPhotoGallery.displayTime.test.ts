import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFreshPhotoFetcher, type EligiblePlaceId } from './googlePhotoFetch';
import { photoDisplayKey } from './photoDisplayKey';
import { resolveStayGallery, type StayGalleryDeps } from './stayPhotoGallery';

// The REAL fetcher with an injected fake `fetch`: nothing here can reach Google or a database.
const KEY = 'test-key-not-real-1234567890';
const PLACE = 'ChIJabc123_-XYZ' as EligiblePlaceId;
const AUTHOR = { displayName: 'Asha Verma', uri: 'https://www.google.com/maps/contrib/1' };
const mapsUri = (token: string) => `https://www.google.com/maps/place/@1,1,3a/photos/${token}`;
const photo = (token: string, extra: Record<string, unknown> = {}) => ({
  name: `places/${PLACE}/photos/NAME-${token}`,
  authorAttributions: [AUTHOR],
  googleMapsUri: mapsUri(token),
  flagContentUri: `https://www.google.com/local/imagery/report/?image_key=${token}`,
  ...extra
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function setup(env: Record<string, string | undefined>, respond: () => Promise<Response> = async () => json({ photos: [photo('a'), photo('b')] })) {
  const fetchImpl = vi.fn(respond);
  const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false });
  const fetchPhotos = vi.fn(fetcher);
  const deps: StayGalleryDeps = { env, getClientKey: async () => '203.0.113.7', fetchPhotos };
  return { fetchImpl, fetchPhotos, deps };
}

const DISPLAY = { GOOGLE_PHOTO_DISPLAY_MODE: 'display-time', GOOGLE_PLACES_API_KEY: KEY };

afterEach(() => vi.restoreAllMocks());

describe('display-time detail gallery (no GOOGLE_PHOTO_METADATA_MODE needed)', () => {
  it('builds credited photos whose image URLs are by-place URLs: place ID, position and a one-way key, never a photo name', async () => {
    const { deps, fetchImpl } = setup(DISPLAY);
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.kind).toBe('credited');
    if (result.kind !== 'credited') return;
    expect(result.photos.map((p) => p.src)).toEqual([
      `/api/places/photo/by-place?placeId=${PLACE}&i=0&w=1200&k=${photoDisplayKey(mapsUri('a'))}`,
      `/api/places/photo/by-place?placeId=${PLACE}&i=1&w=1200&k=${photoDisplayKey(mapsUri('b'))}`
    ]);
    const everything = JSON.stringify(result);
    for (const forbidden of ['NAME-a', 'NAME-b', '/photos/NAME', 'api/places/photo?name', 'places%2F']) expect(everything).not.toContain(forbidden);
    expect(everything).not.toContain(KEY);
  });

  it('keeps the genuine credit, the photo-specific Maps link and the report link for every photo', async () => {
    const { deps } = setup(DISPLAY);
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
    if (result.kind !== 'credited') throw new Error('expected credited');
    expect(result.photos[0]).toMatchObject({ authors: [expect.objectContaining({ displayName: 'Asha Verma', uri: AUTHOR.uri })], googleMapsUri: mapsUri('a'), flagContentUri: expect.stringContaining('image_key=a') });
  });

  it('is independent of GOOGLE_PHOTO_METADATA_MODE: unset, legacy and fresh give the same result', async () => {
    for (const metadata of [undefined, 'legacy', 'fresh']) {
      const { deps } = setup({ ...DISPLAY, GOOGLE_PHOTO_METADATA_MODE: metadata });
      const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
      expect(result.kind).toBe('credited');
    }
  });

  it('GOOGLE_PHOTO_METADATA_MODE=disabled remains the kill switch: unavailable and no Google call', async () => {
    const { deps, fetchImpl } = setup({ ...DISPLAY, GOOGLE_PHOTO_METADATA_MODE: 'disabled' });
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('a hidden photo leaves the others at their TRUE positions, so each URL still points at its own photo', async () => {
    const { deps } = setup(DISPLAY, async () => json({ photos: [photo('a'), photo('b', { googleMapsUri: undefined }), photo('c')] }));
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
    if (result.kind !== 'credited') throw new Error('expected credited');
    expect(result.photos.map((p) => new URL(p.src, 'http://x').searchParams.get('i'))).toEqual(['0', '2']);
    expect(result.photos.map((p) => p.googleMapsUri)).toEqual([mapsUri('a'), mapsUri('c')]);
  });

  it('shows at most positions 0-9, the only ones the route can serve', async () => {
    const many = Array.from({ length: 12 }, (_, i) => photo(`p${i}`));
    const { deps } = setup(DISPLAY, async () => json({ photos: many }));
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
    if (result.kind !== 'credited') throw new Error('expected credited');
    const positions = result.photos.map((p) => Number(new URL(p.src, 'http://x').searchParams.get('i')));
    expect(Math.max(...positions)).toBeLessThanOrEqual(9);
  });

  it('a null EligiblePlaceId (not found, excluded, unavailable) makes zero Google requests', async () => {
    const { deps, fetchImpl } = setup(DISPLAY);
    expect(await resolveStayGallery({ eligiblePlaceId: null }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('a place outside the pilot allowlist gets the placeholder, never stored photos, and no Google request', async () => {
    const { deps, fetchImpl } = setup({ ...DISPLAY, GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: 'ChIJother' });
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'placeholder' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('a pilot place that is listed is fetched', async () => {
    const { deps, fetchImpl } = setup({ ...DISPLAY, GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: `ChIJother,${PLACE}` });
    expect((await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).kind).toBe('credited');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([429, 500, 503, 403])('Google %s -> unavailable, no stored photo', async (status) => {
    const { deps } = setup(DISPLAY, async () => json({}, status));
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'unavailable' });
  });

  it('Google has no photos, or none with a complete credit -> placeholder', async () => {
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(DISPLAY, async () => json({ photos: [] })).deps)).toEqual({ kind: 'placeholder' });
    const incomplete = photo('a', { authorAttributions: 'garbage' });
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(DISPLAY, async () => json({ photos: [incomplete] })).deps)).toEqual({ kind: 'placeholder' });
  });

  it('exactly one Google request per page view, nothing cached, nothing logged', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { deps, fetchImpl } = setup(DISPLAY);
    await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
    await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect([...info.mock.calls, ...log.mock.calls, ...error.mock.calls]).toEqual([]);
  });

  it('without display-time mode the existing legacy and fresh behaviour is untouched (names via the old proxy only in fresh)', async () => {
    const legacy = setup({ GOOGLE_PLACES_API_KEY: KEY });
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, legacy.deps)).toEqual({ kind: 'legacy' });
    expect(legacy.fetchImpl).not.toHaveBeenCalled();
    const fresh = setup({ GOOGLE_PHOTO_METADATA_MODE: 'fresh', GOOGLE_PLACES_API_KEY: KEY });
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, fresh.deps);
    if (result.kind !== 'credited') throw new Error('expected credited');
    expect(result.photos[0].src).toContain('/api/places/photo?name=');
  });
});
