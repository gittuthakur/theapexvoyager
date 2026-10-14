import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import journeyCatalog from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import {
  SECTION_DEADLINE_MS,
  defaultLoaders,
  SECTION_READ_ABORT_AFTER_MS,
  resetSectionReadsForTests,
  runGlobalSearch,
  singleFlight,
  type GlobalSearchLoaders
} from '@/lib/globalSearchServer';
import { createTimings } from '@/lib/globalSearchTiming';
import { parseGlobalSearchQuery } from '@/lib/search/globalSearch';
import type { StaySuggestionsOutcome } from '@/lib/staysSearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';

const destinations = catalog.destinations as unknown as Destination[];
const experiences = catalog.experiences as unknown as Experience[];
const journeys = journeyCatalog.journeys as unknown as TravelPackage[];
const refsOf = (list: Destination[]) => list.map((d) => ({ slug: d.slug, title: d.title, state: d.state }));
const parse = (q: string) => {
  const parsed = parseGlobalSearchQuery(q);
  if (!parsed.ok) throw new Error('bad query');
  return parsed;
};
const never = <T,>() => new Promise<T>(() => undefined);
const delay = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
const abortable = <T,>(signal: AbortSignal) => new Promise<T>((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
const okStays = (): StaySuggestionsOutcome => ({ status: 'ok', suggestions: [], totalCount: 0 });

beforeEach(() => {
  vi.useFakeTimers();
  resetSectionReadsForTests();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  resetSectionReadsForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function loaders(overrides: Partial<GlobalSearchLoaders> = {}): GlobalSearchLoaders {
  return {
    destinations: async () => destinations,
    destinationRefs: async () => refsOf(destinations),
    regions: async () => [],
    journeys: async () => journeys,
    experiences: async () => experiences,
    experts: async () => [],
    stays: async (_q, shared) => {
      await shared.destinations();
      return okStays();
    },
    ...overrides
  };
}

async function timed(l: GlobalSearchLoaders, q = 'Dharamsala') {
  const timings = createTimings();
  const started = Date.now();
  let response: Awaited<ReturnType<typeof runGlobalSearch>> | undefined;
  void runGlobalSearch(parse(q), l, timings).then((r) => {
    response = r;
  });
  while (!response && Date.now() - started < 60_000) await vi.advanceTimersByTimeAsync(10);
  return { ms: Date.now() - started, response: response!, timings };
}
const ids = (response: Awaited<ReturnType<typeof runGlobalSearch>>, key: keyof Awaited<ReturnType<typeof runGlobalSearch>>['sections']) => response.sections[key].items.map((i) => i.id);

describe('two destination reads start together and neither waits for the other', () => {
  it('both are requested in the same tick, once each per request', async () => {
    const calls: Array<[string, number]> = [];
    const out = await timed(loaders({ destinations: async () => { calls.push(['heavy', Date.now()]); return destinations; }, destinationRefs: async () => { calls.push(['refs', Date.now()]); return refsOf(destinations); } }));
    expect(calls.map((c) => c[0]).sort()).toEqual(['heavy', 'refs']);
    expect(new Set(calls.map((c) => c[1])).size).toBe(1);
    expect(out.ms).toBeLessThan(50);
  });

  it('the dependent sections do not wait for the heavy read: a slow heavy read leaves them finished in ~0 ms while Destinations is still reading', async () => {
    const out = await timed(loaders({ destinations: () => delay(1500, destinations) }));
    expect(out.timings.sections.destinations?.ms).toBe(1500);
    for (const key of ['journeys', 'experiences', 'experts', 'stays'] as const) expect(out.timings.sections[key]?.ms, key).toBeLessThan(50);
  });
});

describe('failure policy', () => {
  it('Case A - heavy Destinations times out, light refs succeed: dependents answer with verified links, Destinations is "timeout", the response is partial', async () => {
    const healthy = await timed(loaders());
    const out = await timed(loaders({ destinations: () => never() }));
    expect(out.response.sections.destinations).toEqual({ status: 'timeout', items: [] });
    expect(out.response.sections.stays.status).toBe('ok');
    for (const key of ['journeys', 'experiences', 'experts', 'regions'] as const) expect(out.response.sections[key]).toEqual(healthy.response.sections[key]);
    expect(out.response.partial).toBe(true);
    expect(out.ms).toBe(SECTION_DEADLINE_MS);
  });

  it('Case B - light refs time out, heavy Destinations succeeds: Destinations answers; Journeys, Experiences, Experts and Stays are withheld as "timeout" with no data; Regions answers', async () => {
    const healthy = await timed(loaders());
    const out = await timed(loaders({ destinationRefs: () => never() }));
    expect(out.response.sections.destinations).toEqual(healthy.response.sections.destinations);
    expect(out.response.sections.regions).toEqual(healthy.response.sections.regions);
    for (const key of ['journeys', 'experiences', 'experts', 'stays'] as const) expect(out.response.sections[key], key).toEqual({ status: 'timeout', items: [] });
    expect(out.response.partial).toBe(true);
  });

  it('Case B with a fast failure is "error" for the same four sections (never an empty "ok")', async () => {
    const out = await timed(loaders({ destinationRefs: async () => { throw new Error('refs down'); } }));
    for (const key of ['journeys', 'experiences', 'experts', 'stays'] as const) expect(out.response.sections[key], key).toEqual({ status: 'error', items: [] });
    expect(out.response.sections.destinations.status).toBe('ok');
    expect(out.response.partial).toBe(true);
  });

  it('Case C - both fail: the dependents are unavailable, Regions still answers, the response is partial, and nothing is a zero-result "ok"', async () => {
    const out = await timed(loaders({ destinations: () => never(), destinationRefs: () => never(), regions: async () => [{ id: 'r1', slug: 'himachal-pradesh', name: 'Himachal Pradesh' }] }), 'Himachal');
    expect(out.response.sections.destinations.status).toBe('timeout');
    for (const key of ['journeys', 'experiences', 'experts', 'stays'] as const) expect(out.response.sections[key].status, key).toBe('timeout');
    expect(out.response.sections.regions.status).toBe('ok');
    expect(ids(out.response, 'regions')).toEqual(['region:himachal-pradesh']);
    expect(out.response.partial).toBe(true);
    expect(Object.values(out.response.sections).filter((s) => s.status === 'ok' && s.items.length === 0 && s !== out.response.sections.regions).length).toBeLessThanOrEqual(1);
  });

  it('a failed Regions read still only lowers Experts recall (it is not destination verification)', async () => {
    const out = await timed(loaders({ regions: async () => { throw new Error('regions down'); } }));
    expect(out.response.sections.regions.status).toBe('error');
    expect(out.response.sections.experts.status).toBe('ok');
    expect(out.response.sections.journeys.status).toBe('ok');
  });

  it('a Stays loader that reports unavailable exclusions is "error" and nothing else is withheld', async () => {
    const out = await timed(loaders({ stays: async () => ({ status: 'unavailable', reason: 'exclusions' }) }));
    expect(out.response.sections.stays).toEqual({ status: 'error', items: [] });
    for (const key of ['destinations', 'journeys', 'experiences', 'experts', 'regions'] as const) expect(out.response.sections[key].status, key).toBe('ok');
  });
});

describe('publication is read fresh on every request', () => {
  it('a destination unpublished between two requests is gone from the second request (the light refs are never reused)', async () => {
    let published = destinations;
    let refReads = 0;
    const l = loaders({ destinationRefs: async () => { refReads++; return refsOf(published); }, stays: async (_q, shared) => ({ status: 'ok', suggestions: (await shared.destinations()).filter((d) => d.slug === 'dharamshala').map((d) => ({ id: `stay:${d.slug}`, placeId: d.slug, name: 'Probe', locality: 'x', destinationSlug: d.slug, destinationTitle: d.title, href: '/stays/property/probe' })), totalCount: 1 }) });
    expect(ids((await timed(l)).response, 'stays')).toEqual(['stay:dharamshala']);
    published = destinations.filter((d) => d.slug !== 'dharamshala');
    expect(ids((await timed(l)).response, 'stays')).toEqual([]);
    expect(refReads).toBe(2);
  });
});

describe('healthy parity', () => {
  it.each(['Dharamsala', 'Kaza', 'Spiti', 'Kasol Kheerganga Tosh', 'Manali', 'Himachal', 'zzzzqqq'])('"%s": identical ids, order, URLs and shape with the light refs and with the previous derived-from-Destinations behaviour', async (q) => {
    const withRefs = (await timed(loaders(), q)).response;
    const { destinationRefs: _unused, ...previous } = loaders();
    void _unused;
    const without = (await timed(previous, q)).response;
    expect(withRefs).toEqual(without);
    expect(Object.keys(withRefs.sections)).toEqual(['destinations', 'regions', 'journeys', 'experiences', 'stays', 'experts', 'transport']);
  });
});

describe('lifecycle of the light read', () => {
  const wired = (counts: Record<string, number>, refs: (signal: AbortSignal) => Promise<ReturnType<typeof refsOf>>) =>
    loaders({
      destinations: () => singleFlight('destinations#1500', async () => { counts.heavy = (counts.heavy ?? 0) + 1; return destinations; }),
      destinationRefs: () => singleFlight('destinationRefs#1500', (signal) => { counts.refs = (counts.refs ?? 0) + 1; return refs(signal); })
    });

  it('five concurrent requests share ONE heavy and ONE light read', async () => {
    const counts: Record<string, number> = {};
    const l = wired(counts, () => delay(100, refsOf(destinations)));
    const pending = Promise.all(Array.from({ length: 5 }, () => runGlobalSearch(parse('Kaza'), l)));
    await vi.advanceTimersByTimeAsync(200);
    await pending;
    expect(counts).toEqual({ heavy: 1, refs: 1 });
  });

  it('a hung light read stays registered across repeated requests (one read ever), is aborted at 10 s, and only after it rejects can a new read start', async () => {
    const counts: Record<string, number> = {};
    let signalSeen: AbortSignal | undefined;
    const l = wired(counts, (signal) => {
      signalSeen = signal;
      return abortable(signal);
    });
    for (let i = 0; i < 2; i++) { // 2 x (1.75 s + 2 s) stays inside the 10 s lifetime
      const out = await timed(l);
      expect(out.response.sections.stays.status).toBe('timeout');
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(counts.refs).toBe(1);
    await vi.advanceTimersByTimeAsync(SECTION_READ_ABORT_AFTER_MS);
    expect(signalSeen?.aborted).toBe(true);
    const next = await timed(wired(counts, () => Promise.resolve(refsOf(destinations))));
    expect(counts.refs).toBe(2);
    expect(next.response.sections.stays.status).toBe('ok');
  });

  it('a light read that ignores cancellation keeps its slot: no second light read ever starts, and the dependents stay honestly unavailable', async () => {
    const counts: Record<string, number> = {};
    const l = wired(counts, () => never());
    for (let i = 0; i < 8; i++) {
      const out = await timed(l);
      expect(out.response.sections.journeys.status).toBe('timeout');
      await vi.advanceTimersByTimeAsync(5000);
    }
    expect(counts.refs).toBe(1);
  });

  it('a light read that settles after its callers gave up causes no unhandled rejection', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const counts: Record<string, number> = {};
      const l = wired(counts, () => new Promise<ReturnType<typeof refsOf>>((_, reject) => setTimeout(() => reject(new Error('late failure')), 6000)));
      await timed(l);
      await vi.advanceTimersByTimeAsync(10_000);
      vi.useRealTimers();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });
});

describe('the fallback cannot become a verification bypass', () => {
  it('production loaders always supply the fresh light refs read, so the route never runs on the fallback', () => {
    expect(typeof defaultLoaders.destinationRefs).toBe('function');
    expect(typeof defaultLoaders.destinations).toBe('function');
  });

  it('even without a refs loader, the refs are derived from the SAME request fresh published-only Destinations read - never from stored data', async () => {
    let published = destinations;
    let reads = 0;
    const { destinationRefs: _unused, ...withoutRefs } = loaders({
      destinations: async () => {
        reads++;
        return published;
      },
      stays: async (_q, shared) => ({
        status: 'ok',
        suggestions: (await shared.destinations())
          .filter((d) => d.slug === 'dharamshala')
          .map((d) => ({ id: `stay:${d.slug}`, placeId: d.slug, name: 'Probe', locality: 'x', destinationSlug: d.slug, destinationTitle: d.title, href: '/stays/property/probe' })),
        totalCount: 1
      })
    });
    void _unused;
    expect(ids((await timed(withoutRefs)).response, 'stays')).toEqual(['stay:dharamshala']);
    published = destinations.filter((d) => d.slug !== 'dharamshala');
    expect(ids((await timed(withoutRefs)).response, 'stays')).toEqual([]);
    expect(reads).toBe(2);
  });

  it('without a refs loader a failed Destinations read still fails closed: Stays and the dependents are withheld, never answered from unverified destinations', async () => {
    const { destinationRefs: _unused, ...withoutRefs } = loaders({ destinations: async () => { throw new Error('down'); } });
    void _unused;
    const out = await timed(withoutRefs);
    for (const key of ['journeys', 'experiences', 'experts', 'stays'] as const) expect(out.response.sections[key], key).toEqual({ status: 'error', items: [] });
    expect(out.response.partial).toBe(true);
  });
});
