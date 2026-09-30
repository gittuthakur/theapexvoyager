import { describe, expect, it, vi, beforeEach } from 'vitest';

const {
  placeCacheFindMock,
  placeCacheFindOneAndUpdateMock,
  placeCacheAggregateMock,
  searchStaysMock,
  isLocalDevelopmentMock,
  classifyVerifiedStayTypeMock,
  isPropertyExcludedMock,
  filterOutExcludedPlacesMock,
  getActiveExclusionSetMock
} = vi.hoisted(() => ({
  placeCacheFindMock: vi.fn(),
  placeCacheFindOneAndUpdateMock: vi.fn(),
  placeCacheAggregateMock: vi.fn(),
  searchStaysMock: vi.fn(),
  isLocalDevelopmentMock: vi.fn(),
  classifyVerifiedStayTypeMock: vi.fn(),
  isPropertyExcludedMock: vi.fn(),
  filterOutExcludedPlacesMock: vi.fn(),
  getActiveExclusionSetMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/PlaceCache', () => ({
  PlaceCache: {
    find: placeCacheFindMock,
    findOneAndUpdate: placeCacheFindOneAndUpdateMock,
    aggregate: placeCacheAggregateMock,
    collection: { name: 'placecaches' }
  }
}));
// lib/stays.ts (the PUBLIC read path) only ever imports searchStays from here for its
// isLocalDevelopment() branch — never in production. Mocked so a test can assert it was
// NEVER called for every production-path scenario below (Part 1 of the Phase 1 audit's
// cost-proof requirement).
vi.mock('@/lib/googlePlaces', () => ({
  searchStays: searchStaysMock,
  placeName: (place: { name?: string }) => place.name ?? 'Unnamed',
  placePhotoUrls: () => [],
  placeCoordinates: () => ({ latitude: undefined, longitude: undefined })
}));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: isLocalDevelopmentMock }));
vi.mock('@/lib/stayClassification', () => ({
  classifyVerifiedStayType: classifyVerifiedStayTypeMock,
  verifiedStayTypeMongoExpr: () => ({}),
  hasTreehouseNameEvidence: () => false,
  treehouseNameMongoPattern: () => '.*'
}));
vi.mock('@/services/properties/propertyExclusion.service', () => ({
  isPropertyExcluded: isPropertyExcludedMock,
  filterOutExcludedPlaces: filterOutExcludedPlacesMock,
  getActiveExclusionSet: getActiveExclusionSetMock
}));

const { getStayByPlaceId, getStaysForDestination, getCachedStaysCatalog } = await import('./stays');

const NORMAL_PLACE = { placeId: 'normal-id', name: 'Mountain View Resort', types: ['lodging'], rating: 4.5, userRatingCount: 10 };
const EXCLUDED_PLACE = { placeId: 'excluded-id', name: 'Similar Name Resort', types: ['lodging'], rating: 4.2, userRatingCount: 8 };

function cacheDoc(overrides: Record<string, unknown>) {
  return {
    placeId: 'id',
    name: 'name',
    slug: 'slug',
    stayType: 'hotel',
    photos: [],
    destinationSlug: 'manali',
    updatedAt: new Date(),
    locationClassification: 'exact',
    ...overrides
  };
}

beforeEach(() => {
  placeCacheFindMock.mockReset();
  placeCacheFindOneAndUpdateMock.mockReset();
  placeCacheAggregateMock.mockReset();
  searchStaysMock.mockReset();
  isLocalDevelopmentMock.mockReset().mockReturnValue(false);
  classifyVerifiedStayTypeMock.mockReset().mockReturnValue('hotel');
  isPropertyExcludedMock.mockReset().mockResolvedValue(false);
  filterOutExcludedPlacesMock.mockReset().mockImplementation(async (_provider, items) => items);
  getActiveExclusionSetMock.mockReset().mockResolvedValue(new Set());
});

describe('getStayByPlaceId — direct URL exclusion', () => {
  it('a normal property remains visible', async () => {
    isPropertyExcludedMock.mockResolvedValue(false);
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([cacheDoc(NORMAL_PLACE)]) });

    const result = await getStayByPlaceId('normal-id');
    expect(result).not.toBeNull();
    expect(result?.placeId).toBe('normal-id');
    expect(searchStaysMock).not.toHaveBeenCalled();
  });

  it('an excluded property\'s direct URL returns null (the page\'s existing notFound() then fires)', async () => {
    isPropertyExcludedMock.mockResolvedValue(true);

    const result = await getStayByPlaceId('excluded-id');
    expect(result).toBeNull();
    // Never even queries PlaceCache once excluded — the exclusion check is the first gate.
    expect(placeCacheFindMock).not.toHaveBeenCalled();
  });

  it('deactivating the exclusion makes the property eligible again', async () => {
    isPropertyExcludedMock.mockResolvedValue(true);
    expect(await getStayByPlaceId('excluded-id')).toBeNull();

    isPropertyExcludedMock.mockResolvedValue(false);
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([cacheDoc(EXCLUDED_PLACE)]) });
    const result = await getStayByPlaceId('excluded-id');
    expect(result).not.toBeNull();
  });

  it('excluding one property does not hide a different, similarly-named property', async () => {
    isPropertyExcludedMock.mockImplementation(async (_provider, placeId) => placeId === 'excluded-id');

    expect(await getStayByPlaceId('excluded-id')).toBeNull();

    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([cacheDoc(NORMAL_PLACE)]) });
    const other = await getStayByPlaceId('normal-id');
    expect(other).not.toBeNull();
    expect(other?.placeId).toBe('normal-id');
  });
});

