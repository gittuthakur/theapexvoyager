import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import journeyCatalog from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';

type Row = Record<string, unknown> & { placeId: string; destinationSlug: string; searchLocation: string };

const { rows, findCalls, read, getPublishedRefsMock, getActiveExclusionSetMock, googleCalls, hotelCalls, ExclusionLookupErrorRef } = vi.hoisted(() => ({
  rows: { current: [] as Row[] },
  findCalls: [] as Array<{ filter: Record<string, any> }>,
  read: { gate: null as null | Promise<void> },
  getPublishedRefsMock: vi.fn(),
  getActiveExclusionSetMock: vi.fn(),
  googleCalls: vi.fn(),
  hotelCalls: vi.fn(),
  ExclusionLookupErrorRef: { current: null as unknown as new (cause?: unknown) => Error }
}));


/** What the real database does with SUGGESTION_PROJECTION: keep only the listed fields and compute hasTypes. */
function project(rows: Row[], projection?: Record<string, unknown>): Row[] {
  if (!projection || !('hasTypes' in projection)) return rows;
  const keep = ['placeId', 'name', 'destinationSlug', 'searchLocation', 'formattedAddress', 'rating', 'userRatingCount'];
  return rows.map((row) => ({ ...Object.fromEntries(keep.filter((key) => key in row).map((key) => [key, row[key]])), hasTypes: ((row.types as string[] | undefined)?.length ?? 0) > 0 }) as unknown as Row);
}

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/PlaceCache', () => ({
  PlaceCache: {
    find: (filter: Record<string, any>, projection?: unknown) => {
      findCalls.push({ filter });
      const query = {
        maxTimeMS: () => query,
        lean: async () => {
          if (read.gate) await read.gate;
          return project(
            rows.current.filter((row) => !filter.$or || filter.$or.some((pair: any) => row.destinationSlug === pair.destinationSlug && row.searchLocation === pair.searchLocation)),
            projection as Record<string, unknown>
          );
        }
      };
      return query;
    }
  }
}));
vi.mock('@/lib/destinations', () => ({ getPublishedDestinationRefs: getPublishedRefsMock, getCuratedDestinations: vi.fn() }));
vi.mock('@/lib/stays', () => ({ getCachedStaysCatalog: vi.fn(), toStay: (doc: Row) => ({ placeId: doc.placeId, name: doc.name, stayType: doc.stayType, destinationSlug: doc.destinationSlug, source: 'google' }) }));
vi.mock('@/services/properties/propertyExclusion.service', () => {
  class ExclusionLookupError extends Error {
    constructor(cause?: unknown) {
      super("exclusions unavailable");
      void cause;
    }
  }
  ExclusionLookupErrorRef.current = ExclusionLookupError;
  return { ExclusionLookupError, getActiveExclusionSet: getActiveExclusionSetMock };
});
vi.mock('@/lib/googlePlaces', () => ({ searchStays: googleCalls, placeName: googleCalls, placePhotoUrls: googleCalls, placeCoordinates: googleCalls }));
vi.mock('@/lib/hotels', () => ({ getHotels: hotelCalls, getHotelBySlug: hotelCalls }));
vi.mock('@/models/Hotel', () => ({ Hotel: { find: hotelCalls, findOne: hotelCalls } }));

const { runGlobalSearch, STAYS_SECTION_DEADLINE_MS } = await import('@/lib/globalSearchServer');
const { searchEligibleStays, resetStaysSearchMemo, searchStaySuggestions } = await import('@/lib/staysSearch');
const { parseGlobalSearchQuery } = await import('@/lib/search/globalSearch');

const destinations = catalog.destinations as unknown as Destination[];
const experiences = catalog.experiences as unknown as Experience[];
const journeys = journeyCatalog.journeys as unknown as TravelPackage[];

const DESTS = [
  { slug: 'manali', title: 'Manali', state: 'Himachal Pradesh' },
  { slug: 'spiti-valley', title: 'Spiti Valley', state: 'Himachal Pradesh' },
  { slug: 'bir-billing', title: 'Bir Billing', state: 'Himachal Pradesh' },
  { slug: 'dharamshala', title: 'Dharamshala', state: 'Himachal Pradesh' },
  { slug: 'mcleod-ganj', title: 'McLeod Ganj', state: 'Himachal Pradesh' },
  { slug: 'kinnaur', title: 'Kinnaur', state: 'Himachal Pradesh' }
];

