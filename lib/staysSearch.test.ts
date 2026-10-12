import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown> & { placeId: string; destinationSlug: string; searchLocation: string };

const { getCatalogMock, leak, rows, findCalls, getPublishedRefsMock, getActiveExclusionSetMock, googleCalls, ExclusionLookupErrorRef } = vi.hoisted(() => ({
  getCatalogMock: vi.fn(),
  leak: { on: false },
  rows: { current: [] as Row[] },
  findCalls: [] as Array<{ filter: Record<string, any>; projection?: unknown }>,
  getPublishedRefsMock: vi.fn(),
  getActiveExclusionSetMock: vi.fn(),
  googleCalls: vi.fn(),
  ExclusionLookupErrorRef: { current: null as unknown as new (cause?: unknown) => Error }
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
// In-memory PlaceCache that honours the filters lib/staysSearch.ts sends: eligible $or pairs, placeId $nin / $in.
vi.mock('@/models/PlaceCache', () => ({
  PlaceCache: {
    find: (filter: Record<string, any>, projection?: unknown) => {
      findCalls.push({ filter, projection });
      const result = rows.current.filter((row) => {
        if (filter.$or && !filter.$or.some((pair: any) => row.destinationSlug === pair.destinationSlug && row.searchLocation === pair.searchLocation)) return false;
        if (filter._id?.$exists === false) return false;
        if (!leak.on && filter.placeId?.$nin && filter.placeId.$nin.includes(row.placeId)) return false;
        if (filter.placeId?.$in && !filter.placeId.$in.includes(row.placeId)) return false;
        return true;
      });
      return { lean: async () => result };
    }
  }
}));
vi.mock('@/lib/destinations', () => ({ getPublishedDestinationRefs: getPublishedRefsMock }));
vi.mock('@/lib/stays', () => ({ getCachedStaysCatalog: getCatalogMock, toStay: (doc: Row) => ({ placeId: doc.placeId, name: doc.name, stayType: doc.stayType, destinationSlug: doc.destinationSlug, source: 'google' }) }));
vi.mock('@/services/properties/propertyExclusion.service', () => {
  class ExclusionLookupError extends Error {
    constructor(cause?: unknown) {
      super('exclusions unavailable');
      void cause;
    }
  }
  ExclusionLookupErrorRef.current = ExclusionLookupError;
  return { ExclusionLookupError, getActiveExclusionSet: getActiveExclusionSetMock };
});
// If anything in the search path ever reached Google, one of these would run.
vi.mock('@/lib/googlePlaces', () => ({
  searchStays: googleCalls,
  placeName: googleCalls,
  placePhotoUrls: googleCalls,
  placeCoordinates: googleCalls
}));

const { searchEligibleStays: searchAuto, groupRowsIntoCandidates, resetStaysSearchMemo, STAYS_PAGE_SIZE } = await import('@/lib/staysSearch');
// Unless a test says otherwise, exercise the scan strategy (the fast path is covered by its own describe).
const searchEligibleStays = (request: Parameters<typeof searchAuto>[0] = {}) => searchAuto({ strategy: 'scan', ...request });

const DESTS = [
  { slug: 'manali', title: 'Manali', state: 'Himachal Pradesh' },
  { slug: 'spiti-valley', title: 'Spiti Valley', state: 'Himachal Pradesh' },
  { slug: 'bir-billing', title: 'Bir Billing', state: 'Himachal Pradesh' },
  { slug: 'dharamshala', title: 'Dharamshala', state: 'Himachal Pradesh' },
  { slug: 'mcleod-ganj', title: 'McLeod Ganj', state: 'Himachal Pradesh' }
];

function row(placeId: string, name: string, destinationSlug: string, searchLocation: string, extra: Record<string, unknown> = {}): Row {
  return { placeId, name, destinationSlug, searchLocation, stayType: 'hotel', types: ['hotel'], rating: 4, userRatingCount: 10, updatedAt: new Date('2026-09-15T00:00:00Z'), photos: [], ...extra };
}
const names = (outcome: Awaited<ReturnType<typeof searchEligibleStays>>) => (outcome.status === 'ok' ? outcome.stays.map((s) => s.name) : outcome.status);

beforeEach(() => {
  vi.stubEnv('STAYS_SEARCH_ROW_MEMO_MS', '0');
  resetStaysSearchMemo();
  getCatalogMock.mockReset();
  findCalls.length = 0;
  googleCalls.mockReset();
  getPublishedRefsMock.mockReset().mockResolvedValue(DESTS);
  getActiveExclusionSetMock.mockReset().mockResolvedValue(new Set());
  rows.current = [
    row('p-heritage', 'Hotel Spiti Heritage', 'spiti-valley', 'Kaza'),
    row('p-vajra', 'The Vajra', 'spiti-valley', 'Kaza', { rating: 4.8 }),
    row('p-bir', 'Zostel Bir', 'bir-billing', 'Bir'),
    row('p-dharam', 'Dhauladhar View', 'dharamshala', 'Dharamshala'),
    row('p-mcleod', 'Tibetan Valley Homestay', 'mcleod-ganj', 'McLeod Ganj', { types: ['guest_house'] })
  ];
});

describe('searchEligibleStays — eligibility before ranking and counting', () => {
  it('finds existing properties by name, and a nonsense query returns zero', async () => {
    expect(names(await searchEligibleStays({ q: 'Hotel Spiti Heritage' }))).toEqual(['Hotel Spiti Heritage']);
    expect(names(await searchEligibleStays({ q: 'vajra' }))).toEqual(['The Vajra']);
    expect(names(await searchEligibleStays({ q: 'zzzqqq' }))).toEqual([]);
    expect((await searchEligibleStays({ q: '[' })) as { totalCount: number }).toMatchObject({ totalCount: 0 });
  });

  it('orphan-slug, test-slug and stale-location rows never appear (not in names, listings or counts)', async () => {
    rows.current.push(
      row('o-kaza', 'Orphan Only Kaza Hotel', 'kaza', 'Kaza'),
      row('o-gush', 'Gushaini Orphan Stay', 'gushaini', 'Gushaini'),
      row('t-verify', 'Test Slug Copy', 'spiti-valley-verify2', 'Kaza'),
      row('s-stale', 'Stale McLeod Row', 'dharamshala', 'McLeod Ganj')
    );
    const all = await searchEligibleStays({});
    expect(all.status === 'ok' && all.totalCount).toBe(5);
    for (const q of ['Orphan', 'Gushaini', 'Test Slug', 'Stale']) expect(names(await searchEligibleStays({ q })), q).toEqual([]);
    expect(names(await searchEligibleStays({ destination: 'Dharamshala' }))).toEqual(['Dhauladhar View']);
  });

  it('a place cached under a published row AND an orphan row is public once, via its published row', async () => {
    rows.current.push(row('p-heritage', 'Hotel Spiti Heritage', 'kaza', 'Kaza'), row('p-heritage', 'Hotel Spiti Heritage', 'spiti-valley-verify2', 'Kaza'));
    const all = await searchEligibleStays({});
    expect(all.status === 'ok' && all.totalCount).toBe(5);
    expect(names(await searchEligibleStays({ q: 'Hotel Spiti Heritage' }))).toEqual(['Hotel Spiti Heritage']);
  });

  it('destination and locality text resolve against published destinations and stored stay-base localities', async () => {
    expect(names(await searchEligibleStays({ destination: 'Kaza' })).length).toBe(2);
    expect(names(await searchEligibleStays({ destination: 'Bir' }))).toEqual(['Zostel Bir']);
    expect(names(await searchEligibleStays({ destination: 'Dharamsala' }))).toEqual(['Dhauladhar View']);
    expect(names(await searchEligibleStays({ destination: 'McLeodganj' }))).toEqual(['Tibetan Valley Homestay']);
    expect(names(await searchEligibleStays({ destination: 'Nowhere' }))).toEqual([]);
  });

  it('reads only PlaceCache: no Google client is ever touched', async () => {
    await searchEligibleStays({ q: 'vajra' });
    await searchEligibleStays({ destination: 'Kaza' });
    await searchEligibleStays({});
    expect(googleCalls).not.toHaveBeenCalled();
    expect(findCalls.length).toBeGreaterThan(0);
  });

  it('the database read carries the eligible pairs, and exclusions are applied to every request rows before ranking', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['p-bir']));
    const outcome = await searchEligibleStays({ q: 'zostel' });
    const { filter } = findCalls[0];
    expect(filter.$or).toContainEqual({ destinationSlug: 'spiti-valley', searchLocation: 'Kaza' });
    expect(outcome.status === 'ok' && outcome.totalCount).toBe(0);
  });
});