describe('getStaysForDestination — listing exclusion', () => {
  it('an excluded property disappears from an already-cached listing (not just future fetches)', async () => {
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([cacheDoc(NORMAL_PLACE), cacheDoc(EXCLUDED_PLACE)]) });
    filterOutExcludedPlacesMock.mockImplementation(async (_provider, items) => items.filter((item: { placeId: string }) => item.placeId !== 'excluded-id'));

    const result = await getStaysForDestination('manali', 'Manali', ['hotel']);

    expect(result.stays.map((s) => s.placeId)).toEqual(['normal-id']);
    expect(filterOutExcludedPlacesMock).toHaveBeenCalled();
    expect(searchStaysMock).not.toHaveBeenCalled();
  });
});

// Phase 1 (2026-09) Google Places cost-control audit: getStaysForDestination is the one
// function every public visitor/crawler-facing route reaches (app/stays/search/page.tsx,
// app/api/destinations's `type=stays` handler). It must be Mongo-only, unconditionally —
// see lib/staysRefresh.ts for where Google is now actually called (a separate module this
// file never imports).
describe('getStaysForDestination — Google Places cost control (Phase 1)', () => {
  it('a warm cache hit returns cached data and never calls Google', async () => {
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([cacheDoc(NORMAL_PLACE)]) });

    const result = await getStaysForDestination('manali', 'Manali', ['hotel']);

    expect(result.stays).toHaveLength(1);
    expect(searchStaysMock).not.toHaveBeenCalled();
  });

  it('a cache MISS returns an honest empty result and never calls Google', async () => {
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

    const result = await getStaysForDestination('a-brand-new-destination', 'Nowhere', ['hotel']);

    expect(result.stays).toEqual([]);
    expect(result.meta[0]).toMatchObject({ fromCache: false, queried: false, error: 'NOT_YET_REFRESHED' });
    expect(searchStaysMock).not.toHaveBeenCalled();
    expect(placeCacheFindOneAndUpdateMock).not.toHaveBeenCalled();
  });

  it('a cache MISS across every requested stay type still never calls Google, for any of them', async () => {
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

    const result = await getStaysForDestination('a-brand-new-destination', 'Nowhere');

    expect(result.stays).toEqual([]);
    expect(searchStaysMock).not.toHaveBeenCalled();
  });

  it('an old (but still present) cached row is still served as a cache hit — there is no TTL/staleness check on the read path', async () => {
    const oldDoc = cacheDoc({ ...NORMAL_PLACE, updatedAt: new Date('2020-01-01') });
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([oldDoc]) });

    const result = await getStaysForDestination('manali', 'Manali', ['hotel']);

    expect(result.stays).toHaveLength(1);
    expect(result.meta[0].fromCache).toBe(true);
    expect(searchStaysMock).not.toHaveBeenCalled();
  });

  it('is unaffected by the presence/absence of GOOGLE_PLACES_API_KEY — it never reads that env var', async () => {
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    vi.stubEnv('GOOGLE_PLACES_API_KEY', '');

    const result = await getStaysForDestination('a-brand-new-destination', 'Nowhere', ['hotel']);

    expect(result.stays).toEqual([]);
    expect(searchStaysMock).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

describe('getCachedStaysCatalog — cache-only browse exclusion', () => {
  it('injects an exclusion $nin match stage into the aggregation pipeline when exclusions exist', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['excluded-id']));
    placeCacheAggregateMock.mockResolvedValue([{ data: [], totalCount: [] }]);

    await getCachedStaysCatalog({});

    const pipeline = placeCacheAggregateMock.mock.calls[0][0];
    const exclusionStage = pipeline.find((stage: Record<string, unknown>) => {
      const match = (stage as { $match?: { placeId?: { $nin?: string[] } } }).$match;
      return match?.placeId?.$nin !== undefined;
    });
    expect(exclusionStage).toBeDefined();
    expect(exclusionStage.$match.placeId.$nin).toEqual(['excluded-id']);
    // Must be the very first stage — before dedupe/sort — so pagination counts stay accurate.
    expect(pipeline[0]).toBe(exclusionStage);
    expect(searchStaysMock).not.toHaveBeenCalled();
  });

  it('adds no exclusion stage at all when there are no active exclusions (unchanged pipeline shape)', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set());
    placeCacheAggregateMock.mockResolvedValue([{ data: [], totalCount: [] }]);

    await getCachedStaysCatalog({});

    const pipeline = placeCacheAggregateMock.mock.calls[0][0];
    const hasExclusionStage = pipeline.some((stage: Record<string, unknown>) => {
      const match = (stage as { $match?: { placeId?: { $nin?: unknown } } }).$match;
      return match?.placeId?.$nin !== undefined;
    });
    expect(hasExclusionStage).toBe(false);
  });
});
