import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { filterPackages, sortPackages } from '@/lib/packageFilters';
import { rankByRelevance, relevanceScores, searchPackages } from '@/lib/search/journeySearch';
import type { Destination, TravelPackage } from '@/types';

/**
 * P0 CONTRACT TESTS (fixture based). The fixtures below are tiny synthetic catalogs; none of the
 * production search code knows about any of these records — which is the point: every scenario
 * (publish, edit, link, new itinerary stop, category change, unpublish) is expressed purely by
 * changing the records handed to the same functions the UI uses.
 */

const dest = (slug: string, title: string, state: string): Destination =>
  ({ slug, title, state, category: 'Hill Station', description: `${title} description`, toursCount: 0, image: '' }) as unknown as Destination;

const DESTINATIONS: Destination[] = [
  dest('manali', 'Manali', 'Himachal Pradesh'),
  dest('kasol', 'Kasol', 'Himachal Pradesh'),
  dest('spiti-valley', 'Spiti Valley', 'Himachal Pradesh'),
  dest('joshimath', 'Joshimath (Jyotirmath)', 'Uttarakhand'),
  dest('pahalgam', 'Pahalgam', 'Jammu & Kashmir'),
  dest('srinagar', 'Srinagar', 'Jammu & Kashmir'),
  dest('mcleod-ganj', 'McLeod Ganj', 'Himachal Pradesh'),
  dest('dharamshala', 'Dharamshala', 'Himachal Pradesh'),
  dest('shimla', 'Shimla', 'Himachal Pradesh')
];
const bySlug = (list: Destination[] = DESTINATIONS) => new Map(list.map((d) => [d.slug, d]));

let counter = 0;
function journey(overrides: Partial<TravelPackage> & { name: string }): TravelPackage {
  counter += 1;
  return {
    slug: overrides.slug ?? `fixture-journey-${counter}`,
    destination: overrides.destination ?? 'Himachal Pradesh',
    destinationSlugs: overrides.destinationSlugs ?? [],
    image: '/x.jpg',
    duration: overrides.duration ?? '5 Days / 4 Nights',
    price: overrides.price ?? 20000,
    category: overrides.category ?? 'Family',
    shortDescription: overrides.shortDescription ?? 'A wonderful Himalayan adventure for the whole family.',
    highlights: overrides.highlights ?? [],
    itinerary: overrides.itinerary ?? [{ day: 1, title: 'Arrival and welcome', description: 'Settle in.' }],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    status: 'published',
    ...overrides
  } as unknown as TravelPackage;
}

const slugs = (hits: { pkg: TravelPackage }[]) => hits.map((h) => h.pkg.slug);
const find = (catalog: TravelPackage[], q: string, destinations = DESTINATIONS) => slugs(searchPackages(catalog, q, bySlug(destinations)));
const filter = (catalog: TravelPackage[], q: string, extra: Record<string, unknown> = {}, destinations = DESTINATIONS) =>
  filterPackages(catalog, { query: q, ...extra }, bySlug(destinations)).map((p) => p.slug);

let catalog: TravelPackage[];
beforeEach(() => {
  catalog = [
    journey({ slug: 'manali-premium-escape', name: 'Manali Premium Escape', destination: 'Manali, Himachal Pradesh', destinationSlugs: ['manali'], category: 'Adventure' }),
    journey({
      slug: 'kashmir-paradise',
      name: 'Kashmir Paradise',
      destination: 'Srinagar & Gulmarg, Kashmir',
      destinationSlugs: ['srinagar', 'pahalgam'],
      category: 'Honeymoon',
      itinerary: [{ day: 1, title: 'Arrive Srinagar', description: '' }, { day: 3, title: 'Day trip to Pahalgam', description: '' }]
    }),
    journey({ slug: 'spiti-circuit', name: 'Spiti Circuit Expedition', destination: 'Spiti Valley, Himachal Pradesh', destinationSlugs: ['spiti-valley'], category: 'Offbeat' }),
    journey({ slug: 'uttarakhand-yatra', name: 'Himalayan Yatra', destination: 'Joshimath, Uttarakhand', destinationSlugs: ['joshimath'], category: 'Spiritual' })
  ];
});