function row(placeId: string, name: string, destinationSlug: string, searchLocation: string, extra: Record<string, unknown> = {}): Row {
  return { placeId, name, destinationSlug, searchLocation, stayType: 'hotel', types: ['hotel'], rating: 4, userRatingCount: 10, formattedAddress: `${name}, ${searchLocation}`, updatedAt: new Date('2026-09-15T00:00:00Z'), photos: ['https://photo.example/p.jpg'], ...extra };
}
function baseRows(): Row[] {
  return [
    row('p-heritage', 'Hotel Spiti Heritage', 'spiti-valley', 'Kaza'),
    row('p-vajra', 'The Vajra', 'spiti-valley', 'Kaza', { rating: 4.8 }),
    row('p-navisha', 'Navisha Luxury Villa & Treehouse Cottages', 'manali', 'Manali', { rating: 4.7 }),
    ...Array.from({ length: 8 }, (_, i) => row(`p-kaza-${i}`, `Kaza Homestay ${i}`, 'spiti-valley', 'Kaza', { rating: 5 - i * 0.1, userRatingCount: 100 - i })),
    row('p-bir', 'Bir Camp', 'bir-billing', 'Bir'),
    row('p-sangla', 'Sangla Valley Homestay', 'kinnaur', 'Sangla'),
    row('p-dh1', 'Hotel McLeod View', 'mcleod-ganj', 'McLeod Ganj', { rating: 4.6 }),
    row('p-dh2', 'Dharamshala Palace', 'dharamshala', 'Dharamshala', { rating: 4.4 }),
    row('p-manali-home', 'Manali Homestay', 'manali', 'Manali', { rating: 4.5 }),
    row('p-old-duck', 'Old Duck Home Stay,Cafe and Camp Stay,Kaza', 'spiti-valley', 'Kaza'),
    row('p-orphan', 'Orphan Kaza Lodge', 'kaza', 'Kaza'),
    row('p-stale', 'Stale Location Kaza Inn', 'spiti-valley', 'Old Town'),
    row('p-test', 'Verify Kaza Hotel', 'spiti-valley-verify2', 'Kaza')
  ];
}

/** The published destinations the Destinations section (and, shared, Stays) sees. Tests change it to unpublish a destination. */
let published: Destination[] = destinations;
const destinationReads = vi.fn();
const refReads = vi.fn();

/** The five existing sections come from the fixtures; Stays comes from the REAL searchStaySuggestions over mocked cached rows. */
const realLoaders = () => ({
  destinations: async () => {
    destinationReads();
    return published;
  },
  // The light, fresh, published-only refs every dependent section and Stays are verified against.
  destinationRefs: async () => {
    refReads();
    return published.map((d) => ({ slug: d.slug, title: d.title, state: d.state }));
  },
  regions: async () => [],
  journeys: async () => journeys,
  experiences: async () => experiences,
  experts: async () => [],
  stays: (query: string, shared: { destinations(): Promise<Array<{ slug: string; title: string; state?: string }>> }) => searchStaySuggestions(query, { destinations: shared.destinations })
});
const parse = (q: string) => {
  const parsed = parseGlobalSearchQuery(q);
  if (!parsed.ok) throw new Error('bad query');
  return parsed;
};
const staysFor = async (q: string) => (await runGlobalSearch(parse(q), realLoaders())).sections.stays;
const rowReads = () => findCalls.filter((call) => call.filter.$or).length;

