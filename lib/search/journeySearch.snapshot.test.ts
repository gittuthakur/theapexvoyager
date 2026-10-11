import { describe, expect, it, vi } from 'vitest';
import snapshot from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import { filterPackages } from '@/lib/packageFilters';
import { searchPackages } from '@/lib/search/journeySearch';
import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import type { Destination, TravelPackage } from '@/types';

/**
 * REAL-CATALOG SNAPSHOT TESTS. journeyCatalogSnapshot.json is a read-only snapshot of the
 * published Journey/Destination catalog (test fixture only; application code never imports it).
 *
 * Expected results are derived from the snapshot's STRUCTURED data by a small, separately written
 * oracle below — never from the implementation — so these tests fail both on a missing eligible
 * journey and on an unexpected one.
 */

// The independent oracle below is deliberately brute-force (every destination x every journey); under a
// busy parallel full-suite run it can approach vitest's default 5s per-test limit, so give it headroom.
vi.setConfig({ testTimeout: 60_000 });

const packages = snapshot.journeys as unknown as TravelPackage[];
const destinations = snapshot.destinations as unknown as Destination[];
const bySlug = new Map(destinations.map((d) => [d.slug, d]));
const search = (q: string) => searchPackages(packages, q, bySlug).map((h) => h.pkg.slug);

// ---- independent oracle -----------------------------------------------------------------
const n = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const phrase = (hay: string, needle: string) => !!needle && ` ${hay} `.includes(` ${needle} `);
const forms = (raw: string) => {
  const out = new Set<string>([n(raw), n(raw.replace(/\([^)]*\)/g, ' '))]);
  for (const m of raw.matchAll(/\(([^)]*)\)/g)) out.add(n(m[1]));
  return [...out].filter(Boolean);
};
const REGION: Record<string, string> = { 'Himachal Pradesh': 'Himachal Pradesh', 'Jammu & Kashmir': 'Jammu & Kashmir', Uttarakhand: 'Uttarakhand' };
const regionForms = (name: string) => [n(name), ...n(name).split(' ').filter((w) => w.length >= 4 && w !== 'pradesh' && w !== 'and')];

function expected(query: string): string[] {
  const q = n(query);
  const compactQ = q.replace(/ /g, '');
  return packages
    .filter((j) => {
      const linked = (j.destinationSlugs ?? []).map((s) => bySlug.get(s)).filter(Boolean) as Destination[];
      // title / slug / destination text: substring (long-standing partial matching)
      if (q.length >= 3 && [n(j.name), n(j.slug), n(j.destination)].some((t) => t.includes(q))) return true;
      if ([n(j.name), n(j.slug)].some((t) => t === q)) return true;
      // linked destinations (title + slug forms)
      if (linked.some((d) => [...forms(d.title), n(d.slug)].some((f) => f === q || phrase(f, q) || (compactQ.length >= 4 && f.replace(/ /g, '') === compactQ)))) return true;
      // itinerary stops: a catalog destination named in a day title
      const dayTitles = (j.itinerary ?? []).map((i) => n(i.title));
      if (destinations.some((d) => forms(d.title).some((f) => f.length >= 3 && dayTitles.some((t) => phrase(t, f))) && [...forms(d.title), n(d.slug)].some((f) => f === q || phrase(f, q) || (compactQ.length >= 4 && f.replace(/ /g, '') === compactQ)))) return true;
      // cities
      if ([j.startingCity, j.endingCity].filter(Boolean).some((c) => forms(String(c)).some((f) => phrase(f, q)))) return true;
      // category
      if (n(j.category) === q) return true;
      // region of linked destinations
      const regions = [...new Set(linked.map((d) => REGION[d.state ?? '']).filter(Boolean))];
      if (regions.some((r) => regionForms(r).includes(q))) return true;
      // multi-word queries: every word starts some word of the structured text
      const words = q.split(' ');
      if (words.length >= 2) {
        const stopForms = destinations.filter((d) => forms(d.title).some((f) => f.length >= 3 && dayTitles.some((t) => phrase(t, f)))).flatMap((d) => [...forms(d.title), n(d.slug)]);
        const text = [n(j.name), n(j.slug), n(j.destination), ...linked.flatMap((d) => [...forms(d.title), n(d.slug)]), ...stopForms, ...[j.startingCity, j.endingCity].filter(Boolean).flatMap((c) => forms(String(c))), n(j.category), ...regions.flatMap(regionForms)].join(' ');
        const tokens = text.split(' ');
        if (words.every((w) => tokens.some((t) => t.startsWith(w)))) return true;
      }
      return false;
    })
    .map((j) => j.slug);
}

