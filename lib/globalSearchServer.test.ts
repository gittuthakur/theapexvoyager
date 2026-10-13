import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import journeyCatalog from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import { CONNECT_DEADLINE_MS, SECTION_DB_TIME_LIMIT_MS, SECTION_DEADLINE_MS, runGlobalSearch, singleFlight, type GlobalSearchLoaders } from '@/lib/globalSearchServer';
import { parseGlobalSearchQuery, type RegionRef } from '@/lib/search/globalSearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';
import type { TravelExpert } from '@/types/expert';

const destinations = catalog.destinations as unknown as Destination[];
const experiences = catalog.experiences as unknown as Experience[];
const journeys = journeyCatalog.journeys as unknown as TravelPackage[];
const regions: RegionRef[] = [
  { id: 'r1', slug: 'himachal-pradesh', name: 'Himachal Pradesh', shortDescription: 'Snow passes and apple valleys.' },
  { id: 'r2', slug: 'kashmir', name: 'Jammu & Kashmir', shortDescription: 'Alpine meadows.' },
  { id: 'r3', slug: 'uttarakhand', name: 'Uttarakhand', shortDescription: 'Riverside yoga towns.' }
];
const asha: TravelExpert = { slug: 'asha', name: 'Asha Verma', role: 'Mountain Travel Planner', profileImage: '/a.jpg', bio: 'b', destinationSlugs: ['mcleod-ganj'], travelStyles: [], expertise: ['Trekking'], active: true, publiclyListed: true, regionIds: ['r1'] };

