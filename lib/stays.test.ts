import { describe, expect, it, vi, beforeEach } from 'vitest';

const {
  placeCacheFindMock,
  placeCacheFindOneAndUpdateMock,
  placeCacheAggregateMock,
  searchStaysMock,
  isLocalDevelopmentMock,
  isRecentFailureMock,
  markFailureMock,
  coalesceMock,
  classifyPlaceLocationMock,
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
  isRecentFailureMock: vi.fn(),
  markFailureMock: vi.fn(),
  coalesceMock: vi.fn(),
  classifyPlaceLocationMock: vi.fn(),
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
vi.mock('@/lib/googlePlaces', () => ({
  searchStays: searchStaysMock,
  placeName: (place: { name?: string }) => place.name ?? 'Unnamed',
  placePhotoUrls: () => [],
  placeCoordinates: () => ({ latitude: undefined, longitude: undefined })
}));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: isLocalDevelopmentMock }));
vi.mock('@/lib/negativeCache', () => ({ isRecentFailure: isRecentFailureMock, markFailure: markFailureMock }));
vi.mock('@/lib/requestCoalescing', () => ({ coalesce: coalesceMock, COALESCE_LOCKED: Symbol('coalesce-locked') }));
vi.mock('@/lib/placeLocationSafety', () => ({ classifyPlaceLocation: classifyPlaceLocationMock }));
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
  isRecentFailureMock.mockReset().mockReturnValue(false);
  markFailureMock.mockReset();
  coalesceMock.mockReset();
  classifyPlaceLocationMock.mockReset().mockReturnValue('exact');
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
  });

  it('a Google re-fetch (cache miss) never persists an excluded property into PlaceCache', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'test-key');
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    searchStaysMock.mockResolvedValue({
      places: [{ id: 'normal-id', name: 'Mountain View Resort' }, { id: 'excluded-id', name: 'Similar Name Resort' }],
      pagesFetched: 1,
      saturated: false
    });
    filterOutExcludedPlacesMock.mockImplementation(async (_provider, items) => items.filter((item: { placeId: string }) => item.placeId !== 'excluded-id'));
    placeCacheFindOneAndUpdateMock.mockImplementation(({ placeId }: { placeId: string }) => ({
      lean: vi.fn().mockResolvedValue(cacheDoc({ placeId, name: placeId }))
    }));
    coalesceMock.mockImplementation((_key: string, fetcher: () => Promise<unknown>) => fetcher());

    const result = await getStaysForDestination('manali', 'Manali', ['hotel'], undefined, undefined);

    // Only the normal place was ever upserted — the excluded one is filtered BEFORE the
    // Mongo write, never written and then filtered out on read.
    expect(placeCacheFindOneAndUpdateMock).toHaveBeenCalledTimes(1);
    expect(placeCacheFindOneAndUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ placeId: 'normal-id' }), expect.anything(), expect.anything());
    expect(result.stays.map((s) => s.placeId)).toEqual(['normal-id']);
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