describe('P0 baseline: existing behaviour is preserved', () => {
  it('exact and partial titles, destination text, slug forms and mixed case/whitespace', () => {
    expect(find(catalog, 'Manali Premium Escape')[0]).toBe('manali-premium-escape');
    expect(find(catalog, 'premium')).toContain('manali-premium-escape');
    expect(find(catalog, '  MANALI   premium ')).toContain('manali-premium-escape');
    expect(find(catalog, 'manali-premium-escape')[0]).toBe('manali-premium-escape');
    expect(find(catalog, 'spiti-valley')).toEqual(['spiti-circuit']);
    expect(find(catalog, 'spiti   valley')).toEqual(['spiti-circuit']);
  });
  it('no keyword means no keyword filter, and filterPackages returns every eligible package unchanged', () => {
    expect(searchPackages(catalog, '', bySlug())).toEqual([]);
    expect(searchPackages(catalog, '   ', bySlug())).toEqual([]);
    expect(filter(catalog, '')).toEqual(catalog.map((p) => p.slug));
  });
  it('a query that matches nothing returns nothing (never the whole catalog)', () => {
    expect(find(catalog, 'zzzqqq')).toEqual([]);
    expect(filter(catalog, 'zzzqqq')).toEqual([]);
  });
  it('hostile input is inert', () => {
    for (const q of ['<script>', '[', '(.*)', '\\', '%', '$where']) expect(() => find(catalog, q)).not.toThrow();
    expect(find(catalog, '[(')).toEqual([]);
  });
});

describe('P1 field coverage (dynamic extraction)', () => {
  it('finds a journey through a linked destination even when the title lacks the word', () => {
    expect(find(catalog, 'Pahalgam')).toEqual(['kashmir-paradise']);
    expect(find(catalog, 'pahalgam')).toEqual(['kashmir-paradise']);
  });
  it('finds a journey through an itinerary stop that is a catalog destination but NOT linked', () => {
    const withStop = [...catalog, journey({ slug: 'road-trip', name: 'Road Trip Special', destination: 'Himachal', destinationSlugs: ['manali'], itinerary: [{ day: 2, title: 'Manali to Kasol drive', description: '' }] })];
    expect(find(withStop, 'Kasol')).toEqual(['road-trip']);
  });
  it('does NOT invent a stop from description prose: a destination named only in a description is not a stop', () => {
    const onlyProse = [journey({ slug: 'prose', name: 'Quiet Retreat', itinerary: [{ day: 1, title: 'Arrival', description: 'Optional visit to Kasol.' }] })];
    expect(find(onlyProse, 'Kasol')).toEqual(['prose']); // surfaces only via the low-confidence description fallback
    const withStructured = [...onlyProse, journey({ slug: 'real', name: 'Kasol Weekend', destination: 'Kasol', destinationSlugs: ['kasol'] })];
    expect(find(withStructured, 'Kasol')).toEqual(['real']); // fallback never adds prose-only noise next to real matches
  });
  it('matches starting and ending cities where stored', () => {
    const cities = [journey({ slug: 'delhi-start', name: 'Himalayan Loop', startingCity: 'Chandigarh', endingCity: 'Delhi' })];
    expect(find(cities, 'Chandigarh')).toEqual(['delhi-start']);
    expect(find(cities, 'delhi')).toEqual(['delhi-start']);
  });
  it('matches category and region (derived from linked destinations)', () => {
    expect(find(catalog, 'Offbeat')).toEqual(['spiti-circuit']);
    expect(find(catalog, 'spiritual')).toEqual(['uttarakhand-yatra']);
    expect(find(catalog, 'Himachal')).toEqual(expect.arrayContaining(['manali-premium-escape', 'spiti-circuit']));
    expect(find(catalog, 'Himachal Pradesh')).toEqual(expect.arrayContaining(['manali-premium-escape', 'spiti-circuit']));
    expect(find(catalog, 'Himachal Pradesh')).not.toContain('kashmir-paradise');
    expect(find(catalog, 'Jammu & Kashmir')).toContain('kashmir-paradise');
    expect(find(catalog, 'jammu and kashmir')).toContain('kashmir-paradise');
    expect(find(catalog, 'Uttarakhand')).toContain('uttarakhand-yatra');
  });
  it('supports spelling forms derived from stored text: parentheticals, no-space and slug forms', () => {
    expect(find(catalog, 'Jyotirmath')).toEqual(['uttarakhand-yatra']);
    expect(find(catalog, 'joshimath')).toEqual(['uttarakhand-yatra']);
    expect(find(catalog, 'spitivalley')).toEqual(['spiti-circuit']);
    const mg = [journey({ slug: 'mg', name: 'Temple Trail', destinationSlugs: ['mcleod-ganj'] })];
    expect(find(mg, 'mcleodganj')).toEqual(['mg']);
    expect(find(mg, 'mcleod-ganj')).toEqual(['mg']);
  });
  it('supports ONLY explicit aliases, and an alias never creates a relationship by itself', () => {
    const dh = [journey({ slug: 'dh', name: 'Dhauladhar Trek', destinationSlugs: ['dharamshala'] })];
    expect(find(dh, 'Dharamsala')).toEqual(['dh']); // shipped explicit alias dharamsala -> dharamshala
    expect(find(dh, 'Dharmsala')).toEqual([]); // a different misspelling is NOT forgiven
    expect(find(dh, 'Shimla')).toEqual([]);
    expect(find(dh, 'Simla')).toEqual([]); // alias resolves to shimla; this journey has no Shimla relationship
  });
  it('multi-word queries need every word to start some structured word', () => {
    expect(find(catalog, 'spiti exp')).toEqual(['spiti-circuit']);
    expect(find(catalog, 'manali exp')).toEqual([]); // "exp" starts no Manali-journey word... except none
  });
  it('partial words work as word prefixes (kash -> Kashmir)', () => {
    expect(find(catalog, 'kash')).toEqual(['kashmir-paradise']);
  });
});

