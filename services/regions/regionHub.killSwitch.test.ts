import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The REAL region hub service, the REAL Google attractions provider and the REAL API route run here. Only the outer boundaries are
// mocked (MongoDB models, the Booking provider, and the Google Text Search client), so these tests count every database read and
// every Google call that each public entry point makes. No network, no database, no Google.
const m = vi.hoisted(() => {
  const chain = (value: unknown) => {
    const q: Record<string, unknown> = {};
    q.sort = () => q;
    q.limit = () => q;
    q.select = () => q;
    q.lean = () => Promise.resolve(value);
    return q;
  };
  return {
    chain,
    connectDB: vi.fn(),
    searchPlaces: vi.fn(),
    isLocalDevelopment: vi.fn(),
    getMockPlaces: vi.fn(),
    fetch: vi.fn(),
    regionFindOne: vi.fn(),
    destinationFind: vi.fn(),
    journeyFind: vi.fn(),
    tourFind: vi.fn(),
    hotelFind: vi.fn(),
    experienceFind: vi.fn(),
    routeFind: vi.fn(),
    vehicleFind: vi.fn(),
    expertFind: vi.fn(),
    bookingAccommodations: vi.fn()
  };
});

vi.mock('@/lib/mongodb', () => ({ connectDB: m.connectDB }));
vi.mock('@/models/Region', () => ({ Region: { findOne: m.regionFindOne, find: vi.fn() } }));
vi.mock('@/models/Destination', () => ({ Destination: { find: m.destinationFind } }));
vi.mock('@/models/Journey', () => ({ Journey: { find: m.journeyFind } }));
vi.mock('@/models/Tour', () => ({ Tour: { find: m.tourFind } }));
vi.mock('@/models/Hotel', () => ({ Hotel: { find: m.hotelFind } }));
vi.mock('@/models/Experience', () => ({ Experience: { find: m.experienceFind } }));
vi.mock('@/models/TransportRoute', () => ({ TransportRoute: { find: m.routeFind } }));
vi.mock('@/models/TransportVehicle', () => ({ TransportVehicle: { find: m.vehicleFind } }));
vi.mock('@/models/Expert', () => ({ Expert: { find: m.expertFind } }));
// The row converters are plain mapping functions; identity versions keep the fixtures small without changing what is asserted.
vi.mock('@/lib/destinations', () => ({ toDestination: (d: unknown) => d }));
vi.mock('@/lib/packages', () => ({ toTravelPackage: (d: unknown) => d }));
vi.mock('@/lib/tours', () => ({ toTourPackage: (d: unknown) => d }));
vi.mock('@/lib/hotels', () => ({ toHotelPackage: (d: unknown) => d }));
vi.mock('@/lib/experiences', () => ({ toExperience: (d: unknown) => d }));
vi.mock('@/lib/transport', () => ({ toTransportRoute: (d: unknown) => d, toVehicleOption: (d: unknown) => d }));
vi.mock('@/lib/experts', () => ({ toTravelExpert: (d: unknown) => d }));
vi.mock('@/services/providers/booking/bookingAccommodation.service', () => ({ getRegionAccommodations: m.bookingAccommodations }));
vi.mock('@/lib/googlePlaces', () => ({
  searchPlaces: m.searchPlaces,
  placeName: (place: { name?: string }) => place.name ?? 'Untitled place',
  placePhotoUrls: (place: { photoUrls?: string[] }) => place.photoUrls ?? []
}));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: m.isLocalDevelopment }));
vi.mock('@/lib/mockPlacesData', () => ({ getMockPlaces: m.getMockPlaces }));

const { getRegionHubData } = await import('./regionHub.service');
const { GET } = await import('@/app/api/regions/[slug]/hub/route');

const SECRET_KEY = 'test-key-not-a-real-secret-123';
const REGION_DOC = {
  _id: 'region-1',
  name: 'Himachal Pradesh',
  slug: 'himachal-pradesh',
  shortDescription: 'The land of snow',
  cardImage: '/images/hp-card.jpg',
  showOnHomeHero: true,
  hero: { image: '/images/hp-hero.jpg', title: 'Himachal Pradesh' },
  overview: { description: 'First-party overview text' },
  travelGuide: { bestTime: 'March to June', howToReach: 'Fly into Bhuntar', weather: 'Cool summers' },
  seo: { title: 'Himachal', description: 'Himachal region' },
  sortOrder: 1,
  status: 'published'
};
const GOOGLE_PLACES = [
  { id: 'g1', name: 'Rohtang Pass', rating: 4.7, photoUrls: ['/api/places/photo?name=places%2Fg1%2Fphotos%2Fa&w=1200'] },
  { id: 'g2', name: 'Solang Valley', rating: 4.5, photoUrls: [] }
];
const FIRST_PARTY = {
  destinations: [{ slug: 'manali', title: 'Manali' }],
  journeys: [{ slug: 'manali-escape', title: 'Manali Escape' }],
  tours: [{ slug: 'rohtang-day', title: 'Rohtang Day Tour' }],
  hotels: [{ slug: 'curated-hotel', title: 'Curated Hotel' }],
  experiences: [{ slug: 'paragliding', title: 'Paragliding' }],
  routes: [{ id: 'r1', title: 'Delhi to Manali' }],
  vehicles: [{ id: 'v1', title: 'SUV' }],
  experts: [{ id: 'e1', name: 'Local Expert' }]
};

