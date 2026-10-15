import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fix A: the live Google destination search is confined to authored locations, withholds owner-excluded places
// before anything is returned or cached, and fails closed when the exclusion list cannot be read. Google, MongoDB and
// the exclusion service are all mocked — nothing here touches the network or a database.
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
    destinationFindOne: vi.fn()
  };
});

vi.mock('@/lib/mongodb', () => ({ connectDB: m.connectDB }));
vi.mock('@/models/Destination', () => ({ Destination: { find: vi.fn(), findOne: m.destinationFindOne } }));
vi.mock('@/models/DestinationSearchCache', () => ({ DestinationSearchCache: { findOne: m.cacheFindOne, findOneAndUpdate: m.cacheUpsert } }));
vi.mock('@/lib/googlePlaces', () => ({
  searchDestinations: m.searchDestinations,
  placeName: (place: { displayName?: { text: string } }) => place.displayName?.text ?? 'Untitled place',
  placePhotoUrls: () => []
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

const { getDestinationsForLocation, getDestinationsForLocationResult, getDestinationsWithFallbackResult, getDestinationBySlug, isApprovedLiveSearchLocation, isLiveDestinationSearchDisabled } =
  await import('./destinations');

const place = (id: string, name: string) => ({ id, displayName: { text: name }, formattedAddress: `${name}, Himachal Pradesh`, rating: 4.5, userRatingCount: 10 });
const leanOf = (value: unknown) => ({ lean: () => Promise.resolve(value) });

beforeEach(() => {
  vi.resetAllMocks();
  process.env.GOOGLE_PLACES_API_KEY = 'test-key-not-real';
  delete process.env.GOOGLE_DESTINATION_LIVE_SEARCH;
  m.connectDB.mockResolvedValue(undefined);
  m.isRecentFailure.mockReturnValue(false);
  m.cacheFindOne.mockReturnValue(leanOf(null));
  m.cacheUpsert.mockResolvedValue(undefined);
  m.getActiveExclusionSet.mockResolvedValue(new Set<string>());
  m.searchDestinations.mockResolvedValue([place('p-ok', 'Hadimba Temple')]);
  m.destinationFindOne.mockReturnValue(leanOf(null));
});

describe('allowlist — Google is only ever queried for authored locations', () => {
  it.each(['hotels', 'zzz', 'random string 12345', "Robert'); DROP", 'x'.repeat(80)])('"%s" is not approved and triggers no Google call, cache read or cache write', async (location) => {
    const result = await getDestinationsForLocationResult(location);

    expect(isApprovedLiveSearchLocation(location)).toBe(false);
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.cacheFindOne).not.toHaveBeenCalled();
    expect(m.cacheUpsert).not.toHaveBeenCalled();
    expect(m.getActiveExclusionSet).not.toHaveBeenCalled();
    expect(result.unavailable).toBeUndefined();
  });

  it('a blank or whitespace-only location matches nothing instead of every curated destination', async () => {
    for (const blank of [' ', '   ', '\t']) {
      const result = await getDestinationsForLocationResult(blank);
      expect(result.destinations, JSON.stringify(blank)).toEqual([]);
    }
    expect(m.searchDestinations).not.toHaveBeenCalled();
  });

  it('approves default locations, destination titles and stay locations (primary and nearby), ignoring case and spacing', () => {
    for (const name of ['Manali', '  manali ', 'KASOL', 'Spiti', 'Sangla', 'Kalpa', 'Chitkul', 'Mcleod  Ganj'.replace('Mcleod', 'McLeod')]) {
      expect(isApprovedLiveSearchLocation(name), name).toBe(true);
    }
  });

  it('an approved location still works: one Google search, results returned and cached', async () => {
    const result = await getDestinationsForLocationResult('Manali');

    expect(m.searchDestinations).toHaveBeenCalledTimes(1);
    expect(m.searchDestinations).toHaveBeenCalledWith('Manali', 'test-key-not-real');
    expect(result.destinations.map((d) => d.placeId)).toEqual(['p-ok']);
    expect(m.cacheUpsert).toHaveBeenCalledTimes(1);
    expect(m.cacheUpsert.mock.calls[0][0]).toEqual({ location: 'manali' });
  });

  it('an approved location with a cache hit makes no Google call', async () => {
    m.cacheFindOne.mockReturnValue(leanOf({ results: [{ slug: 'a', title: 'A', placeId: 'p-cached' }] }));

    const destinations = await getDestinationsForLocation('Manali');

    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(destinations.map((d) => d.placeId)).toEqual(['p-cached']);
  });

  it('keeps the previous failure behaviour: a Google error is remembered and answered with curated fallback data', async () => {
    m.searchDestinations.mockRejectedValue(new Error('upstream'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await getDestinationsForLocationResult('Manali');

    expect(m.markFailure).toHaveBeenCalledWith('destination:manali');
    expect(result.destinations.map((d) => d.slug)).toEqual(['manali']);
  });
});

describe('owner exclusions — never returned and never written', () => {
  it('filters an excluded place out of a fresh Google result BEFORE it is cached or returned', async () => {
    m.getActiveExclusionSet.mockResolvedValue(new Set(['p-excluded']));
    m.searchDestinations.mockResolvedValue([place('p-excluded', 'Excluded Hotel'), place('p-ok', 'Hadimba Temple')]);

    const result = await getDestinationsForLocationResult('Manali');

    expect(result.destinations.map((d) => d.placeId)).toEqual(['p-ok']);
    const written = m.cacheUpsert.mock.calls[0][1] as { results: Array<{ placeId: string }> };
    expect(written.results.map((d) => d.placeId)).toEqual(['p-ok']);
    expect(JSON.stringify(m.cacheUpsert.mock.calls)).not.toContain('p-excluded');
  });

  it('a previously cached excluded place cannot reappear: it is filtered on read', async () => {
    m.getActiveExclusionSet.mockResolvedValue(new Set(['p-excluded']));
    m.cacheFindOne.mockReturnValue(leanOf({ results: [{ slug: 'x', title: 'Excluded Hotel', placeId: 'p-excluded' }, { slug: 'y', title: 'Fine', placeId: 'p-ok' }] }));

    const destinations = await getDestinationsForLocation('Manali');

    expect(destinations.map((d) => d.placeId)).toEqual(['p-ok']);
    expect(m.cacheUpsert).not.toHaveBeenCalled();
  });

  it('fails CLOSED when the exclusion list cannot be read: unavailable, no results, no Google call, no cache access or write', async () => {
    m.getActiveExclusionSet.mockRejectedValue(new m.ExclusionLookupError('db down'));

    const result = await getDestinationsForLocationResult('Manali');

    expect(result).toEqual({ destinations: [], unavailable: true });
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.cacheFindOne).not.toHaveBeenCalled();
    expect(m.cacheUpsert).not.toHaveBeenCalled();
    expect(m.markFailure).not.toHaveBeenCalled();
  });

  it('fails closed even when a cached document exists', async () => {
    m.getActiveExclusionSet.mockRejectedValue(new m.ExclusionLookupError('db down'));
    m.cacheFindOne.mockReturnValue(leanOf({ results: [{ slug: 'x', placeId: 'p-excluded' }] }));

    const result = await getDestinationsForLocationResult('Manali');

    expect(result.destinations).toEqual([]);
    expect(result.unavailable).toBe(true);
  });

  it('the default-locations list is withheld as a whole if any lookup is unavailable', async () => {
    m.getActiveExclusionSet.mockRejectedValue(new m.ExclusionLookupError('db down'));

    const result = await getDestinationsWithFallbackResult();

    expect(result).toEqual({ destinations: [], unavailable: true });
    expect(m.searchDestinations).not.toHaveBeenCalled();
  });
});

describe('kill switch — GOOGLE_DESTINATION_LIVE_SEARCH=disabled', () => {
  it('is off unless explicitly set to "disabled"', () => {
    expect(isLiveDestinationSearchDisabled({})).toBe(false);
    expect(isLiveDestinationSearchDisabled({ GOOGLE_DESTINATION_LIVE_SEARCH: 'enabled' })).toBe(false);
    expect(isLiveDestinationSearchDisabled({ GOOGLE_DESTINATION_LIVE_SEARCH: ' Disabled ' })).toBe(true);
  });

  it('stops live searches on a cache miss but still serves (filtered) cached results', async () => {
    process.env.GOOGLE_DESTINATION_LIVE_SEARCH = 'disabled';

    await getDestinationsForLocationResult('Manali');
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.cacheUpsert).not.toHaveBeenCalled();

    m.getActiveExclusionSet.mockResolvedValue(new Set(['p-excluded']));
    m.cacheFindOne.mockReturnValue(leanOf({ results: [{ slug: 'x', placeId: 'p-excluded' }, { slug: 'y', placeId: 'p-ok' }] }));
    const destinations = await getDestinationsForLocation('Manali');
    expect(destinations.map((d) => d.placeId)).toEqual(['p-ok']);
  });
});

describe('getDestinationBySlug — the /plan-my-journey?source=destination&slug= entry point', () => {
  it.each(['hotels-near-me', 'zzz', 'a-very-long-arbitrary-slug-'.repeat(8)])('an arbitrary slug "%s" never triggers a Google request', async (slug) => {
    const result = await getDestinationBySlug(slug);

    expect(result).toBeUndefined();
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.cacheUpsert).not.toHaveBeenCalled();
  });

  it('even an authored location never starts a live search from a slug', async () => {
    const result = await getDestinationBySlug('kasol');

    expect(result).toBeUndefined();
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.cacheUpsert).not.toHaveBeenCalled();
  });

  it('a published curated destination resolves exactly as before, with no Google involvement', async () => {
    m.destinationFindOne.mockReturnValue(leanOf({ slug: 'manali', title: 'Manali', category: 'c', description: 'd', toursCount: 1, image: '/m.jpg', status: 'published' }));

    const result = await getDestinationBySlug('manali');

    expect(result?.slug).toBe('manali');
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.getActiveExclusionSet).not.toHaveBeenCalled();
  });

  it('a cached, non-excluded Google entry for an authored location can still prefill, and an excluded one cannot', async () => {
    m.cacheFindOne.mockReturnValue(leanOf({ results: [{ slug: 'x', title: 'Excluded Hotel', placeId: 'p-excluded' }, { slug: 'y', title: 'Hadimba Temple', placeId: 'p-ok' }] }));
    m.getActiveExclusionSet.mockResolvedValue(new Set(['p-excluded']));

    const result = await getDestinationBySlug('kasol');

    expect(result?.placeId).toBe('p-ok');
    expect(m.searchDestinations).not.toHaveBeenCalled();
  });
});