describe('searchEligibleStays — exclusions fail closed', () => {
  it('a newly excluded property disappears from name search, listings, locality search and the count immediately', async () => {
    expect(names(await searchEligibleStays({ q: 'Zostel' }))).toEqual(['Zostel Bir']);
    const before = await searchEligibleStays({});
    expect(before.status === 'ok' && before.totalCount).toBe(5);

    getActiveExclusionSetMock.mockResolvedValue(new Set(['p-bir']));

    expect(names(await searchEligibleStays({ q: 'Zostel' }))).toEqual([]);
    expect(names(await searchEligibleStays({ destination: 'Bir' }))).toEqual([]);
    expect(names(await searchEligibleStays({ q: 'Bir' }))).not.toContain('Zostel Bir');
    const after = await searchEligibleStays({});
    expect(after.status === 'ok' && after.totalCount).toBe(4);
    expect(after.status === 'ok' && after.stays.map((s) => s.placeId)).not.toContain('p-bir');
  });

  it('an excluded placeId is dropped even if the database layer ignored the $nin', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['p-bir']));
    leak.on = true; // simulate a driver/query that returns the excluded row anyway
    try {
      expect(names(await searchEligibleStays({ q: 'Zostel' }))).toEqual([]);
      const all = await searchEligibleStays({});
      expect(all.status === 'ok' && all.totalCount).toBe(4);
    } finally {
      leak.on = false;
    }
  });

  it('an exclusion-service outage returns "unavailable" and no Google-sourced stay, count or page', async () => {
    getActiveExclusionSetMock.mockRejectedValue(new ExclusionLookupErrorRef.current('down'));

    for (const request of [{}, { q: 'Hotel Spiti Heritage' }, { destination: 'Kaza' }, { q: 'x', destination: 'Bir', offset: 24 }]) {
      const outcome = await searchEligibleStays(request);
      expect(outcome).toEqual({ status: 'unavailable', reason: 'exclusions' });
    }
    expect(findCalls).toHaveLength(0); // PlaceCache is not even read
  });

  it('does not fall back to a previous exclusion set after a later outage', async () => {
    getActiveExclusionSetMock.mockResolvedValueOnce(new Set(['p-bir']));
    expect(names(await searchEligibleStays({ q: 'Zostel' }))).toEqual([]);
    getActiveExclusionSetMock.mockRejectedValueOnce(new ExclusionLookupErrorRef.current('down'));
    expect((await searchEligibleStays({ q: 'Zostel' })).status).toBe('unavailable');
  });

  it('unrelated errors are not swallowed as an outage', async () => {
    getActiveExclusionSetMock.mockRejectedValue(new TypeError('programming error'));
    await expect(searchEligibleStays({})).rejects.toThrow('programming error');
  });

  it('an unreadable published-destination list (eligibility) is also unavailable', async () => {
    getPublishedRefsMock.mockRejectedValue(new Error('down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await searchEligibleStays({})).toEqual({ status: 'unavailable', reason: 'catalog' });
    expect(findCalls).toHaveLength(0);
    spy.mockRestore();
  });
});

