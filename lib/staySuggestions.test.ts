import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown> & { placeId: string; destinationSlug: string; searchLocation: string };

const { rows, findCalls, read, getPublishedRefsMock, getActiveExclusionSetMock, googleCalls, hotelCalls, ExclusionLookupErrorRef } = vi.hoisted(() => ({
  rows: { current: [] as Row[] },
  findCalls: [] as Array<{ filter: Record<string, any>; projection?: unknown; maxTimeMS?: number; signal?: AbortSignal }>,
  // How the next row reads behave: 'ok', 'fail', a code-50 timeout, or a gate the test opens by hand.
  // 'hang' = never settles on its own but honours the AbortSignal; 'deaf' = never settles and IGNORES the signal.
  read: { mode: 'ok' as 'ok' | 'fail' | 'timeout' | 'gate' | 'hang' | 'deaf', gate: null as null | Promise<void>, hung: [] as Array<() => void> },
  getPublishedRefsMock: vi.fn(),
  getActiveExclusionSetMock: vi.fn(),
  googleCalls: vi.fn(),
  hotelCalls: vi.fn(),
  ExclusionLookupErrorRef: { current: null as unknown as new (cause?: unknown) => Error }
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
// In-memory PlaceCache that honours the eligible $or pairs lib/staysSearch.ts sends, records the database time limit and can be made slow/failing.
vi.mock('@/models/PlaceCache', () => ({
  PlaceCache: {
    find: (filter: Record<string, any>, projection?: unknown, options?: { signal?: AbortSignal }) => {
      const call: { filter: Record<string, any>; projection?: unknown; maxTimeMS?: number; signal?: AbortSignal } = { filter, projection, signal: options?.signal };
      findCalls.push(call);
      const query = {
        maxTimeMS(value: number) {
          call.maxTimeMS = value;
          return query;
        },
        lean: async () => {
          if (read.mode === 'hang' || read.mode === 'deaf') {
            return new Promise((resolve, reject) => {
              read.hung.push(() => resolve(rows.current.filter((row) => !filter.$or || filter.$or.some((pair: any) => row.destinationSlug === pair.destinationSlug && row.searchLocation === pair.searchLocation))));
              if (read.mode === 'hang') options?.signal?.addEventListener('abort', () => reject(options.signal?.reason));
            });
          }
          if (read.mode === 'gate') {
            await new Promise<void>((resolve, reject) => {
              void read.gate?.then(() => resolve());
              options?.signal?.addEventListener('abort', () => reject(options.signal?.reason));
            });
          }
          if (read.mode === 'fail') throw new Error('read failed');
          if (read.mode === 'timeout') throw Object.assign(new Error('operation exceeded time limit'), { code: 50, codeName: 'MaxTimeMSExpired' });
          return rows.current.filter((row) => {
            if (filter.$or && !filter.$or.some((pair: any) => row.destinationSlug === pair.destinationSlug && row.searchLocation === pair.searchLocation)) return false;
            if (filter._id?.$exists === false) return false;
            if (filter.placeId?.$in && !filter.placeId.$in.includes(row.placeId)) return false;
            return true;
          });
        }
      };
      return query;
    }
  }
}));
vi.mock('@/lib/destinations', () => ({ getPublishedDestinationRefs: getPublishedRefsMock }));
vi.mock('@/lib/stays', () => ({ getCachedStaysCatalog: vi.fn(), toStay: (doc: Row) => ({ placeId: doc.placeId, name: doc.name, stayType: doc.stayType, destinationSlug: doc.destinationSlug, source: 'google' }) }));
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
// If the suggestion path ever reached Google or the curated-hotel catalog, one of these would run.
vi.mock('@/lib/googlePlaces', () => ({ searchStays: googleCalls, placeName: googleCalls, placePhotoUrls: googleCalls, placeCoordinates: googleCalls }));
vi.mock('@/lib/hotels', () => ({ getHotels: hotelCalls, getHotelBySlug: hotelCalls }));
vi.mock('@/models/Hotel', () => ({ Hotel: { find: hotelCalls, findOne: hotelCalls } }));

const { searchEligibleStays, searchStaySuggestions, resetStaysSearchMemo, STAY_SUGGESTION_ROW_TIME_LIMIT_MS, ROW_READ_MAX_WAIT_MS, MAX_UNSETTLED_ROW_READS, RowReadUnavailableError } = await import('@/lib/staysSearch');

const DESTS = [
  { slug: 'manali', title: 'Manali', state: 'Himachal Pradesh' },
  { slug: 'spiti-valley', title: 'Spiti Valley', state: 'Himachal Pradesh' },
  { slug: 'bir-billing', title: 'Bir Billing', state: 'Himachal Pradesh' },
  { slug: 'dharamshala', title: 'Dharamshala', state: 'Himachal Pradesh' },
  { slug: 'mcleod-ganj', title: 'McLeod Ganj', state: 'Himachal Pradesh' }
];

function row(placeId: string, name: string, destinationSlug: string, searchLocation: string, extra: Record<string, unknown> = {}): Row {
  return { placeId, name, destinationSlug, searchLocation, stayType: 'hotel', types: ['hotel'], rating: 4, userRatingCount: 10, formattedAddress: `${name}, ${searchLocation}`, updatedAt: new Date('2026-09-15T00:00:00Z'), photos: ['https://photo.example/p.jpg'], ...extra };
}

function baseRows(): Row[] {
  return [
    row('p-heritage', 'Hotel Spiti Heritage', 'spiti-valley', 'Kaza'),
    row('p-vajra', 'The Vajra', 'spiti-valley', 'Kaza', { rating: 4.8 }),
    ...Array.from({ length: 8 }, (_, i) => row(`p-kaza-${i}`, `Kaza Homestay ${i}`, 'spiti-valley', 'Kaza', { rating: 5 - i * 0.1, userRatingCount: 100 - i })),
    row('p-bir', 'Bir Camp', 'bir-billing', 'Bir'),
    row('p-dh1', 'Hotel McLeod View', 'mcleod-ganj', 'McLeod Ganj', { rating: 4.6 }),
    row('p-dh2', 'Dharamshala Palace', 'dharamshala', 'Dharamshala', { rating: 4.4 }),
    row('p-manali-home', 'Manali Homestay', 'manali', 'Manali', { rating: 4.5 }),
    row('p-old-duck', 'Old Duck Home Stay', 'spiti-valley', 'Kaza'),
    // Not public: an orphan slug, a stale location under a real destination, a test slug.
    row('p-orphan', 'Orphan Kaza Lodge', 'kaza', 'Kaza'),
    row('p-stale', 'Stale Location Kaza Inn', 'spiti-valley', 'Old Town'),
    row('p-test', 'Verify Kaza Hotel', 'spiti-valley-verify2', 'Kaza')
  ];
}

const QUERIES = ['Hotel Spiti Heritage', 'The Vajra', 'vajra', 'heritage', 'Kaza', 'Bir Billing', 'Sangla', 'Guptkashi', 'Dharamsala', 'McLeodganj', 'Manali homestay', 'Spiti hotel', 'Old Duck', 'nonsense search'];

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('STAYS_SEARCH_ROW_MEMO_MS', '60000');
  resetStaysSearchMemo();
  findCalls.length = 0;
  read.mode = 'ok';
  read.gate = null;
  read.hung = [];
  googleCalls.mockReset();
  hotelCalls.mockReset();
  getPublishedRefsMock.mockReset().mockResolvedValue(DESTS);
  getActiveExclusionSetMock.mockReset().mockResolvedValue(new Set());
  rows.current = baseRows();
});

afterEach(async () => {
  // Settle any read a test left running, so no flight survives into the next test.
  read.hung.forEach((settle) => settle());
  read.hung = [];
  vi.useRealTimers();
  await new Promise((resolve) => setTimeout(resolve, 0));
});

const suggestionIds = (outcome: Awaited<ReturnType<typeof searchStaySuggestions>>) => (outcome.status === 'ok' ? outcome.suggestions.map((s) => s.placeId) : outcome.status);
const p4Ids = async (q: string, limit = 5) => {
  const outcome = await searchEligibleStays({ q, offset: 0, limit, strategy: 'scan' });
  return outcome.status === 'ok' ? outcome.stays.map((s) => s.placeId) : outcome.status;
};
const rowReads = () => findCalls.filter((call) => call.filter.$or || call.filter._id).length;

describe('searchStaySuggestions - shape and limits', () => {
  it('returns at most five public suggestions with the existing detail URL, a verified locality and nothing else', async () => {
    const outcome = await searchStaySuggestions('Kaza');
    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') return;
    expect(outcome.suggestions).toHaveLength(5);
    expect(outcome.totalCount).toBe(11);
    for (const suggestion of outcome.suggestions) {
      expect(Object.keys(suggestion).sort()).toEqual(['destinationSlug', 'destinationTitle', 'href', 'id', 'locality', 'name', 'placeId']);
      expect(suggestion.href).toBe(`/stays/property/${suggestion.placeId}`);
      expect(suggestion.id).toBe(`stay:${suggestion.placeId}`);
      expect(suggestion.locality).toBe('Kaza');
      expect(suggestion.destinationTitle).toBe('Spiti Valley');
    }
    // No price, rating, availability, photograph or provider URL travels with a suggestion.
    expect(JSON.stringify(outcome)).not.toMatch(/photo|rating|price|availab|google|maps/i);
  });

  it('honours a smaller limit and never exceeds five', async () => {
    const two = await searchStaySuggestions('Kaza', { limit: 2 });
    expect(two.status === 'ok' && two.suggestions).toHaveLength(2);
    const many = await searchStaySuggestions('Kaza', { limit: 50 });
    expect(many.status === 'ok' && many.suggestions).toHaveLength(5);
  });

  it('is empty (and reads nothing) for empty or meaningless text', async () => {
    for (const text of ['', '   ', '[[', '()', '!!']) {
      expect(await searchStaySuggestions(text)).toEqual({ status: 'ok', suggestions: [], totalCount: 0 });
    }
    expect(findCalls).toHaveLength(0);
    expect(getActiveExclusionSetMock).not.toHaveBeenCalled();
  });

  it('removes duplicates (same place cached twice, curated duplicate) BEFORE applying the limit', async () => {
    // The same real place cached under two eligible locations is one suggestion.
    rows.current.push(row('p-vajra', 'The Vajra', 'bir-billing', 'Bir', { rating: 3 }));
    const vajra = await searchStaySuggestions('vajra');
    expect(suggestionIds(vajra)).toEqual(['p-vajra']);

    // A curated duplicate (exact name + address) is dropped first, so the list is still filled to five.
    const plain = await searchStaySuggestions('Kaza');
    const curatedName = plain.status === 'ok' ? plain.suggestions[0] : null;
    const first = rows.current.find((r) => r.placeId === curatedName?.placeId)!;
    const withCurated = await searchStaySuggestions('Kaza', { curated: [{ name: first.name as string, formattedAddress: first.formattedAddress as string }] });
    expect(withCurated.status).toBe('ok');
    if (withCurated.status !== 'ok' || plain.status !== 'ok') return;
    expect(withCurated.suggestions.map((s) => s.placeId)).not.toContain(first.placeId);
    expect(withCurated.suggestions).toHaveLength(5);
    expect(withCurated.totalCount).toBe(plain.totalCount - 1);
  });
});

describe('searchStaySuggestions - parity with the P4 listing search', () => {
  it.each(QUERIES)('"%s": same identities and the same top-5 order as searchEligibleStays', async (q) => {
    const suggestions = await searchStaySuggestions(q);
    expect(suggestionIds(suggestions)).toEqual(await p4Ids(q));
    const all = await searchEligibleStays({ q, offset: 0, limit: 50, strategy: 'scan' });
    expect(suggestions.status === 'ok' && suggestions.totalCount).toBe(all.status === 'ok' ? all.totalCount : -1);
  });

  it('the same exclusion set gives the same answer', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['p-vajra', 'p-old-duck']));
    for (const q of ['vajra', 'The Vajra', 'Old Duck', 'Kaza', 'heritage']) expect(suggestionIds(await searchStaySuggestions(q))).toEqual(await p4Ids(q));
    expect(suggestionIds(await searchStaySuggestions('vajra'))).toEqual([]);
  });

  it('never returns a place the listing search would not', async () => {
    for (const q of QUERIES) {
      const listed = new Set((await searchEligibleStays({ q, offset: 0, limit: 500, strategy: 'scan' }).then((o) => (o.status === 'ok' ? o.stays : []))).map((s) => s.placeId));
      const outcome = await searchStaySuggestions(q);
      if (outcome.status === 'ok') for (const s of outcome.suggestions) expect(listed.has(s.placeId)).toBe(true);
    }
  });
});

