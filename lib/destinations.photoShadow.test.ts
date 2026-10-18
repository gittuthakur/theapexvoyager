import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Same mocks as lib/destinations.liveSearch.test.ts: no Google, no MongoDB. `placePhotoUrls` returns the URLs a test attaches to a place.
const m = vi.hoisted(() => {
  class ExclusionLookupError extends Error {}
  return {
    ExclusionLookupError,
    searchDestinations: vi.fn(),
    cacheFindOne: vi.fn(),
    cacheUpsert: vi.fn(),
    connectDB: vi.fn(),
    getActiveExclusionSet: vi.fn(),
    isRecentFailure: vi.fn(),
    markFailure: vi.fn(),
    destinationFindOne: vi.fn(),
    fetch: vi.fn()
  };
});

vi.mock('@/lib/mongodb', () => ({ connectDB: m.connectDB }));
vi.mock('@/models/Destination', () => ({ Destination: { find: vi.fn(), findOne: m.destinationFindOne } }));
vi.mock('@/models/DestinationSearchCache', () => ({ DestinationSearchCache: { findOne: m.cacheFindOne, findOneAndUpdate: m.cacheUpsert } }));
vi.mock('@/lib/googlePlaces', () => ({
  searchDestinations: m.searchDestinations,
  placeName: (place: { displayName?: { text: string } }) => place.displayName?.text ?? 'Untitled place',
  placePhotoUrls: (place: { photoUrls?: unknown }) => place.photoUrls ?? []
}));
vi.mock('@/lib/negativeCache', () => ({ isRecentFailure: m.isRecentFailure, markFailure: m.markFailure }));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: () => false }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({
  ExclusionLookupError: m.ExclusionLookupError,
  getActiveExclusionSet: m.getActiveExclusionSet
}));
vi.mock('@/config/destinations.config', () => ({
  destinations: [{ slug: 'manali', title: 'Manali', category: 'Most Popular', description: 'x', toursCount: 1, image: '/m.jpg' }]
}));

const { getDestinationsForLocationResult } = await import('./destinations');

const NAME_A = 'places/ChIJsecretDestA/photos/AUacShDestTokenAAAA';
const NAME_B = 'places/ChIJsecretDestB/photos/AUacShDestTokenBBBB';
const proxy = (name: string, w = 1200) => `/api/places/photo?name=${encodeURIComponent(name)}&w=${w}`;
const leanOf = (value: unknown) => ({ lean: () => Promise.resolve(value) });
const place = (id: string, name: string, photoUrls?: unknown) => ({ id, displayName: { text: name }, formattedAddress: `${name}, Himachal Pradesh`, rating: 4.5, userRatingCount: 10, photoUrls });

const PLACES = [
  place('d-1', 'Hadimba Temple', [proxy(NAME_A), proxy(NAME_B, 640)]),
  place('d-2', 'Mall Road', ['https://cdn.example.com/own.jpg']),
  place('d-3', 'Old Manali', [])
];

function logged(spy: { mock: { calls: unknown[][] } }): unknown[][] {
  return spy.mock.calls.filter((call) => call[0] === '[photo-shadow]');
}