const ACCEPTANCE = ['Navisha Luxury Villa & Treehouse Cottages', 'Navisha', 'Hotel Spiti Heritage', 'The Vajra', 'vajra', 'Kaza', 'Bir Billing', 'Sangla', 'Guptkashi', 'Dharamsala', 'McLeodganj', 'Manali homestay', 'Spiti hotel', 'Old Duck', 'zzzzqqq'];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.unstubAllEnvs();
  vi.stubEnv('STAYS_SEARCH_ROW_MEMO_MS', '60000');
  resetStaysSearchMemo();
  findCalls.length = 0;
  read.gate = null;
  googleCalls.mockReset();
  hotelCalls.mockReset();
  getPublishedRefsMock.mockReset().mockResolvedValue(DESTS);
  published = destinations;
  destinationReads.mockReset();
  refReads.mockReset();
  getActiveExclusionSetMock.mockReset().mockResolvedValue(new Set());
  rows.current = baseRows();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Header Stays vs the P4 listing search (same eligible identities, same order)', () => {
  it.each(ACCEPTANCE)('"%s": the Stays section equals the first five results of searchEligibleStays', async (q) => {
    const section = await staysFor(q);
    const p4 = await searchEligibleStays({ q, offset: 0, limit: 5, strategy: 'scan' });
    expect(section.status).toBe('ok');
    expect(section.items.map((item) => item.id)).toEqual(p4.status === 'ok' ? p4.stays.map((stay) => `stay:${stay.placeId}`) : []);
    expect(new Set(section.items.map((item) => item.id)).size).toBe(section.items.length);
    for (const item of section.items) expect(item.href).toBe(`/stays/property/${item.id.slice('stay:'.length)}`);
  });

  it('Navisha is discoverable by its exact name and by "Navisha", linking to its public property page', async () => {
    for (const q of ['Navisha Luxury Villa & Treehouse Cottages', 'Navisha']) {
      const section = await staysFor(q);
      expect(section.items.map((i) => i.id)).toEqual(['stay:p-navisha']);
      expect(section.items[0]).toMatchObject({ type: 'stay', title: 'Navisha Luxury Villa & Treehouse Cottages', href: '/stays/property/p-navisha', subtitle: 'Manali' });
    }
  });

  it('the response carries no rating, price, availability, photograph or provider URL', async () => {
    const response = await runGlobalSearch(parse('Kaza'), realLoaders());
    expect(response.sections.stays.items.length).toBe(5);
    expect(JSON.stringify(response.sections.stays)).not.toMatch(/photo|rating|price|availab|google|maps|userRating/i);
  });

  it('never calls Google, the photo proxy or the curated-hotel catalog', async () => {
    for (const q of ACCEPTANCE) await staysFor(q);
    expect(googleCalls).not.toHaveBeenCalled();
    expect(hotelCalls).not.toHaveBeenCalled();
  });
});

describe('eligibility and exclusions are re-checked on every API request', () => {
  it('the excluded Old Duck Home Stay never appears, by short or full name', async () => {
    getActiveExclusionSetMock.mockResolvedValue(new Set(['p-old-duck']));
    for (const q of ['Old Duck', 'Old Duck Home Stay,Cafe and Camp Stay,Kaza']) expect((await staysFor(q)).items).toEqual([]);
    const kaza = await staysFor('Kaza');
    expect(kaza.items.map((i) => i.id)).not.toContain('stay:p-old-duck');
  });

  it('a NEW exclusion takes effect on the very next request, even with the rows memoized', async () => {
    expect((await staysFor('vajra')).items.map((i) => i.id)).toEqual(['stay:p-vajra']);
    expect(rowReads()).toBe(1);
    getActiveExclusionSetMock.mockResolvedValue(new Set(['p-vajra']));
    expect((await staysFor('vajra')).items).toEqual([]);
    expect(rowReads()).toBe(1);
  });

  it('an exclusion lookup failure makes Stays an "error" section with ZERO items, while the other sections still answer', async () => {
    await staysFor('Kaza'); // memo warm
    getActiveExclusionSetMock.mockRejectedValue(new ExclusionLookupErrorRef.current());
    const response = await runGlobalSearch(parse('Dharamsala'), realLoaders());
    expect(response.sections.stays).toEqual({ status: 'error', items: [] });
    expect(response.partial).toBe(true);
    expect(response.sections.destinations.status).toBe('ok');
    expect(response.sections.destinations.items.length).toBeGreaterThan(0);
    expect(response.sections.journeys.items.length).toBeGreaterThan(0);
  });

  it('orphan-only, stale-location-only and test-slug rows stay hidden; a hidden curated hotel is never read', async () => {
    for (const q of ['Orphan Kaza Lodge', 'Stale Location', 'Verify Kaza']) expect((await staysFor(q)).items).toEqual([]);
    expect((await staysFor('Kaza')).items.map((i) => i.id)).not.toEqual(expect.arrayContaining(['stay:p-orphan', 'stay:p-stale', 'stay:p-test']));
    expect(hotelCalls).not.toHaveBeenCalled();
  });

  it('an unpublished (draft) destination makes its cached stays ineligible immediately, and eligible again when republished', async () => {
    expect((await staysFor('Bir Camp')).items.map((i) => i.id)).toEqual(['stay:p-bir']);
    published = destinations.filter((d) => d.slug !== 'bir-billing');
    expect((await staysFor('Bir Camp')).items).toEqual([]);
    published = destinations;
    expect((await staysFor('Bir Camp')).items.map((i) => i.id)).toEqual(['stay:p-bir']);
  });

  it('a new eligible property appears after the row-memo window and a renamed one is searchable by its new name', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
    expect((await staysFor('Brand New Lodge')).items).toEqual([]);
    rows.current.push(row('p-new', 'Brand New Lodge', 'manali', 'Manali'));
    rows.current = rows.current.map((r) => (r.placeId === 'p-vajra' ? { ...r, name: 'Aurora Lodge', formattedAddress: 'Aurora Lodge, Kaza' } : r));
    vi.setSystemTime(new Date('2026-10-14T10:00:30Z'));
    expect((await staysFor('Brand New Lodge')).items).toEqual([]);
    vi.setSystemTime(new Date('2026-10-14T10:01:01Z'));
    expect((await staysFor('Brand New Lodge')).items.map((i) => i.id)).toEqual(['stay:p-new']);
    expect((await staysFor('Aurora Lodge')).items.map((i) => i.id)).toEqual(['stay:p-vajra']);
  });
});