describe('searchEligibleStays — pagination and totals', () => {
  beforeEach(() => {
    rows.current = Array.from({ length: 60 }, (_, i) => row(`m${String(i).padStart(2, '0')}`, `Mountain Lodge ${i}`, 'manali', 'Manali', { rating: 3 + (i % 5) / 10 }));
  });

  it('counts every eligible stay (no 60-style cap) and pages 24 at a time with no duplicates', async () => {
    const pages = [];
    for (let page = 1; page <= 3; page++) pages.push(await searchEligibleStays({ q: 'mountain lodge', offset: (page - 1) * STAYS_PAGE_SIZE, limit: STAYS_PAGE_SIZE }));
    expect(pages.map((p) => (p.status === 'ok' ? p.totalCount : -1))).toEqual([60, 60, 60]);
    expect(pages.map((p) => (p.status === 'ok' ? p.stays.length : -1))).toEqual([24, 24, 12]);
    const ids = pages.flatMap((p) => (p.status === 'ok' ? p.stays.map((s) => s.placeId) : []));
    expect(new Set(ids).size).toBe(60);
  });

  it('applies exclusions before counting and paging', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['m00', 'm01', 'm02']));
    const outcome = await searchEligibleStays({ q: 'mountain lodge', offset: 48, limit: 24 });
    expect(outcome.status === 'ok' && outcome.totalCount).toBe(57);
    expect(outcome.status === 'ok' && outcome.stays.length).toBe(9);
  });

  it('a page past the end is empty while the total stays exact', async () => {
    const outcome = await searchEligibleStays({ q: 'mountain lodge', offset: 600, limit: 24 });
    expect(outcome).toMatchObject({ status: 'ok', stays: [], totalCount: 60 });
  });

  it('limit 0 still reports the exact total (used when a page is filled by curated stays)', async () => {
    expect(await searchEligibleStays({ offset: 0, limit: 0 })).toMatchObject({ stays: [], totalCount: 60 });
  });

  it('ordering is stable between calls', async () => {
    const a = await searchEligibleStays({ q: 'mountain lodge', offset: 0, limit: 24 });
    const b = await searchEligibleStays({ q: 'mountain lodge', offset: 0, limit: 24 });
    expect(a).toEqual(b);
  });
});

