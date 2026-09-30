import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';

// Real config/stayLocations.config.ts and config/staysRefreshManifest.config.ts are used
// unmocked below (via real slugs like 'manali', 'kinnaur', 'sangla-valley') — both are
// plain data/derivation files, not I/O boundaries, so there's no reason to fake them.
const {
  placeCacheFindOneAndUpdateMock,
  searchStaysMock,
  classifyPlaceLocationMock,
  filterOutExcludedPlacesMock,
  getCuratedDestinationsMock,
  comboStateFindMock,
  comboStateFindOneAndUpdateMock
} = vi.hoisted(() => ({
  placeCacheFindOneAndUpdateMock: vi.fn(),
  searchStaysMock: vi.fn(),
  classifyPlaceLocationMock: vi.fn(),
  filterOutExcludedPlacesMock: vi.fn(),
  getCuratedDestinationsMock: vi.fn(),
  comboStateFindMock: vi.fn(),
  comboStateFindOneAndUpdateMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/PlaceCache', () => ({ PlaceCache: { findOneAndUpdate: placeCacheFindOneAndUpdateMock } }));
vi.mock('@/models/StaysRefreshComboState', () => ({
  StaysRefreshComboState: { find: comboStateFindMock, findOneAndUpdate: comboStateFindOneAndUpdateMock }
}));
vi.mock('@/lib/googlePlaces', () => ({
  searchStays: searchStaysMock,
  placeName: (place: { name?: string }) => place.name ?? 'Unnamed',
  placePhotoUrls: () => [],
  placeCoordinates: () => ({ latitude: undefined, longitude: undefined })
}));
vi.mock('@/lib/placeLocationSafety', () => ({ classifyPlaceLocation: classifyPlaceLocationMock }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({ filterOutExcludedPlaces: filterOutExcludedPlacesMock }));
vi.mock('@/lib/destinations', () => ({ getCuratedDestinations: getCuratedDestinationsMock }));

const { refreshAllConfiguredStays } = await import('./staysRefresh');

const MANALI = { slug: 'manali', title: 'Manali', state: 'Himachal Pradesh', isPopular: false };
const GULMARG = { slug: 'gulmarg', title: 'Gulmarg', state: 'Jammu & Kashmir', isPopular: false };
const SHIMLA = { slug: 'shimla', title: 'Shimla', state: 'Himachal Pradesh', isPopular: false };
const SRINAGAR = { slug: 'srinagar', title: 'Srinagar', state: 'Jammu & Kashmir', isPopular: false };
const RISHIKESH = { slug: 'rishikesh', title: 'Rishikesh', state: 'Uttarakhand', isPopular: false };
// 'kinnaur' and 'sangla-valley' both resolve to the real shared search location "Sangla".
const KINNAUR = { slug: 'kinnaur', title: 'Kinnaur', state: 'Himachal Pradesh', isPopular: false };
const SANGLA_VALLEY = { slug: 'sangla-valley', title: 'Sangla Valley', state: 'Himachal Pradesh', isPopular: false };

function stubExistingStates(states: Array<{ groupKey: string; nextEligibleAt?: Date; consecutiveFailures?: number; consecutiveEmptyResults?: number }>) {
  comboStateFindMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(states) });
}

beforeEach(() => {
  placeCacheFindOneAndUpdateMock.mockReset().mockReturnValue({ lean: vi.fn().mockResolvedValue({}) });
  searchStaysMock.mockReset().mockResolvedValue({ places: [], pagesFetched: 1, saturated: true });
  classifyPlaceLocationMock.mockReset().mockReturnValue('exact');
  filterOutExcludedPlacesMock.mockReset().mockImplementation(async (_provider, items) => items);
  getCuratedDestinationsMock.mockReset().mockResolvedValue([]);
  comboStateFindOneAndUpdateMock.mockReset().mockResolvedValue({});
  stubExistingStates([]);
  vi.stubEnv('GOOGLE_PLACES_API_KEY', 'test-key');
  vi.stubEnv('GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET', '');
  vi.stubEnv('GOOGLE_PLACES_REFRESH_MAX_PAGES', '');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('refreshAllConfiguredStays — hard daily request budget (default 20)', () => {
  it('is a no-op (and reports why) when GOOGLE_PLACES_API_KEY is unset', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', '');
    const summary = await refreshAllConfiguredStays();
    expect(summary.googleRequestCount).toBe(0);
    expect(searchStaysMock).not.toHaveBeenCalled();
  });

  it('never exceeds the default budget of 20 actual requests, even with far more due groups', async () => {
    // 11 unrelated-location, non-popular destinations x 2 core types = 22 due groups —
    // more than the budget of 20 allows at the default 1-page-per-group depth.
    const elevenRealDestinations = [
      'manali',
      'gulmarg',
      'shimla',
      'srinagar',
      'rishikesh',
      'pahalgam',
      'kasauli',
      'jammu',
      'katra',
      'patnitop',
      'kullu'
    ].map((slug) => ({ slug, title: slug, state: 'Himachal Pradesh', isPopular: false }));
    getCuratedDestinationsMock.mockResolvedValue(elevenRealDestinations);
    // Mirrors real searchStays behavior: pagesFetched can never exceed the requested
    // maxPages (the 5th argument) — a Google Text Search page loop physically cannot
    // return more pages than it was asked to follow.
    searchStaysMock.mockImplementation(async (_location: string, _stayType: string, _apiKey: string, _state: string, maxPages = 1) => ({
      places: [],
      pagesFetched: Math.min(3, maxPages),
      saturated: false
    }));

    const summary = await refreshAllConfiguredStays();

    expect(summary.googleRequestCount).toBeLessThanOrEqual(20);
    expect(summary.budgetLimited).toBe(true);
  });

  it('respects a lower GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET override', async () => {
    vi.stubEnv('GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET', '2');
    getCuratedDestinationsMock.mockResolvedValue([MANALI]); // 2 core-type groups due
    searchStaysMock.mockResolvedValue({ places: [], pagesFetched: 1, saturated: true });

    const summary = await refreshAllConfiguredStays();

    expect(summary.googleRequestCount).toBeLessThanOrEqual(2);
  });
});

describe('refreshAllConfiguredStays — pagination counted in the request total (default refresh depth = 1 page)', () => {
  it('defaults scheduled refresh to 1 page per group, not the general MAX_PAGES(3)', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);

    await refreshAllConfiguredStays();

    expect(searchStaysMock).toHaveBeenCalledWith('Manali', 'hotel', 'test-key', 'Himachal Pradesh', 1);
  });

  it('a GOOGLE_PLACES_REFRESH_MAX_PAGES override multiplies the actual request count accordingly', async () => {
    vi.stubEnv('GOOGLE_PLACES_REFRESH_MAX_PAGES', '3');
    vi.stubEnv('GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET', '100');
    getCuratedDestinationsMock.mockResolvedValue([MANALI]); // 2 groups
    searchStaysMock.mockResolvedValue({ places: [], pagesFetched: 3, saturated: false });

    const summary = await refreshAllConfiguredStays();

    expect(searchStaysMock).toHaveBeenCalledWith('Manali', 'hotel', 'test-key', 'Himachal Pradesh', 3);
    expect(summary.googleRequestCount).toBe(6); // 2 groups x 3 pages each — never a flat per-group count
  });
});

describe('refreshAllConfiguredStays — rotation continues across runs', () => {
  it('a group refreshed today is NOT re-selected on a later run within its freshness window', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);

    const run1 = await refreshAllConfiguredStays();
    expect(run1.searchGroupsAttempted).toBe(2); // hotel + homestay, both never-attempted

    // Simulate the persisted state run1 would have written: both groups now fresh until
    // FRESHNESS_WINDOW_DAYS.core (21) days out.
    stubExistingStates([
      { groupKey: 'Manali|Himachal Pradesh|hotel', nextEligibleAt: new Date('2026-09-22T00:00:00.000Z') },
      { groupKey: 'Manali|Himachal Pradesh|homestay', nextEligibleAt: new Date('2026-09-22T00:00:00.000Z') }
    ]);
    searchStaysMock.mockClear();

    const run2 = await refreshAllConfiguredStays(); // same day, nothing due yet
    expect(run2.searchGroupsAttempted).toBe(0);
    expect(searchStaysMock).not.toHaveBeenCalled();
  });

  it('a group becomes eligible again once its freshness window has actually passed', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    stubExistingStates([
      { groupKey: 'Manali|Himachal Pradesh|hotel', nextEligibleAt: new Date('2026-08-01T00:00:00.000Z') }, // long past
      { groupKey: 'Manali|Himachal Pradesh|homestay', nextEligibleAt: new Date('2026-08-01T00:00:00.000Z') }
    ]);

    const summary = await refreshAllConfiguredStays();

    expect(summary.dueGroupCount).toBe(2);
    expect(summary.searchGroupsAttempted).toBe(2);
  });

  it('a never-attempted group is prioritized over one merely due again (oldest-due-first ordering)', async () => {
    vi.stubEnv('GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET', '1');
    getCuratedDestinationsMock.mockResolvedValue([MANALI]); // hotel + homestay groups
    stubExistingStates([
      // 'hotel' was already attempted once and is due again; 'homestay' has never run.
      { groupKey: 'Manali|Himachal Pradesh|hotel', nextEligibleAt: new Date('2026-08-01T00:00:00.000Z') }
    ]);

    await refreshAllConfiguredStays();

    // Budget of 1 only fits one group — it must be the never-attempted one (oldest
    // possible priority, sorts before any real past timestamp).
    expect(searchStaysMock).toHaveBeenCalledWith('Manali', 'homestay', 'test-key', 'Himachal Pradesh', 1);
    expect(searchStaysMock).not.toHaveBeenCalledWith('Manali', 'hotel', expect.anything(), expect.anything(), expect.anything());
  });
});