describe('searchStaySuggestions - eligibility', () => {
  it('hides orphan-only, stale-location-only and test-slug rows, and never reads a curated-hotel catalog', async () => {
    const outcome = await searchStaySuggestions('Kaza', { limit: 5 });
    const ids = suggestionIds(await searchStaySuggestions('Kaza'));
    expect(ids).not.toContain('p-orphan');
    expect(ids).not.toContain('p-stale');
    expect(ids).not.toContain('p-test');
    for (const q of ['Orphan Kaza Lodge', 'Stale Location', 'Verify Kaza']) expect(suggestionIds(await searchStaySuggestions(q))).toEqual([]);
    expect(outcome.status).toBe('ok');
    expect(hotelCalls).not.toHaveBeenCalled();
    expect(googleCalls).not.toHaveBeenCalled();
  });

  it('a place cached only under an UNPUBLISHED destination is not eligible, even with the rows already memoized', async () => {
    expect(suggestionIds(await searchStaySuggestions('Bir Camp'))).toEqual(['p-bir']);
    getPublishedRefsMock.mockResolvedValue(DESTS.filter((d) => d.slug !== 'bir-billing'));
    expect(suggestionIds(await searchStaySuggestions('Bir Camp'))).toEqual([]);
    // ...and it is eligible again the moment the destination is republished.
    getPublishedRefsMock.mockResolvedValue(DESTS);
    expect(suggestionIds(await searchStaySuggestions('Bir Camp'))).toEqual(['p-bir']);
  });

  it('a draft destination cannot make a cached stay public: no published destination means nothing at all', async () => {
    getPublishedRefsMock.mockResolvedValue([]);
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'ok', suggestions: [], totalCount: 0 });
    expect(rowReads()).toBe(0);
  });

  it('nothing is returned just because a row exists in the cache (no match, no suggestion)', async () => {
    expect(suggestionIds(await searchStaySuggestions('nonsense search'))).toEqual([]);
    expect(suggestionIds(await searchStaySuggestions('Sangla'))).toEqual([]);
  });
});