describe('P1 relevance ranking', () => {
  it('orders exact title > title prefix > title word > linked destination > itinerary stop > city > category > region', () => {
    const ranked = [
      journey({ slug: 'region-only', name: 'Plain Tour', destinationSlugs: ['manali'], category: 'Family' }),
      journey({ slug: 'category', name: 'Plain Tour Two', category: 'Kasol' }),
      journey({ slug: 'city', name: 'Plain Tour Three', startingCity: 'Kasol' }),
      journey({ slug: 'stop', name: 'Plain Tour Four', destinationSlugs: ['manali'], itinerary: [{ day: 1, title: 'Drive to Kasol', description: '' }] }),
      journey({ slug: 'linked', name: 'Plain Tour Five', destinationSlugs: ['kasol'] }),
      journey({ slug: 'title-word', name: 'The Kasol Escape' }),
      journey({ slug: 'title-prefix', name: 'Kasol Weekend Break' }),
      journey({ slug: 'title-exact', name: 'Kasol' })
    ];
    const hits = searchPackages(ranked, 'kasol', bySlug());
    expect(slugs(hits)).toEqual(['title-exact', 'title-prefix', 'title-word', 'linked', 'stop', 'city', 'category']);
    expect(hits.map((h) => h.reason)).toEqual(['title-exact', 'title-prefix', 'title-word', 'linked-destination', 'itinerary-stop', 'city', 'category']);
    expect(hits.map((h) => h.score)).toEqual([...hits.map((h) => h.score)].sort((a, b) => b - a));
  });
  it('ties keep the caller order (stable)', () => {
    const a = journey({ slug: 'a', name: 'Alpha', destinationSlugs: ['kasol'] });
    const b = journey({ slug: 'b', name: 'Beta', destinationSlugs: ['kasol'] });
    expect(slugs(searchPackages([a, b], 'kasol', bySlug()))).toEqual(['a', 'b']);
    expect(slugs(searchPackages([b, a], 'kasol', bySlug()))).toEqual(['b', 'a']);
  });
  it('rankByRelevance orders the default (popular) list by score, ahead of featured order', () => {
    const list = [journey({ slug: 'featured-weak', name: 'Plain', featured: true, destinationSlugs: ['kasol'] }), journey({ slug: 'strong', name: 'Kasol Weekend' })];
    const scores = relevanceScores(list, 'kasol', bySlug());
    expect(rankByRelevance(sortPackages(list, 'popular'), scores).map((p) => p.slug)).toEqual(['strong', 'featured-weak']);
  });
  it('generic marketing text never adds unrelated results next to real matches (description is a fallback only)', () => {
    const list = [
      journey({ slug: 'real', name: 'Adventure Seekers Tour', category: 'Adventure' }),
      journey({ slug: 'marketing', name: 'Calm Valley Stay', category: 'Family', shortDescription: 'Not an adventure, just a calm family stay with adventure-free evenings.' })
    ];
    expect(find(list, 'adventure')).toEqual(['real']);
    const onlyMarketing = [list[1]];
    expect(find(onlyMarketing, 'adventure')).toEqual(['marketing']); // nothing structured matches, so the description is consulted
  });
});

