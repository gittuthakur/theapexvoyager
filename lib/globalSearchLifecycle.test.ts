import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import journeyCatalog from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import {
  MAX_UNSETTLED_SECTION_READS,
  SECTION_READ_CATALOGS,
  UnknownSectionReadError,
  SECTION_DEADLINE_MS,
  SECTION_READ_ABORT_AFTER_MS,
  SectionReadBusyError,
  resetSectionReadsForTests,
  runGlobalSearch,
  singleFlight,
  type GlobalSearchLoaders
} from '@/lib/globalSearchServer';
import { parseGlobalSearchQuery } from '@/lib/search/globalSearch';
import type { StaySuggestionsOutcome } from '@/lib/staysSearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';

const destinations = catalog.destinations as unknown as Destination[];
const experiences = catalog.experiences as unknown as Experience[];
const journeys = journeyCatalog.journeys as unknown as TravelPackage[];
const parse = (q: string) => {
  const parsed = parseGlobalSearchQuery(q);
  if (!parsed.ok) throw new Error('bad query');
  return parsed;
};
const delay = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
const never = <T,>() => new Promise<T>(() => undefined);
/** A read that honours its AbortSignal the way the driver does: it rejects when aborted. */
const abortable = <T,>(signal: AbortSignal, ms: number | null, value: T) =>
  new Promise<T>((resolve, reject) => {
    if (ms !== null) setTimeout(() => resolve(value), ms);
    signal.addEventListener('abort', () => reject(signal.reason));
  });

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

/** Virtual milliseconds until the search answers. */
async function timed(loaders: GlobalSearchLoaders, q = 'Kaza') {
  const started = Date.now();
  let response: Awaited<ReturnType<typeof runGlobalSearch>> | undefined;
  void runGlobalSearch(parse(q), loaders).then((r) => {
    response = r;
  });
  while (!response && Date.now() - started < 60_000) await vi.advanceTimersByTimeAsync(10);
  const ms = Date.now() - started;
  return { ms, response: response! };
}

function base(overrides: Partial<GlobalSearchLoaders> = {}): GlobalSearchLoaders {
  return {
    destinations: async () => destinations,
    regions: async () => [],
    journeys: async () => journeys,
    experiences: async () => experiences,
    destinationRefs: async () => destinations.map((d) => ({ slug: d.slug, title: d.title, state: d.state })),
    experts: async () => [],
    stays: async (_q, shared) => {
      await shared.destinations();
      return okStays();
    },
    ...overrides
  };
}

