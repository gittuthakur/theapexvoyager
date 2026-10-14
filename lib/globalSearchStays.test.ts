import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import journeyCatalog from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import { SECTION_DEADLINE_MS, STAYS_SECTION_DEADLINE_MS, runGlobalSearch, type GlobalSearchLoaders } from '@/lib/globalSearchServer';
import { GLOBAL_SEARCH_LIMITS, GLOBAL_SEARCH_SECTION_ORDER, parseGlobalSearchQuery, staySection, type RegionRef, type StaySuggestionRow } from '@/lib/search/globalSearch';
import type { StaySuggestionsOutcome } from '@/lib/staysSearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';
import type { TravelExpert } from '@/types/expert';

const destinations = catalog.destinations as unknown as Destination[];
const experiences = catalog.experiences as unknown as Experience[];
const journeys = journeyCatalog.journeys as unknown as TravelPackage[];
const regions: RegionRef[] = [{ id: 'r1', slug: 'himachal-pradesh', name: 'Himachal Pradesh', shortDescription: 'Snow passes and apple valleys.' }];
const asha: TravelExpert = { slug: 'asha', name: 'Asha Verma', role: 'Mountain Travel Planner', profileImage: '/a.jpg', bio: 'b', destinationSlugs: ['mcleod-ganj'], travelStyles: [], expertise: ['Trekking'], active: true, publiclyListed: true, regionIds: ['r1'] };

const suggestion = (n: number, extra: Partial<StaySuggestionRow> = {}): StaySuggestionRow => ({ placeId: `ChIJ${n}`, name: `Stay ${n}`, locality: 'Kaza', destinationTitle: 'Spiti Valley', href: `/stays/property/ChIJ${n}`, ...extra });
const ok = (rows: StaySuggestionRow[]): StaySuggestionsOutcome => ({ status: 'ok', suggestions: rows.map((row) => ({ id: `stay:${row.placeId}`, destinationSlug: 'spiti-valley', ...row })), totalCount: rows.length });

function loaders(stays?: GlobalSearchLoaders['stays']): GlobalSearchLoaders {
  return {
    destinations: vi.fn(async () => destinations),
    regions: vi.fn(async () => regions),
    journeys: vi.fn(async () => journeys),
    experiences: vi.fn(async () => experiences),
    experts: vi.fn(async () => [asha]),
    ...(stays ? { stays } : {})
  };
}
const parse = (q: string) => {
  const parsed = parseGlobalSearchQuery(q);
  if (!parsed.ok) throw new Error('bad query');
  return parsed;
};

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('staySection (pure row shaping)', () => {
  it('maps suggestions to rows: public name, locality + destination, public property URL, a stay type, NO image', () => {
    const items = staySection([suggestion(1), suggestion(2, { locality: 'Sangla', destinationTitle: 'Chitkul' })]);
    expect(items).toEqual([
      { id: 'stay:ChIJ1', type: 'stay', title: 'Stay 1', subtitle: 'Kaza, Spiti Valley', href: '/stays/property/ChIJ1', reason: 'stay' },
      { id: 'stay:ChIJ2', type: 'stay', title: 'Stay 2', subtitle: 'Sangla, Chitkul', href: '/stays/property/ChIJ2', reason: 'stay' }
    ]);
    for (const item of items) expect('image' in item).toBe(false);
  });

  it('caps at five, keeps order, and drops a repeated place identity before capping', () => {
    const rows = [suggestion(1), suggestion(1), ...[2, 3, 4, 5, 6, 7].map((n) => suggestion(n))];
    const items = staySection(rows);
    expect(items.map((i) => i.id)).toEqual(['stay:ChIJ1', 'stay:ChIJ2', 'stay:ChIJ3', 'stay:ChIJ4', 'stay:ChIJ5']);
    expect(items).toHaveLength(GLOBAL_SEARCH_LIMITS.perSection);
  });

  it('shows the place once when locality and destination are the same, and nothing when both are empty', () => {
    expect(staySection([suggestion(1, { locality: 'Manali', destinationTitle: 'manali' })])[0].subtitle).toBe('Manali');
    expect(staySection([suggestion(1, { locality: '', destinationTitle: '' })])[0].subtitle).toBeUndefined();
  });

  it('exposes no rating, price, availability, photograph or provider URL, even if the suggestion object carried extras', () => {
    const noisy = { ...suggestion(1), rating: 4.9, price: 4000, photos: ['https://maps.example/p'], googleMapsUri: 'https://maps.google.com/x', availability: 'open' } as StaySuggestionRow;
    const [item] = staySection([noisy]);
    expect(JSON.stringify(item)).not.toMatch(/rating|price|photo|maps|availab/i);
  });
});