function mockDatabase() {
  m.connectDB.mockReset().mockResolvedValue(undefined);
  m.regionFindOne.mockReset().mockReturnValue(m.chain(REGION_DOC));
  m.destinationFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.destinations));
  m.journeyFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.journeys));
  m.tourFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.tours));
  m.hotelFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.hotels));
  m.experienceFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.experiences));
  m.routeFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.routes));
  m.vehicleFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.vehicles));
  m.expertFind.mockReset().mockReturnValue(m.chain(FIRST_PARTY.experts));
}

const databaseReadCounts = () => ({
  region: m.regionFindOne.mock.calls.length,
  destinations: m.destinationFind.mock.calls.length,
  journeys: m.journeyFind.mock.calls.length,
  tours: m.tourFind.mock.calls.length,
  hotels: m.hotelFind.mock.calls.length,
  experiences: m.experienceFind.mock.calls.length,
  routes: m.routeFind.mock.calls.length,
  vehicles: m.vehicleFind.mock.calls.length,
  experts: m.expertFind.mock.calls.length,
  connects: m.connectDB.mock.calls.length
});

function setMode(mode: string | undefined) {
  if (mode === undefined) vi.stubEnv('GOOGLE_REGION_ATTRACTIONS_MODE', undefined as unknown as string);
  else vi.stubEnv('GOOGLE_REGION_ATTRACTIONS_MODE', mode);
}

const hubRequest = (slug = 'himachal-pradesh') => GET(new Request(`http://localhost/api/regions/${slug}/hub`), { params: Promise.resolve({ slug }) });

beforeEach(() => {
  mockDatabase();
  m.searchPlaces.mockReset().mockResolvedValue(GOOGLE_PLACES);
  m.isLocalDevelopment.mockReset().mockReturnValue(false);
  m.getMockPlaces.mockReset().mockReturnValue(GOOGLE_PLACES);
  m.bookingAccommodations.mockReset().mockResolvedValue({ enabled: false, accommodations: [] });
  m.fetch.mockReset();
  vi.stubGlobal('fetch', m.fetch);
  vi.stubEnv('GOOGLE_PLACES_API_KEY', SECRET_KEY);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getRegionHubData (the data path of the region page)', () => {
  it.each([undefined, '', 'live', 'LIVE', 'off', 'false', 'disabledd', 'shadow'])('mode %j: one Google search per call, as before', async (mode) => {
    setMode(mode);
    const hub = await getRegionHubData('himachal-pradesh');
    expect(m.searchPlaces).toHaveBeenCalledTimes(1);
    expect(m.searchPlaces).toHaveBeenCalledWith('top tourist attractions in Himachal Pradesh', SECRET_KEY);
    expect(hub?.googleContext.attractions.map((a) => a.id)).toEqual(['g1', 'g2']);
    expect(hub?.googleContext.attribution).toBe('Places data by Google');
  });

  it.each(['disabled', 'DISABLED', '  Disabled  '])('mode %j: zero Google calls, an empty Google context, and every first-party section intact', async (mode) => {
    setMode(mode);
    const hub = await getRegionHubData('himachal-pradesh');
    expect(m.searchPlaces).not.toHaveBeenCalled();
    expect(m.fetch).not.toHaveBeenCalled();
    expect(hub?.googleContext).toEqual({ attractions: [] });
    expect(hub?.region.name).toBe('Himachal Pradesh');
    expect(hub?.region.travelGuide).toEqual(REGION_DOC.travelGuide);
    expect(hub?.region.overview).toEqual(REGION_DOC.overview);
    expect(hub?.destinations).toEqual(FIRST_PARTY.destinations);
    expect(hub?.journeys).toEqual(FIRST_PARTY.journeys);
    expect(hub?.tours).toEqual(FIRST_PARTY.tours);
    expect(hub?.curatedStays).toEqual(FIRST_PARTY.hotels);
    expect(hub?.experiences).toEqual(FIRST_PARTY.experiences);
    expect(hub?.transportServices).toEqual(FIRST_PARTY.routes);
    expect(hub?.transportVehicles).toEqual(FIRST_PARTY.vehicles);
    expect(hub?.travelExperts).toEqual(FIRST_PARTY.experts);
  });

  it('the result in disabled mode differs from live mode ONLY in the Google context', async () => {
    setMode('live');
    const live = await getRegionHubData('himachal-pradesh');
    setMode('disabled');
    const disabled = await getRegionHubData('himachal-pradesh');
    const { googleContext: _liveGoogle, ...liveRest } = live!;
    const { googleContext: _disabledGoogle, ...disabledRest } = disabled!;
    expect(disabledRest).toEqual(liveRest);
  });

  it('makes exactly the same database reads in both modes (the switch adds and removes none)', async () => {
    setMode('live');
    await getRegionHubData('himachal-pradesh');
    const liveReads = databaseReadCounts();
    mockDatabase();
    m.searchPlaces.mockClear();
    setMode('disabled');
    await getRegionHubData('himachal-pradesh');
    expect(databaseReadCounts()).toEqual(liveReads);
    expect(liveReads).toMatchObject({ region: 1, destinations: 1, journeys: 1, tours: 1, hotels: 1, experiences: 1, routes: 1, vehicles: 1, experts: 1 });
  });

  it('performs no database write of any kind (the mocked models expose reads only)', async () => {
    setMode('disabled');
    await expect(getRegionHubData('himachal-pradesh')).resolves.toBeTruthy();
  });

  it('an unknown region returns null before any other work, in every mode, with no Google call', async () => {
    m.regionFindOne.mockReturnValue(m.chain(null));
    for (const mode of [undefined, 'live', 'disabled']) {
      setMode(mode);
      await expect(getRegionHubData('nope')).resolves.toBeNull();
    }
    expect(m.searchPlaces).not.toHaveBeenCalled();
    expect(m.destinationFind).not.toHaveBeenCalled();
  });

  it('a Google outage in live mode still degrades to an empty context without failing the hub', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    m.searchPlaces.mockRejectedValue(new Error('Google Places searchText failed (503)'));
    setMode(undefined);
    const hub = await getRegionHubData('himachal-pradesh');
    expect(hub?.googleContext).toEqual({ attractions: [] });
    expect(hub?.destinations).toEqual(FIRST_PARTY.destinations);
  });
});