describe('single-flight lifetime (the five older catalogs)', () => {
  it('five concurrent requests for one key share ONE underlying read', async () => {
    let reads = 0;
    const read = () => {
      reads++;
      return delay(50, 'rows');
    };
    const calls = Array.from({ length: 5 }, () => singleFlight('regions#1500', read));
    await vi.advanceTimersByTimeAsync(60);
    expect(await Promise.all(calls)).toEqual(Array(5).fill('rows'));
    expect(reads).toBe(1);
  });

  it('a read that never settles and ten later requests: still ONE read for that key (no timer ever forgets it)', async () => {
    let reads = 0;
    const read = () => {
      reads++;
      return never<string>();
    };
    for (let i = 0; i < 10; i++) {
      void singleFlight('regions#1500', read);
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(reads).toBe(1);
  });

  it('a read that honours cancellation is aborted after its maximum lifetime, and only AFTER it rejects can a new read start', async () => {
    let reads = 0;
    let signalSeen: AbortSignal | undefined;
    const read = (signal: AbortSignal) => {
      reads++;
      signalSeen = signal;
      return abortable<string>(signal, null, 'never');
    };
    const first = singleFlight('regions#1500', read);
    first.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(SECTION_READ_ABORT_AFTER_MS - 100);
    expect(signalSeen?.aborted).toBe(false);
    void singleFlight('regions#1500', read);
    expect(reads).toBe(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(signalSeen?.aborted).toBe(true);
    await expect(first).rejects.toBeInstanceOf(Error);
    void singleFlight('regions#1500', read).catch(() => undefined);
    expect(reads).toBe(2);
  });

  it('a read that IGNORES cancellation stays registered: the abort is not treated as settlement and no duplicate is ever started', async () => {
    let reads = 0;
    let signalSeen: AbortSignal | undefined;
    const read = (signal: AbortSignal) => {
      reads++;
      signalSeen = signal;
      return never<string>();
    };
    for (let i = 0; i < 20; i++) {
      void singleFlight('regions#1500', read);
      await vi.advanceTimersByTimeAsync(3000);
    }
    expect(signalSeen?.aborted).toBe(true);
    expect(reads).toBe(1);
  });

  it('a slow 14 s read is not released early: joiners at 3, 6, 9 and 12 s share it, and it delivers when it finishes', async () => {
    let reads = 0;
    const read = () => {
      reads++;
      return delay(14_000, 'slow rows');
    };
    const joiners: Array<Promise<string>> = [];
    for (let t = 0; t <= 12_000; t += 3000) {
      joiners.push(singleFlight('regions#1500', read));
      await vi.advanceTimersByTimeAsync(3000);
    }
    await vi.advanceTimersByTimeAsync(2100);
    // The read ignored cancellation at 10 s only if it did not honour the signal; this one finishes on its own at 14 s.
    expect(reads).toBe(1);
    expect(await Promise.all(joiners)).toEqual(Array(5).fill('slow rows'));
  });

  it('rejection and resolution both unregister the read, and nothing is kept: the next request reads fresh', async () => {
    let reads = 0;
    await expect(singleFlight('regions#1500', async () => { reads++; throw new Error('down'); })).rejects.toThrow('down');
    expect(await singleFlight('regions#1500', async () => { reads++; return 'a'; })).toBe('a');
    expect(await singleFlight('regions#1500', async () => { reads++; return 'b'; })).toBe('b');
    expect(reads).toBe(3);
  });

  it('a synchronous throw inside the read is a rejection, not a leaked registration', async () => {
    await expect(singleFlight('regions#1500', () => { throw new Error('sync'); })).rejects.toThrow('sync');
    expect(await singleFlight('regions#1500', async () => 'ok')).toBe('ok');
  });

  it('cleanup is identity-checked: an older read that settles late can never unregister a newer read of the same key', async () => {
    let reads = 0;
    let finishOld!: () => void;
    const old = singleFlight('regions#1500', () => {
      reads++;
      return new Promise<string>((resolve) => (finishOld = () => resolve('old')));
    });
    resetSectionReadsForTests(); // invalidation while the old read is still running
    singleFlight('regions#1500', () => {
      reads++;
      return never<string>();
    }).catch(() => undefined);
    expect(reads).toBe(2);
    finishOld();
    expect(await old).toBe('old');
    void singleFlight('regions#1500', () => {
      reads++;
      return never<string>();
    });
    expect(reads).toBe(2); // joined the newer read: it was NOT forgotten when the old one settled
  });

  it('different database limits never share a read (the limit is part of the key)', async () => {
    let reads = 0;
    const read = () => {
      reads++;
      return never<string>();
    };
    void singleFlight('regions#1500', read);
    void singleFlight('regions#3000', read);
    expect(reads).toBe(2);
  });

  it('exactly six catalogs are authorized, the cap equals that number, and every one is admitted', async () => {
    expect([...SECTION_READ_CATALOGS]).toEqual(['destinations', 'destinationRefs', 'regions', 'journeys', 'experiences', 'experts']);
    expect(MAX_UNSETTLED_SECTION_READS).toBe(6);
    expect(MAX_UNSETTLED_SECTION_READS).toBe(SECTION_READ_CATALOGS.length);
    let reads = 0;
    for (const catalog of SECTION_READ_CATALOGS) void singleFlight(`${catalog}#1500`, () => { reads++; return never<string>(); });
    expect(reads).toBe(6);
  });

  it('a seventh unsettled read is refused immediately, and fits again once one settles', async () => {
    let reads = 0;
    const read = (signal: AbortSignal) => {
      reads++;
      return abortable<string>(signal, null, 'x');
    };
    const flights = SECTION_READ_CATALOGS.map((catalog) => singleFlight(`${catalog}#1500`, read));
    flights.forEach((f) => f.catch(() => undefined));
    await expect(singleFlight('regions#3000', read)).rejects.toBeInstanceOf(SectionReadBusyError);
    expect(reads).toBe(MAX_UNSETTLED_SECTION_READS);
    await vi.advanceTimersByTimeAsync(SECTION_READ_ABORT_AFTER_MS + 10); // all six are aborted and settle
    expect(await singleFlight('regions#3000', async () => 'fits')).toBe('fits');
  });

  it('keys that are not an authorized catalog in canonical form never start a read and never take a slot', async () => {
    let reads = 0;
    const read = () => {
      reads++;
      return never<string>();
    };
    const bad = ['k#1500', 'regions', 'regions#', '#1500', 'regions#01500', 'regions#1500#x', 'regions#1500 ', ' regions#1500', 'Regions#1500', 'REGIONS#1500', 'regions#-1', 'regions#1.5', 'regions#1e3', 'regions#1500\n', 'regions#1500\nexperts#1500', '__proto__#1500', 'constructor#1500', 'toString#1500', 'regions#9999999', 'destinationrefs#1500', 'destination#1500', 'regions\u0000#1500', 'regions#१५००', ''];
    for (const key of bad) await expect(singleFlight(key, read), JSON.stringify(key)).rejects.toBeInstanceOf(UnknownSectionReadError);
    expect(reads).toBe(0);
    // none of them occupied a slot: all six authorized catalogs still fit
    for (const catalog of SECTION_READ_CATALOGS) void singleFlight(`${catalog}#1500`, read);
    expect(reads).toBe(6);
  });

  it('the cap counts every flight across catalogs AND database limits: two limits for one catalog use two slots', async () => {
    let reads = 0;
    const read = () => {
      reads++;
      return never<string>();
    };
    for (const key of ['destinations#1500', 'destinations#3000', 'destinationRefs#1500', 'regions#1500', 'journeys#1500', 'experts#1500']) void singleFlight(key, read);
    expect(reads).toBe(6);
    await expect(singleFlight('experiences#1500', read)).rejects.toBeInstanceOf(SectionReadBusyError);
    await expect(singleFlight('regions#3000', read)).rejects.toBeInstanceOf(SectionReadBusyError);
    void singleFlight('destinations#3000', read); // a registered key still joins its own read at the cap
    expect(reads).toBe(6);
  });
});

describe('the API answers honestly when a section read hangs', () => {
  const wire = (regionsRead: () => Promise<unknown>): GlobalSearchLoaders => base({ regions: () => singleFlight('regions#1500', regionsRead) as never });

  it('one section hangs: it is "timeout" at the section deadline, partial, the others answer, and repeated requests start NO further read', async () => {
    let reads = 0;
    const loaders = wire(() => {
      reads++;
      return never();
    });
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await timed(loaders));
    expect(results.every((r) => r.ms === SECTION_DEADLINE_MS)).toBe(true);
    expect(results.every((r) => r.response.sections.regions.status === 'timeout' && r.response.partial)).toBe(true);
    expect(results.every((r) => r.response.sections.destinations.status === 'ok' && r.response.sections.journeys.status === 'ok')).toBe(true);
    expect(reads).toBe(1);
  });

  it('several sections hang together: each is "timeout", the rest answer, and the response still ends at the section deadline', async () => {
    const reads: string[] = [];
    const hang = (name: string) => () => singleFlight(`${name}#1500`, () => { reads.push(name); return never(); }) as never;
    const out = await timed(base({ regions: hang('regions'), journeys: hang('journeys'), experts: hang('experts') }));
    expect(out.ms).toBe(SECTION_DEADLINE_MS);
    expect(['regions', 'journeys', 'experts'].every((k) => (out.response.sections as Record<string, { status: string }>)[k].status === 'timeout')).toBe(true);
    expect(out.response.sections.destinations.status).toBe('ok');
    expect(out.response.partial).toBe(true);
    await timed(base({ regions: hang('regions'), journeys: hang('journeys'), experts: hang('experts') }));
    expect(reads.sort()).toEqual(['experts', 'journeys', 'regions']);
  });

  it('a refused (capped) read is reported as "timeout", never as data or as "no results"', async () => {
    for (const key of ['destinations#1500', 'destinationRefs#1500', 'journeys#1500', 'experiences#1500', 'experts#1500', 'destinations#3000']) void singleFlight(key, () => never<string>());
    const out = await timed(base({ regions: () => singleFlight('regions#1500', async () => []) as never }));
    expect(out.response.sections.regions).toEqual({ status: 'timeout', items: [] });
    expect(out.response.partial).toBe(true);
  });

  it('a read that settles after its callers gave up causes no unhandled rejection (success or failure)', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const late = (ok: boolean) => () => singleFlight(`${ok ? 'regions' : 'journeys'}#1500`, () => new Promise<never[]>((resolve, reject) => setTimeout(() => (ok ? resolve([]) : reject(new Error('late failure'))), 6000))) as never;
      await timed(base({ regions: late(true), journeys: late(false) }));
      await vi.advanceTimersByTimeAsync(10_000);
      vi.useRealTimers();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });
});