describe('runGlobalSearch with the Stays section', () => {
  it('has six sections in order and reads Stays once for the query', async () => {
    const stays = vi.fn(async () => ok([suggestion(1)]));
    const response = await runGlobalSearch(parse('Kaza'), loaders(stays));
    expect(GLOBAL_SEARCH_SECTION_ORDER).toEqual(['destinations', 'regions', 'journeys', 'experiences', 'stays', 'experts']);
    expect(Object.keys(response.sections).sort()).toEqual([...GLOBAL_SEARCH_SECTION_ORDER].sort());
    expect(stays).toHaveBeenCalledTimes(1);
    expect(stays).toHaveBeenCalledWith('Kaza', { destinations: expect.any(Function) });
    expect(response.sections.stays).toEqual({ status: 'ok', items: [expect.objectContaining({ id: 'stay:ChIJ1', type: 'stay', href: '/stays/property/ChIJ1' })] });
    expect(response.partial).toBe(false);
  });

  it('the five existing sections are identical with and without Stays', async () => {
    const without = await runGlobalSearch(parse('Spiti'), loaders());
    const withStays = await runGlobalSearch(parse('Spiti'), loaders(async () => ok([suggestion(1)])));
    for (const key of ['destinations', 'regions', 'journeys', 'experiences', 'experts'] as const) expect(withStays.sections[key]).toEqual(without.sections[key]);
  });

  it('returns at most five stays even if the loader returns more, and counts them in the total', async () => {
    const response = await runGlobalSearch(parse('Kaza'), loaders(async () => ok([1, 2, 3, 4, 5, 6, 7, 8].map((n) => suggestion(n)))));
    expect(response.sections.stays.items).toHaveLength(5);
    const expected = GLOBAL_SEARCH_SECTION_ORDER.reduce((sum, key) => sum + response.sections[key].items.length, 0);
    expect(response.total).toBe(expected);
  });

  it('a genuine empty Stays answer is "ok" with no items (not a timeout)', async () => {
    const response = await runGlobalSearch(parse('Spiti'), loaders(async () => ok([])));
    expect(response.sections.stays).toEqual({ status: 'ok', items: [] });
    expect(response.partial).toBe(false);
  });

  it('meaningless text reads nothing, Stays included', async () => {
    const stays = vi.fn(async () => ok([suggestion(1)]));
    const response = await runGlobalSearch(parse('[['), loaders(stays));
    expect(stays).not.toHaveBeenCalled();
    expect(response.total).toBe(0);
    expect(response.partial).toBe(false);
  });

  it('a failed connection fails every section including Stays, and never reaches the Stays loader', async () => {
    const stays = vi.fn(async () => ok([suggestion(1)]));
    const l = { ...loaders(stays), connect: vi.fn(async () => { throw new Error('no db'); }) };
    const response = await runGlobalSearch(parse('Kaza'), l);
    expect(stays).not.toHaveBeenCalled();
    expect(response.sections.stays.status).toBe('error');
    expect(response.partial).toBe(true);
  });
});

