import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFreshPhotoFetcher, eligiblePlaceIdFrom, type EligiblePlaceId } from './googlePhotoFetch';
import { resolveStayGallery, type StayGalleryDeps } from './stayPhotoGallery';

// The REAL D1-3a fetcher is used, with an injected fake `fetch`. Nothing here can reach Google or a database.
const KEY = 'test-key-not-real-1234567890';
const PLACE = 'ChIJabc123_-XYZ' as EligiblePlaceId;
const AUTHOR = { displayName: 'Asha Verma', uri: 'https://www.google.com/maps/contrib/1', photoUri: 'https://lh3.googleusercontent.com/a' };
const photo = (token: string, extra: Record<string, unknown> = {}) => ({
  name: `places/${PLACE}/photos/${token}`,
  widthPx: 4000,
  heightPx: 3000,
  authorAttributions: [AUTHOR],
  googleMapsUri: `https://www.google.com/maps/place/@1,1,3a/photos/${token}`,
  flagContentUri: `https://www.google.com/local/imagery/report/?image_key=${token}`,
  ...extra
});
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function setup(env: Record<string, string | undefined>, respond: () => Promise<Response> = async () => jsonResponse({ photos: [photo('a')] })) {
  const fetchImpl = vi.fn(respond);
  const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false });
  const fetchPhotosSpy = vi.fn(fetcher);
  const getClientKey = vi.fn(async () => '203.0.113.7');
  const deps: StayGalleryDeps = { env, getClientKey, fetchPhotos: fetchPhotosSpy };
  return { fetchImpl, fetchPhotosSpy, getClientKey, deps };
}

const FRESH = { GOOGLE_PHOTO_METADATA_MODE: 'fresh', GOOGLE_PLACES_API_KEY: KEY };

afterEach(() => vi.restoreAllMocks());