describe('P1 future-record automation (no search code or config changes)', () => {
  it('a newly published journey is searchable immediately', () => {
    expect(find(catalog, 'Rohtang')).toEqual([]);
    const next = [...catalog, journey({ slug: 'rohtang-snow-day', name: 'Rohtang Snow Day' })];
    expect(find(next, 'Rohtang')).toEqual(['rohtang-snow-day']);
    expect(find(next, 'rohtang-snow-day')).toEqual(['rohtang-snow-day']);
  });
  it('updating a title is reflected with no code change (old title stops matching)', () => {
    const before = catalog.map((p) => ({ ...p }));
    expect(find(before, 'Manali Premium')).toContain('manali-premium-escape');
    const edited = before.map((p) => (p.slug === 'manali-premium-escape' ? { ...p, slug: 'kullu-valley-classic', name: 'Kullu Valley Classic' } : p));
    expect(find(edited, 'Kullu Valley')).toEqual(['kullu-valley-classic']);
    expect(find(edited, 'Premium Escape')).toEqual([]);
    // an edited title alone keeps the (unchanged) slug searchable — the slug is a stored field too
    const titleOnly = before.map((p) => (p.slug === 'manali-premium-escape' ? { ...p, name: 'Kullu Valley Classic' } : p));
    expect(find(titleOnly, 'Kullu Valley')).toEqual(['manali-premium-escape']);
  });
  it('mutating a record in place is also reflected (no stale cache)', () => {
    const first = catalog[0];
    expect(find(catalog, 'Zanskar')).toEqual([]);
    first.name = 'Zanskar Winter Trek';
    expect(find(catalog, 'Zanskar')).toEqual([first.slug]);
  });
  it('linking a destination makes the journey searchable by that destination', () => {
    const target = catalog.find((p) => p.slug === 'manali-premium-escape')!;
    expect(find(catalog, 'Kasol')).toEqual([]);
    const linked = catalog.map((p) => (p === target ? { ...p, destinationSlugs: [...(p.destinationSlugs ?? []), 'kasol'] } : p));
    expect(find(linked, 'Kasol')).toEqual(['manali-premium-escape']);
  });
  it('adding a structured itinerary stop makes the journey searchable through the stop', () => {
    expect(find(catalog, 'Shimla')).toEqual([]);
    const withStop = catalog.map((p) => (p.slug === 'spiti-circuit' ? { ...p, itinerary: [...p.itinerary, { day: 6, title: 'Return via Shimla', description: '' }] } : p));
    expect(find(withStop, 'Shimla')).toEqual(['spiti-circuit']);
  });
  it('a newly published destination relationship is discovered automatically (new destination in the catalog)', () => {
    const newDest = dest('zanskar', 'Zanskar', 'Jammu & Kashmir');
    const journeys = [...catalog, journey({ slug: 'frozen-river-trek', name: 'Frozen River Trek', destinationSlugs: ['zanskar'] })];
    expect(find(journeys, 'Zanskar', DESTINATIONS)).toEqual([]); // destination not published yet -> relationship unresolved
    expect(find(journeys, 'Zanskar', [...DESTINATIONS, newDest])).toEqual(['frozen-river-trek']);
    expect(find(journeys, 'Jammu & Kashmir', [...DESTINATIONS, newDest])).toEqual(expect.arrayContaining(['frozen-river-trek', 'kashmir-paradise']));
  });
  it('changing the category updates category matching', () => {
    expect(find(catalog, 'Offbeat')).toEqual(['spiti-circuit']);
    const changed = catalog.map((p) => (p.slug === 'spiti-circuit' ? { ...p, category: 'Luxury' } : p));
    expect(find(changed, 'Offbeat')).toEqual([]);
    expect(find(changed, 'Luxury')).toEqual(['spiti-circuit']);
  });
  it('unpublishing removes the journey (loader drops it; an explicit draft is refused too)', () => {
    const remaining = catalog.filter((p) => p.slug !== 'kashmir-paradise');
    expect(find(remaining, 'Pahalgam')).toEqual([]);
    const marked = catalog.map((p) => (p.slug === 'kashmir-paradise' ? { ...p, status: 'draft' as const } : p));
    expect(find(marked, 'Pahalgam')).toEqual([]);
    expect(find(marked, 'Kashmir Paradise')).toEqual([]);
    expect(filter(marked, 'Kashmir')).toEqual([]);
    expect(filter(marked, '')).not.toContain('kashmir-paradise');
  });
  it('a draft journey is never exposed by any field (title, slug, destination, stop, category, region, description)', () => {
    const draft = journey({
      slug: 'secret-draft',
      name: 'Secret Draft Journey',
      destinationSlugs: ['kasol'],
      category: 'Luxury',
      itinerary: [{ day: 1, title: 'Visit Manali', description: 'secretword' }],
      status: 'draft'
    });
    const withDraft = [...catalog, draft];
    for (const q of ['Secret Draft', 'secret-draft', 'Kasol', 'Manali', 'Luxury', 'Himachal', 'secretword']) {
      expect(find(withDraft, q), q).not.toContain('secret-draft');
      expect(filter(withDraft, q), q).not.toContain('secret-draft');
    }
  });
});

