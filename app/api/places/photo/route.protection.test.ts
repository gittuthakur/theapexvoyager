import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ isLocalDevelopment: vi.fn(() => false) }));

const NAME = 'places/ChIJabc123/photos/AVxyz789_-=.';
const TEST_KEY = 'test-key-not-real-1234567890';
const ENV_KEYS = ['GOOGLE_PLACES_API_KEY', 'GOOGLE_PHOTO_PROXY_MODE', 'GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE', 'GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE'] as const;
const saved: Record<string, string | undefined> = {};

type GetFn = (request: Request) => Promise<Response>;
let GET: GetFn;

function req(query: string, headers: Record<string, string> = {}) {
  return new Request(`http://localhost/api/places/photo?${query}`, { headers });
}
const q = (name: string, extra = '') => `name=${encodeURIComponent(name)}${extra}`;

function okImage() {
  return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
}

beforeEach(async () => {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  process.env.GOOGLE_PLACES_API_KEY = TEST_KEY;
  delete process.env.GOOGLE_PHOTO_PROXY_MODE;
  delete process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE;
  delete process.env.GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE;
  vi.resetModules();
  ({ GET } = await import('./route'));
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('requests rejected before any upstream call', () => {
  it('rejects unsupported and duplicated query parameters', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    for (const query of [q(NAME, '&w=640&x=1'), q(NAME, '&cachebust=123'), `${q(NAME)}&name=${encodeURIComponent(NAME)}`, q(NAME, '&w=640&w=800')]) {
      const res = await GET(req(query));
      expect(res.status, query).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects malformed photo resource names', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const bad = [
      '',
      'places/abc',
      'places/abc/photos/',
      'places//photos/x',
      'place/abc/photos/x',
      'places/abc/photos/x/extra',
      'places/a%2Fb/photos/c',
      'places/abc/photos/..',
      'places/../photos/x',
      'places/abc/photos/x?y=1',
      'places/abc/photos/x#frag',
      'places/abc/photos/x y',
      `places/${'a'.repeat(256)}/photos/x`,
      `places/abc/photos/${'a'.repeat(2049)}`
    ];
    for (const name of bad) {
      const res = await GET(req(q(name)));
      expect(res.status, name).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects non-integer widths', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    for (const w of ['', '1.5', '1e3', '0x10', 'abc', '640px', '1234567', '+640']) {
      const res = await GET(req(q(NAME, `&w=${encodeURIComponent(w)}`)));
      expect(res.status, `w=${w}`).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('redirects a non-canonical width to its bucket with only name and w, and no upstream call', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(q(NAME, '&w=641')));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location') as string);
    expect([...location.searchParams.keys()].sort()).toEqual(['name', 'w']);
    expect(location.searchParams.get('w')).toBe('800');
    expect(location.searchParams.get('name')).toBe(NAME);
    expect(res.headers.get('Cache-Control')).toContain('s-maxage');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejected requests do not consume the rate budget', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE = '2';
    vi.resetModules();
    ({ GET } = await import('./route'));
    vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    for (let i = 0; i < 20; i += 1) await GET(req(q(NAME, `&bad=${i}`), { 'x-real-ip': '9.9.9.9' }));
    expect((await GET(req(q(NAME, '&w=640'), { 'x-real-ip': '9.9.9.9' }))).status).toBe(200);
  });
});

describe('valid requests keep their behaviour', () => {
  it('forwards a canonical width and the exact photo name, with the key only in a header', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(okImage());
    const res = await GET(req(q(NAME, '&w=640')));
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://places.googleapis.com/v1/${NAME}/media?maxWidthPx=640`);
    expect(url).not.toContain(TEST_KEY);
    expect((init.headers as Record<string, string>)['X-Goog-Api-Key']).toBe(TEST_KEY);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable');
  });

  it('every bucket width is accepted, and an omitted width still defaults to 800', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    for (const w of [192, 320, 480, 640, 800, 1200, 1600]) expect((await GET(req(q(NAME, `&w=${w}`)))).status).toBe(200);
    expect((await GET(req(q(NAME)))).status).toBe(200);
    expect(fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0]).toContain('maxWidthPx=800');
  });
});

describe('upstream failures are answered once and never retried', () => {
  it('a genuine Google 404 (missing or expired photo) is a short-cached 404 after a single attempt', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('not found', { status: 404 }));
    const res = await GET(req(q(NAME, '&w=640')));
    expect(res.status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60, s-maxage=300');
    expect(JSON.stringify(await res.json())).not.toContain(TEST_KEY);
  });

  it.each([400, 401, 403])('Google %i (key, quota, billing or request problem) is NOT reported as not-found, and is cached for seconds only', async (status) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(`{"error":"secret detail ${TEST_KEY}"}`, { status }));
    const res = await GET(req(q(NAME, '&w=640')));
    expect(res.status).toBe(502);
    expect(res.status).not.toBe(404);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=10');
    const body = JSON.stringify(await res.json());
    expect(body).not.toMatch(/not found/i);
    expect(body).not.toContain(TEST_KEY);
    expect(body).not.toContain('secret detail');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it.each([429, 500, 503])('Google %i is a briefly-cached 502 after a single attempt', async (status) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('x', { status }));
    const res = await GET(req(q(NAME, '&w=640')));
    expect(res.status).toBe(502);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=15, s-maxage=30');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('a network error or timeout is a single attempt and a safe 502', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const res = await GET(req(q(NAME, '&w=640')));
    expect(res.status).toBe(502);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=15, s-maxage=30');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('never logs the key, the photo URL or the upstream body, for failures and for network errors', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(`body with ${TEST_KEY}`, { status: 403 }));
    await GET(req(q(NAME, '&w=640')));
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error(`request to places.googleapis.com/${NAME} with ${TEST_KEY} failed`));
    await GET(req(q('places/ChIJother/photos/zzz', '&w=640')));
    const output = JSON.stringify(logged.mock.calls);
    expect(output).not.toContain(TEST_KEY);
    expect(output).not.toContain('googleapis.com');
    expect(output).not.toContain('ChIJ');
    expect(logged.mock.calls.length).toBeGreaterThan(0);
  });
});