describe('searchEligibleStays — future records need no search configuration', () => {
  it('a newly cached eligible stay becomes searchable, and a renamed one is found under its new name', async () => {
    expect(names(await searchEligibleStays({ q: 'Himalayan Nest' }))).toEqual([]);
    rows.current.push(row('p-new', 'The Himalayan Nest', 'manali', 'Manali'));
    expect(names(await searchEligibleStays({ q: 'Himalayan Nest' }))).toEqual(['The Himalayan Nest']);

    rows.current = rows.current.map((r) => (r.placeId === 'p-new' ? { ...r, name: 'Cedar Grove Retreat' } : r));
    expect(names(await searchEligibleStays({ q: 'Himalayan Nest' }))).toEqual([]);
    expect(names(await searchEligibleStays({ q: 'Cedar Grove' }))).toEqual(['Cedar Grove Retreat']);
  });

  it('a newly published destination with an authored stay rule makes its cached stays public', async () => {
    rows.current.push(row('p-chamba', 'Ravi Valley Inn', 'chamba', 'Chamba'));
    expect(names(await searchEligibleStays({ q: 'Ravi Valley' }))).toEqual([]);
    getPublishedRefsMock.mockResolvedValue([...DESTS, { slug: 'chamba', title: 'Chamba', state: 'Himachal Pradesh' }]);
    expect(names(await searchEligibleStays({ q: 'Ravi Valley' }))).toEqual(['Ravi Valley Inn']);
    expect(names(await searchEligibleStays({ destination: 'Chamba' }))).toEqual(['Ravi Valley Inn']);
  });

  it('exposes the cache age (cached provider data) separately from results', async () => {
    const outcome = await searchEligibleStays({ q: 'vajra' });
    expect(outcome.status === 'ok' && outcome.cacheAge).toEqual({ oldest: '2026-09-15T00:00:00.000Z', newest: '2026-09-15T00:00:00.000Z' });
  });
});