describe('late results and cancellation are never mistaken for answers', () => {
  const region = [{ id: 'r9', slug: 'ladakh', name: 'Ladakh' }];

  it('a read that ignores cancellation and finishes at 14 s: the caller whose deadline passed keeps its "timeout" and never receives the late rows; only a caller still inside its own deadline does', async () => {
    let reads = 0;
    const regions = () => singleFlight('regions#1500', () => {
      reads++;
      return delay(14_000, region);
    }) as never;
    const first = await timed(base({ regions }), 'Ladakh');
    expect(first.response.sections.regions).toEqual({ status: 'timeout', items: [] });
    await vi.advanceTimersByTimeAsync(20_000); // the read settles at 14 s, long after the answer was sent
    expect(first.response.sections.regions).toEqual({ status: 'timeout', items: [] });
    expect(reads).toBe(1);
    // The late rows were not kept: the next request must read again (and times out again, honestly).
    const second = await timed(base({ regions }), 'Ladakh');
    expect(reads).toBe(2);
    expect(second.response.sections.regions.status).toBe('timeout');
  });

  it('a caller that joins at 12.5 s (deadline 14.25 s) of a read finishing at 14 s receives it - inside its own deadline - and nobody started a second read', async () => {
    let reads = 0;
    const regions = () => singleFlight('regions#1500', () => {
      reads++;
      return delay(14_000, region);
    }) as never;
    const early = timed(base({ regions }), 'Ladakh');
    await vi.advanceTimersByTimeAsync(12_500 - 0);
    const late = await timed(base({ regions }), 'Ladakh');
    expect((await early).response.sections.regions.status).toBe('timeout');
    expect(late.response.sections.regions.status).toBe('ok');
    expect(late.response.sections.regions.items.map((i) => i.id)).toEqual(['region:ladakh']);
    expect(reads).toBe(1);
  });

  it('a read that supports cancellation is aborted at 10 s: a caller waiting then is a "timeout" (never ok, never data), the aborted read unregisters, and the next request starts a new read', async () => {
    let reads = 0;
    let signalSeen: AbortSignal | undefined;
    const regions = () => singleFlight('regions#1500', (signal) => {
      reads++;
      signalSeen = signal;
      return abortable<typeof region>(signal, null, region);
    }) as never;
    await vi.advanceTimersByTimeAsync(0);
    void timed(base({ regions }), 'Ladakh');
    await vi.advanceTimersByTimeAsync(9_000);
    const joiner = await timed(base({ regions }), 'Ladakh'); // joins at ~9 s, deadline would be 10.75 s; the abort at 10 s lands inside it
    expect(signalSeen?.aborted).toBe(true);
    expect(joiner.response.sections.regions).toEqual({ status: 'timeout', items: [] });
    expect(joiner.response.partial).toBe(true);
    const next = await timed(base({ regions }), 'Ladakh');
    expect(reads).toBe(2);
    expect(next.response.sections.regions.status).toBe('timeout');
  });

  it('a read that ignores cancellation forever: every request over a minute is an honest "timeout" and exactly one read ever exists', async () => {
    let reads = 0;
    const regions = () => singleFlight('regions#1500', () => {
      reads++;
      return never();
    }) as never;
    for (let i = 0; i < 6; i++) {
      const out = await timed(base({ regions }), 'Ladakh');
      expect(out.response.sections.regions.status).toBe('timeout');
      await vi.advanceTimersByTimeAsync(10_000);
    }
    expect(reads).toBe(1);
  });
});

