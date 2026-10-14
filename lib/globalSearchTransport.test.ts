import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import snapshot from '@/lib/search/__fixtures__/transportRoutesSnapshot.json';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import { filterTransportRoutes } from '@/lib/search/transportSearch';
import {
  GLOBAL_SEARCH_LIMITS,
  GLOBAL_SEARCH_SECTION_ORDER,
  parseGlobalSearchQuery,
  transportSection
} from '@/lib/search/globalSearch';
import {
  MAX_UNSETTLED_SECTION_READS,
  SECTION_DB_TIME_LIMIT_MS,
  SECTION_DEADLINE_MS,
  SECTION_READ_CATALOGS,
  defaultLoaders,
  resetSectionReadsForTests,
  runGlobalSearch,
  type GlobalSearchLoaders
} from '@/lib/globalSearchServer';
import { seeAllHref } from '@/lib/globalSearchClient';
import type { Destination } from '@/types';
import type { TransportRoute } from '@/types/transport';

const getActiveTransportRouteRefs = vi.hoisted(() => vi.fn());
vi.mock('@/lib/publishedTransportRoutes', () => ({ getActiveTransportRouteRefs }));

// The 25 active routes read (read-only) from production when the route catalog was last captured. The pure matcher and the
// section below are driven by whatever records the loader returns; nothing in production code lists a route.
const routes = (snapshot as unknown as TransportRoute[]).map((route, index) => ({ ...route, id: `route-${index + 1}` }));
const destinations = catalog.destinations as unknown as Destination[];
const parse = (q: string) => {
  const parsed = parseGlobalSearchQuery(q);
  if (!parsed.ok) throw new Error('bad query');
  return parsed;
};
const titles = (q: string, list: readonly TransportRoute[] = routes) => transportSection(list, q).map((item) => item.title);
const route = (origin: string, destination: string, extra: Partial<TransportRoute> = {}): TransportRoute => ({ id: `${origin}>${destination}`, origin, destination, supportedVehicleCategories: ['SUV'], active: true, ...extra });

beforeEach(() => {
  resetSectionReadsForTests();
  getActiveTransportRouteRefs.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  resetSectionReadsForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Transport section: the live catalog', () => {
  it('the captured catalog is the 25 active routes, and every one is findable by its own pickup -> drop', () => {
    expect(routes).toHaveLength(25);
    for (const r of routes) {
      const found = transportSection(routes, `${r.origin} to ${r.destination}`);
      expect(found.map((item) => item.id), `${r.origin} -> ${r.destination}`).toEqual([`transport:${r.id}`]);
    }
  });

  it('is the seventh, last section and every item is a transport item', () => {
    expect(GLOBAL_SEARCH_SECTION_ORDER).toHaveLength(7);
    expect(GLOBAL_SEARCH_SECTION_ORDER[6]).toBe('transport');
    expect(transportSection(routes, 'Manali').every((item) => item.type === 'transport' && item.id.startsWith('transport:'))).toBe(true);
  });

  it('a route added to the data is found with no search change, and one that is not active never is', () => {
    const extra = [...routes, route('Leh', 'Pangong Lake'), route('Leh', 'Nubra Valley', { active: false }), route('Leh', 'Khardung La', { active: undefined })];
    expect(titles('Pangong', extra)).toEqual(['Leh → Pangong Lake']);
    expect(titles('Nubra', extra)).toEqual([]);
    expect(titles('Khardung', extra)).toEqual([]);
    expect(titles('Leh', extra)).toEqual(['Leh → Pangong Lake']);
  });

  it('returns nothing for text that names no route end', () => {
    for (const q of ['zzzzqqq', 'Ladakh', 'nali', 'a', '[[']) expect(titles(q), q).toEqual([]);
  });
});