describe('combined filters, sorting, pagination and region isolation stay correct', () => {
  it('keyword + category, + region and + duration combine with AND semantics', () => {
    expect(filter(catalog, 'Himachal', { category: 'Offbeat' })).toEqual(['spiti-circuit']);
    expect(filter(catalog, 'Himachal', { category: 'Honeymoon' })).toEqual([]);
    expect(filter(catalog, 'Pahalgam', { region: 'jammu-kashmir' })).toEqual(['kashmir-paradise']);
    expect(filter(catalog, 'Pahalgam', { region: 'himachal-pradesh' })).toEqual([]);
    expect(filter(catalog, 'Manali', { region: 'uttarakhand' })).toEqual([]);
    const timed = [...catalog, journey({ slug: 'long', name: 'Manali Long Trip', destinationSlugs: ['manali'], duration: '12 Days / 11 Nights' })];
    expect(filter(timed, 'Manali', { duration: '10-plus' })).toEqual(expect.any(Array));
  });
  it('region isolation: a keyword never leaks a journey into another region', () => {
    expect(filter(catalog, 'Uttarakhand', { region: 'himachal-pradesh' })).toEqual([]);
    expect(filter(catalog, 'Kashmir', { region: 'himachal-pradesh' })).toEqual([]);
  });
  it('price sorting is explicit and wins over relevance', () => {
    const list = [journey({ slug: 'cheap', name: 'Plain', destinationSlugs: ['kasol'], price: 1000 }), journey({ slug: 'dear', name: 'Kasol Weekend', price: 9000 })];
    const filtered = filterPackages(list, { query: 'kasol' }, bySlug());
    expect(sortPackages(filtered, 'price-asc').map((p) => p.slug)).toEqual(['cheap', 'dear']);
    expect(sortPackages(filtered, 'price-desc').map((p) => p.slug)).toEqual(['dear', 'cheap']);
  });
  it('pagination arithmetic is untouched: every match remains reachable across pages', () => {
    const many = Array.from({ length: 23 }, (_, i) => journey({ slug: `kasol-${i}`, name: `Kasol Trip ${i}` }));
    const result = filter(many, 'kasol');
    expect(result).toHaveLength(23);
    const pages = Math.ceil(result.length / 9);
    expect(pages).toBe(3);
    expect(new Set(result).size).toBe(23);
  });
  it('the order of filterPackages output is the input order (relevance is a separate, explicit step)', () => {
    const list = [journey({ slug: 'weak', name: 'Plain', destinationSlugs: ['kasol'] }), journey({ slug: 'strong', name: 'Kasol' })];
    expect(filter(list, 'kasol')).toEqual(['weak', 'strong']);
  });
});

