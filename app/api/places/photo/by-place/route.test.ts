import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ isLocalDevelopment: vi.fn(() => false) }));
const lookup = vi.fn();
vi.mock('@/lib/stays', () => ({ getStayByPlaceIdResult: (...args: unknown[]) => lookup(...args) }));

const PLACE = 'ChIJabc123';
const PHOTO_NAME = 'places/ChIJabc123/photos/AVxyzSECRETTOKEN789';
const KEY = 'test-key-not-real-1234567890';
const ENV_KEYS = [
  'GOOGLE_PLACES_API_KEY',
  'GOOGLE_PHOTO_DISPLAY_MODE',
  'GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS',
  'GOOGLE_PHOTO_PROXY_MODE',
  'GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE'
] as const;
const saved: Record<string, string | undefined> = {};
let GET: (request: Request) => Promise<Response>;

const req = (query: string, headers: Record<string, string> = {}) => new Request(`http://localhost/api/places/photo/by-place?${query}`, { headers });
const q = (extra = '') => `placeId=${PLACE}&i=0&w=640${extra}`;

function detailsResponse(photos: unknown[] = [{ name: PHOTO_NAME, widthPx: 800, heightPx: 600, authorAttributions: [{ displayName: 'Jane Doe', uri: 'https://maps.google.com/contrib/1' }] }]) {
  return new Response(JSON.stringify({ photos }), { status: 200, headers: { 'content-type': 'application/json' } });
}
const imageResponse = () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } });

/** Details first, then media. */
function mockGoogle(details: Response = detailsResponse(), media: Response = imageResponse()) {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce(details).mockResolvedValueOnce(media);
}

async function load(env: Record<string, string> = {}) {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  process.env.GOOGLE_PLACES_API_KEY = KEY;
  process.env.GOOGLE_PHOTO_DISPLAY_MODE = 'display-time';
  delete process.env.GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS;
  delete process.env.GOOGLE_PHOTO_PROXY_MODE;
  delete process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE;
  Object.assign(process.env, env);
  vi.resetModules();
  ({ GET } = await import('./route'));
}