describe('cost: database commands and single-flight under the Global API', () => {
  it('a cold request does ONE eligible-row read, a warm one none; each request checks destinations and exclusions once', async () => {
    await runGlobalSearch(parse('Kaza'), realLoaders());
    expect(rowReads()).toBe(1);
    // One heavy Destinations read and one light refs read per request; Stays never reads the published destinations itself.
    expect(destinationReads).toHaveBeenCalledTimes(1);
    expect(refReads).toHaveBeenCalledTimes(1);
    expect(getPublishedRefsMock).not.toHaveBeenCalled();
    expect(getActiveExclusionSetMock).toHaveBeenCalledTimes(1);
    await runGlobalSearch(parse('vajra'), realLoaders());
    expect(rowReads()).toBe(1);
    expect(destinationReads).toHaveBeenCalledTimes(2);
    expect(refReads).toHaveBeenCalledTimes(2);
    expect(getPublishedRefsMock).not.toHaveBeenCalled();
    expect(getActiveExclusionSetMock).toHaveBeenCalledTimes(2);
  });

  it('five concurrent cold API requests share ONE row read, each still checking exclusions itself', async () => {
    let open!: () => void;
    read.gate = new Promise<void>((resolve) => (open = resolve));
    const pending = Promise.all(['Kaza', 'vajra', 'heritage', 'Navisha', 'Bir Camp'].map((q) => runGlobalSearch(parse(q), realLoaders())));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(rowReads()).toBe(1);
    open();
    const responses = await pending;
    expect(responses.every((r) => r.sections.stays.status === 'ok')).toBe(true);
    expect(rowReads()).toBe(1);
    expect(getActiveExclusionSetMock).toHaveBeenCalledTimes(5);
  });

  it('a cold read slower than the Stays deadline: Stays times out (partial), nothing is repeated, and the SAME read fills the memo so the next request is warm', async () => {
    vi.useFakeTimers();
    read.gate = new Promise<void>((resolve) => setTimeout(resolve, 3200));
    const pending = runGlobalSearch(parse('Kaza'), realLoaders());
    await vi.advanceTimersByTimeAsync(STAYS_SECTION_DEADLINE_MS + 20);
    const first = await pending;
    expect(first.sections.stays).toEqual({ status: 'timeout', items: [] });
    expect(first.partial).toBe(true);
    expect(first.sections.destinations.status).toBe('ok');
    expect(rowReads()).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    // Next keystroke: the finished read is in the memo; no second read.
    const second = await runGlobalSearch(parse('Kaza'), realLoaders());
    expect(second.sections.stays.status).toBe('ok');
    expect(second.sections.stays.items).toHaveLength(5);
    expect(second.partial).toBe(false);
    expect(rowReads()).toBe(1);
  });
});