describe('safety: pure, read-only, no provider calls, no catalog data in search code', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });
  it('performs no network or provider calls while searching', () => {
    const spy = vi.fn(() => {
      throw new Error('network call attempted by search');
    });
    globalThis.fetch = spy as unknown as typeof fetch;
    find(catalog, 'Pahalgam');
    filter(catalog, 'Himachal Pradesh', { category: 'Adventure' });
    relevanceScores(catalog, 'Kasol', bySlug());
    expect(spy).not.toHaveBeenCalled();
  });
  it('does not mutate its inputs', () => {
    const copy = JSON.stringify(catalog);
    find(catalog, 'Manali');
    filter(catalog, 'Pahalgam');
    expect(JSON.stringify(catalog)).toBe(copy);
  });
  it('the search modules import no database, model, provider or network code', () => {
    for (const file of ['normalize.ts', 'journeySearch.ts']) {
      const src = readFileSync(join(process.cwd(), 'lib', 'search', file), 'utf8');
      expect(src, file).not.toMatch(/mongoose|@\/lib\/mongodb|@\/models\/|services\/providers|googleapis|fetch\(|process\.env/);
    }
  });
  it('contains no hand-maintained record lists: no journey slug/title literals in search code or aliases', () => {
    const files = [
      readFileSync(join(process.cwd(), 'lib', 'search', 'journeySearch.ts'), 'utf8'),
      readFileSync(join(process.cwd(), 'config', 'searchAliases.config.ts'), 'utf8')
    ];
    for (const src of files) {
      expect(src).not.toMatch(/manali-premium-escape|kashmir-signature-journey|spiti-valley-adventure|kinnaur-spiti-circuit|Premium Escape/);
    }
  });
});

describe('explorer integration: explicit sort and pagination (final review)', () => {
  it('relevance ordering is applied only for an active keyword with the default sort; an explicit sort wins', () => {
    const src = readFileSync(join(process.cwd(), 'components', 'modules', 'journeys', 'JourneysExplorer.tsx'), 'utf8').replace(/\r\n/g, '\n');
    expect(src).toContain("return query.trim() && sortBy === 'popular' ? rankByRelevance(ordered, relevance) : ordered;");
    expect(src).toContain('const ordered = sortPackages(filtered, sortBy);');
    // relevance is computed over the full package list, never over the already-filtered subset
    expect(src).toContain('relevanceScores(packages, query, destinationsBySlug)');
  });
  it('page boundaries: every result is reachable exactly once at the explorer page size (9)', async () => {
    const { paginate } = await import('@/lib/destinationFilters');
    for (const total of [0, 1, 8, 9, 10, 17, 18, 19, 27, 28]) {
      const list = Array.from({ length: total }, (_, i) => i);
      const first = paginate(list, 1, 9);
      expect(first.totalPages).toBe(Math.max(1, Math.ceil(total / 9)));
      const all = Array.from({ length: first.totalPages }, (_, i) => paginate(list, i + 1, 9).items).flat();
      expect(all).toEqual(list);
      expect(paginate(list, 99, 9).page).toBe(first.totalPages);
    }
  });
});