describe('legacy mode (the default)', () => {
  it.each([[{}], [{ GOOGLE_PHOTO_METADATA_MODE: undefined }], [{ GOOGLE_PHOTO_METADATA_MODE: 'legacy' }], [{ GOOGLE_PHOTO_METADATA_MODE: 'typo' }], [{ GOOGLE_PHOTO_METADATA_MODE: '' }]])(
    'env %j resolves to legacy and makes no fetch, no key read and no header read',
    async (env) => {
      const { deps, fetchImpl, fetchPhotosSpy, getClientKey } = setup({ ...env, GOOGLE_PLACES_API_KEY: KEY });
      expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'legacy' });
      expect(fetchImpl).not.toHaveBeenCalled();
      expect(fetchPhotosSpy).not.toHaveBeenCalled();
      expect(getClientKey).not.toHaveBeenCalled();
    }
  );

  it('legacy ignores eligibility entirely (it never touches Google, so there is nothing to protect)', async () => {
    const { deps, fetchImpl } = setup({});
    expect(await resolveStayGallery({ eligiblePlaceId: null }, deps)).toEqual({ kind: 'legacy' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('disabled mode', () => {
  it('shows the unavailable state and makes no Google call', async () => {
    const { deps, fetchImpl, fetchPhotosSpy, getClientKey } = setup({ GOOGLE_PHOTO_METADATA_MODE: 'disabled', GOOGLE_PLACES_API_KEY: KEY });
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(fetchPhotosSpy).not.toHaveBeenCalled();
    expect(getClientKey).not.toHaveBeenCalled();
  });
});

describe('fresh mode: only an eligible, verified place ever reaches Google', () => {
  it('a null EligiblePlaceId (not found, excluded, unavailable, not Google-sourced) makes zero Google requests', async () => {
    const { deps, fetchImpl, fetchPhotosSpy } = setup(FRESH);
    expect(await resolveStayGallery({ eligiblePlaceId: null }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(fetchPhotosSpy).not.toHaveBeenCalled();
  });

  it('every non-found lookup yields no EligiblePlaceId and therefore no request', async () => {
    const { deps, fetchImpl } = setup(FRESH);
    for (const lookup of [{ status: 'not-found' }, { status: 'unavailable' }, { status: 'found', stay: { placeId: PLACE, source: 'curated' } }, { status: 'found', stay: { placeId: 'bad id/with?chars', source: 'google' } }]) {
      await resolveStayGallery({ eligiblePlaceId: eligiblePlaceIdFrom(lookup) }, deps);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('an invalid Place ID that somehow carries the brand is still rejected by the fetcher and never reaches Google', async () => {
    const { deps, fetchImpl } = setup(FRESH);
    expect(await resolveStayGallery({ eligiblePlaceId: 'ChIJ/../evil?fields=*' as EligiblePlaceId }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('an eligible place makes exactly one Google request, for photos only, with the trusted client key', async () => {
    const { deps, fetchImpl, fetchPhotosSpy, getClientKey } = setup(FRESH);
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);

    expect(result.kind).toBe('credited');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(getClientKey).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://places.googleapis.com/v1/places/${PLACE}`);
    expect((init.headers as Record<string, string>)['X-Goog-FieldMask']).toBe('photos');
    expect(fetchPhotosSpy).toHaveBeenCalledWith({ placeId: PLACE, apiKey: KEY, mode: 'fresh', clientKey: '203.0.113.7' });
  });

  it('an unreadable client address falls into the shared "unknown" bucket instead of failing or skipping the limit', async () => {
    const { deps, fetchPhotosSpy } = setup(FRESH);
    deps.getClientKey = async () => {
      throw new Error('no request context');
    };
    expect((await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).kind).toBe('credited');
    expect(fetchPhotosSpy).toHaveBeenCalledWith(expect.objectContaining({ clientKey: 'unknown' }));
  });
});

describe('fresh mode: failures show "Photos temporarily unavailable" (never an old stored photo)', () => {
  it('a Google timeout', async () => {
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_res, rej) => (init.signal as AbortSignal).addEventListener('abort', () => rej((init.signal as AbortSignal).reason))));
    const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false, timeoutMs: 20 });
    const deps: StayGalleryDeps = { env: FRESH, getClientKey: async () => 'c', fetchPhotos: fetcher };
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([429, 500, 502, 503, 403, 400])('Google %s', async (status) => {
    const { deps, fetchImpl } = setup(FRESH, async () => jsonResponse({ error: { message: 'x' } }, status));
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('a Google 404 (an unknown or stale place ID) and a network failure', async () => {
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse({}, 404)).deps)).toEqual({ kind: 'unavailable' });
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, () => Promise.reject(new TypeError('fetch failed'))).deps)).toEqual({ kind: 'unavailable' });
  });

  it('a missing server key, a malformed body, and a fetcher that throws', async () => {
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup({ GOOGLE_PHOTO_METADATA_MODE: 'fresh' }).deps)).toEqual({ kind: 'unavailable' });
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => new Response('not json', { status: 200 })).deps)).toEqual({ kind: 'unavailable' });
    const throwing = setup(FRESH);
    throwing.deps.fetchPhotos = async () => {
      throw new Error(`boom ${KEY}`);
    };
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, throwing.deps)).toEqual({ kind: 'unavailable' });
  });

  it('our own per-client limit and a saturated instance also show the unavailable state', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ photos: [photo('a')] }));
    const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false, perClientPerMinute: 1 });
    const deps: StayGalleryDeps = { env: FRESH, getClientKey: async () => 'same-client', fetchPhotos: fetcher };
    expect((await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).kind).toBe('credited');
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, deps)).toEqual({ kind: 'unavailable' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('fresh mode: no eligible photos shows the placeholder', () => {
  it.each([
    ['an empty object', {}],
    ['an empty photos list', { photos: [] }]
  ])('Google returns no photos (%s)', async (_label, body) => {
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse(body)).deps)).toEqual({ kind: 'placeholder' });
  });

  it('every photo has an incomplete or unreadable author credit', async () => {
    const body = { photos: [photo('a', { authorAttributions: [{ uri: 'https://www.google.com/x' }] }), photo('b', { authorAttributions: 'Asha' }), photo('c', { authorAttributions: [{ displayName: 'Fine' }, {}] })] };
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse(body)).deps)).toEqual({ kind: 'placeholder' });
  });

  it('every photo lacks a valid photo-specific googleMapsUri', async () => {
    const body = { photos: [photo('a', { googleMapsUri: undefined }), photo('b', { googleMapsUri: 'javascript:alert(1)' }), photo('c', { googleMapsUri: 'http://insecure.example/x' }), photo('d', { googleMapsUri: '' })] };
    expect(await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse(body)).deps)).toEqual({ kind: 'placeholder' });
  });
});