describe('Transport section: direction, airport vs city, spelling', () => {
  it('"A to B" is strictly pickup then drop, whichever separator is typed; the reverse is never implied', () => {
    for (const q of ['Delhi to Manali', 'delhi TO manali', 'Delhi -> Manali', 'Delhi → Manali', 'Delhi > Manali', 'New Delhi to Manali']) expect(titles(q), q).toEqual(['Delhi → Manali']);
    expect(titles('Manali to Delhi')).toEqual([]);
    expect(titles('Manali -> Delhi')).toEqual([]);
    expect(titles('Delhi to Shimla')).toEqual([]);
  });

  it('a single place finds routes at either end, and the stronger end match ranks first', () => {
    expect(titles('Manali')).toEqual(expect.arrayContaining(['Delhi → Manali', 'Shimla → Manali', 'Manali → Spiti Valley']));
    const ranked = transportSection(routes, 'Man');
    expect(ranked.length).toBeGreaterThan(0);
    expect(transportSection(routes, 'Dharamsala').map((i) => i.title)).toEqual(['Chandigarh → Dharamshala']);
  });

  it('Srinagar city and Srinagar Airport are different places; an airport with no route is never read as its city', () => {
    expect(titles('Srinagar Airport')).toEqual(['Srinagar Airport → Srinagar']);
    expect(titles('Srinagar').sort()).toEqual(['Srinagar → Gulmarg', 'Srinagar → Pahalgam', 'Srinagar → Sonamarg', 'Srinagar Airport → Srinagar'].sort());
    expect(titles('Srinagar to Srinagar')).toEqual([]);
    expect(titles('Srinagar Airport to Srinagar')).toEqual(['Srinagar Airport → Srinagar']);
    expect(titles('Chandigarh Airport')).toEqual([]);
    expect(titles('Chandigarh Airport to Shimla')).toEqual([]);
    expect(titles('Dehradun Airport to Dehradun')).toEqual(['Dehradun Airport → Dehradun']);
    // "Dehradun" never pulls the airport pickup as a Dehradun origin
    expect(titles('Dehradun to Rishikesh')).toEqual(['Dehradun → Rishikesh']);
  });

  it('no suggestion ever differs from the /transport page lookup it links to', () => {
    for (const item of transportSection(routes, 'Srinagar')) {
      const url = new URL(item.href, 'https://example.test');
      expect(url.pathname).toBe('/transport');
      const found = filterTransportRoutes(routes, { origin: url.searchParams.get('pickup')!, destination: url.searchParams.get('destination')! });
      expect(found.map((r) => `${r.origin} → ${r.destination}`)).toEqual([item.title]);
    }
  });
});