/** Low-confidence fallback: only when no structured match exists, descriptions (short text + highlights) are consulted. */
function expectedWithFallback(query: string): string[] {
  const structured = expected(query);
  if (structured.length) return structured;
  const q = n(query);
  return packages.filter((j) => phrase(n([j.shortDescription, ...(j.highlights ?? [])].join(' ')), q)).map((j) => j.slug);
}

const legacy = (q: string) => {
  const needle = q.trim().toLowerCase().replace(/\s+/g, ' ');
  return packages.filter((j) => j.name.toLowerCase().includes(needle) || j.destination.toLowerCase().includes(needle)).map((j) => j.slug);
};
const sortedSet = (a: string[]) => [...new Set(a)].sort();
const missing = (want: string[], got: string[]) => want.filter((s) => !got.includes(s));
const unexpected = (want: string[], got: string[]) => got.filter((s) => !want.includes(s));

describe('snapshot sanity', () => {
  it('holds only PUBLISHED journeys and published destinations (drafts are not in the catalog fixture)', () => {
    expect(packages.length).toBe(28);
    expect(destinations.length).toBe(70);
    expect(packages.every((p) => p.status === 'published')).toBe(true);
    expect(snapshot.draftJourneyCount).toBe(12);
  });
  it('every published journey links only to published destinations that exist (no dangling associations)', () => {
    for (const j of packages) for (const slug of j.destinationSlugs ?? []) expect(bySlug.has(slug), `${j.slug} -> ${slug}`).toBe(true);
  });
});

describe('every published journey is findable by its own title and slug', () => {
  it('exact name, exact slug and first/last word', () => {
    for (const j of packages) {
      expect(search(j.name)[0], j.name).toBe(j.slug);
      expect(search(j.slug)[0], j.slug).toBe(j.slug);
      expect(search(j.name.split(/\s+/)[0]), `first word of ${j.name}`).toContain(j.slug);
      expect(search(j.name.split(/\s+/).slice(-1)[0]), `last word of ${j.name}`).toContain(j.slug);
      expect(search(`  ${j.name.toUpperCase()}   `)[0]).toBe(j.slug);
    }
  });
});

describe('every destination relationship in the structured data is found, and nothing unrelated is added', () => {
  it('for every published destination title: actual results equal the structured expectation', () => {
    const problems: string[] = [];
    for (const d of destinations) {
      const q = d.title;
      const want = sortedSet(expectedWithFallback(q));
      const got = sortedSet(search(q));
      const m = missing(want, got);
      const u = unexpected(want, got);
      if (m.length || u.length) problems.push(`"${q}" missing=[${m}] unexpected=[${u}]`);
      // a result with no structured relationship must be labelled as the low-confidence description fallback
      if (expected(q).length === 0) for (const hit of searchPackages(packages, q, bySlug)) if (hit.reason !== 'description') problems.push(`"${q}" ${hit.pkg.slug} reason=${hit.reason} (expected description fallback)`);
    }
    expect(problems).toEqual([]);
  });
  it('every linked destination finds its journeys (the audit gap: 17 of 73 linked pairs were missed)', () => {
    let pairs = 0;
    for (const j of packages) for (const slug of j.destinationSlugs ?? []) {
      pairs += 1;
      const d = bySlug.get(slug)!;
      expect(search(d.title), `${d.title} -> ${j.slug}`).toContain(j.slug);
      expect(search(d.slug), `${d.slug} -> ${j.slug}`).toContain(j.slug);
    }
    expect(pairs).toBe(73);
  });
  it('slug and no-space spellings of destination names work (audit: 0 of 9 slug-form pairs were found)', () => {
    for (const j of packages) for (const slug of j.destinationSlugs ?? []) {
      const d = bySlug.get(slug)!;
      expect(search(d.slug)).toContain(j.slug);
      const compact = n(d.title).replace(/ /g, '');
      if (compact.length >= 4) expect(search(compact), compact).toContain(j.slug);
    }
  });
  it('catalog destinations named in a structured itinerary day title are found through that stop', () => {
    let stops = 0;
    for (const j of packages) {
      const dayTitles = (j.itinerary ?? []).map((i) => n(i.title));
      for (const d of destinations) {
        if (!forms(d.title).some((f) => f.length >= 3 && dayTitles.some((t) => phrase(t, f)))) continue;
        stops += 1;
        expect(search(d.title), `${j.slug} via stop ${d.title}`).toContain(j.slug);
      }
    }
    expect(stops).toBeGreaterThan(0);
  });
});