describe('searchStaySuggestions - exclusions fail closed', () => {
  it('a newly excluded place disappears on the very next request, even while its rows are memoized', async () => {
    expect(suggestionIds(await searchStaySuggestions('vajra'))).toEqual(['p-vajra']);
    expect(rowReads()).toBe(1);
    getActiveExclusionSetMock.mockResolvedValue(new Set(['p-vajra']));
    expect(suggestionIds(await searchStaySuggestions('vajra'))).toEqual([]);
    // The rows came from the memo: exclusion was still read fresh.
    expect(rowReads()).toBe(1);
    expect(getActiveExclusionSetMock).toHaveBeenCalledTimes(2);
    // Reinstated: back at once.
    getActiveExclusionSetMock.mockResolvedValue(new Set());
    expect(suggestionIds(await searchStaySuggestions('vajra'))).toEqual(['p-vajra']);
  });

  it('exclusion lookup failure withholds the WHOLE section - cold, warm, and even when every other read succeeded', async () => {
    getActiveExclusionSetMock.mockRejectedValue(new ExclusionLookupErrorRef.current());
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'exclusions' });
    // Warm the memo with a good lookup, then fail the lookup again: the memoized rows must not be shown.
    getActiveExclusionSetMock.mockResolvedValue(new Set());
    expect(suggestionIds(await searchStaySuggestions('Kaza'))).toHaveLength(5);
    getActiveExclusionSetMock.mockRejectedValue(new ExclusionLookupErrorRef.current());
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'exclusions' });
    expect(await searchStaySuggestions('The Vajra')).toEqual({ status: 'unavailable', reason: 'exclusions' });
  });

  it('exclusion failure wins over a row-read failure, and over a destinations failure', async () => {
    getActiveExclusionSetMock.mockRejectedValue(new ExclusionLookupErrorRef.current());
    read.mode = 'fail';
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'exclusions' });
    getPublishedRefsMock.mockRejectedValue(new Error('destinations down'));
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'catalog' });
  });

  it('a failed exclusion check leaves no state behind: the next good check serves normally', async () => {
    getActiveExclusionSetMock.mockRejectedValueOnce(new ExclusionLookupErrorRef.current());
    expect((await searchStaySuggestions('vajra')).status).toBe('unavailable');
    expect(suggestionIds(await searchStaySuggestions('vajra'))).toEqual(['p-vajra']);
  });

  it('a non-lookup error from the exclusion service is not hidden as "no results"', async () => {
    getActiveExclusionSetMock.mockRejectedValue(new TypeError('unexpected'));
    await expect(searchStaySuggestions('Kaza')).rejects.toThrow('unexpected');
  });

  it('row-read failures and time-limit expiries are unavailable (never stale, never empty-as-answer)', async () => {
    read.mode = 'fail';
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'catalog' });
    read.mode = 'timeout';
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'timeout' });
    getPublishedRefsMock.mockRejectedValue(new Error('down'));
    expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'catalog' });
  });
});

