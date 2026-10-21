import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ reserve: vi.fn(), createStore: vi.fn(), exclusions: vi.fn(), local: vi.fn() }));
vi.mock('@/lib/googleApiBudgetStore.mongo', () => ({ createMongoBudgetStore: mocks.createStore }));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: mocks.local }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({
  ExclusionLookupError: class ExclusionLookupError extends Error {},
  getActiveExclusionSet: mocks.exclusions
}));

let GET: (r: Request) => Promise<Response>;
const name = 'places/test_place/photos/test_photo';
const request = (extra = '') => new Request('https://local/api/places/photo?name=' + encodeURIComponent(name) + '&w=640' + extra);

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('GOOGLE_PLACES_API_KEY', 'fake-key');
  vi.stubEnv('GOOGLE_API_BUDGET_MODE', 'shadow');
  vi.stubEnv('GOOGLE_PHOTO_PROXY_MODE', '');
  mocks.local.mockReturnValue(false);
  mocks.exclusions.mockResolvedValue(new Set());
  mocks.reserve.mockResolvedValue({ kind: 'reserved', dayCount: 1, monthCount: 1 });
  mocks.createStore.mockReturnValue({ tryReserve: mocks.reserve });
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'image/jpeg' } })));
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  ({ GET } = await import('./route'));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('photo-media actual outbound boundary', () => {
  it('default off performs no budget store loading or operations and preserves the response', async () => {
    vi.stubEnv('GOOGLE_API_BUDGET_MODE', '');
    const result = await GET(request());
    expect(result.status).toBe(200);
    expect([...new Uint8Array(await result.arrayBuffer())]).toEqual([1, 2]);
    expect(result.headers.get('Cache-Control')).toContain('s-maxage=2592000');
    expect(mocks.createStore).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('counts exactly once, only photo-media, immediately before the unchanged no-store fetch', async () => {
    const result = await GET(request());
    expect(result.status).toBe(200);
    expect(mocks.reserve).toHaveBeenCalledTimes(1);
    expect(mocks.reserve).toHaveBeenCalledWith(expect.objectContaining({ bucket: 'photo-media', amount: 1 }));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(fetch).mock.invocationCallOrder[0]);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: 'no-store', headers: { 'X-Goog-Api-Key': 'fake-key' } }));
    expect(await result.text()).not.toContain('budget');
  });

  it.each(['disabled', 'excluded', 'invalid', 'local', 'rate-limited', 'missing-key'])('%s returns before accounting and Google', async (kind) => {
    if (kind === 'disabled') vi.stubEnv('GOOGLE_PHOTO_PROXY_MODE', 'disabled');
    if (kind === 'excluded') mocks.exclusions.mockResolvedValue(new Set(['test_place']));
    if (kind === 'local') mocks.local.mockReturnValue(true);
    if (kind === 'rate-limited') {
      vi.stubEnv('GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE', '1');
      await GET(request());
      vi.mocked(fetch).mockClear(); mocks.reserve.mockClear();
    }
    if (kind === 'missing-key') vi.stubEnv('GOOGLE_PLACES_API_KEY', '');
    await GET(kind === 'invalid' ? request('&unsupported=1') : request());
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reuses one lazy store and counts separate uncached handler attempts separately', async () => {
    await Promise.all([GET(request()), GET(request())]);
    expect(mocks.createStore).toHaveBeenCalledTimes(1);
    expect(mocks.reserve).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('region disabled mode still makes zero Google and budget calls even with shadow selected', async () => {
    vi.stubEnv('GOOGLE_REGION_ATTRACTIONS_MODE', 'disabled');
    const { getRegionAttractions } = await import('@/services/providers/google/googlePlaces.attractions');
    expect(await getRegionAttractions({ name: 'private-region' })).toEqual({ attractions: [], attribution: undefined });
    expect(mocks.createStore).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('a budget error never changes Google errors or retries the attempt', async () => {
    mocks.reserve.mockRejectedValue(new Error('mongodb://private'));
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 404 }));
    expect((await GET(request())).status).toBe(404);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain('private');
  });
});