beforeEach(() => {
  lookup.mockReset();
  lookup.mockResolvedValue({ status: 'found', stay: { placeId: PLACE, source: 'google' } });
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('off by default', () => {
  it('answers 404 and touches neither the database nor Google while the mode is not display-time', async () => {
    await load({ GOOGLE_PHOTO_DISPLAY_MODE: 'legacy' });
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(q()));
    expect(res.status).toBe(404);
    expect(lookup).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('rejected before any Google call', () => {
  it.each([
    ['unsupported parameter', q('&x=1')],
    ['duplicate parameter', `${q()}&placeId=other`],
    ['missing place', 'i=0&w=640'],
    ['malformed place', 'placeId=bad%20id&i=0&w=640'],
    ['place path trick', 'placeId=..%2Fx&i=0&w=640'],
    ['index too large', `placeId=${PLACE}&i=10&w=640`],
    ['non-numeric index', `placeId=${PLACE}&i=a&w=640`],
    ['non-numeric width', `placeId=${PLACE}&i=0&w=big`]
  ])('%s -> 400 without database or upstream call', async (_label, query) => {
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(query));
    expect(res.status).toBe(400);
    expect(lookup).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('redirects a non-bucket width to the canonical one without any upstream call', async () => {
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(`placeId=${PLACE}&i=0&w=600`));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('w=640');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses a Place ID outside the pilot allowlist before the database and Google', async () => {
    await load({ GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS: 'ChIJother' });
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(q()));
    expect(res.status).toBe(404);
    expect(lookup).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('honours the existing kill switch', async () => {
    await load({ GOOGLE_PHOTO_PROXY_MODE: 'disabled' });
    const fetchSpy = vi.spyOn(global, 'fetch');
    expect((await GET(req(q()))).status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rate-limits per client before the database', async () => {
    await load({ GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE: '1' });
    mockGoogle();
    expect((await GET(req(q(), { 'x-real-ip': '9.9.9.9' }))).status).toBe(200);
    lookup.mockClear();
    const res = await GET(req(q(), { 'x-real-ip': '9.9.9.9' }));
    expect(res.status).toBe(429);
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe('eligibility and owner exclusions', () => {
  it('a place that is not found (unknown, excluded or not published) never reaches Google', async () => {
    await load();
    lookup.mockResolvedValue({ status: 'not-found' });
    const fetchSpy = vi.spyOn(global, 'fetch');
    expect((await GET(req(q()))).status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fails closed when the exclusion list cannot be read', async () => {
    await load();
    lookup.mockResolvedValue({ status: 'unavailable' });
    const fetchSpy = vi.spyOn(global, 'fetch');
    expect((await GET(req(q()))).status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fails closed when the lookup throws', async () => {
    await load();
    lookup.mockRejectedValue(new Error('db down'));
    const fetchSpy = vi.spyOn(global, 'fetch');
    expect((await GET(req(q()))).status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('happy path', () => {
  it('makes exactly one Place Details call (photos only) and one media call, and returns the image uncached with its credit', async () => {
    await load();
    const fetchSpy = mockGoogle();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await GET(req(q()));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(decodeURIComponent(res.headers.get('x-photo-credit') ?? '')).toBe('Jane Doe');
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual([1, 2, 3]);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [detailsUrl, detailsInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(detailsUrl).toBe(`https://places.googleapis.com/v1/places/${PLACE}`);
    expect((detailsInit.headers as Record<string, string>)['X-Goog-FieldMask']).toBe('photos');
    const [mediaUrl, mediaInit] = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(mediaUrl).toBe(`https://places.googleapis.com/v1/${PHOTO_NAME}/media?maxWidthPx=640`);
    // The key is only ever a header, never in a URL.
    for (const [url] of fetchSpy.mock.calls as Array<[string]>) expect(url).not.toContain(KEY);
    expect((mediaInit.headers as Record<string, string>)['X-Goog-Api-Key']).toBe(KEY);

    // Nothing logged contains the photo name, its token, the key or the place ID.
    const logged = [...info.mock.calls, ...error.mock.calls].flat().join('\n');
    for (const secret of [PHOTO_NAME, 'SECRETTOKEN', KEY, PLACE]) expect(logged).not.toContain(secret);
    expect(logged).toContain('kind=place-details');
    expect(logged).toContain('kind=photo-media');
  });

  it('never returns the photo name to the client', async () => {
    await load();
    mockGoogle();
    const res = await GET(req(q()));
    const headers = JSON.stringify([...res.headers.entries()]);
    expect(headers).not.toContain('SECRETTOKEN');
  });

  it('serves the requested index and a missing index is a 404 with no media call', async () => {
    await load();
    const second = { name: 'places/ChIJabc123/photos/SECONDTOKEN', authorAttributions: [{ displayName: 'Sam' }] };
    const first = { name: PHOTO_NAME, authorAttributions: [{ displayName: 'Jane Doe' }] };
    const fetchSpy = mockGoogle(detailsResponse([first, second]));
    const res = await GET(req(`placeId=${PLACE}&i=1&w=640`));
    expect(res.status).toBe(200);
    expect((fetchSpy.mock.calls[1] as [string])[0]).toContain('SECONDTOKEN');

    vi.restoreAllMocks();
    const spy2 = vi.spyOn(global, 'fetch').mockResolvedValueOnce(detailsResponse([first]));
    const missing = await GET(req(`placeId=${PLACE}&i=5&w=640`));
    expect(missing.status).toBe(404);
    expect(spy2).toHaveBeenCalledTimes(1);
  });
});

describe('failures are explicit and bounded', () => {
  it('a Place Details failure answers 502 and makes no media call', async () => {
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 403 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await GET(req(q()));
    expect(res.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('a place with no photos is a 404 and makes no media call', async () => {
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(detailsResponse([]));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await GET(req(q()))).status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('a photo with an unreadable credit is never served', async () => {
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(detailsResponse([{ name: PHOTO_NAME, authorAttributions: [{ displayName: '' }] }]));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await GET(req(q()))).status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('a media 400/429/500 answers a short-lived 502 (no retry)', async () => {
    for (const status of [400, 429, 500]) {
      await load();
      const fetchSpy = mockGoogle(detailsResponse(), new Response('{"error":{}}', { status }));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await GET(req(q()));
      expect(res.status, String(status)).toBe(502);
      expect(res.headers.get('cache-control')).toContain('s-maxage=30');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      vi.restoreAllMocks();
    }
  });

  it('refuses a non-image media response', async () => {
    await load();
    mockGoogle(detailsResponse(), new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }));
    expect((await GET(req(q()))).status).toBe(502);
  });

  it('a network error on the media call answers 502 without throwing', async () => {
    await load();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(detailsResponse()).mockRejectedValueOnce(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await GET(req(q()))).status).toBe(502);
  });
});

describe('persistence guard (static)', () => {
  it('the route contains no database write, file write or cache-store call', () => {
    const source = readFileSync(path.resolve(__dirname, 'route.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const forbidden of [/\.create\(/, /\.save\(/, /\.insertOne\(|\.insertMany\(/, /\.updateOne\(|\.updateMany\(|findOneAndUpdate\(|findByIdAndUpdate\(/, /\.bulkWrite\(/, /writeFile/, /localStorage|unstable_cache|revalidate/]) {
      expect(source).not.toMatch(forbidden);
    }
  });
});

describe('detail-page match key (k)', () => {
  const MAPS = 'https://www.google.com/maps/place/@1,1,3a/photos/one';
  const withMaps = (extra: Record<string, unknown> = {}) => [{ name: PHOTO_NAME, authorAttributions: [{ displayName: 'Jane Doe', uri: 'https://maps.google.com/contrib/1' }], googleMapsUri: MAPS, ...extra }];

  it('serves the image when the photo at that position still matches the key', async () => {
    await load();
    const { photoDisplayKey } = await import('@/lib/photoDisplayKey');
    const fetchSpy = mockGoogle(detailsResponse(withMaps()));
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const res = await GET(req(q(`&k=${photoDisplayKey(MAPS)}`)));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('answers 404 with NO media request when Google now has a different photo at that position', async () => {
    await load();
    const { photoDisplayKey } = await import('@/lib/photoDisplayKey');
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(detailsResponse(withMaps({ googleMapsUri: `${MAPS}-changed` })));
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const res = await GET(req(q(`&k=${photoDisplayKey(MAPS)}`)));
    expect(res.status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).not.toContain('/media');
  });

  it('answers 404 with no media request when the photo carries no Maps link to match', async () => {
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(detailsResponse(withMaps({ googleMapsUri: undefined })));
    vi.spyOn(console, 'info').mockImplementation(() => {});
    expect((await GET(req(q('&k=0123456789abcdef')))).status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed key before the database or Google, and a canonical-width redirect keeps the key', async () => {
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch');
    expect((await GET(req(q('&k=zzz')))).status).toBe(400);
    expect(lookup).not.toHaveBeenCalled();
    const redirect = await GET(req(`placeId=${PLACE}&i=0&w=600&k=0123456789abcdef`));
    expect(redirect.status).toBe(307);
    expect(redirect.headers.get('location')).toContain('k=0123456789abcdef');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the response stays no-store and no photo name, token or key is logged', async () => {
    await load();
    const { photoDisplayKey } = await import('@/lib/photoDisplayKey');
    mockGoogle(detailsResponse(withMaps()));
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await GET(req(q(`&k=${photoDisplayKey(MAPS)}`)));
    expect(res.headers.get('cache-control')).toBe('no-store');
    const logged = [...info.mock.calls, ...error.mock.calls].flat().join('\n');
    for (const secret of [PHOTO_NAME, 'SECRETTOKEN', KEY]) expect(logged).not.toContain(secret);
  });
});