describe('Transport section: limits, URLs and honesty', () => {
  it('returns at most five suggestions, de-duplicated', () => {
    const many = Array.from({ length: 9 }, (_, i) => route('Leh', `Stop ${i + 1}`));
    const items = transportSection(many, 'Leh');
    expect(items).toHaveLength(GLOBAL_SEARCH_LIMITS.perSection);
    expect(new Set(items.map((i) => i.id)).size).toBe(5);
  });

  it('every href is a valid same-site /transport lookup carrying exactly that route\'s pickup and drop', () => {
    const awkward = [...routes, route('Kaza & Tabo', 'Dhankar #2'), route("Mcleod Ganj", 'Triund/Camp')];
    for (const q of ['Manali', 'Srinagar', 'Kaza', 'Triund', 'Delhi']) {
      for (const item of transportSection(awkward, q)) {
        expect(item.href).toMatch(/^\/transport\?pickup=[^&]+&destination=[^&#]+$/);
        const url = new URL(item.href, 'https://example.test');
        expect(`${url.searchParams.get('pickup')} → ${url.searchParams.get('destination')}`).toBe(item.title);
        expect(url.hash).toBe('');
      }
    }
  });

  it('a row carries no fare, vehicle, availability or booking claim, whatever the stored route holds', () => {
    const priced = routes.map((r) => ({ ...r, startingFare: 99999, supportedVehicleCategories: ['Tempo Traveller'], seasonalStatus: 'Open now' }));
    const text = JSON.stringify(transportSection(priced, 'Manali'));
    expect(text).not.toMatch(/99999|₹|rs\.?\s?\d|fare|price|from \d|tempo|open now|available|book|seat|startingFare/i);
    for (const item of transportSection(priced, 'Manali')) expect(Object.keys(item).sort()).toEqual(['href', 'id', 'reason', 'subtitle', 'title', 'type'].filter((k) => k in item).sort());
  });

  it('shows only stored route type and duration as the subtitle', () => {
    const [item] = transportSection([route('Delhi', 'Manali', { routeType: 'Intercity Transfer', estimatedDuration: '12-14 hours' })], 'Delhi to Manali');
    expect(item.subtitle).toBe('Intercity Transfer · 12-14 hours');
    expect(transportSection([route('Delhi', 'Manali')], 'Delhi to Manali')[0].subtitle).toBeUndefined();
  });

  it('has no "See all" listing (no page runs the same free-text route search) - never a fabricated link', () => {
    expect(seeAllHref('transport', 'Manali', 5, 5)).toBeNull();
  });
});

describe('Transport section: server integration', () => {
  function loaders(overrides: Partial<GlobalSearchLoaders> = {}): GlobalSearchLoaders {
    return {
      destinations: async () => destinations,
      regions: async () => [],
      journeys: async () => [],
      experiences: async () => [],
      destinationRefs: async () => destinations.map((d) => ({ slug: d.slug, title: d.title, state: d.state })),
      experts: async () => [],
      stays: async () => ({ status: 'ok', suggestions: [], totalCount: 0 }),
      transport: async () => routes,
      ...overrides
    };
  }

  it('answers Transport from the loader, as the last section, within the response total', async () => {
    const response = await runGlobalSearch(parse('Delhi to Manali'), loaders());
    expect(Object.keys(response.sections)[6]).toBe('transport');
    expect(response.sections.transport).toEqual({ status: 'ok', items: [expect.objectContaining({ id: 'transport:route-' + (routes.findIndex((r) => r.origin === 'Delhi' && r.destination === 'Manali') + 1), href: '/transport?pickup=Delhi&destination=Manali' })] });
    expect(response.total).toBe(GLOBAL_SEARCH_SECTION_ORDER.reduce((n, k) => n + response.sections[k].items.length, 0));
  });

  it('asks the loader with the same database limit as every other read', async () => {
    const transport = vi.fn(async () => routes);
    await runGlobalSearch(parse('Manali'), loaders({ transport }));
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledWith({ maxTimeMS: SECTION_DB_TIME_LIMIT_MS });
  });

  it('a loader set without Transport still answers the other six unchanged (an empty, complete Transport section)', async () => {
    const { transport: _transport, ...withoutTransport } = loaders();
    void _transport;
    const withIt = await runGlobalSearch(parse('Spiti'), loaders({ transport: async () => [] }));
    const without = await runGlobalSearch(parse('Spiti'), withoutTransport);
    expect(without).toEqual(withIt);
    expect(without.sections.transport).toEqual({ status: 'ok', items: [] });
  });

  it('meaningless text reads nothing, Transport included', async () => {
    const transport = vi.fn(async () => routes);
    const response = await runGlobalSearch(parse('[['), loaders({ transport }));
    expect(transport).not.toHaveBeenCalled();
    expect(response.total).toBe(0);
  });

  it('a Transport failure is "error" and partial, and the six independent sections are untouched', async () => {
    const healthy = await runGlobalSearch(parse('Kaza'), loaders());
    const failed = await runGlobalSearch(parse('Kaza'), loaders({ transport: async () => { throw new Error('down'); } }));
    expect(failed.sections.transport).toEqual({ status: 'error', items: [] });
    expect(failed.partial).toBe(true);
    for (const key of GLOBAL_SEARCH_SECTION_ORDER.filter((k) => k !== 'transport')) expect(failed.sections[key]).toEqual(healthy.sections[key]);
  });

  it('a Transport read that hangs is an honest "timeout" at the shared section deadline - never "no routes" - and does not delay or suppress the others', async () => {
    vi.useFakeTimers();
    const started = Date.now();
    let response: Awaited<ReturnType<typeof runGlobalSearch>> | undefined;
    void runGlobalSearch(parse('Kaza'), loaders({ transport: () => new Promise(() => undefined) })).then((r) => { response = r; });
    while (!response) await vi.advanceTimersByTimeAsync(10);
    expect(Date.now() - started).toBe(SECTION_DEADLINE_MS);
    expect(response.sections.transport).toEqual({ status: 'timeout', items: [] });
    expect(response.partial).toBe(true);
    expect(response.sections.destinations.status).toBe('ok');
    expect(response.sections.destinations.items.length).toBeGreaterThan(0);
    expect(response.sections.stays.status).toBe('ok');
  });

  it('all seven reads start before any one settles: no serial waterfall, and Transport waits for no other read', async () => {
    const started: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const gated = <T,>(name: string, value: T) => async () => { started.push(name); await gate; return value; };
    const run = runGlobalSearch(parse('Manali'), {
      destinations: gated('destinations', destinations),
      destinationRefs: gated('destinationRefs', destinations.map((d) => ({ slug: d.slug, title: d.title, state: d.state }))),
      regions: gated('regions', []),
      journeys: gated('journeys', []),
      experiences: gated('experiences', []),
      experts: gated('experts', []),
      transport: gated('transport', routes)
    });
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect([...started].sort()).toEqual(['destinationRefs', 'destinations', 'experiences', 'experts', 'journeys', 'regions', 'transport']);
    release();
    expect((await run).sections.transport.status).toBe('ok');
  });
});

describe('Transport read: the seventh authorized, bounded catalog', () => {
  it('is authorized and the cap is exactly seven, counting every key and limit', () => {
    expect(SECTION_READ_CATALOGS).toContain('transport');
    expect(MAX_UNSETTLED_SECTION_READS).toBe(7);
    expect(MAX_UNSETTLED_SECTION_READS).toBe(SECTION_READ_CATALOGS.length);
  });

  it('the default loader registers one single-flight read: concurrent requests share it, and it is read fresh once settled', async () => {
    let finish!: (value: TransportRoute[]) => void;
    getActiveTransportRouteRefs.mockImplementation(() => new Promise<TransportRoute[]>((resolve) => { finish = resolve; }));
    const a = defaultLoaders.transport!({ maxTimeMS: SECTION_DB_TIME_LIMIT_MS });
    const b = defaultLoaders.transport!({ maxTimeMS: SECTION_DB_TIME_LIMIT_MS });
    expect(getActiveTransportRouteRefs).toHaveBeenCalledTimes(1);
    expect(getActiveTransportRouteRefs).toHaveBeenCalledWith(expect.objectContaining({ maxTimeMS: SECTION_DB_TIME_LIMIT_MS, signal: expect.any(AbortSignal) }));
    finish(routes);
    expect(await a).toBe(routes);
    expect(await b).toBe(routes);
    getActiveTransportRouteRefs.mockImplementation(async () => []);
    await defaultLoaders.transport!({ maxTimeMS: SECTION_DB_TIME_LIMIT_MS });
    expect(getActiveTransportRouteRefs).toHaveBeenCalledTimes(2);
  });

  it('a healthy request reads the Transport catalog exactly once through the default loader', async () => {
    const counts: Record<string, number> = {};
    getActiveTransportRouteRefs.mockImplementation(async () => { counts.transport = (counts.transport ?? 0) + 1; return routes; });
    const response = await runGlobalSearch(parse('Manali'), { ...defaultLoaders, connect: async () => undefined, destinations: async () => destinations, destinationRefs: async () => [], regions: async () => [], journeys: async () => [], experiences: async () => [], experts: async () => [], stays: async () => ({ status: 'ok', suggestions: [], totalCount: 0 }) });
    expect(counts.transport).toBe(1);
    expect(response.sections.transport.items.length).toBeGreaterThan(0);
  });
});