describe('groupRowsIntoCandidates', () => {
  it('keeps one candidate per real place with every eligible tag, preferring the row that has types', () => {
    const grouped = groupRowsIntoCandidates([
      { placeId: 'x', name: 'Old Name', destinationSlug: 'sangla-valley', searchLocation: 'Sangla' },
      { placeId: 'x', name: 'Typed Name', destinationSlug: 'kinnaur', searchLocation: 'Sangla', types: ['campground'] },
      { placeId: 'x', name: 'Typed Name', destinationSlug: 'kinnaur', searchLocation: 'Sangla', types: ['campground'] }
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].tags).toEqual([{ destinationSlug: 'sangla-valley', searchLocation: 'Sangla' }, { destinationSlug: 'kinnaur', searchLocation: 'Sangla' }]);
    expect(grouped[0].types).toEqual(['campground']);
  });
});

describe('searchEligibleStays - synthetic publicly listed curated hotels (deduped before counting and paging)', () => {
  const curatedStay = (slug: string, name: string, address: string) =>
    ({ placeId: 'curated:' + slug, name, slug, stayType: 'hotel', formattedAddress: address, photos: [], destinationSlug: slug, source: 'curated' }) as unknown as import('@/types/stay').Stay;

  beforeEach(() => {
    rows.current = Array.from({ length: 30 }, (_, i) =>
      row('g' + String(i).padStart(2, '0'), 'Pine Lodge ' + i, 'manali', 'Manali', { formattedAddress: 'Road ' + i + ', Manali', rating: 4 - i / 100 })
    );
  });

  it('curated stays lead the combined list; counts include them exactly once', async () => {
    const curated = [curatedStay('c1', 'Curated One', 'Manali'), curatedStay('c2', 'Curated Two', 'Manali')];
    const page1 = await searchEligibleStays({ destination: 'Manali', curated, offset: 0, limit: 24 });
    expect(page1.status === 'ok' && page1.totalCount).toBe(32);
    expect(page1.status === 'ok' && page1.stays.slice(0, 2).map((s) => s.placeId)).toEqual(['curated:c1', 'curated:c2']);
    expect(page1.status === 'ok' && page1.stays.length).toBe(24);
    const page2 = await searchEligibleStays({ destination: 'Manali', curated, offset: 24, limit: 24 });
    expect(page2.status === 'ok' && page2.stays.length).toBe(8);
    const ids = [...(page1.status === 'ok' ? page1.stays : []), ...(page2.status === 'ok' ? page2.stays : [])].map((s) => s.placeId);
    expect(new Set(ids).size).toBe(32);
  });

  it('a cached duplicate of a curated stay (same name and address) is removed BEFORE the count, so totals and pages never drift', async () => {
    const curated = [curatedStay('dup', 'Pine Lodge 3', 'Road 3, Manali')];
    const outcome = await searchEligibleStays({ destination: 'Manali', curated, offset: 0, limit: 24 });
    expect(outcome.status === 'ok' && outcome.totalCount).toBe(30); // 1 curated + 29 distinct cached (the duplicate is dropped once)
    const all: string[] = [];
    for (let offset = 0; offset < 40; offset += 24) {
      const page = await searchEligibleStays({ destination: 'Manali', curated, offset, limit: 24 });
      if (page.status === 'ok') all.push(...page.stays.map((s) => s.name));
    }
    expect(all).toHaveLength(30);
    expect(all.filter((name) => name === 'Pine Lodge 3')).toHaveLength(1);
    expect(all[0]).toBe('Pine Lodge 3'); // the curated copy
  });

  it('a page that is entirely curated still reports the exact combined total; limit and offset line up across the boundary', async () => {
    const curated = Array.from({ length: 25 }, (_, i) => curatedStay('c' + i, 'Curated ' + i, 'Somewhere ' + i));
    const first = await searchEligibleStays({ destination: 'Manali', curated, offset: 0, limit: 24 });
    const second = await searchEligibleStays({ destination: 'Manali', curated, offset: 24, limit: 24 });
    expect(first.status === 'ok' && first.totalCount).toBe(55);
    expect(first.status === 'ok' && first.stays.every((s) => s.source === 'curated')).toBe(true);
    expect(second.status === 'ok' && second.stays.map((s) => s.placeId).slice(0, 2)).toEqual(['curated:c24', 'g00']);
    expect(second.status === 'ok' && second.stays.length).toBe(24);
  });

  it('curated stays are not exclusion-filtered by Google place id, and cached stays still are', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['g00']));
    const curated = [curatedStay('c1', 'Curated One', 'Manali')];
    const outcome = await searchEligibleStays({ destination: 'Manali', curated, offset: 0, limit: 100 });
    expect(outcome.status === 'ok' && outcome.stays.map((s) => s.placeId)).toContain('curated:c1');
    expect(outcome.status === 'ok' && outcome.stays.map((s) => s.placeId)).not.toContain('g00');
    expect(outcome.status === 'ok' && outcome.totalCount).toBe(30);
  });

  it('an exclusion outage withholds every cached stay even when curated stays are supplied', async () => {
    getActiveExclusionSetMock.mockRejectedValue(new ExclusionLookupErrorRef.current('down'));
    const outcome = await searchEligibleStays({ curated: [curatedStay('c1', 'Curated One', 'Manali')] });
    expect(outcome).toEqual({ status: 'unavailable', reason: 'exclusions' });
  });
});

