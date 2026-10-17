import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The REAL lib/stays.getStayByPlaceIdResult (exclusion list read fail-closed, published-destination eligibility, stored
// record lookup) is driven into the REAL stays page. Only the database, the exclusion list and the unrelated catalogs are
// mocked. The point: the Place ID that may reach Google comes only from a found, eligible, non-excluded stored record.
const m = vi.hoisted(() => ({
  placeCacheFind: vi.fn(),
  getActiveExclusionSet: vi.fn(),
  getPublishedDestinationRefs: vi.fn(),
  getCuratedDestinationBySlug: vi.fn(),
  ExclusionLookupError: class ExclusionLookupError extends Error {}
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/PlaceCache', () => ({ PlaceCache: { find: m.placeCacheFind, aggregate: vi.fn(), findOneAndUpdate: vi.fn(), collection: { name: 'placecaches' } } }));
vi.mock('@/lib/destinations', () => ({ getPublishedDestinationRefs: m.getPublishedDestinationRefs, getCuratedDestinationBySlug: m.getCuratedDestinationBySlug }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({
  ExclusionLookupError: m.ExclusionLookupError,
  getActiveExclusionSet: m.getActiveExclusionSet,
  filterOutExcludedPlaces: vi.fn(async (_provider: string, items: unknown[]) => items),
  isPropertyExcluded: vi.fn()
}));
vi.mock('@/lib/hotels', () => ({ getHotels: vi.fn(), getHotelBySlug: vi.fn() }));
vi.mock('@/lib/packages', () => ({ getPackagesByDestinationSlug: vi.fn() }));
vi.mock('@/lib/experiences', () => ({ primaryDestinationName: vi.fn() }));

const { default: StaysCatchAllPage } = await import('./[...segments]/page');
const { StayPhotoSection } = await import('@/components/modules/stays/StayPhotoSection');
const { createFreshPhotoFetcher } = await import('@/lib/googlePhotoFetch');

const ROOT = process.cwd();
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');

const storedDoc = (placeId: string) => ({
  placeId,
  name: 'Riverside Hotel',
  slug: 'manali-riverside-hotel',
  stayType: 'hotel',
  formattedAddress: 'Old Manali, Himachal Pradesh',
  photos: ['/api/places/photo?name=places%2Fx%2Fphotos%2Fold&w=1200'],
  destinationSlug: 'manali',
  searchLocation: 'Manali',
  types: ['lodging', 'hotel'],
  updatedAt: new Date('2026-01-01T00:00:00Z')
});

const render = (segments: string[]) => StaysCatchAllPage({ params: Promise.resolve({ segments }), searchParams: Promise.resolve({}) }) as Promise<{ type: { name?: string }; props: Record<string, unknown> }>;

function useStoredRecords(docs: unknown[]) {
  m.placeCacheFind.mockReturnValue({ lean: async () => docs });
}

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetAllMocks();
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw new Error('a real network request was attempted');
  });
  m.getActiveExclusionSet.mockResolvedValue(new Set<string>());
  m.getPublishedDestinationRefs.mockResolvedValue([{ slug: 'manali', title: 'Manali' }]);
  m.getCuratedDestinationBySlug.mockResolvedValue({ slug: 'manali', title: 'Manali' });
});

describe('eligibility is enforced before any photo metadata can be requested', () => {
  it('an eligible, non-excluded Google property reaches the detail page with its stored Place ID as the EligiblePlaceId', async () => {
    useStoredRecords([storedDoc('ChIJreal123')]);

    const element = await render(['property', 'ChIJreal123']);

    expect(element.type.name).toBe('GooglePropertyDetail');
    expect(element.props.eligiblePlaceId).toBe('ChIJreal123');
    expect((element.props.stay as { source: string; placeId: string }).source).toBe('google');
    expect(m.getActiveExclusionSet).toHaveBeenCalledWith('google');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the stored lookup is scoped to eligible destinations, not just the Place ID', async () => {
    useStoredRecords([storedDoc('ChIJreal123')]);
    await render(['property', 'ChIJreal123']);

    const query = m.placeCacheFind.mock.calls[0][0] as Record<string, unknown>;
    expect(query.placeId).toBe('ChIJreal123');
    expect(Object.keys(query).length).toBeGreaterThan(1);
    expect(m.getPublishedDestinationRefs).toHaveBeenCalled();
  });

  it('an EXCLUDED property is a 404: no stored lookup, no detail page, zero Google requests', async () => {
    m.getActiveExclusionSet.mockResolvedValue(new Set(['ChIJexcluded']));
    useStoredRecords([storedDoc('ChIJexcluded')]);

    await expect(render(['property', 'ChIJexcluded'])).rejects.toMatchObject({ digest: expect.stringMatching(/404|NOT_FOUND/) });
    expect(m.placeCacheFind).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('an UNKNOWN property (no eligible stored record) is a 404 with zero Google requests', async () => {
    useStoredRecords([]);

    await expect(render(['property', 'ChIJunknown'])).rejects.toMatchObject({ digest: expect.stringMatching(/404|NOT_FOUND/) });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('when the exclusion list cannot be read the page fails closed: the unavailable page, no stored lookup, no EligiblePlaceId, zero Google requests', async () => {
    m.getActiveExclusionSet.mockRejectedValue(new m.ExclusionLookupError('db down'));
    useStoredRecords([storedDoc('ChIJreal123')]);

    const element = await render(['property', 'ChIJreal123']);

    expect(element.type.name).not.toBe('GooglePropertyDetail');
    expect(element.props).not.toHaveProperty('eligiblePlaceId');
    expect(m.placeCacheFind).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('an unreadable published-destination list also fails closed', async () => {
    m.getPublishedDestinationRefs.mockRejectedValue(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    useStoredRecords([storedDoc('ChIJreal123')]);

    const element = await render(['property', 'ChIJreal123']);
    expect(element.type.name).not.toBe('GooglePropertyDetail');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the Place ID that may reach Google is the STORED record\'s, never the raw URL segment', async () => {
    useStoredRecords([storedDoc('ChIJstored')]);

    const element = await render(['property', 'ChIJ-evil-from-url?fields=*']);

    expect(element.props.eligiblePlaceId).toBe('ChIJstored');
    expect(JSON.stringify(element.props)).not.toContain('evil');
  });

  it('a stored Google record carries source "google", which is exactly what the EligiblePlaceId brand requires', async () => {
    // (The negative cases, a non-google source or an invalid ID, are covered in lib/googlePhotoFetch.test.ts.)
    useStoredRecords([storedDoc('ChIJreal123')]);
    const element = await render(['property', 'ChIJreal123']);
    expect((element.props.stay as { source: string }).source).toBe('google');
    expect(element.props.eligiblePlaceId).toBeTruthy();
  });
});

describe('the end-to-end chain: lookup -> EligiblePlaceId -> photo section', () => {
  const FRESH = { GOOGLE_PHOTO_METADATA_MODE: 'fresh', GOOGLE_PLACES_API_KEY: 'test-key-not-real-1234567890' };
  const photoBody = { photos: [{ name: 'places/ChIJreal123/photos/t1', authorAttributions: [{ displayName: 'Asha' }], googleMapsUri: 'https://www.google.com/maps/photo/t1' }] };

  function sectionDeps() {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(photoBody), { status: 200 }));
    const fetcher = createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false });
    return { fetchImpl, deps: { env: FRESH, getClientKey: async () => '203.0.113.7', fetchPhotos: fetcher } };
  }

  it('an eligible property in fresh mode makes exactly one Google request, for exactly the stored Place ID', async () => {
    useStoredRecords([storedDoc('ChIJreal123')]);
    const element = await render(['property', 'ChIJreal123']);
    const { fetchImpl, deps } = sectionDeps();

    await StayPhotoSection({ stay: element.props.stay as never, eligiblePlaceId: element.props.eligiblePlaceId as never, deps });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect((fetchImpl.mock.calls[0] as unknown as [string])[0]).toBe('https://places.googleapis.com/v1/places/ChIJreal123');
  });

  it('excluded, unknown and unavailable properties never produce a section, so no Google request exists to make', async () => {
    const { fetchImpl } = sectionDeps();
    m.getActiveExclusionSet.mockResolvedValue(new Set(['ChIJreal123']));
    useStoredRecords([storedDoc('ChIJreal123')]);
    await expect(render(['property', 'ChIJreal123'])).rejects.toBeTruthy();

    m.getActiveExclusionSet.mockResolvedValue(new Set<string>());
    useStoredRecords([]);
    await expect(render(['property', 'ChIJreal123'])).rejects.toBeTruthy();

    m.getActiveExclusionSet.mockRejectedValue(new m.ExclusionLookupError('down'));
    const unavailable = await render(['property', 'ChIJreal123']);
    expect(unavailable.props).not.toHaveProperty('eligiblePlaceId');

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('page wiring (source)', () => {
  const source = read('app/stays/[...segments]/page.tsx');

  it('derives the EligiblePlaceId only from a found lookup, after getStayByPlaceIdResult, and passes it on', () => {
    expect(source).toMatch(/const lookup = await getStayByPlaceIdResult\(segments\[1\]\);[\s\S]*eligiblePlaceId: eligiblePlaceIdFrom\(lookup\)/);
    expect(source).toContain('<StayPhotoSection stay={stay} eligiblePlaceId={eligiblePlaceId} />');
    expect(source).toContain('eligiblePlaceId={resolved.eligiblePlaceId}');
  });

  it('never passes a raw URL segment, query string or param to the photo section or the fetcher', () => {
    expect(source).not.toMatch(/<StayPhotoSection[^>]*segments/);
    expect(source).not.toMatch(/fetchFreshPlacePhotos|createFreshPhotoFetcher/);
    expect(source).not.toMatch(/eligiblePlaceId=\{(?!resolved\.eligiblePlaceId|eligiblePlaceId)/);
  });

  it('only the Google-sourced detail uses the new section; the curated property detail and stay cards are untouched', () => {
    const curated = source.slice(source.indexOf('async function PropertyDetail'), source.indexOf('async function GooglePropertyDetail'));
    expect(curated).not.toMatch(/StayPhotoSection|CreditedPhotoGallery|eligiblePlaceId/);
    expect(read('components/modules/StaysGrid.tsx')).not.toMatch(/StayPhotoSection|CreditedPhotoGallery|googlePhotoFetch|photoMetadataMode/);
  });
});