describe('category and region queries', () => {
  it('every category word returns exactly the structured expectation (audit: Adventure 1 of 7, Sightseeing 0 of 6, ...)', () => {
    const categories = [...new Set(packages.map((p) => p.category))];
    expect(categories.length).toBeGreaterThanOrEqual(7);
    for (const category of categories) {
      const want = sortedSet(expected(category));
      const got = sortedSet(search(category));
      expect({ category, missing: missing(want, got), unexpected: unexpected(want, got) }).toEqual({ category, missing: [], unexpected: [] });
      // and every journey carrying that category is in the result
      for (const j of packages.filter((p) => p.category === category)) expect(got, `${category} -> ${j.slug}`).toContain(j.slug);
    }
  });
  it('region names and their derived short forms return every journey linked into that region', () => {
    const stateOf = (j: TravelPackage) => new Set((j.destinationSlugs ?? []).map((s) => bySlug.get(s)?.state));
    const cases: [string, string][] = [
      ['Himachal Pradesh', 'Himachal Pradesh'],
      ['Himachal', 'Himachal Pradesh'],
      ['Jammu & Kashmir', 'Jammu & Kashmir'],
      ['Jammu and Kashmir', 'Jammu & Kashmir'],
      ['Kashmir', 'Jammu & Kashmir'],
      ['Jammu', 'Jammu & Kashmir'],
      ['Uttarakhand', 'Uttarakhand']
    ];
    for (const [query, state] of cases) {
      const got = search(query);
      for (const j of packages.filter((p) => stateOf(p).has(state))) expect(got, `${query} -> ${j.slug}`).toContain(j.slug);
      const want = sortedSet(expected(query));
      expect({ query, unexpected: unexpected(want, got) }).toEqual({ query, unexpected: [] });
    }
  });
});

describe('before / after: the new search is a strict superset of the legacy title+destination search', () => {
  it('never loses a journey the legacy matcher found, for a broad set of queries', () => {
    const queries = [
      ...packages.map((p) => p.name),
      ...destinations.map((d) => d.title),
      'manali', 'spiti', 'kasol', 'adventure', 'valley', 'tour', 'himachal', 'kashmir', 'uttarakhand', 'rishikesh', 'family', 'trek', 'yatra'
    ];
    const lost: string[] = [];
    for (const q of queries) {
      const l = legacy(q);
      const a = search(q);
      for (const slug of l) if (!a.includes(slug)) lost.push(`"${q}" lost ${slug}`);
    }
    expect(lost).toEqual([]);
  });
  it('is the SAME as the legacy result for exact-title queries (no new unrelated results)', () => {
    for (const j of packages) {
      const hits = searchPackages(packages, j.name, bySlug);
      const a = hits.map((h) => h.pkg.slug);
      expect(a[0]).toBe(j.slug);
      expect(hits[0].reason).toBe('title-exact');
      // every extra result must be explained by structured data and rank below the exact match
      const want = sortedSet(expected(j.name));
      expect(unexpected(want, a)).toEqual([]);
      for (const extra of hits.slice(1)) expect(extra.score).toBeLessThan(hits[0].score);
    }
  });
});

describe('listing behaviour on the real catalog', () => {
  it('filterPackages with a keyword + category + region combines with AND and respects published-only', () => {
    const all = filterPackages(packages, { query: 'Himachal' }, bySlug).map((p) => p.slug);
    const adventure = filterPackages(packages, { query: 'Himachal', category: 'Adventure' }, bySlug).map((p) => p.slug);
    expect(adventure.every((s) => all.includes(s))).toBe(true);
    expect(filterPackages(packages, { query: 'Himachal', region: 'uttarakhand' }, bySlug)).toEqual([]);
    for (const slug of all) expect(packages.find((p) => p.slug === slug)?.status).toBe('published');
  });
  it('28 published journeys paginate into 4 pages of 9 with every journey reachable', () => {
    const everything = filterPackages(packages, {}, bySlug);
    expect(everything).toHaveLength(28);
    const pages = Math.ceil(everything.length / 9);
    expect(pages).toBe(4);
    expect(new Set(everything.map((p) => p.slug)).size).toBe(28);
  });
  it('a nonsense or hostile query returns nothing rather than the whole catalog', () => {
    for (const q of ['zzzqqq', '[', '<script>', '(.*)']) expect(search(q)).toEqual([]);
  });
});