describe('row single-flight', () => {
  it('five concurrent cold requests share ONE row read, then the memo serves the rest', async () => {
    let open!: () => void;
    read.mode = 'gate';
    read.gate = new Promise<void>((resolve) => (open = resolve));
    const pending = Promise.all(['Kaza', 'vajra', 'Kaza ', 'heritage', 'Bir Camp'].map((q) => searchStaySuggestions(q)));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(rowReads()).toBe(1);
    open();
    const results = await pending;
    expect(results.every((r) => r.status === 'ok')).toBe(true);
    expect(rowReads()).toBe(1);
    // The results are the right ones for each query, not one shared answer.
    expect(suggestionIds(results[1])).toEqual(['p-vajra']);
    expect(suggestionIds(results[4])).toEqual(['p-bir']);
    // Memo hit afterwards.
    await searchStaySuggestions('Kaza');
    expect(rowReads()).toBe(1);
  });

  it('every concurrent request still gets its own fresh exclusion check', async () => {
    read.mode = 'gate';
    let open!: () => void;
    read.gate = new Promise<void>((resolve) => (open = resolve));
    getActiveExclusionSetMock.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set(['p-vajra']));
    const a = searchStaySuggestions('vajra');
    const b = searchStaySuggestions('vajra');
    await new Promise((resolve) => setTimeout(resolve, 20));
    open();
    expect(suggestionIds(await a)).toEqual(['p-vajra']);
    expect(suggestionIds(await b)).toEqual([]);
    expect(rowReads()).toBe(1);
  });

  it('a failed shared read fails every waiter, is not memoized, and the next request starts a new read that succeeds', async () => {
    read.mode = 'gate';
    let fail!: () => void;
    read.gate = new Promise<void>((resolve) => (fail = resolve));
    const pending = Promise.all([1, 2, 3].map(() => searchStaySuggestions('Kaza')));
    await new Promise((resolve) => setTimeout(resolve, 20));
    read.mode = 'fail';
    fail();
    const failed = await pending;
    expect(failed.every((r) => r.status === 'unavailable')).toBe(true);
    expect(rowReads()).toBe(1);

    read.mode = 'ok';
    expect(suggestionIds(await searchStaySuggestions('Kaza'))).toHaveLength(5);
    expect(rowReads()).toBe(2);
    await searchStaySuggestions('Kaza');
    expect(rowReads()).toBe(2);
  });

  it('twelve requests while a read never settles: ONE underlying read; after the maximum wait it is cancelled via its signal, the waiters get a typed result, and only then can a new read start', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    read.mode = 'hang';
    const outcomes: Array<Promise<Awaited<ReturnType<typeof searchStaySuggestions>>>> = [];
    const reads: number[] = [];
    for (let i = 0; i < 12; i++) {
      outcomes.push(searchStaySuggestions('Kaza'));
      await vi.advanceTimersByTimeAsync(1500);
      reads.push(rowReads());
    }
    // 18 s elapsed: still exactly one read, never aborted yet.
    expect(reads.every((count) => count === 1)).toBe(true);
    expect(findCalls[0].signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(ROW_READ_MAX_WAIT_MS - 18_000 + 10);
    // The wait limit passed: every waiter was told "unavailable", and the read was CANCELLED (not replaced).
    const settled = await Promise.all(outcomes);
    expect(settled.every((o) => o.status === 'unavailable' && (o as { reason: string }).reason === 'timeout')).toBe(true);
    expect(findCalls[0].signal?.aborted).toBe(true);
    expect(findCalls[0].signal?.reason).toBeInstanceOf(RowReadUnavailableError);
    expect(rowReads()).toBe(1);
    // The aborted read settled, so recovery starts a NEW read and succeeds.
    read.mode = 'ok';
    expect(suggestionIds(await searchStaySuggestions('Kaza'))).toHaveLength(5);
    expect(rowReads()).toBe(2);
  });

  it('a read that ignores cancellation: later callers get a typed result at once and NO second read is ever started for the same key', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    read.mode = 'deaf';
    const early = searchStaySuggestions('Kaza');
    await vi.advanceTimersByTimeAsync(ROW_READ_MAX_WAIT_MS + 10);
    expect(await early).toEqual({ status: 'unavailable', reason: 'timeout' });
    for (let i = 0; i < 12; i++) {
      expect(await searchStaySuggestions('Kaza')).toEqual({ status: 'unavailable', reason: 'timeout' });
      await vi.advanceTimersByTimeAsync(5000);
    }
    expect(rowReads()).toBe(1);
    // The unsettled read is still registered. When it finally settles its rows fill the memo (they are real rows read by a
    // real read), so the next request is served without any new read.
    read.hung.forEach((settle) => settle());
    read.hung = [];
    await vi.advanceTimersByTimeAsync(10);
    expect(suggestionIds(await searchStaySuggestions('Kaza'))).toHaveLength(5);
    expect(rowReads()).toBe(1);
  });

  it('a slow 14 s transfer: requests every 6 s share it (no second read) and are served when it finishes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    read.mode = 'gate';
    read.gate = new Promise<void>((resolve) => setTimeout(resolve, 14_000));
    const outcomes: Array<Promise<Awaited<ReturnType<typeof searchStaySuggestions>>>> = [];
    const reads: number[] = [];
    for (let i = 0; i < 3; i++) {
      outcomes.push(searchStaySuggestions('Kaza'));
      await vi.advanceTimersByTimeAsync(6000);
      reads.push(rowReads());
    }
    await vi.advanceTimersByTimeAsync(2100);
    expect(reads).toEqual([1, 1, 1]);
    const results = await Promise.all(outcomes);
    expect(results.every((r) => r.status === 'ok')).toBe(true);
    expect(rowReads()).toBe(1);
    // Served from the memo now.
    await searchStaySuggestions('Kaza');
    expect(rowReads()).toBe(1);
  });

  it('a settled flight is removed: after memo expiry a new read starts normally (resolution and rejection both clear it)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
    await searchStaySuggestions('Kaza');
    expect(rowReads()).toBe(1);
    vi.setSystemTime(new Date('2026-10-14T10:02:00Z'));
    read.mode = 'fail';
    expect((await searchStaySuggestions('Kaza')).status).toBe('unavailable');
    expect(rowReads()).toBe(2);
    read.mode = 'ok';
    expect((await searchStaySuggestions('Kaza')).status).toBe('ok');
    expect(rowReads()).toBe(3);
  });

  it('an expired memo plus a failed read is "unavailable" - the old rows are never shown as a fallback', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
    expect(suggestionIds(await searchStaySuggestions('vajra'))).toEqual(['p-vajra']);
    vi.setSystemTime(new Date('2026-10-14T10:02:00Z'));
    read.mode = 'fail';
    expect(await searchStaySuggestions('vajra')).toEqual({ status: 'unavailable', reason: 'catalog' });
  });

  it('a joiner arriving late can wait only for what is left of the maximum wait, never longer', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    read.mode = 'deaf';
    void searchStaySuggestions('Kaza').catch(() => undefined);
    await vi.advanceTimersByTimeAsync(15_000);
    let done = false;
    const late = searchStaySuggestions('vajra').then((o) => {
      done = true;
      return o;
    });
    await vi.advanceTimersByTimeAsync(4_900);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(await late).toEqual({ status: 'unavailable', reason: 'timeout' });
    expect(rowReads()).toBe(1);
  });

  it('a memo reset while a read runs does not allow a second overlapping read: new requests join the running one, and the older read does not refill the memo', async () => {
    read.mode = 'gate';
    let open!: () => void;
    read.gate = new Promise<void>((resolve) => (open = resolve));
    const first = searchStaySuggestions('Kaza');
    await new Promise((resolve) => setTimeout(resolve, 20));
    resetStaysSearchMemo();
    const second = searchStaySuggestions('vajra');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(rowReads()).toBe(1);
    open();
    expect((await first).status).toBe('ok');
    expect(suggestionIds(await second)).toEqual(['p-vajra']);
    // The pre-reset read must not have refilled the memo: the next request reads again.
    read.mode = 'ok';
    await searchStaySuggestions('Kaza');
    expect(rowReads()).toBe(2);
  });

  it('different location sets are bounded: at most MAX_UNSETTLED_ROW_READS unsettled reads, then requests are refused without starting more', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    read.mode = 'deaf';
    const sets = [
      DESTS.slice(0, 1),
      DESTS.slice(0, 2),
      DESTS.slice(0, 3),
      DESTS.slice(0, 4),
      DESTS.slice(0, 5)
    ];
    const outcomes: Array<Promise<Awaited<ReturnType<typeof searchStaySuggestions>>>> = [];
    for (const published of sets) {
      getPublishedRefsMock.mockResolvedValue(published);
      outcomes.push(searchStaySuggestions('Kaza'));
      await vi.advanceTimersByTimeAsync(5);
    }
    expect(rowReads()).toBe(MAX_UNSETTLED_ROW_READS);
    // The fifth (over the cap) was refused immediately with a typed result.
    expect(await outcomes[4]).toEqual({ status: 'unavailable', reason: 'timeout' });
    await vi.advanceTimersByTimeAsync(ROW_READ_MAX_WAIT_MS + 10);
    await Promise.all(outcomes);
    expect(rowReads()).toBe(MAX_UNSETTLED_ROW_READS);
  });

  it('a P4 listing request is served by the shared read, and a hung read makes it "unavailable" (never hangs, never starts a second read)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    read.mode = 'deaf';
    const p4 = searchEligibleStays({ q: 'Kaza', limit: 5, strategy: 'scan' });
    await vi.advanceTimersByTimeAsync(ROW_READ_MAX_WAIT_MS + 10);
    expect(await p4).toEqual({ status: 'unavailable', reason: 'catalog' });
    expect(await searchEligibleStays({ q: 'Kaza', limit: 5, strategy: 'scan' })).toEqual({ status: 'unavailable', reason: 'catalog' });
    expect(rowReads()).toBe(1);
  });

  it('the shared read carries an abort signal that stays un-aborted when the read finishes', async () => {
    await searchStaySuggestions('Kaza');
    expect(findCalls[0].signal).toBeInstanceOf(AbortSignal);
    expect(findCalls[0].signal?.aborted).toBe(false);
  });

  it('requests with a different database limit do not share a flight (an unlimited P4 request is never failed by a limit it did not ask for)', async () => {
    read.mode = 'gate';
    let open!: () => void;
    read.gate = new Promise<void>((resolve) => (open = resolve));
    const limited = searchStaySuggestions('Kaza', { maxTimeMS: 1200 });
    const defaulted = searchStaySuggestions('Kaza');
    const p4 = searchEligibleStays({ q: 'Kaza', limit: 5, strategy: 'scan' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(rowReads()).toBe(3);
    expect(findCalls.map((c) => c.maxTimeMS).sort()).toEqual([undefined, 1200, STAY_SUGGESTION_ROW_TIME_LIMIT_MS].sort());
    open();
    await Promise.all([limited, defaulted, p4]);
  });
});

