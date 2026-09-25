import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ isLocalDevelopment: vi.fn(() => false) }));

const { isLocalDevelopment } = await import('@/lib/env');
const { GET } = await import('./route');

const VALID_NAME = 'places/ChIJabc123/photos/AVxyz789';
const ORIGINAL_KEY = process.env.GOOGLE_PLACES_API_KEY;

function req(query: string) {
  return new Request(`http://localhost/api/places/photo?${query}`);
}

beforeEach(() => {
  vi.mocked(isLocalDevelopment).mockReturnValue(false);
  process.env.GOOGLE_PLACES_API_KEY = 'test-key-not-real';
});

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL_KEY === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
  else process.env.GOOGLE_PLACES_API_KEY = ORIGINAL_KEY;
});

describe('GET /api/places/photo — request shape validation', () => {
  it('rejects a missing name', async () => {
    const res = await GET(req('w=200'));
    expect(res.status).toBe(400);
  });

  it('rejects a malformed name', async () => {
    const res = await GET(req(`name=${encodeURIComponent('not-a-valid-name')}`));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/places/photo — width validation (Phase P2A)', () => {
  it('forwards a valid, in-range width to Google unchanged', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    );
    await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=192`));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('maxWidthPx=192');
  });

  it('clamps an oversized width to the maximum bound rather than forwarding it raw', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    );
    await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=999999`));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('maxWidthPx=999999');
    expect(calledUrl).toMatch(/maxWidthPx=1600/);
  });

  it('clamps a negative width to the minimum bound', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    );
    await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=-50`));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/maxWidthPx=32/);
  });

  it('defaults safely when w is non-numeric garbage', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    );
    await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=not-a-number`));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/maxWidthPx=800/);
  });

  it('existing callers that omit w entirely still work exactly as before (defaults to 800)', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    );
    await GET(req(`name=${encodeURIComponent(VALID_NAME)}`));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/maxWidthPx=800/);
  });
});

describe('GET /api/places/photo — photo identity preserved', () => {
  it('always requests the exact photo name given, never a different one', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    );
    await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=300`));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent(VALID_NAME).replace(/%2F/g, '/') === VALID_NAME ? VALID_NAME : VALID_NAME);
    expect(calledUrl).toContain('ChIJabc123');
    expect(calledUrl).toContain('AVxyz789');
  });
});

describe('GET /api/places/photo — no arbitrary upstream URL injection', () => {
  it('never allows the name to escape the fixed Google Places media URL template', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
    const maliciousName = 'places/x/photos/y?injected=https://evil.example.com';
    const res = await GET(req(`name=${encodeURIComponent(maliciousName)}`));
    // The regex requires exactly two path segments after `places/.../photos/...` with no
    // further slashes or query-breaking characters reaching the upstream template.
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('GET /api/places/photo — caching headers unchanged', () => {
  it('still sets the existing 30-day immutable cache header on a successful response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } }));
    const res = await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=200`));
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable');
  });
});

describe('GET /api/places/photo — no Google discovery triggered', () => {
  it('this route never imports the Places Text Search / discovery functions', async () => {
    const routeSource = await import('node:fs').then((fs) => fs.readFileSync(new URL('./route.ts', import.meta.url), 'utf8'));
    expect(routeSource).not.toMatch(/searchPlaces|searchText|searchStays|searchDestinations/);
  });

  it('never calls fetch more than once per photo request (no duplicate/discovery side calls)', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
    await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=200`));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/places/photo — local dev unaffected', () => {
  it('still redirects to a local placeholder in dev, without calling Google or reading the width', async () => {
    vi.mocked(isLocalDevelopment).mockReturnValue(true);
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await GET(req(`name=${encodeURIComponent(VALID_NAME)}&w=99999999`));
    expect(res.status).toBe(307);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