function loaders(overrides: Partial<GlobalSearchLoaders> = {}): GlobalSearchLoaders & { calls: Record<string, number> } {
  const calls: Record<string, number> = {};
  const track = <T,>(name: string, value: T) => vi.fn(async () => { calls[name] = (calls[name] ?? 0) + 1; return value; });
  return {
    calls,
    destinations: track('destinations', destinations),
    regions: track('regions', regions),
    journeys: track('journeys', journeys),
    experiences: track('experiences', experiences),
    experts: track('experts', [asha]),
    ...overrides
  };
}
const parse = (q: string) => {
  const parsed = parseGlobalSearchQuery(q);
  if (!parsed.ok) throw new Error('bad query');
  return parsed;
};
const ids = (response: Awaited<ReturnType<typeof runGlobalSearch>>, section: keyof Awaited<ReturnType<typeof runGlobalSearch>>['sections']) => response.sections[section].items.map((i) => i.id);

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('runGlobalSearch', () => {
  it('reads every catalog once, in parallel, each with a server-side time limit', async () => {
    const l = loaders();
    await runGlobalSearch(parse('Dharamsala'), l);
    expect(l.calls).toEqual({ destinations: 1, regions: 1, journeys: 1, experiences: 1, experts: 1 });
    for (const read of [l.destinations, l.regions, l.journeys, l.experiences, l.experts]) {
      expect(read).toHaveBeenCalledWith({ maxTimeMS: SECTION_DB_TIME_LIMIT_MS });
    }
  });

  it('starts all reads before any of them resolves (they do not wait for each other)', async () => {
    const started: string[] = [];
    const slow = <T,>(name: string, value: T) => vi.fn(() => { started.push(name); return new Promise<T>((resolve) => setTimeout(() => resolve(value), 20)); });
    const response = await runGlobalSearch(parse('Spiti'), { destinations: slow('d', destinations), regions: slow('r', regions), journeys: slow('j', journeys), experiences: slow('e', experiences), experts: slow('x', [asha]) });
    expect(started.sort()).toEqual(['d', 'e', 'j', 'r', 'x']);
    expect(response.partial).toBe(false);
  });

  it('returns grouped, record-specific results for a real query', async () => {
    const response = await runGlobalSearch(parse('Dharamsala'), loaders());
    expect(response.query).toBe('Dharamsala');
    expect(ids(response, 'destinations')).toEqual(['destination:dharamshala']);
    expect(ids(response, 'journeys')[0]).toBe('journey:dharamshala-dalhousie-escape');
    expect(response.sections.journeys.items[0].href).toBe('/journeys/dharamshala-dalhousie-escape');
    expect(response.partial).toBe(false);
    expect(response.total).toBe(Object.values(response.sections).reduce((n, s) => n + s.items.length, 0));
  });

  it('finds an expert through a linked destination with the McLeodganj spelling, using the shared published catalogs', async () => {
    const response = await runGlobalSearch(parse('McLeodganj'), loaders());
    expect(ids(response, 'experts')).toEqual(['expert:asha']);
    expect(ids(response, 'destinations')).toEqual(['destination:mcleod-ganj']);
  });

  it('meaningless text reads nothing at all', async () => {
    const l = loaders();
    const response = await runGlobalSearch(parse('[['), l);
    expect(l.calls).toEqual({});
    expect(response.total).toBe(0);
    expect(response.partial).toBe(false);
  });

  it('keeps each section within 5 items and the whole response within 25', async () => {
    const response = await runGlobalSearch(parse('Adventure'), loaders());
    for (const section of Object.values(response.sections)) expect(section.items.length).toBeLessThanOrEqual(5);
    expect(response.total).toBeLessThanOrEqual(25);
  });

  it('one failing section does not block the others, and no error detail leaks into the response', async () => {
    const response = await runGlobalSearch(parse('Spiti'), loaders({ journeys: vi.fn(async () => { throw new Error('mongodb://user:secret@host exploded'); }) }));
    expect(response.sections.journeys).toEqual({ status: 'error', items: [] });
    expect(response.sections.destinations.status).toBe('ok');
    expect(ids(response, 'destinations').length).toBeGreaterThan(0);
    expect(response.partial).toBe(true);
    expect(JSON.stringify(response)).not.toMatch(/secret|mongodb:/);
  });

  it('a database time-limit error is reported as a timeout, not an error', async () => {
    const expired = Object.assign(new Error('operation exceeded time limit'), { code: 50, codeName: 'MaxTimeMSExpired' });
    const response = await runGlobalSearch(parse('Spiti'), loaders({ experiences: vi.fn(async () => { throw expired; }) }));
    expect(response.sections.experiences).toEqual({ status: 'timeout', items: [] });
    expect(response.partial).toBe(true);
  });

  it('a read that never finishes is cut off at the deadline while other sections still answer', async () => {
    vi.useFakeTimers();
    const never = vi.fn(() => new Promise<never>(() => undefined));
    const pending = runGlobalSearch(parse('Spiti'), loaders({ journeys: never }));
    await vi.advanceTimersByTimeAsync(SECTION_DEADLINE_MS + 10);
    const response = await pending;
    expect(response.sections.journeys).toEqual({ status: 'timeout', items: [] });
    expect(response.sections.destinations.status).toBe('ok');
    expect(response.partial).toBe(true);
    expect(SECTION_DEADLINE_MS).toBeGreaterThan(SECTION_DB_TIME_LIMIT_MS);
    // the deadline is bounded: nothing waits longer than this
    expect(SECTION_DEADLINE_MS).toBeLessThanOrEqual(2000);
  });

  it('if destinations cannot be read, journeys and experiences still answer from their own fields (never widening results)', async () => {
    const response = await runGlobalSearch(parse('Kasol Kheerganga Tosh'), loaders({ destinations: vi.fn(async () => { throw new Error('down'); }) }));
    expect(response.sections.destinations.status).toBe('error');
    expect(ids(response, 'journeys')[0]).toBe('journey:kasol-kheerganga-tosh');
  });

  it('if every source fails, the response is all-empty and partial, not an exception', async () => {
    const down = vi.fn(async () => { throw new Error('down'); });
    const response = await runGlobalSearch(parse('Spiti'), { destinations: down, regions: down, journeys: down, experiences: down, experts: down, stays: down });
    expect(response.total).toBe(0);
    expect(Object.values(response.sections).every((s) => s.status === 'error')).toBe(true);
    expect(response.partial).toBe(true);
  });
});