describe('bounded database work', () => {
  it('puts the default database time limit on the row read, and a caller limit overrides it', async () => {
    await searchStaySuggestions('Kaza');
    expect(findCalls[0].maxTimeMS).toBe(STAY_SUGGESTION_ROW_TIME_LIMIT_MS);
    resetStaysSearchMemo();
    findCalls.length = 0;
    await searchStaySuggestions('Kaza', { maxTimeMS: 2500 });
    expect(findCalls[0].maxTimeMS).toBe(2500);
  });

  it('reads only light fields (no photo arrays) and exactly one catalog command per cold request, zero when warm', async () => {
    await searchStaySuggestions('Kaza');
    await searchStaySuggestions('vajra');
    await searchStaySuggestions('Bir Camp');
    expect(findCalls).toHaveLength(1);
    const projection = findCalls[0].projection as Record<string, number>;
    expect(Object.keys(projection)).not.toContain('photos');
    expect(Object.keys(projection)).toContain('placeId');
  });
});

describe('row memo freshness', () => {
  it('a new eligible property appears once the memo window has passed, and not before', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
    expect(suggestionIds(await searchStaySuggestions('Brand New Lodge'))).toEqual([]);
    rows.current.push(row('p-new', 'Brand New Lodge', 'manali', 'Manali'));
    vi.setSystemTime(new Date('2026-10-14T10:00:30Z'));
    expect(suggestionIds(await searchStaySuggestions('Brand New Lodge'))).toEqual([]);
    vi.setSystemTime(new Date('2026-10-14T10:01:01Z'));
    expect(suggestionIds(await searchStaySuggestions('Brand New Lodge'))).toEqual(['p-new']);
    expect(rowReads()).toBe(2);
  });

  it('a renamed eligible property becomes searchable under the new name after the window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
    expect(suggestionIds(await searchStaySuggestions('Vajra'))).toEqual(['p-vajra']);
    rows.current = rows.current.map((r) => (r.placeId === 'p-vajra' ? { ...r, name: 'Aurora Lodge', formattedAddress: 'Aurora Lodge, Kaza' } : r));
    vi.setSystemTime(new Date('2026-10-14T10:01:05Z'));
    expect(suggestionIds(await searchStaySuggestions('Vajra'))).toEqual([]);
    expect(suggestionIds(await searchStaySuggestions('Aurora Lodge'))).toEqual(['p-vajra']);
  });

  it('with the memo disabled every request reads fresh rows', async () => {
    vi.stubEnv('STAYS_SEARCH_ROW_MEMO_MS', '0');
    await searchStaySuggestions('Kaza');
    await searchStaySuggestions('Kaza');
    expect(rowReads()).toBe(2);
  });
});