describe('Stays failure isolation', () => {
  it.each([
    ['exclusions', 'error'],
    ['catalog', 'error'],
    ['timeout', 'timeout']
  ] as const)('an unavailable Stays section (%s) is status "%s" with zero items, the response is partial, and the other sections still answer', async (reason, status) => {
    const response = await runGlobalSearch(parse('Dharamsala'), loaders(async () => ({ status: 'unavailable', reason })));
    expect(response.sections.stays).toEqual({ status, items: [] });
    expect(response.partial).toBe(true);
    expect(response.sections.destinations.status).toBe('ok');
    expect(response.sections.destinations.items.length).toBeGreaterThan(0);
    expect(response.sections.journeys.items.length).toBeGreaterThan(0);
  });

  it('a throwing Stays loader is an "error" section, never an exception and never an empty "ok"', async () => {
    const response = await runGlobalSearch(parse('Dharamsala'), loaders(async () => { throw new Error('boom'); }));
    expect(response.sections.stays).toEqual({ status: 'error', items: [] });
    expect(response.partial).toBe(true);
    expect(response.sections.destinations.items.length).toBeGreaterThan(0);
  });

  it('a synchronously throwing Stays loader is contained too', async () => {
    const response = await runGlobalSearch(parse('Dharamsala'), loaders((() => { throw new Error('sync boom'); }) as unknown as GlobalSearchLoaders['stays']));
    expect(response.sections.stays.status).toBe('error');
    expect(response.sections.destinations.status).toBe('ok');
  });
});