describe('searchEligibleStays - performance strategies stay equivalent and safe', () => {
  it('a plain browse on a page boundary is answered by the database aggregation, not a scan', async () => {
    getCatalogMock.mockResolvedValue({ stays: [{ placeId: 'a', name: 'A', updatedAt: '2026-09-01T00:00:00.000Z' }], page: 3, pageSize: 24, totalCount: 80, totalPages: 4 });
    const outcome = await searchAuto({ offset: 48, limit: 24 });
    expect(getCatalogMock).toHaveBeenCalledWith({ stayType: undefined, page: 3, pageSize: 24 });
    expect(outcome).toMatchObject({ status: 'ok', totalCount: 80 });
    expect(findCalls).toHaveLength(0);
    expect(googleCalls).not.toHaveBeenCalled();
  });

  it('the fast path never bypasses fail-closed: an unavailable catalog is unavailable', async () => {
    getCatalogMock.mockResolvedValue({ stays: [], page: 1, pageSize: 24, totalCount: 0, totalPages: 1, unavailable: true, unavailableReason: 'exclusions' });
    expect(await searchAuto({ offset: 0, limit: 24 })).toEqual({ status: 'unavailable', reason: 'exclusions' });
  });

  it('text, destination, curated lists and unaligned offsets use the scan, never the fast path', async () => {
    await searchAuto({ q: 'vajra' });
    await searchAuto({ destination: 'Kaza' });
    await searchAuto({ offset: 0, limit: 24, curated: [{ placeId: 'curated:x', name: 'X', slug: 'x', stayType: 'hotel', photos: [], destinationSlug: 'x', source: 'curated' } as never] });
    await searchAuto({ offset: 5, limit: 24 });
    expect(getCatalogMock).not.toHaveBeenCalled();
  });

  it('a destination search without text reads only the eligible rows of that destination', async () => {
    await searchAuto({ destination: 'Kaza' });
    const filter = findCalls[0].filter;
    expect(filter.$or).toEqual([{ destinationSlug: 'spiti-valley', searchLocation: 'Kaza' }]);
    findCalls.length = 0;
    await searchAuto({ destination: 'Dharamsala' });
    expect(findCalls[0].filter.$or).toEqual([{ destinationSlug: 'dharamshala', searchLocation: 'Dharamshala' }]);
    findCalls.length = 0;
    await searchAuto({ destination: 'Atlantis' });
    expect(findCalls).toHaveLength(0); // nothing eligible can match: no read at all
  });

  it('the pushed-down destination search returns exactly what the full scan returns', async () => {
    const base = rows.current.slice();
    for (const destination of ['Kaza', 'Bir', 'Dharamsala', 'McLeodganj', 'Spiti Valley', 'Manali', 'Atlantis']) {
      rows.current = base;
      const pushed = await searchAuto({ destination });
      // the same request with text forces the full scan path over every eligible row
      const full = await searchAuto({ destination, q: ' ' });
      expect(pushed).toEqual(full);
    }
  });

  describe('row memo (rows only; exclusions and eligibility are always fresh)', () => {
    beforeEach(() => {
      vi.stubEnv('STAYS_SEARCH_ROW_MEMO_MS', '60000');
      resetStaysSearchMemo();
    });

    it('reuses the eligible-row scan for repeated name searches', async () => {
      await searchAuto({ q: 'vajra' });
      await searchAuto({ q: 'heritage' });
      await searchAuto({ q: 'zostel' });
      const scans = findCalls.filter((call) => call.projection !== undefined);
      expect(scans).toHaveLength(1);
    });

    it('a newly excluded property disappears at once even though the rows are memoized', async () => {
      expect(names(await searchAuto({ q: 'zostel' }))).toEqual(['Zostel Bir']);
      getActiveExclusionSetMock.mockResolvedValue(new Set(['p-bir']));
      expect(names(await searchAuto({ q: 'zostel' }))).toEqual([]);
      const all = await searchAuto({ q: 'a', strategy: 'scan' });
      expect(all.status === 'ok' && all.stays.map((s) => s.placeId)).not.toContain('p-bir');
    });

    it('an exclusion outage still fails closed on a memo hit', async () => {
      await searchAuto({ q: 'vajra' });
      getActiveExclusionSetMock.mockRejectedValue(new ExclusionLookupErrorRef.current('down'));
      expect(await searchAuto({ q: 'vajra' })).toEqual({ status: 'unavailable', reason: 'exclusions' });
    });

    it('unpublishing a destination invalidates the memo immediately (eligibility is never served from memory)', async () => {
      expect(names(await searchAuto({ q: 'zostel' }))).toEqual(['Zostel Bir']);
      getPublishedRefsMock.mockResolvedValue(DESTS.filter((d) => d.slug !== 'bir-billing'));
      expect(names(await searchAuto({ q: 'zostel' }))).toEqual([]);
    });

    it('a newly cached stay becomes searchable once the memo window passes (here: after a reset), and never sooner than the window', async () => {
      await searchAuto({ q: 'brand new' });
      rows.current.push(row('p-new2', 'Brand New Haven', 'manali', 'Manali'));
      expect(names(await searchAuto({ q: 'brand new' }))).toEqual([]);
      resetStaysSearchMemo();
      expect(names(await searchAuto({ q: 'brand new' }))).toEqual(['Brand New Haven']);
    });

    it('a memo of 0 disables reuse', async () => {
      vi.stubEnv('STAYS_SEARCH_ROW_MEMO_MS', '0');
      await searchAuto({ q: 'vajra' });
      await searchAuto({ q: 'vajra' });
      expect(findCalls.filter((call) => call.projection !== undefined)).toHaveLength(2);
    });
  });
});

describe('groupRowsIntoCandidates - representative row (same rule as the database aggregation)', () => {
  it('a duplicated place is represented by its typed row, then the higher rating, then review count', () => {
    const [candidate] = groupRowsIntoCandidates([
      { placeId: 'x', name: 'X', destinationSlug: 'manali', searchLocation: 'Manali', rating: 4.9, userRatingCount: 5 },
      { placeId: 'x', name: 'X', destinationSlug: 'manali', searchLocation: 'Manali', rating: 4.1, userRatingCount: 50, types: ['hotel'] },
      { placeId: 'x', name: 'X', destinationSlug: 'manali', searchLocation: 'Manali', rating: 4.3, userRatingCount: 9, types: ['hotel'] }
    ]);
    expect(candidate.rating).toBe(4.3);
    expect(candidate.userRatingCount).toBe(9);
    expect(candidate.types).toEqual(['hotel']);
  });
});
