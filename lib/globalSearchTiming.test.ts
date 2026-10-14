import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import journeyCatalog from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import { CONNECT_DEADLINE_MS, SECTION_DEADLINE_MS, STAYS_SECTION_DEADLINE_MS, resetSectionReadsForTests, runGlobalSearch, type GlobalSearchLoaders } from '@/lib/globalSearchServer';
import { createTimings, formatServerTiming } from '@/lib/globalSearchTiming';
import { parseGlobalSearchQuery } from '@/lib/search/globalSearch';
import type { StaySuggestionsOutcome } from '@/lib/staysSearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';

describe('formatServerTiming', () => {
  it('lists connect, each section in display order, then total, in the standard Server-Timing syntax', () => {
    const timings = createTimings();
    timings.connect = { ms: 2401.4, outcome: 'ok' };
    timings.sections = { experts: { ms: 12, outcome: 'ok' }, destinations: { ms: 1752, outcome: 'timeout' }, stays: { ms: 2500, outcome: 'error' } };
    expect(formatServerTiming(timings, 4903.6)).toBe('connect;dur=2401;desc="ok", destinations;dur=1752;desc="timeout", stays;dur=2500;desc="error", experts;dur=12;desc="ok", total;dur=4904');
  });

  it('is just the total when nothing else was measured', () => {
    expect(formatServerTiming(createTimings(), 7)).toBe('total;dur=7');
  });

  it('never emits a negative, fractional, non-numeric or absurd duration', () => {
    const timings = createTimings();
    timings.connect = { ms: -5, outcome: 'ok' };
    timings.sections = { regions: { ms: Number.NaN, outcome: 'ok' }, journeys: { ms: Infinity, outcome: 'ok' }, experiences: { ms: 99_999_999, outcome: 'ok' } };
    expect(formatServerTiming(timings, -1)).toBe('connect;dur=0;desc="ok", regions;dur=0;desc="ok", journeys;dur=0;desc="ok", experiences;dur=600000;desc="ok", total;dur=0');
  });

  it('can only ever print the four fixed outcome words, whatever it is handed', () => {
    const timings = createTimings();
    timings.sections = { regions: { ms: 1, outcome: 'mongodb://u:p@host/db' as never } };
    const header = formatServerTiming(timings, 1);
    expect(header).toBe('regions;dur=1;desc="error", total;dur=1');
    expect(header).not.toMatch(/mongodb|host/);
  });
});

// ---- what the diagnostics record while the search runs (fake clock, mocked loaders) --------------------------

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

/** Virtual milliseconds until the search answers, plus the diagnostics it recorded. */
async function timed(loaders: GlobalSearchLoaders, q = 'Kaza') {
  const timings = createTimings();
  const started = Date.now();
  let response: Awaited<ReturnType<typeof runGlobalSearch>> | undefined;
  void runGlobalSearch(parse(q), loaders, timings).then((r) => {
    response = r;
  });
  while (!response && Date.now() - started < 60_000) await vi.advanceTimersByTimeAsync(10);
  const ms = Date.now() - started;
  return { ms, response: response!, timings, header: formatServerTiming(timings, ms) };
}

