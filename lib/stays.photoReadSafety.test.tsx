import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Same mocks as lib/stays.test.ts: no MongoDB and no Google, so these tests cannot read or write real data or call any API.
const {
  placeCacheFindMock,
  placeCacheFindOneAndUpdateMock,
  placeCacheAggregateMock,
  searchStaysMock,
  isLocalDevelopmentMock,
  classifyVerifiedStayTypeMock,
  filterOutExcludedPlacesMock,
  getActiveExclusionSetMock,
  getPublishedRefsMock,
  fetchMock
} = vi.hoisted(() => ({
  placeCacheFindMock: vi.fn(),
  placeCacheFindOneAndUpdateMock: vi.fn(),
  placeCacheAggregateMock: vi.fn(),
  searchStaysMock: vi.fn(),
  isLocalDevelopmentMock: vi.fn(),
  classifyVerifiedStayTypeMock: vi.fn(),
  filterOutExcludedPlacesMock: vi.fn(),
  getActiveExclusionSetMock: vi.fn(),
  getPublishedRefsMock: vi.fn(),
  fetchMock: vi.fn()
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
vi.mock('@/lib/stayClassification', () => ({
  classifyVerifiedStayType: classifyVerifiedStayTypeMock,
  verifiedStayTypeMongoExpr: () => ({}),
  hasTreehouseNameEvidence: () => false,
  treehouseNameMongoPattern: () => '.*'
}));
vi.mock('@/lib/destinations', () => ({ getPublishedDestinationRefs: getPublishedRefsMock }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({
  ExclusionLookupError: class ExclusionLookupError extends Error {},
  isPropertyExcluded: vi.fn().mockResolvedValue(false),
  filterOutExcludedPlaces: filterOutExcludedPlacesMock,
  getActiveExclusionSet: getActiveExclusionSetMock
}));

const { toStay, getStaysForDestination, getStayByPlaceIdResult, getCachedStaysCatalog } = await import('./stays');
const { hotelToStay } = await import('./stayMerge');
const { StayCard } = await import('@/components/modules/StaysGrid');

const proxy = (token: string) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJreadsafety/photos/${token}`)}&w=1200`;

function cacheDoc(overrides: Record<string, unknown> = {}) {
  return {
    placeId: 'id',
    name: 'name',
    slug: 'slug',
    stayType: 'hotel',
    photos: [],
    destinationSlug: 'manali',
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    locationClassification: 'exact',
    types: ['lodging'],
    ...overrides
  };
}

/** A stored document with the `photos` field removed entirely (what .lean() returns for a document that never had it). */
function docWithoutPhotos(overrides: Record<string, unknown> = {}) {
  const doc: Record<string, unknown> = cacheDoc(overrides);
  delete doc.photos;
  return doc;
}

beforeEach(() => {
  placeCacheFindMock.mockReset();
  placeCacheFindOneAndUpdateMock.mockReset();
  placeCacheAggregateMock.mockReset();
  searchStaysMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  isLocalDevelopmentMock.mockReset().mockReturnValue(false);
  classifyVerifiedStayTypeMock.mockReset().mockReturnValue('hotel');
  filterOutExcludedPlacesMock.mockReset().mockImplementation(async (_provider, items) => items);
  getActiveExclusionSetMock.mockReset().mockResolvedValue(new Set());
  getPublishedRefsMock.mockReset().mockResolvedValue([{ slug: 'manali', title: 'Manali', state: 'Himachal Pradesh' }]);
});

describe('toStay — stored photos are read safely', () => {
  const convert = (photos: unknown, extra: Record<string, unknown> = {}) => toStay({ ...cacheDoc(extra), photos } as never);

  it('a missing photos property becomes []', () => {
    expect(toStay(docWithoutPhotos() as never).photos).toEqual([]);
  });

  it('null becomes []', () => {
    expect(convert(null).photos).toEqual([]);
  });

  it('undefined becomes []', () => {
    expect(convert(undefined).photos).toEqual([]);
  });

  it('an empty array stays an empty array', () => {
    expect(convert([]).photos).toEqual([]);
  });

  it.each([
    ['a string', proxy('a')],
    ['a number', 42],
    ['true', true],
    ['an object', { 0: proxy('a'), length: 1 }],
    ['a nested array-like object', { photos: [proxy('a')] }],
    ['a function', () => proxy('a')]
  ])('a non-array value (%s) becomes [] and cannot crash a consumer', (_label, value) => {
    const stay = convert(value);
    expect(stay.photos).toEqual([]);
    expect(() => renderToStaticMarkup(<StayCard stay={stay} />)).not.toThrow();
  });

  it('a valid array is returned untouched: same array, same URLs, same order', () => {
    const photos = [proxy('first'), proxy('second'), proxy('third'), proxy('fourth')];
    const snapshot = [...photos];
    const stay = convert(photos);
    expect(stay.photos).toBe(photos);
    expect(stay.photos).toEqual(snapshot);
  });

  it('keeps unchanged Google proxy URLs byte for byte (no rewriting, no re-encoding, no width change)', () => {
    const photos = [proxy('a=b'), '/api/places/photo?name=places%2FChIJx%2Fphotos%2FAbC_-.&w=640'];
    expect(convert(photos).photos).toEqual(photos);
  });

  it('keeps valid photos and their order when an array contains junk entries', () => {
    const stay = convert([proxy('one'), null, undefined, 7, { url: 'x' }, proxy('two'), ['nested'], proxy('three')]);
    expect(stay.photos).toEqual([proxy('one'), proxy('two'), proxy('three')]);
  });

  it('never mutates a frozen document or its photo array', () => {
    const photos = Object.freeze([proxy('a'), proxy('b')]);
    const doc = Object.freeze({ ...cacheDoc(), photos });
    expect(() => toStay(doc as never)).not.toThrow();
    expect(doc.photos).toEqual([proxy('a'), proxy('b')]);
    const mixed = Object.freeze([proxy('a'), null]);
    expect(() => toStay(Object.freeze({ ...cacheDoc(), photos: mixed }) as never)).not.toThrow();
    expect(mixed).toEqual([proxy('a'), null]);
  });

  it('does not change any other field of the Stay', () => {
    const doc = cacheDoc({ placeId: 'ChIJabc', name: 'Hotel Alpha', rating: 4.4, userRatingCount: 80, googleMapsUri: 'https://maps.google.com/?cid=1', photos: [proxy('a')] });
    const stay = toStay(doc as never);
    expect(stay).toMatchObject({ placeId: 'ChIJabc', name: 'Hotel Alpha', rating: 4.4, userRatingCount: 80, googleMapsUri: 'https://maps.google.com/?cid=1', source: 'google', photos: [proxy('a')] });
  });
});

describe('a valid record renders exactly its own photo (no unexpected fallback)', () => {
  it('shows the first stored photo and the thumbnails, and no "No photo available" box', () => {
    const photos = [proxy('main'), proxy('t1'), proxy('t2'), proxy('t3')];
    const html = renderToStaticMarkup(<StayCard stay={toStay(cacheDoc({ photos }) as never)} />);
    expect(html).not.toContain('No photo available');
    expect((html.match(/<img[^>]+api(?:%2F|\/)places(?:%2F|\/)photo/g) ?? []).length).toBe(4);
  });

  it('a record with no photos shows the existing "No photo available" box, as before', () => {
    const html = renderToStaticMarkup(<StayCard stay={toStay(docWithoutPhotos() as never)} />);
    expect(html).toContain('No photo available');
  });
});

describe('the public read paths survive missing photo arrays', () => {
  it('getStaysForDestination: missing, null, empty and valid photos in one listing, order preserved', async () => {
    const valid = [proxy('v1'), proxy('v2')];
    placeCacheFindMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        docWithoutPhotos({ placeId: 'a', name: 'A' }),
        cacheDoc({ placeId: 'b', name: 'B', photos: null }),
        cacheDoc({ placeId: 'c', name: 'C', photos: [] }),
        cacheDoc({ placeId: 'd', name: 'D', photos: valid })
      ])
    });
    const { stays } = await getStaysForDestination('manali', 'Manali', ['hotel']);
    expect(stays.map((s) => s.placeId)).toEqual(['a', 'b', 'c', 'd']);
    expect(stays.map((s) => s.photos)).toEqual([[], [], [], valid]);
  });

  it('getStayByPlaceIdResult: a property page for a record without photos still resolves', async () => {
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([docWithoutPhotos({ placeId: 'only', name: 'Only' })]) });
    const result = await getStayByPlaceIdResult('only');
    expect(result.status).toBe('found');
    if (result.status === 'found') expect(result.stay.photos).toEqual([]);
  });

  it('getCachedStaysCatalog: a catalog row without photos becomes []', async () => {
    placeCacheAggregateMock.mockResolvedValue([
      { data: [{ ...docWithoutPhotos({ placeId: 'cat', name: 'Cat' }), verifiedStayType: 'hotel' }, { ...cacheDoc({ placeId: 'cat2', photos: [proxy('k')] }), verifiedStayType: 'hotel' }], totalCount: [{ count: 2 }] }
    ]);
    const page = await getCachedStaysCatalog({});
    expect(page.stays.map((s) => s.photos)).toEqual([[], [proxy('k')]]);
  });

  it('makes no Google call and no write on any of these paths', async () => {
    placeCacheFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([docWithoutPhotos({ placeId: 'a' })]) });
    placeCacheAggregateMock.mockResolvedValue([{ data: [{ ...docWithoutPhotos({ placeId: 'z' }), verifiedStayType: 'hotel' }], totalCount: [{ count: 1 }] }]);
    await getStaysForDestination('manali', 'Manali', ['hotel']);
    await getStayByPlaceIdResult('a');
    await getCachedStaysCatalog({});
    expect(searchStaysMock).not.toHaveBeenCalled();
    expect(placeCacheFindOneAndUpdateMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('owner exclusions are unaffected', () => {
  it('an excluded property without a photos field is still removed from a listing', async () => {
    placeCacheFindMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue([docWithoutPhotos({ placeId: 'excluded-id', name: 'Excluded' }), cacheDoc({ placeId: 'ok-id', name: 'Ok', photos: [proxy('x')] })])
    });
    filterOutExcludedPlacesMock.mockImplementation(async (_provider, items) => items.filter((item: { placeId: string }) => item.placeId !== 'excluded-id'));
    const { stays } = await getStaysForDestination('manali', 'Manali', ['hotel']);
    expect(stays.map((s) => s.placeId)).toEqual(['ok-id']);
    expect(stays[0].photos).toEqual([proxy('x')]);
  });

  it('an excluded property\'s direct lookup still returns nothing and never queries the cache', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['excluded-id']));
    const result = await getStayByPlaceIdResult('excluded-id');
    expect(result.status).not.toBe('found');
    expect(placeCacheFindMock).not.toHaveBeenCalled();
  });
});

describe('curated stays are unaffected', () => {
  it('hotelToStay keeps the curated hotel images exactly as they are', () => {
    const hotel = { slug: 'curated-hotel', title: 'Curated Hotel', images: ['/images/a.jpg', '/images/b.jpg'], location: 'Manali', pricePerNight: 100 } as never;
    const stay = hotelToStay(hotel, 'manali');
    expect(stay.photos).toEqual(['/images/a.jpg', '/images/b.jpg']);
    expect(stay.source).toBe('curated');
  });
});
