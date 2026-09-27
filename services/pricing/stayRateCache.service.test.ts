import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));

interface FakeDoc {
  provider: string;
  hotelIdsKey: string;
  providerHotelIds: string[];
  destinationSlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  state: string;
  rates: unknown[];
  error?: string;
  updatedAt: Date;
}

let store: FakeDoc[] = [];

function matchesQuery(doc: FakeDoc, query: Record<string, unknown>): boolean {
  return Object.entries(query).every(([key, value]) => String((doc as unknown as Record<string, unknown>)[key]) === String(value));
}

vi.mock('@/models/StayRateCache', () => ({
  STAY_RATE_CACHE_TTL_SECONDS: 600,
  StayRateCache: {
    findOne: vi.fn((query: Record<string, unknown>) => ({
      lean: async () => store.find((doc) => matchesQuery(doc, query)) ?? null
    })),
    findOneAndUpdate: vi.fn(async (query: Record<string, unknown>, update: Partial<FakeDoc>) => {
      const existingIndex = store.findIndex((doc) => matchesQuery(doc, query));
      const doc: FakeDoc = { ...(existingIndex >= 0 ? store[existingIndex] : {}), ...update, updatedAt: new Date() } as FakeDoc;
      if (existingIndex >= 0) store[existingIndex] = doc;
      else store.push(doc);
      return doc;
    })
  }
}));

const { getCachedAvailability, saveCachedAvailability } = await import('./stayRateCache.service');

const QUERY = {
  destinationSlug: 'manali',
  checkIn: '2026-10-10',
  checkOut: '2026-10-12',
  adults: 2,
  children: 0,
  rooms: 1,
  providerHotelIds: ['142378']
};

const RESULT = {
  state: 'VERIFIED_LIVE_RATE' as const,
  rates: [
    {
      provider: 'hbx' as const,
      providerHotelId: '142378',
      currency: 'EUR',
      totalStayPrice: 188.54,
      nightCount: 2,
      displayPerNight: 94.27,
      cancellationPolicies: [],
      lastCheckedAt: new Date().toISOString(),
      environment: 'test' as const
    }
  ]
};

beforeEach(() => {
  store = [];
});

describe('getCachedAvailability', () => {
  it('returns null on a genuine miss (no matching document at all)', async () => {
    const result = await getCachedAvailability(QUERY, 'hbx');
    expect(result).toBeNull();
  });

  it('returns null for a sampling-mode query (no explicit providerHotelIds) — never cached', async () => {
    const { providerHotelIds: _ids, ...samplingQuery } = QUERY;
    const result = await getCachedAvailability(samplingQuery, 'hbx');
    expect(result).toBeNull();
  });

  it('returns the cached result when a fresh matching document exists', async () => {
    await saveCachedAvailability(QUERY, 'hbx', RESULT);
    const result = await getCachedAvailability(QUERY, 'hbx');
    expect(result).toEqual(RESULT);
  });

  it('returns null when the matching document is past the TTL window (stale)', async () => {
    await saveCachedAvailability(QUERY, 'hbx', RESULT);
    store[0].updatedAt = new Date(Date.now() - 601_000); // 601s ago > 600s TTL
    const result = await getCachedAvailability(QUERY, 'hbx');
    expect(result).toBeNull();
  });

  it('never reuses a cached result from a different search context (different checkOut)', async () => {
    await saveCachedAvailability(QUERY, 'hbx', RESULT);
    const result = await getCachedAvailability({ ...QUERY, checkOut: '2026-10-13' }, 'hbx');
    expect(result).toBeNull();
  });

  it('never reuses a cached result for a different occupancy (adults)', async () => {
    await saveCachedAvailability(QUERY, 'hbx', RESULT);
    const result = await getCachedAvailability({ ...QUERY, adults: 3 }, 'hbx');
    expect(result).toBeNull();
  });

  it('matches the hotel-id set regardless of input order (canonical key)', async () => {
    await saveCachedAvailability({ ...QUERY, providerHotelIds: ['A', 'B'] }, 'hbx', RESULT);
    const result = await getCachedAvailability({ ...QUERY, providerHotelIds: ['B', 'A'] }, 'hbx');
    expect(result).toEqual(RESULT);
  });
});

describe('saveCachedAvailability', () => {
  it('never caches a PROVIDER_ERROR result', async () => {
    await saveCachedAvailability(QUERY, 'hbx', { state: 'PROVIDER_ERROR', rates: [], error: 'boom' });
    expect(store).toHaveLength(0);
  });

  it('never caches a sampling-mode query', async () => {
    const { providerHotelIds: _ids, ...samplingQuery } = QUERY;
    await saveCachedAvailability(samplingQuery, 'hbx', RESULT);
    expect(store).toHaveLength(0);
  });

  it('is idempotent — repeated writes for the same context update one document, never accumulate duplicates', async () => {
    await saveCachedAvailability(QUERY, 'hbx', RESULT);
    await saveCachedAvailability(QUERY, 'hbx', RESULT);
    await saveCachedAvailability(QUERY, 'hbx', RESULT);
    expect(store).toHaveLength(1);
  });

  it('caches an UNAVAILABLE result too (a valid, cacheable outcome)', async () => {
    await saveCachedAvailability(QUERY, 'hbx', { state: 'UNAVAILABLE', rates: [] });
    const result = await getCachedAvailability(QUERY, 'hbx');
    expect(result).toEqual({ state: 'UNAVAILABLE', rates: [], error: undefined });
  });
});
