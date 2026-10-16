import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Fix B: a photo that belongs to an owner-excluded property must not be fetched through the proxy. The exclusion
// service and Google are mocked; nothing here touches a database or the network.
const state = vi.hoisted(() => {
  class ExclusionLookupError extends Error {}
  return {
    ExclusionLookupError,
    excluded: new Set<string>(),
    fail: false,
    providers: [] as string[],
    events: [] as string[]
  };
});

vi.mock('@/lib/env', () => ({ isLocalDevelopment: () => false }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({
  ExclusionLookupError: state.ExclusionLookupError,
  getActiveExclusionSet: async (provider: string) => {
    state.providers.push(provider);
    state.events.push('exclusion-lookup');
    if (state.fail) throw new state.ExclusionLookupError('exclusion list unavailable');
    return state.excluded;
  }
}));

const TEST_KEY = 'test-key-not-real-1234567890';
const EXCLUDED_NAME = 'places/ChIJexcludedProperty/photos/AVsecretToken123';
const OK_NAME = 'places/ChIJallowedProperty/photos/AVokToken456';
const ENV_KEYS = ['GOOGLE_PLACES_API_KEY', 'GOOGLE_PHOTO_PROXY_MODE', 'GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE', 'GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE'] as const;
const saved: Record<string, string | undefined> = {};

type GetFn = (request: Request) => Promise<Response>;
let GET: GetFn;

const req = (name: string, extra = '', headers: Record<string, string> = {}) =>
  new Request(`http://localhost/api/places/photo?name=${encodeURIComponent(name)}${extra}`, { headers });
const okImage = () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } });

async function load() {
  vi.resetModules();
  ({ GET } = await import('./route'));
}

beforeEach(async () => {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  process.env.GOOGLE_PLACES_API_KEY = TEST_KEY;
  delete process.env.GOOGLE_PHOTO_PROXY_MODE;
  delete process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE;
  delete process.env.GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE;
  state.excluded = new Set(['ChIJexcludedProperty']);
  state.fail = false;
  state.providers = [];
  state.events = [];
  await load();
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('an excluded property: its photo is never fetched', () => {
  it('returns 404 and makes no Google call', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());

    const response = await GET(req(EXCLUDED_NAME, '&w=640'));

    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.providers).toEqual(['google']);
  });

  it('is indistinguishable from a photo Google itself reports as not found', async () => {
    const excluded = await GET(req(EXCLUDED_NAME, '&w=640'));
    vi.spyOn(global, 'fetch').mockImplementation(async () => new Response('x', { status: 404 }));
    const unknown = await GET(req(OK_NAME, '&w=640'));

    expect(excluded.status).toBe(unknown.status);
    expect(await excluded.text()).toBe(await unknown.text());
    expect(excluded.headers.get('cache-control')).toBe(unknown.headers.get('cache-control'));
    expect(excluded.headers.get('content-type')).toBe(unknown.headers.get('content-type'));
  });

  it('matches by Place ID only: another place, or a photo token that merely contains the excluded ID, is not blocked', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());

    expect((await GET(req('places/ChIJexcludedProperty2/photos/AVtoken1', '&w=640'))).status).toBe(200);
    expect((await GET(req('places/ChIJallowedProperty/photos/ChIJexcludedProperty', '&w=640'))).status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('is still excluded at any canonical width and with the width omitted', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    for (const extra of ['', '&w=192', '&w=1200', '&w=1600']) {
      expect((await GET(req(EXCLUDED_NAME, extra))).status, extra).toBe(404);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('the exclusion list cannot be read: fail closed', () => {
  it('returns 503 with Cache-Control: no-store and makes no Google call', async () => {
    state.fail = true;
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());

    const response = await GET(req(OK_NAME, '&w=640'));

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fetchSpy).not.toHaveBeenCalled();
    const body = await response.text();
    expect(body).not.toContain(TEST_KEY);
    expect(body).not.toContain('ChIJallowedProperty');
  });

  it('recovers on the next request once the list is readable again (nothing is remembered)', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    state.fail = true;
    expect((await GET(req(OK_NAME, '&w=640'))).status).toBe(503);
    state.fail = false;
    expect((await GET(req(OK_NAME, '&w=640'))).status).toBe(200);
    expect(state.events.filter((event) => event === 'exclusion-lookup')).toHaveLength(2);
  });

  it('a non-exclusion error from the service is not swallowed into a photo response', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    state.fail = false;
    state.excluded = new Proxy(new Set<string>(), {
      get() {
        throw new TypeError('unexpected');
      }
    });

    await expect(GET(req(OK_NAME, '&w=640'))).rejects.toThrow('unexpected');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('legitimate photos are unchanged', () => {
  it('a non-excluded photo is fetched once, with the exact name and width, and keeps its headers', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());

    const response = await GET(req(OK_NAME, '&w=640'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('cache-control')).toBe('public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toBe(`https://places.googleapis.com/v1/${OK_NAME}/media?maxWidthPx=640`);
  });

  it('every canonical width still works with nothing excluded', async () => {
    state.excluded = new Set();
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    for (const width of [192, 320, 480, 640, 800, 1200, 1600]) {
      expect((await GET(req(OK_NAME, `&w=${width}`))).status, String(width)).toBe(200);
    }
    expect(fetchSpy).toHaveBeenCalledTimes(7);
  });
});

describe('processing order: no exclusion lookup for requests that never reach Google', () => {
  it('invalid requests perform no lookup', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const bad = [
      req(OK_NAME, '&w=640&unexpected=x'),
      new Request(`http://localhost/api/places/photo?name=${encodeURIComponent(OK_NAME)}&name=${encodeURIComponent(OK_NAME)}`),
      req('places/ChIJabc/photos/../../x', '&w=640'),
      req('not-a-photo-name', '&w=640'),
      req(OK_NAME, '&w=abc'),
      new Request('http://localhost/api/places/photo')
    ];
    for (const request of bad) expect((await GET(request)).status).toBe(400);
    expect(state.events).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('a non-canonical width is redirected with no lookup (even for an excluded photo)', async () => {
    for (const name of [OK_NAME, EXCLUDED_NAME]) {
      const response = await GET(req(name, '&w=641'));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('w=800');
    }
    expect(state.events).toEqual([]);
  });

  it('the kill switch and a missing server key answer before any lookup', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MODE = 'disabled';
    await load();
    expect((await GET(req(OK_NAME, '&w=640'))).status).toBe(503);
    delete process.env.GOOGLE_PHOTO_PROXY_MODE;
    delete process.env.GOOGLE_PLACES_API_KEY;
    await load();
    expect((await GET(req(OK_NAME, '&w=640'))).status).toBe(503);
    expect(state.events).toEqual([]);
  });

  it('the lookup happens after the per-client check and before the Google call', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => {
      state.events.push('google-fetch');
      return okImage();
    });
    await GET(req(OK_NAME, '&w=640'));
    expect(state.events).toEqual(['exclusion-lookup', 'google-fetch']);
  });

  it('an over-limit client is answered 429 BEFORE any lookup, so abuse cannot drive unlimited database reads', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE = '3';
    await load();
    vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    const headers = { 'x-vercel-forwarded-for': '203.0.113.9' };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await GET(req(`places/ChIJallowedProperty/photos/p${i}`, '&w=640', headers))).status);

    expect(statuses).toEqual([200, 200, 200, 429, 429, 429]);
    expect(state.events.filter((event) => event === 'exclusion-lookup')).toHaveLength(3);
  });
});