describe('refreshAllConfiguredStays — popular destinations cannot starve normal ones', () => {
  it('caps popular-tier groups at POPULAR_BUDGET_SHARE of the budget even when many more are due', async () => {
    // spiti-valley, kasol, haridwar: 3 real, distinct-location POPULAR destinations x 6
    // types = 18 due popular groups, all competing for a budget of 10 (share=0.4 -> cap 4).
    vi.stubEnv('GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET', '10');
    getCuratedDestinationsMock.mockResolvedValue([
      { slug: 'spiti-valley', title: 'Spiti', state: 'Himachal Pradesh', isPopular: true },
      { slug: 'kasol', title: 'Kasol', state: 'Himachal Pradesh', isPopular: true },
      { slug: 'haridwar', title: 'Haridwar', state: 'Uttarakhand', isPopular: true },
      MANALI, // non-popular, core-only — must still get a share
      GULMARG
    ]);

    const summary = await refreshAllConfiguredStays();

    const popularCalls = searchStaysMock.mock.calls.filter(([location]) => ['Spiti', 'Kasol', 'Haridwar'].includes(location as string));
    const coreCalls = searchStaysMock.mock.calls.filter(([location]) => ['Manali', 'Gulmarg'].includes(location as string));

    expect(popularCalls.length).toBeLessThanOrEqual(4); // popular capped, never allowed to consume the whole budget
    expect(coreCalls.length).toBeGreaterThan(0); // normal destinations still got a slot
    expect(summary.searchGroupsAttempted).toBeLessThanOrEqual(10);
  });

  it('lets normal-tier groups use leftover budget popular didn\'t need', async () => {
    vi.stubEnv('GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET', '10');
    // Only 1 popular destination due (well under its 4-request cap) — the other 6 slots
    // should go to core groups instead of being wasted.
    getCuratedDestinationsMock.mockResolvedValue([{ ...MANALI, isPopular: true }, GULMARG, SHIMLA, SRINAGAR]);

    const summary = await refreshAllConfiguredStays();

    expect(summary.searchGroupsAttempted).toBeGreaterThan(4);
  });
});