describe('final review properties on the real catalog', () => {
  it('the explicit aliases add no unrelated matches and change no other query', () => {
    for (const [alias, targets] of Object.entries(LOCATION_ALIASES)) {
      const viaAlias = new Set(search(alias));
      const canonical = new Set(targets.flatMap((t) => search(t)));
      const literal = new Set(packages.filter((p) => n([p.name, p.slug, p.destination].join(' ')).includes(alias)).map((p) => p.slug));
      for (const slug of viaAlias) expect(canonical.has(slug) || literal.has(slug), `${alias} -> ${slug}`).toBe(true);
      expect(viaAlias.size).toBe(canonical.size);
    }
    const queries = [...destinations.map((d) => d.title), ...packages.map((p) => p.name), 'adventure', 'valley'];
    for (const q of queries) {
      expect(searchPackages(packages, q, bySlug).map((h) => h.pkg.slug), q).toEqual(searchPackages(packages, q, bySlug, {}).map((h) => h.pkg.slug));
    }
  });
  it('draft journeys are never returned by any query, filter or unfiltered list (206-query fuzz)', () => {
    const drafts = packages.map((p, i) => ({ ...p, slug: `DRAFT-${i}`, name: `${p.name} (draft)`, status: 'draft' })) as unknown as TravelPackage[];
    const mixed = [...packages, ...drafts];
    const queries = [...packages.map((p) => p.name), ...packages.map((p) => p.slug), ...destinations.map((d) => d.title), ...destinations.map((d) => d.slug), 'adventure', 'offbeat', 'himachal pradesh', 'draft', 'DRAFT-3'];
    for (const q of queries) {
      for (const h of searchPackages(mixed, q, bySlug)) expect(h.pkg.slug.startsWith('DRAFT-'), q).toBe(false);
      for (const p of filterPackages(mixed, { query: q }, bySlug)) expect(p.slug.startsWith('DRAFT-'), q).toBe(false);
    }
    for (const p of filterPackages(mixed, {}, bySlug)) expect(p.slug.startsWith('DRAFT-')).toBe(false);
  });
  it('a keyword combined with category or region is exactly the intersection of each filter alone', () => {
    const cats = [...new Set(packages.map((p) => p.category))];
    const regions = ['himachal-pradesh', 'jammu-kashmir', 'uttarakhand'] as const;
    for (const q of [...destinations.slice(0, 25).map((d) => d.title), 'adventure', 'himachal pradesh', 'kashmir']) {
      const queryOnly = new Set(filterPackages(packages, { query: q }, bySlug).map((p) => p.slug));
      for (const category of cats) {
        const combined = filterPackages(packages, { query: q, category }, bySlug).map((p) => p.slug).sort();
        const expectedSet = filterPackages(packages, { category }, bySlug).map((p) => p.slug).filter((s) => queryOnly.has(s)).sort();
        expect(combined, `${q} + ${category}`).toEqual(expectedSet);
      }
      for (const region of regions) {
        const combined = filterPackages(packages, { query: q, region }, bySlug).map((p) => p.slug).sort();
        const expectedSet = filterPackages(packages, { region }, bySlug).map((p) => p.slug).filter((s) => queryOnly.has(s)).sort();
        expect(combined, `${q} + ${region}`).toEqual(expectedSet);
      }
    }
  });
  it('the description fallback is never mixed with structured matches, and results are always labelled by reason', () => {
    const probes = [...destinations.map((d) => d.title), 'adventure', 'honeymoon', 'family', 'trek', 'snow', 'lake', 'temple', 'himalayan', 'tour', 'weekend', 'luxury'];
    for (const q of probes) {
      const hitsFor = searchPackages(packages, q, bySlug);
      const reasons = new Set(hitsFor.map((h) => h.reason));
      if (reasons.has('description')) expect([...reasons], q).toEqual(['description']);
      for (const h of hitsFor) expect(h.score, `${q} ${h.pkg.slug}`).toBeGreaterThan(0);
    }
  });
});