describe('Stays has its own deadline and never makes the response wait for it to finish', () => {
  it('a Stays answer after the others\' deadline but before its own is included (cold read inside the window)', async () => {
    vi.useFakeTimers();
    const stays = () => new Promise<StaySuggestionsOutcome>((resolve) => setTimeout(() => resolve(ok([suggestion(1)])), SECTION_DEADLINE_MS + 400));
    const pending = runGlobalSearch(parse('Kaza'), loaders(stays));
    await vi.advanceTimersByTimeAsync(SECTION_DEADLINE_MS + 450);
    const response = await pending;
    expect(response.sections.stays.status).toBe('ok');
    expect(response.sections.stays.items).toHaveLength(1);
    expect(response.partial).toBe(false);
  });

  it('a Stays read that outlasts its deadline: the response is returned AT the deadline with Stays "timeout", partial, other sections complete', async () => {
    vi.useFakeTimers();
    const stays = () => new Promise<StaySuggestionsOutcome>((resolve) => setTimeout(() => resolve(ok([suggestion(1)])), 30_000));
    let settled = false;
    const pending = runGlobalSearch(parse('Dharamsala'), loaders(stays)).then((r) => {
      settled = true;
      return r;
    });
    await vi.advanceTimersByTimeAsync(STAYS_SECTION_DEADLINE_MS - 50);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    const response = await pending;
    expect(settled).toBe(true);
    expect(response.sections.stays).toEqual({ status: 'timeout', items: [] });
    expect(response.partial).toBe(true);
    expect(response.sections.destinations.items.length).toBeGreaterThan(0);
    // The straggler is bounded: the response never waited for the 30 s read.
    await vi.advanceTimersByTimeAsync(30_000);
  });

  it('the Stays deadline adds at most the difference to the others\' deadline', () => {
    expect(STAYS_SECTION_DEADLINE_MS).toBeGreaterThan(SECTION_DEADLINE_MS);
    expect(STAYS_SECTION_DEADLINE_MS - SECTION_DEADLINE_MS).toBeLessThanOrEqual(1000);
  });

  it('a Stays read that never settles, and one that rejects AFTER the deadline, leave no unhandled rejection', async () => {
    vi.useFakeTimers();
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const rejectsLate = () => new Promise<StaySuggestionsOutcome>((_, reject) => setTimeout(() => reject(new Error('late')), 10_000));
      const never = () => new Promise<StaySuggestionsOutcome>(() => undefined);
      for (const stays of [rejectsLate, never]) {
        const pending = runGlobalSearch(parse('Kaza'), loaders(stays));
        await vi.advanceTimersByTimeAsync(STAYS_SECTION_DEADLINE_MS + 50);
        expect((await pending).sections.stays.status).toBe('timeout');
      }
      await vi.advanceTimersByTimeAsync(20_000);
      vi.useRealTimers();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  it('a fast Stays answer does not slow the response (everything resolves on the first tick)', async () => {
    vi.useFakeTimers();
    const pending = runGlobalSearch(parse('Kaza'), loaders(async () => ok([suggestion(1)])));
    await vi.advanceTimersByTimeAsync(5);
    expect((await pending).sections.stays.status).toBe('ok');
  });
});

describe('Stays reuses the Destinations section read', () => {
  it('hands the Stays loader the published refs (slug, title, state); without a refs loader they come from the Destinations read, never a second read', async () => {
    const l = loaders();
    let received: Array<{ slug: string; title: string; state?: string }> = [];
    const stays = vi.fn(async (_q: string, shared: { destinations(): Promise<Array<{ slug: string; title: string; state?: string }>> }) => {
      received = await shared.destinations();
      return ok([]);
    });
    await runGlobalSearch(parse('Kaza'), { ...l, stays });
    expect(l.destinations).toHaveBeenCalledTimes(1);
    expect(received).toEqual(destinations.map((d) => ({ slug: d.slug, title: d.title, state: d.state })));
  });

  it('if only the heavy Destinations read fails, Stays is still verified by the light refs and answers; the response is partial', async () => {
    const l = { ...loaders(), destinations: vi.fn(async () => { throw new Error('destinations down'); }), destinationRefs: vi.fn(async () => destinations.map((d) => ({ slug: d.slug, title: d.title, state: d.state }))) };
    const stays = vi.fn(async (_q: string, shared: { destinations(): Promise<unknown> }) => {
      await shared.destinations();
      return ok([suggestion(1)]);
    });
    const response = await runGlobalSearch(parse('Kaza'), { ...l, stays });
    expect(response.sections.destinations.status).toBe('error');
    expect(response.sections.stays.status).toBe('ok');
    expect(response.sections.stays.items).toHaveLength(1);
    expect(response.sections.journeys.status).toBe('ok');
    expect(response.partial).toBe(true);
  });

  it('if the light refs read fails, Stays and the destination-dependent sections are withheld (error), while Destinations and Regions still answer', async () => {
    const l = { ...loaders(), destinationRefs: vi.fn(async () => { throw new Error('refs down'); }) };
    const stays = vi.fn(async (_q: string, shared: { destinations(): Promise<unknown> }) => {
      await shared.destinations();
      return ok([suggestion(1)]);
    });
    const response = await runGlobalSearch(parse('Dharamsala'), { ...l, stays });
    expect(response.sections.stays).toEqual({ status: 'error', items: [] });
    for (const key of ['journeys', 'experiences', 'experts'] as const) expect(response.sections[key]).toEqual({ status: 'error', items: [] });
    expect(response.sections.destinations.status).toBe('ok');
    expect(response.sections.destinations.items.length).toBeGreaterThan(0);
    expect(response.sections.regions.status).toBe('ok');
    expect(response.partial).toBe(true);
  });

  it('a Destinations read that exceeds its own deadline makes Stays a "timeout" with no items', async () => {
    vi.useFakeTimers();
    const l = { ...loaders(), destinations: vi.fn(() => new Promise<Destination[]>(() => undefined)) };
    const stays = (_q: string, shared: { destinations(): Promise<unknown> }) => shared.destinations().then(() => ok([suggestion(1)]));
    const pending = runGlobalSearch(parse('Kaza'), { ...l, stays });
    await vi.advanceTimersByTimeAsync(SECTION_DEADLINE_MS + 20);
    const response = await pending;
    expect(response.sections.stays).toEqual({ status: 'timeout', items: [] });
    expect(response.partial).toBe(true);
  });
});