describe('excluded or unverifiable requests do not consume the shared per-instance allowance', () => {
  it('many excluded requests leave the whole instance allowance for real visitors', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE = '2';
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    for (let i = 0; i < 50; i += 1) {
      expect((await GET(req(EXCLUDED_NAME, '&w=640', { 'x-vercel-forwarded-for': `198.51.100.${i}` }))).status).toBe(404);
    }

    const visitors: number[] = [];
    for (let i = 0; i < 3; i += 1) visitors.push((await GET(req(`places/ChIJallowedProperty/photos/v${i}`, '&w=640', { 'x-vercel-forwarded-for': `192.0.2.${i}` }))).status);

    expect(visitors).toEqual([200, 200, 429]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('requests answered 503 because the list was unreadable also consume none of it', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE = '2';
    await load();
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    state.fail = true;
    for (let i = 0; i < 20; i += 1) {
      expect((await GET(req(OK_NAME, '&w=640', { 'x-vercel-forwarded-for': `198.51.100.${i}` }))).status).toBe(503);
    }
    state.fail = false;

    expect((await GET(req('places/ChIJallowedProperty/photos/a', '&w=640', { 'x-vercel-forwarded-for': '192.0.2.1' }))).status).toBe(200);
    expect((await GET(req('places/ChIJallowedProperty/photos/b', '&w=640', { 'x-vercel-forwarded-for': '192.0.2.2' }))).status).toBe(200);
    expect((await GET(req('places/ChIJallowedProperty/photos/c', '&w=640', { 'x-vercel-forwarded-for': '192.0.2.3' }))).status).toBe(429);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('logging', () => {
  it('this route logs neither the photo name, the token nor the Place ID for excluded or unverifiable requests', async () => {
    const sinks = [vi.spyOn(console, 'error'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'info'), vi.spyOn(console, 'log')].map((spy) => spy.mockImplementation(() => undefined));
    vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());

    await GET(req(EXCLUDED_NAME, '&w=640'));
    state.fail = true;
    await GET(req(EXCLUDED_NAME, '&w=640'));

    const logged = JSON.stringify(sinks.flatMap((sink) => sink.mock.calls));
    for (const secret of ['ChIJexcludedProperty', 'AVsecretToken123', TEST_KEY, 'places/']) expect(logged).not.toContain(secret);
  });
});
