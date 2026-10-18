import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The REAL region page, the REAL section components and the REAL Google attractions provider render here. Only the data source
// (the hub service's database layer is replaced by a fixed hub) and Next's navigation helpers are faked. Google is mocked and counted.
const m = vi.hoisted(() => ({
  getRegionHubData: vi.fn(),
  getRegionProfileBySlug: vi.fn(),
  searchPlaces: vi.fn(),
  notFound: vi.fn()
}));

vi.mock('next/navigation', () => ({ notFound: m.notFound, useRouter: () => ({ push: () => undefined, back: () => undefined }), usePathname: () => '/regions/himachal-pradesh' }));
vi.mock('@/services/regions/regionHub.service', () => ({ getRegionHubData: m.getRegionHubData, getRegionProfileBySlug: m.getRegionProfileBySlug }));
vi.mock('@/lib/googlePlaces', () => ({ searchPlaces: m.searchPlaces, placeName: (p: { name?: string }) => p.name ?? '', placePhotoUrls: () => [] }));
vi.mock('@/components/ui/BackButton', () => ({ default: () => null }));
vi.mock('@/components/modules/WhatsAppButton', () => ({ default: () => null }));
vi.mock('@/components/modules/regions/RegionDestinations', () => ({ default: () => null }));
vi.mock('@/components/modules/regions/RegionJourneys', () => ({ default: () => null }));
vi.mock('@/components/modules/regions/RegionStays', () => ({ default: () => null }));
vi.mock('@/components/modules/regions/RegionExperiences', () => ({ default: () => null }));
vi.mock('@/components/modules/regions/RegionTransport', () => ({ default: () => null }));
vi.mock('@/components/modules/regions/RegionExperts', () => ({ default: () => null }));
vi.mock('@/components/modules/regions/RegionFinalCTA', () => ({ default: () => null }));

const { default: RegionHubPage } = await import('./page');

const TRAVEL_GUIDE = { bestTime: 'March to June is ideal', howToReach: 'Fly into Bhuntar airport', weather: 'Cool summers', localTransport: '', permits: '', responsibleTravel: '' };

function hubFixture(attractions: Array<{ id: string; name: string }>, travelGuide: Record<string, string> = TRAVEL_GUIDE) {
  return {
    region: {
      id: 'r1',
      name: 'Himachal Pradesh',
      slug: 'himachal-pradesh',
      shortDescription: 'x',
      hero: { image: '/hero.jpg', title: 'Himachal Pradesh', subtitle: 's' },
      overview: { description: 'First-party overview' },
      travelGuide,
      seo: { title: 't', description: 'd' },
      sortOrder: 1,
      status: 'published'
    },
    destinations: [],
    journeys: [],
    tours: [],
    curatedStays: [],
    experiences: [],
    transportServices: [],
    transportVehicles: [],
    travelExperts: [],
    googleContext: { attractions, attribution: attractions.length ? 'Places data by Google' : undefined },
    bookingContext: { enabled: false, accommodations: [] }
  };
}

async function renderPage() {
  const element = await RegionHubPage({ params: Promise.resolve({ slug: 'himachal-pradesh' }) });
  return renderToStaticMarkup(element);
}

function setMode(mode: string | undefined) {
  if (mode === undefined) vi.stubEnv('GOOGLE_REGION_ATTRACTIONS_MODE', undefined as unknown as string);
  else vi.stubEnv('GOOGLE_REGION_ATTRACTIONS_MODE', mode);
}

beforeEach(() => {
  m.getRegionHubData.mockReset();
  m.searchPlaces.mockReset();
  m.notFound.mockReset().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND');
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('the region page (live mode and default: unchanged)', () => {
  it.each([undefined, 'live', 'garbage'])('mode %j: with Google attractions the Travel Guide section shows its text AND the "Nearby to Explore" block', async (mode) => {
    setMode(mode);
    m.getRegionHubData.mockResolvedValue(hubFixture([{ id: 'g1', name: 'Rohtang Pass' }]));
    const html = await renderPage();
    expect(html).toContain('id="travel-guide"');
    expect(html).toContain('Himachal Pradesh Travel Guide');
    expect(html).toContain('March to June is ideal');
    expect(html).toContain('Nearby to Explore');
    expect(html).toContain('Rohtang Pass');
    expect(html).toContain('Places data by Google');
  });

  it('with NO attractions (a Google failure) the Travel Guide section is hidden exactly as before, even though the guide has text', async () => {
    setMode(undefined);
    m.getRegionHubData.mockResolvedValue(hubFixture([]));
    const html = await renderPage();
    expect(html).not.toContain('id="travel-guide"');
    expect(html).not.toContain('March to June is ideal');
  });
});

describe('the region page (disabled mode)', () => {
  it('keeps the region\'s own travel-guide text visible, with no Google block and no Google claim', async () => {
    setMode('disabled');
    m.getRegionHubData.mockResolvedValue(hubFixture([]));
    const html = await renderPage();
    expect(html).toContain('id="travel-guide"');
    expect(html).toContain('Himachal Pradesh Travel Guide');
    expect(html).toContain('March to June is ideal');
    expect(html).toContain('Fly into Bhuntar airport');
    expect(html).not.toContain('Nearby to Explore');
    expect(html).not.toContain('Places data by Google');
    expect(html).not.toContain('/api/places/photo');
  });

  it('adds the Travel Guide entry to the section navigation, and still renders the overview', async () => {
    setMode('disabled');
    m.getRegionHubData.mockResolvedValue(hubFixture([]));
    const html = await renderPage();
    expect(html).toContain('Travel Guide');
    expect(html).toContain('First-party overview');
  });

  it('a region with no guide text and no attractions shows no Travel Guide section at all (a safe empty state)', async () => {
    setMode('disabled');
    m.getRegionHubData.mockResolvedValue(hubFixture([], { bestTime: '', howToReach: '' }));
    const html = await renderPage();
    expect(html).not.toContain('id="travel-guide"');
    expect(html).toContain('First-party overview');
  });

  it('still returns not-found for an unknown region, and never calls Google itself', async () => {
    setMode('disabled');
    m.getRegionHubData.mockResolvedValue(null);
    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(m.notFound).toHaveBeenCalledTimes(1);
    expect(m.searchPlaces).not.toHaveBeenCalled();
  });

  it('the page itself never calls Google: it only reads the hub through the protected service', async () => {
    setMode('live');
    m.getRegionHubData.mockResolvedValue(hubFixture([]));
    await renderPage();
    expect(m.searchPlaces).not.toHaveBeenCalled();
    expect(m.getRegionHubData).toHaveBeenCalledTimes(1);
    expect(m.getRegionHubData).toHaveBeenCalledWith('himachal-pradesh');
  });
});

describe('source guards', () => {
  it('the page and the API route import no Google module: the provider guard is the only road to Google', async () => {
    const { readFileSync } = await import('node:fs');
    for (const file of ['./page.tsx', '../../api/regions/[slug]/hub/route.ts']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source, file).not.toMatch(/googlePlaces|searchPlaces|providers\/google/);
    }
  });
});
