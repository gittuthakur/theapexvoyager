import { PREVIEW_MOCK_JPEG } from '@/lib/googlePhotoPreviewMock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ reserve: vi.fn(), createStore: vi.fn(), exclusions: vi.fn(), local: vi.fn() }));
vi.mock('@/lib/googleApiBudgetStore.mongo', () => ({ createMongoBudgetStore: mocks.createStore }));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: mocks.local }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({
  ExclusionLookupError: class ExclusionLookupError extends Error {},
  getActiveExclusionSet: mocks.exclusions
}));

let GET: (request: Request) => Promise<Response>;
const NAME = 'places/preview_allowed/photos/preview_photo';
const request = (extra = '') => new Request(`https://preview.example/api/places/photo?name=${encodeURIComponent(NAME)}&w=640${extra}`);
const ENV_KEYS = ['GOOGLE_PLACES_API_KEY', 'GOOGLE_API_BUDGET_MODE', 'GOOGLE_PHOTO_PROXY_MODE', 'GOOGLE_PHOTO_PREVIEW_MOCK', 'VERCEL', 'VERCEL_ENV'] as const;
const saved: Record<string, string | undefined> = {};

async function load() {
  vi.resetModules();
  ({ GET } = await import('./route'));
}

beforeEach(async () => {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  vi.clearAllMocks();
  process.env.GOOGLE_PLACES_API_KEY = 'fake-key';
  process.env.GOOGLE_API_BUDGET_MODE = 'shadow';
  process.env.GOOGLE_PHOTO_PROXY_MODE = '';
  process.env.GOOGLE_PHOTO_PREVIEW_MOCK = 'enabled';
  process.env.VERCEL = '1';
  process.env.VERCEL_ENV = 'preview';
  mocks.local.mockReturnValue(false);
  mocks.exclusions.mockResolvedValue(new Set());
  mocks.reserve.mockResolvedValue({ kind: 'reserved', dayCount: 1, monthCount: 1 });
  mocks.createStore.mockReturnValue({ tryReserve: mocks.reserve });
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('a Preview mock must never call fetch'); }));
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await load();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('Preview-only photo media mock boundary', () => {
  it('returns the normal image response without any outbound fetch and retains shadow placement', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('cache-control')).toBe('public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable');
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.equals(Buffer.from(PREVIEW_MOCK_JPEG))).toBe(true);
    expect(bytes.length).toBe(265);
    expect([...bytes.subarray(0, 2)]).toEqual([0xff, 0xd8]);
    expect([...bytes.subarray(-2)]).toEqual([0xff, 0xd9]);
    expect(mocks.reserve).toHaveBeenCalledTimes(1);
    expect(mocks.reserve).toHaveBeenCalledWith(expect.objectContaining({ bucket: 'photo-media', amount: 1 }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps owner exclusions ahead of the mock and accounting', async () => {
    mocks.exclusions.mockResolvedValue(new Set(['preview_allowed']));
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('public, max-age=60, s-maxage=300');
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps a failed exclusion lookup fail-closed ahead of the mock and accounting', async () => {
    const { ExclusionLookupError } = await import('@/services/properties/propertyExclusion.service');
    mocks.exclusions.mockRejectedValue(new ExclusionLookupError());
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not expose a public mock switch', async () => {
    const response = await GET(request('&mock=enabled'));
    expect(response.status).toBe(400);
    expect(mocks.exclusions).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed outside Vercel Preview without fetch or accounting', async () => {
    process.env.VERCEL_ENV = 'production';
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=10');
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not let mock mode bypass the existing missing-key error', async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(mocks.exclusions).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