async function lookup(mode: string | undefined, places: unknown[] = PLACES) {
  m.searchDestinations.mockReset().mockResolvedValue(places);
  m.cacheUpsert.mockReset().mockResolvedValue(undefined);
  m.cacheFindOne.mockReset().mockReturnValue(leanOf(null));
  m.getActiveExclusionSet.mockReset().mockResolvedValue(new Set<string>());
  if (mode === undefined) delete process.env.GOOGLE_PHOTO_PERSISTENCE_MODE;
  else process.env.GOOGLE_PHOTO_PERSISTENCE_MODE = mode;
  const result = await getDestinationsForLocationResult('Manali');
  return {
    result,
    searches: structuredClone(m.searchDestinations.mock.calls),
    cacheWrites: structuredClone(m.cacheUpsert.mock.calls),
    cacheReads: m.cacheFindOne.mock.calls.length,
    exclusionReads: m.getActiveExclusionSet.mock.calls.length
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.GOOGLE_PLACES_API_KEY = 'test-key-not-real';
  delete process.env.GOOGLE_DESTINATION_LIVE_SEARCH;
  delete process.env.GOOGLE_PHOTO_PERSISTENCE_MODE;
  m.connectDB.mockResolvedValue(undefined);
  m.isRecentFailure.mockReturnValue(false);
  m.destinationFindOne.mockReturnValue(leanOf(null));
  vi.stubGlobal('fetch', m.fetch);
  // The code stamps lastSyncedAt with the current time; freezing the clock lets two runs be compared exactly.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-01T00:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
  delete process.env.GOOGLE_PHOTO_PERSISTENCE_MODE;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('shadow mode leaves the destination search and its cache write unchanged', () => {
  it('returns identical destinations and writes an identical cache document, with identical Google and database calls', async () => {
    const legacy = await lookup(undefined);
    const shadow = await lookup('shadow');
    expect(shadow.result).toEqual(legacy.result);
    expect(shadow.cacheWrites).toEqual(legacy.cacheWrites);
    expect(shadow.searches).toEqual(legacy.searches);
    expect(shadow.cacheReads).toBe(legacy.cacheReads);
    expect(shadow.exclusionReads).toBe(legacy.exclusionReads);
    expect(JSON.stringify(shadow.cacheWrites)).toBe(JSON.stringify(legacy.cacheWrites));
    expect(m.searchDestinations).toHaveBeenCalledTimes(1);
    expect(m.cacheUpsert).toHaveBeenCalledTimes(1);
    expect(m.fetch).not.toHaveBeenCalled();
  });

  it('the stored photo arrays are exactly what Google returned (nothing replaced, removed or reordered)', async () => {
    const { cacheWrites } = await lookup('shadow');
    const stored = (cacheWrites[0][1] as { results: Array<{ photos: unknown }> }).results.map((item) => item.photos);
    expect(stored).toEqual([PLACES[0].photoUrls, PLACES[1].photoUrls, []]);
  });

  it('exposes no statistics in the returned data (this path is public)', async () => {
    const { result } = await lookup('shadow');
    expect(Object.keys(result).sort()).toEqual(['destinations']);
    expect(JSON.stringify(result)).not.toContain('photo-shadow');
    expect(JSON.stringify(result)).not.toContain('googleOriginPhotos');
  });
});

describe('the shadow log line', () => {
  it('is written once, in shadow mode only, as numbers with a fixed label', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await lookup('shadow');
    expect(logged(info)).toHaveLength(1);
    expect(logged(info)[0][1]).toEqual({
      source: 'destination-search',
      propertiesScanned: 3,
      photosScanned: 3,
      googleOriginPhotos: 2,
      photoNameTokenPhotos: 2,
      unknownPhotoSources: 1,
      propertiesWithoutPhotos: 1,
      malformedPhotoEntries: 0,
      skippedForBounds: 0
    });
  });

  it('is never written in legacy mode or for unknown and reserved modes', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    for (const mode of [undefined, '', 'legacy', 'stop-new-writes', 'enforce', 'garbage']) await lookup(mode);
    expect(logged(info)).toHaveLength(0);
  });

  it('contains no photo identifier, name, Place ID or URL, in any console output', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    await lookup('shadow');
    const output = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    for (const secret of ['places/', 'ChIJ', 'AUacSh', 'DestTokenAAAA', 'DestTokenBBBB', 'api/places', 'Hadimba', 'Mall Road', 'd-1', 'cdn.example.com']) expect(output).not.toContain(secret);
    expect(output).toContain('photo-shadow');
  });

  it('handles missing and malformed photo values without changing the cached document', async () => {
    const messy = [place('x-1', 'No Photos'), place('x-2', 'Null', null), place('x-3', 'Weird', 'nope'), place('x-4', 'Mixed', [proxy(NAME_A), null, 7])];
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const legacy = await lookup(undefined, messy);
    const shadow = await lookup('shadow', messy);
    expect(shadow.cacheWrites).toEqual(legacy.cacheWrites);
    expect(logged(info)[0][1]).toMatchObject({ propertiesScanned: 4, googleOriginPhotos: 1, propertiesWithoutPhotos: 3, malformedPhotoEntries: 3 });
  });

  it('a failing logger can never break the search', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {
      throw new Error('logger down');
    });
    const { result } = await lookup('shadow');
    expect(result.destinations).toHaveLength(3);
  });
});