describe('the unsettled-read cap holds across every key', () => {
  it('a read that ignores cancellation keeps its slot; the cap can never be exceeded by waiting longer or by cycling limits', async () => {
    let reads = 0;
    const read = (signal: AbortSignal) => {
      reads++;
      void signal;
      return never<string>();
    };
    const keys = [...SECTION_READ_CATALOGS.map((c) => `${c}#1500`), 'regions#3000', 'journeys#3000', 'experts#3000'];
    for (let round = 0; round < 5; round++) {
      for (const key of keys) void singleFlight(key, read).catch(() => undefined);
      await vi.advanceTimersByTimeAsync(SECTION_READ_ABORT_AFTER_MS);
    }
    expect(reads).toBe(MAX_UNSETTLED_SECTION_READS);
  });

  it('every catalog recovers once its own read settles (resolved or rejected), and the slot is free again', async () => {
    for (const name of SECTION_READ_CATALOGS) {
      let finish!: (ok: boolean) => void;
      const flight = singleFlight(`${name}#1500`, () => new Promise<string>((resolve, reject) => (finish = (ok) => (ok ? resolve('rows') : reject(new Error('down'))))));
      flight.catch(() => undefined);
      finish(name === 'journeys');
      await vi.advanceTimersByTimeAsync(0);
      expect(await singleFlight(`${name}#1500`, async () => 'fresh')).toBe('fresh');
    }
  });
});