describe('kill switch and credentials', () => {
  it('GOOGLE_PHOTO_PROXY_MODE=disabled makes no upstream call and leaks nothing', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MODE = 'disabled';
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(q(NAME, '&w=640')));
    expect(res.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(JSON.stringify(await res.json())).not.toMatch(/key|AIza|google/i);
  });

  it('any other mode value keeps the existing behaviour', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MODE = 'enabled';
    vi.spyOn(global, 'fetch').mockResolvedValue(okImage());
    expect((await GET(req(q(NAME, '&w=640')))).status).toBe(200);
  });

  it('a missing server key is a 503 with no upstream call and no secret in the body', async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(q(NAME, '&w=640')));
    expect(res.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('abuse damping (per serverless instance, best effort)', () => {
  it('limits upstream calls per client and answers 429 with Retry-After, without calling Google', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE = '3';
    vi.resetModules();
    ({ GET } = await import('./route'));
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    const headers = { 'x-vercel-forwarded-for': '1.2.3.4' };
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) statuses.push((await GET(req(q(`places/ChIJabc/photos/p${i}`, '&w=640'), headers))).status);
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    const limited = await GET(req(q('places/ChIJabc/photos/p9', '&w=640'), headers));
    expect(limited.headers.get('Retry-After')).toBe('30');
    expect(limited.headers.get('Cache-Control')).toBe('no-store');
    // A different client is unaffected.
    expect((await GET(req(q('places/ChIJabc/photos/p10', '&w=640'), { 'x-vercel-forwarded-for': '5.6.7.8' }))).status).toBe(200);
  });

  it('an over-limit client cannot consume the shared instance allowance, so other visitors are not starved', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE = '3';
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE = '5';
    vi.resetModules();
    ({ GET } = await import('./route'));
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    const attacker = { 'x-vercel-forwarded-for': '6.6.6.6' };
    const attackerStatuses: number[] = [];
    for (let i = 0; i < 200; i += 1) attackerStatuses.push((await GET(req(q(`places/ChIJabc/photos/a${i}`, '&w=640'), attacker))).status);
    expect(attackerStatuses.slice(0, 3)).toEqual([200, 200, 200]);
    expect(attackerStatuses.slice(3).every((status) => status === 429)).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    // 197 rejected attacker requests consumed none of the instance allowance: 2 of 5 remain for others.
    const victims: number[] = [];
    for (let i = 0; i < 3; i += 1) victims.push((await GET(req(q(`places/ChIJabc/photos/v${i}`, '&w=640'), { 'x-vercel-forwarded-for': `7.7.7.${i}` }))).status);
    expect(victims).toEqual([200, 200, 429]);
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });

  it('a 429 for an over-limit client still carries Retry-After and no-store', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE = '1';
    vi.resetModules();
    ({ GET } = await import('./route'));
    vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    const headers = { 'x-real-ip': '8.8.4.4' };
    await GET(req(q(NAME, '&w=640'), headers));
    const limited = await GET(req(q(NAME, '&w=640'), headers));
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBe('30');
    expect(limited.headers.get('Cache-Control')).toBe('no-store');
  });

  it('also caps total upstream calls per instance', async () => {
    process.env.GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE = '2';
    vi.resetModules();
    ({ GET } = await import('./route'));
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => okImage());
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) statuses.push((await GET(req(q(`places/ChIJabc/photos/p${i}`, '&w=640'), { 'x-real-ip': `10.0.0.${i}` }))).status);
    expect(statuses).toEqual([200, 200, 429, 429]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('consumers and scope', () => {
  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      if (['node_modules', '.next', '.git'].includes(entry)) return [];
      const full = join(dir, entry);
      return statSync(full).isDirectory() ? sources(full) : /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
    });
  }
  const root = process.cwd();

  it('every in-repo photo-proxy URL builder uses only the name and w parameters', () => {
    const builders = ['app', 'components', 'lib', 'services', 'types'].flatMap((dir) => sources(join(root, dir))).filter((file) => /\/api\/places\/photo\?/.test(readFileSync(file, 'utf8')));
    expect(builders.length).toBeGreaterThan(0);
    for (const file of builders) {
      const matches = readFileSync(file, 'utf8').match(/\/api\/places\/photo\?[^`'"\s)]*/g) ?? [];
      for (const match of matches) {
        const params = [...match.replace('/api/places/photo?', '').matchAll(/(?:^|&)([a-zA-Z]+)=/g)].map((m) => m[1]);
        for (const param of params) expect(['name', 'w'], `${file}: ${match}`).toContain(param);
      }
    }
  });

  it('the protection touches no exclusion, stays, pricing, availability or booking code', () => {
    const files = [readFileSync(join(root, 'app/api/places/photo/route.ts'), 'utf8'), readFileSync(join(root, 'lib/photoProxyGuard.ts'), 'utf8')].join('\n');
    const imports = files.split('\n').filter((line) => /^\s*import /.test(line)).join('\n');
    expect(imports).not.toMatch(/stays|propertyExclusion|mongodb|models\/|pricing|hbx|booking/i);
    expect(files).not.toMatch(/book now|check availability|starting from|pricePerNight/i);
  });
});