function base(overrides: Partial<GlobalSearchLoaders> = {}): GlobalSearchLoaders {
  return {
    destinations: async () => destinations,
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

describe('connection acquisition: outside the section deadlines, and now visible', () => {
  it('reproduces the observed 4.9 s response: a 2.4 s connection plus a Stays read that misses its 2.5 s deadline', async () => {
    const out = await timed(base({ connect: () => delay(2400, undefined), stays: () => delay(3000, okStays()) }));
    expect(out.ms).toBe(2400 + STAYS_SECTION_DEADLINE_MS);
    expect(out.header).toBe(
      'connect;dur=2400;desc="ok", destinations;dur=0;desc="ok", regions;dur=0;desc="ok", journeys;dur=0;desc="ok", experiences;dur=0;desc="ok", stays;dur=2500;desc="timeout", experts;dur=0;desc="ok", transport;dur=0;desc="ok", total;dur=4900'
    );
  });

  it('reproduces the observed 5.2 s response: a 2.7 s connection and a slow Stays read', async () => {
    const out = await timed(base({ connect: () => delay(2700, undefined), stays: () => delay(3000, okStays()) }));
    expect(out.ms).toBe(5200);
    expect(out.timings.connect).toEqual({ ms: 2700, outcome: 'ok' });
    expect(out.timings.sections.stays).toEqual({ ms: 2500, outcome: 'timeout' });
  });

  it('a Destinations timeout after a slow connection shows connect + 1.75 s, and Stays is withheld at the same moment', async () => {
    const out = await timed(base({ connect: () => delay(3500, undefined), destinations: () => never() }));
    expect(out.ms).toBe(3500 + SECTION_DEADLINE_MS);
    expect(out.timings.sections.destinations).toEqual({ ms: 1750, outcome: 'timeout' });
    expect(out.timings.sections.stays).toEqual({ ms: 1750, outcome: 'timeout' });
    expect(out.response.sections.stays).toEqual({ status: 'timeout', items: [] });
  });

  it('a connection that hangs fails every section at the connect budget; the slowest possible answer is connect + the Stays deadline', async () => {
    const out = await timed(base({ connect: () => never() }));
    expect(out.ms).toBe(CONNECT_DEADLINE_MS);
    expect(out.timings.connect).toEqual({ ms: CONNECT_DEADLINE_MS, outcome: 'timeout' });
    expect(Object.values(out.timings.sections).every((s) => s.outcome === 'skipped')).toBe(true);
    expect(Object.values(out.response.sections).every((s) => s.status === 'timeout' && s.items.length === 0)).toBe(true);
    const slowest = await timed(base({ connect: () => delay(5900, undefined), stays: () => delay(9000, okStays()) }));
    expect(slowest.ms).toBe(5900 + STAYS_SECTION_DEADLINE_MS);
  });

  it('a connection that fails is "error", sections are skipped, and no loader runs', async () => {
    const regions = vi.fn(async () => []);
    const out = await timed(base({ connect: async () => { throw new Error('mongodb://user:secret@host/db refused'); }, regions }));
    expect(out.timings.connect?.outcome).toBe('error');
    expect(regions).not.toHaveBeenCalled();
    expect(out.header).not.toMatch(/mongodb|secret|host|refused/i);
  });
});

describe('what each section records', () => {
  it('a failed exclusion lookup is a Stays "error" and nothing else', async () => {
    const out = await timed(base({ stays: async () => ({ status: 'unavailable', reason: 'exclusions' }) }));
    expect(out.response.sections.stays).toEqual({ status: 'error', items: [] });
    expect(out.timings.sections.stays?.outcome).toBe('error');
    expect(out.timings.sections.destinations?.outcome).toBe('ok');
  });

  it('one hung section is "timeout" at its deadline while the others are "ok"', async () => {
    const out = await timed(base({ regions: () => never() }));
    expect(out.timings.sections.regions).toEqual({ ms: SECTION_DEADLINE_MS, outcome: 'timeout' });
    expect(out.timings.sections.journeys?.outcome).toBe('ok');
  });
});

describe('diagnostics', () => {
  it('adds no loader call and changes nothing in the answer', async () => {
    const calls = () => ({ destinations: vi.fn(async () => destinations), regions: vi.fn(async () => []), journeys: vi.fn(async () => journeys), experiences: vi.fn(async () => experiences), experts: vi.fn(async () => []), connect: vi.fn(async () => undefined) });
    const a = calls();
    const b = calls();
    const without = await runGlobalSearch(parse('Dharamsala'), base({ ...a, stays: undefined }));
    const withTimings = await runGlobalSearch(parse('Dharamsala'), base({ ...b, stays: undefined }), createTimings());
    expect(withTimings).toEqual(without);
    for (const key of Object.keys(a) as Array<keyof typeof a>) expect(b[key].mock.calls.length).toBe(a[key].mock.calls.length);
  });

  it('the header contains only fixed metric names, fixed outcome words and integers - never the query, an error or a host', async () => {
    const out = await timed(
      base({
        regions: async () => { throw new Error('MongoServerError: connection to ac-xyz-shard-00-00.cluster0.mongodb.net:27017 failed; user=admin'); },
        journeys: () => never()
      }),
      'secret-query-text'
    );
    const names = out.header.split(', ').map((part) => part.split(';')[0]);
    expect(names).toEqual(['destinations', 'regions', 'journeys', 'experiences', 'stays', 'experts', 'transport', 'total']);
    expect(out.header).toMatch(/^[a-z]+;dur=\d+(;desc="(ok|timeout|error|skipped)")?(, [a-z]+;dur=\d+(;desc="(ok|timeout|error|skipped)")?)*$/);
    expect(out.header).not.toMatch(/secret|mongo|cluster|shard|admin|27017/i);
  });

  it('skipped sections are reported for meaningless text and nothing else is measured', async () => {
    const out = await timed(base(), '[[');
    expect(out.timings.connect).toBeUndefined();
    expect(Object.values(out.timings.sections).every((s) => s.outcome === 'skipped')).toBe(true);
  });

  it('answers keep their order, URLs and shape with diagnostics on', async () => {
    const out = await timed(base(), 'Dharamsala');
    expect(Object.keys(out.response.sections)).toEqual(['destinations', 'regions', 'journeys', 'experiences', 'stays', 'experts', 'transport']);
    expect(out.response.sections.destinations.items[0].href).toBe('/destinations/dharamshala');
    expect(out.response.sections.journeys.items[0].href).toBe('/journeys/dharamshala-dalhousie-escape');
  });
});