describe('shared dependency and fail-closed behaviour are unchanged', () => {
  it('a failed heavy Destinations read leaves Stays and the dependent sections verified by the light refs', async () => {
    const out = await timed(base({ destinations: async () => { throw new Error('boom'); } }));
    expect(out.response.sections.destinations.status).toBe('error');
    expect(out.response.sections.stays.status).toBe('ok');
    expect(out.response.sections.journeys.status).toBe('ok');
    expect(out.response.partial).toBe(true);
  });

  it('a failed light refs read withholds Stays and the dependent sections (fail closed) while Destinations and Regions answer', async () => {
    const out = await timed(base({ destinationRefs: async () => { throw new Error('boom'); } }), 'Dharamsala');
    expect(out.response.sections.stays).toEqual({ status: 'error', items: [] });
    for (const key of ['journeys', 'experiences', 'experts'] as const) expect(out.response.sections[key]).toEqual({ status: 'error', items: [] });
    expect(out.response.sections.destinations.status).toBe('ok');
    expect(out.response.sections.destinations.items.length).toBeGreaterThan(0);
    expect(out.response.sections.regions.status).toBe('ok');
    expect(out.response.partial).toBe(true);
  });

  it('a failed exclusion lookup withholds Stays and nothing else', async () => {
    const out = await timed(base({ stays: async () => ({ status: 'unavailable', reason: 'exclusions' }) }));
    expect(out.response.sections.stays).toEqual({ status: 'error', items: [] });
    expect(out.response.sections.destinations.status).toBe('ok');
  });

  it('Destinations is read once per request (Stays reuses it): no duplicate query, no new waterfall', async () => {
    const destinationsLoader = vi.fn(async () => destinations);
    const out = await timed(base({ destinations: destinationsLoader }));
    expect(destinationsLoader).toHaveBeenCalledTimes(1);
    expect(out.ms).toBeLessThan(50);
  });
});