describe('owner exclusions and cost behaviour are unchanged', () => {
  it('an excluded place is neither returned, cached nor counted, in either mode', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    for (const mode of [undefined, 'shadow']) {
      m.getActiveExclusionSet.mockReset().mockResolvedValue(new Set(['d-1']));
      m.searchDestinations.mockReset().mockResolvedValue(PLACES);
      m.cacheFindOne.mockReset().mockReturnValue(leanOf(null));
      m.cacheUpsert.mockReset().mockResolvedValue(undefined);
      if (mode) process.env.GOOGLE_PHOTO_PERSISTENCE_MODE = mode;
      else delete process.env.GOOGLE_PHOTO_PERSISTENCE_MODE;
      const { destinations } = await getDestinationsForLocationResult('Manali');
      expect(destinations.map((d) => d.placeId)).toEqual(['d-2', 'd-3']);
      const cached = (m.cacheUpsert.mock.calls[0][1] as { results: Array<{ placeId: string }> }).results.map((r) => r.placeId);
      expect(cached).toEqual(['d-2', 'd-3']);
    }
    expect(logged(info)[0][1]).toMatchObject({ propertiesScanned: 2, googleOriginPhotos: 0 });
  });

  it('when the exclusion list cannot be read, nothing is fetched, cached or counted, and no statistics are logged', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    m.getActiveExclusionSet.mockReset().mockRejectedValue(new m.ExclusionLookupError('down'));
    process.env.GOOGLE_PHOTO_PERSISTENCE_MODE = 'shadow';
    const result = await getDestinationsForLocationResult('Manali');
    expect(result).toEqual({ destinations: [], unavailable: true });
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.cacheUpsert).not.toHaveBeenCalled();
    expect(logged(info)).toHaveLength(0);
  });

  it('a cache hit makes no Google call and logs nothing (shadow only observes values about to be written)', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    m.getActiveExclusionSet.mockReset().mockResolvedValue(new Set<string>());
    m.cacheFindOne.mockReset().mockReturnValue(leanOf({ results: [{ placeId: 'c-1', photos: [proxy(NAME_A)] }] }));
    m.searchDestinations.mockReset();
    process.env.GOOGLE_PHOTO_PERSISTENCE_MODE = 'shadow';
    await getDestinationsForLocationResult('Manali');
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(logged(info)).toHaveLength(0);
  });
});

describe('a failing shadow classifier or logger can never break the destination search', () => {
  it('still returns and caches exactly what legacy does when the summarizer throws', async () => {
    const legacy = await lookup(undefined);

    vi.resetModules();
    vi.doMock('@/lib/photoProvenanceShadow', async (importOriginal) => ({
      ...(await importOriginal<typeof import('./photoProvenanceShadow')>()),
      summarizePhotoShadow: () => {
        throw new Error('classifier exploded');
      }
    }));
    try {
      const { getDestinationsForLocationResult: brokenLookup } = await import('./destinations');
      m.searchDestinations.mockReset().mockResolvedValue(PLACES);
      m.cacheUpsert.mockReset().mockResolvedValue(undefined);
      m.cacheFindOne.mockReset().mockReturnValue(leanOf(null));
      m.getActiveExclusionSet.mockReset().mockResolvedValue(new Set<string>());
      process.env.GOOGLE_PHOTO_PERSISTENCE_MODE = 'shadow';
      const result = await brokenLookup('Manali');
      expect(result).toEqual(legacy.result);
      expect(structuredClone(m.cacheUpsert.mock.calls)).toEqual(legacy.cacheWrites);
      expect(m.searchDestinations).toHaveBeenCalledTimes(1);
    } finally {
      vi.doUnmock('@/lib/photoProvenanceShadow');
      vi.resetModules();
    }
  });
});