describe('P4 listing behaviour is unchanged', () => {
  it('searchEligibleStays without a limit still reads with no database time limit and still returns the same list', async () => {
    const before = await searchEligibleStays({ q: 'Kaza', limit: 50, strategy: 'scan' });
    expect(findCalls.find((c) => c.filter.$or)?.maxTimeMS).toBeUndefined();
    expect(before.status === 'ok' && before.totalCount).toBe(11);
  });

  it('concurrent P4 requests now share one row read but still check exclusions each time', async () => {
    read.mode = 'gate';
    let open!: () => void;
    read.gate = new Promise<void>((resolve) => (open = resolve));
    getActiveExclusionSetMock.mockResolvedValueOnce(new Set()).mockResolvedValueOnce(new Set(['p-vajra']));
    const a = searchEligibleStays({ q: 'vajra', limit: 5, strategy: 'scan' });
    const b = searchEligibleStays({ q: 'vajra', limit: 5, strategy: 'scan' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    open();
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra.status === 'ok' && ra.stays.map((s) => s.placeId)).toEqual(['p-vajra']);
    expect(rb.status === 'ok' && rb.stays.map((s) => s.placeId)).toEqual([]);
    expect(findCalls.filter((c) => c.filter.$or && !c.filter.placeId)).toHaveLength(1);
  });

  it('with the memo disabled (the default for the existing P4 suite) there is no sharing at all', async () => {
    vi.stubEnv('STAYS_SEARCH_ROW_MEMO_MS', '0');
    await Promise.all([searchEligibleStays({ q: 'vajra', limit: 5, strategy: 'scan' }), searchEligibleStays({ q: 'vajra', limit: 5, strategy: 'scan' })]);
    expect(findCalls.filter((c) => c.filter.$or && !c.filter.placeId)).toHaveLength(2);
  });
});

describe('no provider, photo or write path', () => {
  it('never calls Google, the photo proxy or the hotel catalog', async () => {
    for (const q of QUERIES) await searchStaySuggestions(q);
    expect(googleCalls).not.toHaveBeenCalled();
    expect(hotelCalls).not.toHaveBeenCalled();
  });
});