describe('GET /api/regions/[slug]/hub (the public API)', () => {
  it.each([undefined, 'live', 'unknown-value'])('mode %j: one Google search, with the same response shape as before', async (mode) => {
    setMode(mode);
    const res = await hubRequest();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(m.searchPlaces).toHaveBeenCalledTimes(1);
    expect(body.data.googleContext.attractions.map((a: { id: string }) => a.id)).toEqual(['g1', 'g2']);
    expect(Object.keys(body.data).sort()).toEqual(['bookingContext', 'curatedStays', 'destinations', 'experiences', 'googleContext', 'journeys', 'region', 'tours', 'transportServices', 'transportVehicles', 'travelExperts']);
  });

  it('disabled: zero Google calls, still 200 with every first-party section, and the same response keys as live', async () => {
    setMode('live');
    const liveBody = await (await hubRequest()).json();
    m.searchPlaces.mockClear();
    setMode('disabled');
    const res = await hubRequest();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(m.searchPlaces).not.toHaveBeenCalled();
    expect(m.fetch).not.toHaveBeenCalled();
    expect(body.success).toBe(true);
    expect(Object.keys(body.data).sort()).toEqual(Object.keys(liveBody.data).sort());
    expect(body.data.googleContext).toEqual({ attractions: [] });
    expect(body.data.destinations).toEqual(FIRST_PARTY.destinations);
    expect(body.data.region.travelGuide).toEqual(REGION_DOC.travelGuide);
  });

  it('disabled: the public response never reveals the switch, a diagnostic or the API key', async () => {
    setMode('disabled');
    const text = await (await hubRequest()).text();
    expect(text).not.toContain(SECRET_KEY);
    expect(text.toLowerCase()).not.toContain('disabled');
    expect(text).not.toContain('GOOGLE_');
    expect(text).not.toContain('Places data by Google');
  });

  it('an unknown region is still a 404 with no Google call, in both modes', async () => {
    m.regionFindOne.mockReturnValue(m.chain(null));
    for (const mode of [undefined, 'disabled']) {
      setMode(mode);
      const res = await hubRequest('nope');
      expect(res.status).toBe(404);
      expect((await res.json()).error.code).toBe('REGION_NOT_FOUND');
    }
    expect(m.searchPlaces).not.toHaveBeenCalled();
  });

  it('an internal error is still a 500 with the generic message in both modes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    m.regionFindOne.mockImplementation(() => {
      throw new Error('database down');
    });
    for (const mode of [undefined, 'disabled']) {
      setMode(mode);
      const res = await hubRequest();
      expect(res.status).toBe(500);
      expect(JSON.stringify(await res.json())).not.toContain('database down');
    }
  });

  it('the page data path and the API share the single protected function (one search each in live, none in disabled)', async () => {
    setMode('live');
    await getRegionHubData('himachal-pradesh');
    await hubRequest();
    expect(m.searchPlaces).toHaveBeenCalledTimes(2);
    m.searchPlaces.mockClear();
    setMode('disabled');
    await getRegionHubData('himachal-pradesh');
    await hubRequest();
    expect(m.searchPlaces).not.toHaveBeenCalled();
  });
});