describe('refreshAllConfiguredStays — empty-result retry delay', () => {
  it('backs a genuinely empty Google result off LONGER than the ordinary freshness window', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    searchStaysMock.mockResolvedValue({ places: [], pagesFetched: 1, saturated: true }); // 0 raw places

    await refreshAllConfiguredStays();

    const writeCall = comboStateFindOneAndUpdateMock.mock.calls.find(([query]) => query.groupKey === 'Manali|Himachal Pradesh|hotel');
    expect(writeCall).toBeDefined();
    const update = writeCall![1];
    // core freshness window is 21 days; empty-result backoff for core is 45 days — the
    // written nextEligibleAt must reflect the LONGER empty-result window.
    const daysOut = (update.nextEligibleAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysOut).toBeGreaterThan(21);
    expect(update.consecutiveEmptyResults).toBe(1);
  });

  it('does not permanently suppress an empty-result combo — it still gets a finite, real future retry date', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    searchStaysMock.mockResolvedValue({ places: [], pagesFetched: 1, saturated: true });

    await refreshAllConfiguredStays();

    const writeCall = comboStateFindOneAndUpdateMock.mock.calls.find(([query]) => query.groupKey === 'Manali|Himachal Pradesh|hotel');
    const update = writeCall![1];
    expect(update.nextEligibleAt).toBeInstanceOf(Date);
    expect(Number.isFinite(update.nextEligibleAt.getTime())).toBe(true);
  });

  it('resets consecutiveEmptyResults to 0 once a result actually comes back', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    stubExistingStates([{ groupKey: 'Manali|Himachal Pradesh|hotel', nextEligibleAt: new Date('2026-08-01T00:00:00.000Z'), consecutiveEmptyResults: 3 }]);
    searchStaysMock.mockResolvedValue({ places: [{ id: 'p1', name: 'A', types: ['lodging'] }], pagesFetched: 1, saturated: true });

    await refreshAllConfiguredStays();

    const writeCall = comboStateFindOneAndUpdateMock.mock.calls.find(([query]) => query.groupKey === 'Manali|Himachal Pradesh|hotel');
    expect(writeCall![1].consecutiveEmptyResults).toBe(0);
  });
});

