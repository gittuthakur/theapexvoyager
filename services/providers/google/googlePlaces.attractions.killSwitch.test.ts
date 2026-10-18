import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Google, the mock-data module and the network are all mocked: nothing here can reach Google or spend a credit.
const { searchPlacesMock, isLocalDevelopmentMock, getMockPlacesMock, fetchMock } = vi.hoisted(() => ({
  searchPlacesMock: vi.fn(),
  isLocalDevelopmentMock: vi.fn(),
  getMockPlacesMock: vi.fn(),
  fetchMock: vi.fn()
}));

vi.mock('@/lib/googlePlaces', () => ({
  searchPlaces: searchPlacesMock,
  placeName: (place: { name?: string }) => place.name ?? 'Untitled place',
  placePhotoUrls: (place: { photoUrls?: string[] }) => place.photoUrls ?? []
}));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: isLocalDevelopmentMock }));
vi.mock('@/lib/mockPlacesData', () => ({ getMockPlaces: getMockPlacesMock }));

const { getRegionAttractions } = await import('./googlePlaces.attractions');

const PLACES = [
  { id: 'p1', name: 'Rohtang Pass', rating: 4.7, photoUrls: ['/api/places/photo?name=places%2Fp1%2Fphotos%2Fa&w=1200'] },
  { id: 'p2', name: 'Solang Valley', rating: 4.5, photoUrls: [] }
];
const SECRET_KEY = 'test-key-not-a-real-secret-123';

function setMode(mode: string | undefined) {
  if (mode === undefined) vi.stubEnv('GOOGLE_REGION_ATTRACTIONS_MODE', undefined as unknown as string);
  else vi.stubEnv('GOOGLE_REGION_ATTRACTIONS_MODE', mode);
}

beforeEach(() => {
  searchPlacesMock.mockReset().mockResolvedValue(PLACES);
  isLocalDevelopmentMock.mockReset().mockReturnValue(false);
  getMockPlacesMock.mockReset().mockReturnValue(PLACES);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GOOGLE_PLACES_API_KEY', SECRET_KEY);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('live behaviour is unchanged (default, explicit live, and unknown values)', () => {
  it.each([undefined, '', '   ', 'live', 'LIVE', ' live ', 'off', 'false', 'disable', 'disabledd', 'shadow', 'enforce'])('mode %j makes exactly one Google search and returns the mapped attractions', async (mode) => {
    setMode(mode);
    const result = await getRegionAttractions({ name: 'Himachal Pradesh' });
    expect(searchPlacesMock).toHaveBeenCalledTimes(1);
    expect(searchPlacesMock).toHaveBeenCalledWith('top tourist attractions in Himachal Pradesh', SECRET_KEY);
    expect(result).toEqual({
      attractions: [
        { id: 'p1', name: 'Rohtang Pass', photoUrl: PLACES[0].photoUrls[0], rating: 4.7 },
        { id: 'p2', name: 'Solang Valley', photoUrl: undefined, rating: 4.5 }
      ],
      attribution: 'Places data by Google'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('an empty Google result still gives the empty fallback', async () => {
    searchPlacesMock.mockResolvedValue([]);
    expect(await getRegionAttractions({ name: 'X' })).toEqual({ attractions: [], attribution: undefined });
  });

  it('a Google failure still degrades to the empty fallback and logs only the label and message (no key)', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    searchPlacesMock.mockRejectedValue(new Error('Google Places searchText failed (503): upstream'));
    const result = await getRegionAttractions({ name: 'Uttarakhand' });
    expect(result).toEqual({ attractions: [], attribution: undefined });
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(error.mock.calls)).not.toContain(SECRET_KEY);
  });

  it('without an API key it still returns the empty fallback with no Google call', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubEnv('GOOGLE_PLACES_API_KEY', '');
    expect(await getRegionAttractions({ name: 'X' })).toEqual({ attractions: [], attribution: undefined });
    expect(searchPlacesMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('local development still serves mock data and makes no Google call', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    isLocalDevelopmentMock.mockReturnValue(true);
    const result = await getRegionAttractions({ name: 'Kashmir' });
    expect(searchPlacesMock).not.toHaveBeenCalled();
    expect(result.attractions).toHaveLength(2);
    expect(info).toHaveBeenCalledTimes(1);
  });
});

describe('disabled mode: no Google attraction search, a safe empty result', () => {
  it.each(['disabled', 'DISABLED', ' Disabled ', '\tdisabled\n'])('mode %j makes zero Google calls and returns the empty result', async (mode) => {
    setMode(mode);
    const result = await getRegionAttractions({ name: 'Himachal Pradesh' });
    expect(searchPlacesMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({ attractions: [], attribution: undefined });
  });

  it('presents no fake attraction data and no "Places data by Google" claim', async () => {
    setMode('disabled');
    const result = await getRegionAttractions({ name: 'Himachal Pradesh' });
    expect(result.attractions).toEqual([]);
    expect(result.attribution).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('Google');
  });

  it('applies before the API-key and local-development branches: no mock data, no logging, not even a warning', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    setMode('disabled');
    isLocalDevelopmentMock.mockReturnValue(true);
    await getRegionAttractions({ name: 'Kashmir' });
    vi.stubEnv('GOOGLE_PLACES_API_KEY', '');
    isLocalDevelopmentMock.mockReturnValue(false);
    await getRegionAttractions({ name: 'Kashmir' });
    expect(getMockPlacesMock).not.toHaveBeenCalled();
    expect(searchPlacesMock).not.toHaveBeenCalled();
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('never returns or logs the API key or any internal diagnostic', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    setMode('disabled');
    const result = await getRegionAttractions({ name: 'Himachal Pradesh' });
    expect(JSON.stringify(result)).not.toContain(SECRET_KEY);
    expect(JSON.stringify(result).toLowerCase()).not.toContain('disabled');
    expect(JSON.stringify(spies.flatMap((spy) => spy.mock.calls))).not.toContain(SECRET_KEY);
  });

  it('is stateless: switching back to live resumes the search on the next call', async () => {
    setMode('disabled');
    await getRegionAttractions({ name: 'X' });
    expect(searchPlacesMock).not.toHaveBeenCalled();
    setMode('live');
    await getRegionAttractions({ name: 'X' });
    expect(searchPlacesMock).toHaveBeenCalledTimes(1);
  });

  it('is controlled only by GOOGLE_REGION_ATTRACTIONS_MODE: other switches neither disable nor enable it', async () => {
    vi.stubEnv('GOOGLE_DESTINATION_LIVE_SEARCH', 'disabled');
    vi.stubEnv('GOOGLE_PHOTO_PROXY_MODE', 'disabled');
    vi.stubEnv('GOOGLE_PHOTO_METADATA_MODE', 'disabled');
    vi.stubEnv('GOOGLE_PHOTO_PERSISTENCE_MODE', 'shadow');
    setMode(undefined);
    await getRegionAttractions({ name: 'X' });
    expect(searchPlacesMock).toHaveBeenCalledTimes(1);
  });
});