describe('fresh mode: which photos are shown', () => {
  it('hides a photo with an incomplete credit and keeps the credited ones, in order', async () => {
    const body = { photos: [photo('good1'), photo('bad-credit', { authorAttributions: [{ displayName: '' }] }), photo('good2')] };
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse(body)).deps);
    expect(result.kind).toBe('credited');
    if (result.kind !== 'credited') return;
    expect(result.photos.map((p) => decodeURIComponent(p.src))).toEqual([`/api/places/photo?name=places/${PLACE}/photos/good1&w=1200`, `/api/places/photo?name=places/${PLACE}/photos/good2&w=1200`]);
  });

  it('hides a photo with no valid photo-specific Google Maps link and keeps the rest', async () => {
    const body = { photos: [photo('no-link', { googleMapsUri: undefined }), photo('bad-link', { googleMapsUri: 'javascript:void(0)' }), photo('ok')] };
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse(body)).deps);
    expect(result.kind === 'credited' && result.photos).toHaveLength(1);
    if (result.kind === 'credited') expect(result.photos[0].googleMapsUri).toContain('/photos/ok');
  });

  it('shows valid photos with their genuine author credits, links and the report link', async () => {
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH).deps);
    expect(result).toEqual({
      kind: 'credited',
      photos: [
        {
          src: `/api/places/photo?name=${encodeURIComponent(`places/${PLACE}/photos/a`)}&w=1200`,
          authors: [AUTHOR],
          googleMapsUri: `https://www.google.com/maps/place/@1,1,3a/photos/a`,
          flagContentUri: `https://www.google.com/local/imagery/report/?image_key=a`
        }
      ]
    });
  });

  it('keeps every one of several photographers, in order, with their own links', async () => {
    const authors = [{ displayName: 'One', uri: 'https://www.google.com/maps/contrib/1' }, { displayName: 'Two' }, { displayName: 'Three', photoUri: 'https://lh3.googleusercontent.com/t' }];
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse({ photos: [photo('a', { authorAttributions: authors })] })).deps);
    expect(result.kind === 'credited' && result.photos[0].authors).toEqual(authors);
  });

  it('a photo Google sent with NO author and nothing dropped is shown, with no author line (nothing is invented)', async () => {
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse({ photos: [photo('a', { authorAttributions: [] })] })).deps);
    expect(result.kind === 'credited' && result.photos[0].authors).toEqual([]);
  });

  it('omits the report link when Google did not send a safe one', async () => {
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse({ photos: [photo('a', { flagContentUri: 'http://insecure.example/report' })] })).deps);
    expect(result.kind === 'credited' && result.photos[0]).not.toHaveProperty('flagContentUri');
  });

  it('the image URLs are built from the FRESH photo names and go through the existing protected proxy (never a stored URL)', async () => {
    const result = await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse({ photos: [photo('fresh-token')] })).deps);
    if (result.kind !== 'credited') throw new Error('expected credited');
    expect(result.photos[0].src.startsWith('/api/places/photo?name=')).toBe(true);
    expect(result.photos[0].src).toContain(encodeURIComponent('fresh-token'));
    expect(result.photos[0].src).toMatch(/&w=1200$/);
  });
});

describe('privacy and scope', () => {
  it('the API key appears in no resolution, whatever the outcome', async () => {
    const outcomes = await Promise.all([
      resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH).deps),
      resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse({ error: { message: `bad ${KEY}` } }, 403)).deps),
      resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, () => Promise.reject(new Error(`leak ${KEY}`))).deps),
      resolveStayGallery({ eligiblePlaceId: PLACE }, setup({ GOOGLE_PHOTO_METADATA_MODE: 'disabled', GOOGLE_PLACES_API_KEY: KEY }).deps)
    ]);
    expect(JSON.stringify(outcomes)).not.toContain(KEY);
  });

  it('logs nothing: no place ID, photo name, photographer or key reaches the console', async () => {
    const sinks = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')].map((spy) => spy.mockImplementation(() => undefined));
    await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH).deps);
    await resolveStayGallery({ eligiblePlaceId: PLACE }, setup(FRESH, async () => jsonResponse({}, 500)).deps);
    expect(sinks.flatMap((sink) => sink.mock.calls)).toEqual([]);
  });

  it('nothing is cached: two views make two Google requests, and results do not share objects', async () => {
    const { deps, fetchImpl } = setup(FRESH);
    deps.getClientKey = vi.fn(async () => 'a-different-client-each-time-' + Math.random());
    const first = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
    const second = await resolveStayGallery({ eligiblePlaceId: PLACE }, deps);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});