describe('refreshAllConfiguredStays — provider-failure backoff', () => {
  it('a failed group backs off rather than being retried on the very next run', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    searchStaysMock.mockRejectedValue(new Error('network timeout'));

    await refreshAllConfiguredStays();

    const writeCall = comboStateFindOneAndUpdateMock.mock.calls.find(([query]) => query.groupKey === 'Manali|Himachal Pradesh|hotel');
    expect(writeCall).toBeDefined();
    const update = writeCall![1];
    expect(update.consecutiveFailures).toBe(1);
    expect(update.nextEligibleAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('grows the backoff with repeated consecutive failures, capped at FAILURE_BACKOFF_MAX_DAYS', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    stubExistingStates([{ groupKey: 'Manali|Himachal Pradesh|hotel', nextEligibleAt: new Date('2026-08-01T00:00:00.000Z'), consecutiveFailures: 10 }]);
    searchStaysMock.mockImplementation(async (location: string, stayType: string) => {
      if (stayType === 'hotel') throw new Error('still failing');
      return { places: [], pagesFetched: 1, saturated: true };
    });

    await refreshAllConfiguredStays();

    const writeCall = comboStateFindOneAndUpdateMock.mock.calls.find(([query]) => query.groupKey === 'Manali|Himachal Pradesh|hotel');
    const update = writeCall![1];
    expect(update.consecutiveFailures).toBe(11);
    const daysOut = (update.nextEligibleAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysOut).toBeLessThanOrEqual(14); // FAILURE_BACKOFF_MAX_DAYS
  });

  it('an upsert-only write never deletes existing PlaceCache data on a failed group — it simply isn\'t called for that group', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    searchStaysMock.mockRejectedValue(new Error('network timeout'));

    await refreshAllConfiguredStays();

    expect(placeCacheFindOneAndUpdateMock).not.toHaveBeenCalled();
  });
});

describe('refreshAllConfiguredStays — duplicate-search dedup and exclusion filtering (unchanged from prior correction)', () => {
  it('groups two destinations sharing a real search location into ONE Google call per stay type', async () => {
    getCuratedDestinationsMock.mockResolvedValue([KINNAUR, SANGLA_VALLEY]);

    const summary = await refreshAllConfiguredStays();

    expect(summary.manifestTagCount).toBe(4); // 2 destinations x 2 core types
    expect(summary.searchGroupCount).toBe(2); // deduped by shared "Sangla" location
    expect(searchStaysMock).toHaveBeenCalledTimes(2);
  });

  it('applies the property exclusion filter before writing to PlaceCache', async () => {
    getCuratedDestinationsMock.mockResolvedValue([MANALI]);
    searchStaysMock.mockResolvedValue({
      places: [
        { id: 'normal-id', name: 'Mountain View Resort', types: ['lodging'] },
        { id: 'excluded-id', name: 'Excluded Resort', types: ['lodging'] }
      ],
      pagesFetched: 1,
      saturated: true
    });
    filterOutExcludedPlacesMock.mockImplementation(async (_provider, items) => items.filter((item: { placeId: string }) => item.placeId !== 'excluded-id'));

    await refreshAllConfiguredStays();

    const persistedPlaceIds = placeCacheFindOneAndUpdateMock.mock.calls.map(([query]) => query.placeId);
    expect(persistedPlaceIds.every((id: string) => id === 'normal-id')).toBe(true);
  });

  it('skips a destination with no authored stay-location rule rather than guessing a search location', async () => {
    getCuratedDestinationsMock.mockResolvedValue([{ slug: 'not-a-real-mapped-destination', title: 'Nowhere', state: 'Himachal Pradesh' }]);

    const summary = await refreshAllConfiguredStays();

    expect(summary.manifestTagCount).toBe(0);
    expect(searchStaysMock).not.toHaveBeenCalled();
  });
});
