import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Same mocks as lib/staysRefresh.test.ts: no MongoDB and no Google. `placePhotoUrls` here returns the photo URLs a test attaches to a
// place, so the refresh builds real-looking photo arrays that these tests can compare between modes.
const { placeCacheFindOneAndUpdateMock, searchStaysMock, classifyPlaceLocationMock, filterOutExcludedPlacesMock, getCuratedDestinationsMock, comboStateFindMock, comboStateFindOneAndUpdateMock, connectDBMock, fetchMock } = vi.hoisted(() => ({
  placeCacheFindOneAndUpdateMock: vi.fn(),
  searchStaysMock: vi.fn(),
  classifyPlaceLocationMock: vi.fn(),
  filterOutExcludedPlacesMock: vi.fn(),
  getCuratedDestinationsMock: vi.fn(),
  comboStateFindMock: vi.fn(),
  comboStateFindOneAndUpdateMock: vi.fn(),
  connectDBMock: vi.fn(),
  fetchMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: connectDBMock }));
vi.mock('@/models/PlaceCache', () => ({ PlaceCache: { findOneAndUpdate: placeCacheFindOneAndUpdateMock } }));
vi.mock('@/models/StaysRefreshComboState', () => ({ StaysRefreshComboState: { find: comboStateFindMock, findOneAndUpdate: comboStateFindOneAndUpdateMock } }));
vi.mock('@/lib/googlePlaces', () => ({
  searchStays: searchStaysMock,
  placeName: (place: { name?: string }) => place.name ?? 'Unnamed',
  placePhotoUrls: (place: { photoUrls?: unknown }) => place.photoUrls ?? [],
  placeCoordinates: () => ({ latitude: undefined, longitude: undefined })
}));
vi.mock('@/lib/placeLocationSafety', () => ({ classifyPlaceLocation: classifyPlaceLocationMock }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({ filterOutExcludedPlaces: filterOutExcludedPlacesMock }));
vi.mock('@/lib/destinations', () => ({ getCuratedDestinations: getCuratedDestinationsMock }));

const { refreshAllConfiguredStays } = await import('./staysRefresh');

const NAME_A = 'places/ChIJsecretRefreshA/photos/AUacShRefreshTokenAAAA';
const NAME_B = 'places/ChIJsecretRefreshB/photos/AUacShRefreshTokenBBBB';
const proxy = (name: string, w = 1200) => `/api/places/photo?name=${encodeURIComponent(name)}&w=${w}`;
const MANALI = { slug: 'manali', title: 'Manali', state: 'Himachal Pradesh', isPopular: false };
const KINNAUR = { slug: 'kinnaur', title: 'Kinnaur', state: 'Himachal Pradesh', isPopular: false };
const SANGLA_VALLEY = { slug: 'sangla-valley', title: 'Sangla Valley', state: 'Himachal Pradesh', isPopular: false };

const PLACES = [
  { id: 'place-1', name: 'Hotel Alpha', formattedAddress: 'Manali', photoUrls: [proxy(NAME_A), proxy(NAME_B, 640)] },
  { id: 'place-2', name: 'Hotel Beta', formattedAddress: 'Manali', photoUrls: ['https://cdn.example.com/own.jpg'] },
  { id: 'place-3', name: 'Hotel Gamma', formattedAddress: 'Manali', photoUrls: [] }
];

/** One destination fans out to one search group per core stay type, and each group writes the same places: expect results in multiples of the groups attempted. */
const times = <T,>(items: T[], n: number): T[] => Array.from({ length: n }, () => items).flat();

function arrange(destinations = [MANALI], places: unknown[] = PLACES) {
  getCuratedDestinationsMock.mockResolvedValue(destinations);
  searchStaysMock.mockResolvedValue({ places, pagesFetched: 1, saturated: true });
}

/** Runs one full refresh and returns everything observable: the summary and every call the refresh made on every mock. */
async function runRefresh(mode: string | undefined) {
  for (const mock of [placeCacheFindOneAndUpdateMock, searchStaysMock, comboStateFindMock, comboStateFindOneAndUpdateMock, filterOutExcludedPlacesMock, connectDBMock, fetchMock, getCuratedDestinationsMock]) mock.mockClear();
  if (mode === undefined) vi.stubEnv('GOOGLE_PHOTO_PERSISTENCE_MODE', undefined as unknown as string);
  else vi.stubEnv('GOOGLE_PHOTO_PERSISTENCE_MODE', mode);
  const summary = await refreshAllConfiguredStays();
  return {
    summary,
    writes: structuredClone(placeCacheFindOneAndUpdateMock.mock.calls),
    searches: structuredClone(searchStaysMock.mock.calls),
    comboReads: comboStateFindMock.mock.calls.length,
    comboWrites: structuredClone(comboStateFindOneAndUpdateMock.mock.calls),
    exclusionChecks: structuredClone(filterOutExcludedPlacesMock.mock.calls),
    connects: connectDBMock.mock.calls.length,
    fetches: fetchMock.mock.calls.length
  };
}

beforeEach(() => {
  placeCacheFindOneAndUpdateMock.mockReset().mockReturnValue({ lean: vi.fn().mockResolvedValue({}) });
  searchStaysMock.mockReset();
  classifyPlaceLocationMock.mockReset().mockReturnValue('exact');
  filterOutExcludedPlacesMock.mockReset().mockImplementation(async (_provider, items) => items);
  getCuratedDestinationsMock.mockReset();
  comboStateFindMock.mockReset().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
  comboStateFindOneAndUpdateMock.mockReset().mockResolvedValue({});
  connectDBMock.mockReset().mockResolvedValue(undefined);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GOOGLE_PLACES_API_KEY', 'test-key');
  vi.stubEnv('GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET', '');
  vi.stubEnv('GOOGLE_PLACES_REFRESH_MAX_PAGES', '');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('legacy mode (default): exactly the behaviour before this change', () => {
  it.each([undefined, '', '  ', 'legacy'])('mode %j writes the stored photo arrays and adds nothing to the summary', async (mode) => {
    arrange();
    const run = await runRefresh(mode);
    const groups = run.summary.searchGroupsAttempted;
    expect(groups).toBeGreaterThan(0);
    expect(run.writes).toHaveLength(3 * groups);
    expect(run.writes.map((call) => (call[1] as { photos: unknown }).photos)).toEqual(times([PLACES[0].photoUrls, PLACES[1].photoUrls, []], groups));
    expect('photoProvenanceShadow' in run.summary).toBe(false);
    expect(Object.keys(run.summary).sort()).toEqual(['budgetLimited', 'destinationsProcessed', 'dueGroupCount', 'errors', 'googleRequestCount', 'manifestTagCount', 'recordsUpserted', 'searchGroupCount', 'searchGroupsAttempted', 'searchGroupsSkippedForBudget']);
  });
});

describe('shadow mode changes nothing that is written, requested or returned to the database', () => {
  it('writes byte-identical documents, makes identical Google requests and identical database calls', async () => {
    arrange();
    const legacy = await runRefresh(undefined);
    arrange();
    const shadow = await runRefresh('shadow');
    expect(shadow.writes).toEqual(legacy.writes);
    expect(shadow.searches).toEqual(legacy.searches);
    expect(shadow.comboReads).toBe(legacy.comboReads);
    expect(shadow.comboWrites).toEqual(legacy.comboWrites);
    expect(shadow.exclusionChecks).toEqual(legacy.exclusionChecks);
    expect(shadow.connects).toBe(legacy.connects);
    expect(shadow.fetches).toBe(0);
    expect(legacy.fetches).toBe(0);
    expect(JSON.stringify(shadow.writes)).toBe(JSON.stringify(legacy.writes));
  });

  it('every stored photo array is exactly what Google returned: nothing replaced, removed, reordered or emptied', async () => {
    arrange();
    const { writes, summary } = await runRefresh('shadow');
    expect(writes.map((call) => (call[1] as { photos: unknown }).photos)).toEqual(times([PLACES[0].photoUrls, PLACES[1].photoUrls, []], summary.searchGroupsAttempted));
    for (const call of writes) expect(Object.keys(call[1] as object)).toContain('photos');
  });

  it('the summary is identical to legacy apart from the one added aggregate key', async () => {
    arrange();
    const legacy = await runRefresh(undefined);
    arrange();
    const shadow = await runRefresh('shadow');
    const { photoProvenanceShadow, ...rest } = shadow.summary;
    expect(rest).toEqual(legacy.summary);
    expect(photoProvenanceShadow).toBeDefined();
  });

  it('makes no extra Google request or database operation (call counts equal legacy)', async () => {
    arrange();
    const legacy = await runRefresh('legacy');
    arrange();
    const shadow = await runRefresh('shadow');
    expect(searchStaysMock).toHaveBeenCalledTimes(legacy.searches.length);
    expect(shadow.summary.googleRequestCount).toBe(legacy.summary.googleRequestCount);
    expect(placeCacheFindOneAndUpdateMock).toHaveBeenCalledTimes(legacy.writes.length);
    expect(comboStateFindOneAndUpdateMock).toHaveBeenCalledTimes(legacy.comboWrites.length);
  });

  it('does not schedule an extra run: the due and attempted group counts are unchanged', async () => {
    arrange();
    const legacy = await runRefresh(undefined);
    arrange();
    const shadow = await runRefresh('shadow');
    expect(shadow.summary.dueGroupCount).toBe(legacy.summary.dueGroupCount);
    expect(shadow.summary.searchGroupsAttempted).toBe(legacy.summary.searchGroupsAttempted);
  });
});

describe('shadow statistics', () => {
  it('are exact aggregate counts of the documents written', async () => {
    arrange();
    const { summary } = await runRefresh('shadow');
    const g = summary.searchGroupsAttempted;
    expect(g).toBeGreaterThan(0);
    expect(summary.photoProvenanceShadow).toEqual({
      propertiesScanned: 3 * g,
      photosScanned: 3 * g,
      googleOriginPhotos: 2 * g,
      photoNameTokenPhotos: 2 * g,
      unknownPhotoSources: 1 * g,
      propertiesWithoutPhotos: 1 * g,
      malformedPhotoEntries: 0,
      skippedForBounds: 0
    });
  });

  it('count every document written when several destinations share one search group', async () => {
    arrange([KINNAUR, SANGLA_VALLEY], PLACES);
    const { summary, writes } = await runRefresh('shadow');
    expect(writes.length).toBeGreaterThanOrEqual(6);
    expect(summary.photoProvenanceShadow?.propertiesScanned).toBe(writes.length);
  });

  it('contain numbers only: no photo identifier, name, Place ID or URL, anywhere in the serialized summary', async () => {
    arrange();
    const { summary } = await runRefresh('shadow');
    const json = JSON.stringify(summary.photoProvenanceShadow);
    for (const secret of ['places/', 'ChIJ', 'AUacSh', 'TokenAAAA', 'TokenBBBB', 'api/places', 'Hotel Alpha', 'place-1', 'cdn.example.com', 'manali']) expect(json).not.toContain(secret);
    expect(Object.values(summary.photoProvenanceShadow ?? {}).every((value) => typeof value === 'number')).toBe(true);
  });

  it('handle places with missing, null and malformed photo arrays without changing what is written', async () => {
    const messy = [
      { id: 'm1', name: 'M1', formattedAddress: 'Manali' },
      { id: 'm2', name: 'M2', formattedAddress: 'Manali', photoUrls: null },
      { id: 'm3', name: 'M3', formattedAddress: 'Manali', photoUrls: 'not-an-array' },
      { id: 'm4', name: 'M4', formattedAddress: 'Manali', photoUrls: [proxy(NAME_A), null, 5, ''] }
    ];
    arrange([MANALI], messy);
    const legacy = await runRefresh(undefined);
    arrange([MANALI], messy);
    const shadow = await runRefresh('shadow');
    expect(shadow.writes).toEqual(legacy.writes);
    const g = shadow.summary.searchGroupsAttempted;
    expect(shadow.summary.photoProvenanceShadow).toMatchObject({ propertiesScanned: 4 * g, googleOriginPhotos: 1 * g, propertiesWithoutPhotos: 3 * g, malformedPhotoEntries: 4 * g });
  });

  it('are present (all zero) in shadow mode even when nothing was refreshed', async () => {
    arrange([], []);
    const { summary } = await runRefresh('shadow');
    expect(summary.photoProvenanceShadow).toEqual({ propertiesScanned: 0, photosScanned: 0, googleOriginPhotos: 0, photoNameTokenPhotos: 0, unknownPhotoSources: 0, propertiesWithoutPhotos: 0, malformedPhotoEntries: 0, skippedForBounds: 0 });
  });
});

describe('unknown and reserved modes stay legacy', () => {
  it.each(['stop-new-writes', 'enforce', 'ENFORCE', 'disabled', 'fresh', 'true', 'shadows', 'shadow;enforce'])('mode %j behaves exactly like legacy', async (mode) => {
    arrange();
    const legacy = await runRefresh(undefined);
    arrange();
    const other = await runRefresh(mode);
    expect(other.writes).toEqual(legacy.writes);
    expect(other.searches).toEqual(legacy.searches);
    expect('photoProvenanceShadow' in other.summary).toBe(false);
  });
});

describe('logging and owner exclusions', () => {
  it('writes no photo identifier to any log in either mode, and no shadow line at all in legacy', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    arrange();
    await runRefresh(undefined);
    arrange();
    await runRefresh('shadow');
    const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    for (const secret of ['places/', 'ChIJ', 'AUacSh', 'TokenAAAA', 'api/places', 'Hotel Alpha', 'place-1', 'cdn.example.com']) expect(logged).not.toContain(secret);
    expect(logged).not.toContain('photo-shadow');
  });

  it('owner exclusions are unchanged: an excluded place is never written, in either mode', async () => {
    filterOutExcludedPlacesMock.mockImplementation(async (_provider, items: Array<{ placeId: string }>) => items.filter((item) => item.placeId !== 'place-1'));
    arrange();
    const legacy = await runRefresh(undefined);
    arrange();
    const shadow = await runRefresh('shadow');
    const ids = (run: typeof legacy) => run.writes.map((call) => (call[0] as { placeId: string }).placeId);
    expect(ids(shadow)).toEqual(ids(legacy));
    expect(ids(shadow)).not.toContain('place-1');
    expect(shadow.summary.photoProvenanceShadow?.googleOriginPhotos).toBe(0);
  });
});

describe('a failing shadow classifier can never break a refresh', () => {
  it('still refreshes, writes identical documents and reports no error when the summarizer throws', async () => {
    arrange();
    const legacy = await runRefresh(undefined);

    vi.resetModules();
    vi.doMock('@/lib/photoProvenanceShadow', async (importOriginal) => ({
      ...(await importOriginal<typeof import('./photoProvenanceShadow')>()),
      summarizePhotoShadow: () => {
        throw new Error('classifier exploded');
      }
    }));
    try {
      const { refreshAllConfiguredStays: refreshWithBrokenClassifier } = await import('./staysRefresh');
      arrange();
      for (const mock of [placeCacheFindOneAndUpdateMock, searchStaysMock, comboStateFindOneAndUpdateMock]) mock.mockClear();
      vi.stubEnv('GOOGLE_PHOTO_PERSISTENCE_MODE', 'shadow');
      const summary = await refreshWithBrokenClassifier();
      expect(summary.errors).toEqual([]);
      expect(summary.recordsUpserted).toBe(legacy.summary.recordsUpserted);
      expect(summary.googleRequestCount).toBe(legacy.summary.googleRequestCount);
      expect(structuredClone(placeCacheFindOneAndUpdateMock.mock.calls)).toEqual(legacy.writes);
      expect(structuredClone(comboStateFindOneAndUpdateMock.mock.calls)).toEqual(legacy.comboWrites);
      expect(Object.values(summary.photoProvenanceShadow ?? {}).every((value) => value === 0)).toBe(true);
    } finally {
      vi.doUnmock('@/lib/photoProvenanceShadow');
      vi.resetModules();
    }
  });
});