describe('connection setup is budgeted separately from queries', () => {
  it('connects before any read starts', async () => {
    const order: string[] = [];
    const l = loaders({ connect: vi.fn(async () => { order.push('connect'); }) });
    for (const key of ['destinations', 'regions', 'journeys', 'experiences', 'experts'] as const) {
      const original = l[key] as () => Promise<unknown>;
      (l as unknown as Record<string, unknown>)[key] = vi.fn(async () => { order.push(key); return original(); });
    }
    await runGlobalSearch(parse('Spiti'), l);
    expect(order[0]).toBe('connect');
    expect(order.length).toBe(6);
  });

  it('a slow cold-start connection (well over one query deadline) still yields complete results', async () => {
    vi.useFakeTimers();
    const slowConnect = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 4000)));
    const pending = runGlobalSearch(parse('Dharamsala'), loaders({ connect: slowConnect }));
    await vi.advanceTimersByTimeAsync(4100);
    const response = await pending;
    expect(SECTION_DEADLINE_MS).toBeLessThan(4000);
    expect(response.partial).toBe(false);
    expect(ids(response, 'destinations')).toEqual(['destination:dharamshala']);
  });

  it('a connection that never opens fails every section as a timeout without starting any read', async () => {
    vi.useFakeTimers();
    const l = loaders({ connect: vi.fn(() => new Promise<never>(() => undefined)) });
    const pending = runGlobalSearch(parse('Spiti'), l);
    await vi.advanceTimersByTimeAsync(CONNECT_DEADLINE_MS + 10);
    const response = await pending;
    expect(Object.values(response.sections).every((s) => s.status === 'timeout' && s.items.length === 0)).toBe(true);
    expect(response.partial).toBe(true);
    expect(l.calls).toEqual({});
  });

  it('a connection error fails every section as an error', async () => {
    const l = loaders({ connect: vi.fn(async () => { throw new Error('auth failed for user:pw'); }) });
    const response = await runGlobalSearch(parse('Spiti'), l);
    expect(Object.values(response.sections).every((s) => s.status === 'error')).toBe(true);
    expect(JSON.stringify(response)).not.toMatch(/pw|auth/);
    expect(l.calls).toEqual({});
  });
});

describe('future records through the server layer (isolated loader fixtures)', () => {
  it('a new published journey appears on the very next request and an unpublished one disappears immediately', async () => {
    const added = { ...(journeys[0] as unknown as Record<string, unknown>), slug: 'quillon-meadow-weekend', name: 'Quillon Meadow Weekend', status: 'published' } as unknown as TravelPackage;
    let catalogNow: TravelPackage[] = journeys;
    const l = loaders({ journeys: vi.fn(async () => catalogNow) });
    expect(ids(await runGlobalSearch(parse('Quillon'), l), 'journeys')).toEqual([]);
    catalogNow = [...journeys, added];
    expect(ids(await runGlobalSearch(parse('Quillon'), l), 'journeys')).toEqual(['journey:quillon-meadow-weekend']);
    catalogNow = journeys; // unpublished: the public loader no longer returns it
    expect(ids(await runGlobalSearch(parse('Quillon'), l), 'journeys')).toEqual([]);
  });

  it('publication changes to destinations, regions and experts apply with no caching between requests', async () => {
    let regionList: RegionRef[] = regions;
    let experts: TravelExpert[] = [asha];
    const l = loaders({ regions: vi.fn(async () => regionList), experts: vi.fn(async () => experts) });
    expect(ids(await runGlobalSearch(parse('Ladakh'), l), 'regions')).toEqual([]);
    regionList = [...regions, { id: 'r9', slug: 'ladakh', name: 'Ladakh' }];
    expect(ids(await runGlobalSearch(parse('Ladakh'), l), 'regions')).toEqual(['region:ladakh']);
    expect(ids(await runGlobalSearch(parse('Asha'), l), 'experts')).toEqual(['expert:asha']);
    experts = [];
    expect(ids(await runGlobalSearch(parse('Asha'), l), 'experts')).toEqual([]);
  });
});

describe('singleFlight (burst coalescing without any stored copy)', () => {
  it('concurrent requests share one running read', async () => {
    let reads = 0;
    const read = () => { reads++; return new Promise<number>((resolve) => setTimeout(() => resolve(reads), 20)); };
    const results = await Promise.all(Array.from({ length: 20 }, () => singleFlight('k1', read)));
    expect(reads).toBe(1);
    expect(new Set(results).size).toBe(1);
  });

  it('keeps nothing after the read finishes: the next request reads fresh', async () => {
    let value = 1;
    const read = async () => value;
    expect(await singleFlight('k2', read)).toBe(1);
    value = 2;
    expect(await singleFlight('k2', read)).toBe(2);
  });

  it('never keeps a failed read, and different catalogs never share', async () => {
    let attempts = 0;
    await expect(singleFlight('k3', async () => { attempts++; throw new Error('down'); })).rejects.toThrow('down');
    expect(await singleFlight('k3', async () => { attempts++; return 'ok'; })).toBe('ok');
    expect(attempts).toBe(2);
    const [a, b] = await Promise.all([singleFlight('ka', async () => 'a'), singleFlight('kb', async () => 'b')]);
    expect([a, b]).toEqual(['a', 'b']);
  });
});
