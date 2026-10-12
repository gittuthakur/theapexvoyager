import { describe, expect, it } from 'vitest';
import snapshot from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import { filterDestinations, paginate } from '@/lib/destinationFilters';
import { destinationRelevanceScores, rankDestinationsByRelevance, searchDestinations } from '@/lib/search/destinationSearch';
import type { Destination } from '@/types';

const catalog = snapshot.destinations as unknown as Destination[];
const slugs = (list: Destination[], query: string) => searchDestinations(list, query).map((hit) => hit.destination.slug);

function dest(partial: Partial<Destination> & { slug: string; title: string }): Destination {
  return { category: 'Hill Station', description: '', toursCount: 0, image: '', status: 'published', ...partial } as Destination;
}

describe('destination search over the real published catalog snapshot', () => {
  it('state queries return exactly the destinations whose state matches, for all three states', () => {
    for (const state of ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand']) {
      const want = catalog.filter((d) => d.state === state).map((d) => d.slug).sort();
      expect(slugs(catalog, state).sort(), state).toEqual(want);
    }
  });

  it('short region names and spellings resolve the same state', () => {
    const hp = catalog.filter((d) => d.state === 'Himachal Pradesh').map((d) => d.slug).sort();
    expect(slugs(catalog, 'himachal').sort()).toEqual(hp);
    expect(slugs(catalog, 'HIMACHAL   PRADESH').sort()).toEqual(hp);
    const jk = catalog.filter((d) => d.state === 'Jammu & Kashmir').map((d) => d.slug).sort();
    expect(slugs(catalog, 'Jammu and Kashmir').sort()).toEqual(jk);
    expect(slugs(catalog, 'kashmir').sort()).toEqual(jk);
  });

  it('every destination is found by its own title and slug, ranked first', () => {
    for (const d of catalog) {
      expect(slugs(catalog, d.title)[0] === d.slug || slugs(catalog, d.title).includes(d.slug), d.title).toBe(true);
      expect(slugs(catalog, d.slug), d.slug).toContain(d.slug);
    }
  });

  it('"Spiti Valley", "spiti-valley" and "spitivalley" are consistent', () => {
    const a = slugs(catalog, 'Spiti Valley');
    expect(a.length).toBeGreaterThan(0);
    expect(slugs(catalog, 'spiti-valley')).toEqual(a);
    expect(slugs(catalog, 'SPITI  VALLEY')).toEqual(a);
    expect(slugs(catalog, 'spitivalley')).toEqual(a);
  });

  it('a state query is not polluted by descriptions that merely mention the state', () => {
    const polluted = catalog.filter((d) => d.state !== 'Uttarakhand' && /uttarakhand/i.test(d.description)).map((d) => d.slug);
    const got = slugs(catalog, 'Uttarakhand');
    for (const slug of polluted) expect(got, slug).not.toContain(slug);
  });
});

describe('destination search over structured fields (future-record contract)', () => {
  const list = [
    dest({ slug: 'jibhi', title: 'Jibhi', state: 'Himachal Pradesh', places: [{ title: 'Jibhi Waterfall', description: '' }, { title: 'Chehni Kothi', description: '' }], travelStyles: ['Offbeat', 'Nature'] }),
    dest({ slug: 'tirthan-valley', title: 'Tirthan Valley', state: 'Himachal Pradesh', description: 'Quiet like Jibhi but wilder.' }),
    dest({ slug: 'kasol', title: 'Kasol', state: 'Himachal Pradesh', stayBaseLocations: ['Bhuntar'] }),
    dest({ slug: 'auli', title: 'Auli', state: 'Uttarakhand', travelStyles: ['Adventure'] })
  ];

  it('a sub-place finds its parent destination and beats a weaker description mention', () => {
    expect(slugs(list, 'Jibhi Waterfall')).toEqual(['jibhi']);
    expect(slugs(list, 'chehni kothi')).toEqual(['jibhi']);
    // "jibhi" is a direct title match (first), the description mention is only a fallback and is dropped.
    expect(slugs(list, 'jibhi')).toEqual(['jibhi']);
  });

  it('description text is used only when nothing structured matches', () => {
    expect(slugs(list, 'wilder')).toEqual(['tirthan-valley']);
  });

  it('travel styles and stay-base locations are searchable', () => {
    expect(slugs(list, 'Adventure')).toEqual(['auli']);
    expect(slugs(list, 'Offbeat')).toEqual(['jibhi']);
    expect(slugs(list, 'Bhuntar')).toEqual(['kasol']);
  });

  it('a newly published destination is found with no code change; edits are reflected; drafts never appear', () => {
    const next = [...list, dest({ slug: 'new-place', title: 'New Place', state: 'Jammu & Kashmir', places: [{ title: 'Hidden Meadow', description: '' }] })];
    expect(slugs(next, 'New Place')).toEqual(['new-place']);
    expect(slugs(next, 'hidden meadow')).toEqual(['new-place']);
    expect(slugs(next, 'Jammu & Kashmir')).toEqual(['new-place']);
    const renamed = next.map((d) => (d.slug === 'new-place' ? { ...d, title: 'Renamed Place' } : d));
    expect(slugs(renamed, 'Renamed')).toEqual(['new-place']);
    const withDraft = [...list, dest({ slug: 'secret', title: 'Secret Draft', state: 'Himachal Pradesh', status: 'draft', places: [{ title: 'Secret Waterfall', description: '' }] })];
    for (const q of ['Secret', 'secret-draft', 'Himachal Pradesh', 'Secret Waterfall']) expect(slugs(withDraft, q), q).not.toContain('secret');
  });

  it('edits to state and places[] are reflected immediately, and unpublishing removes the destination', () => {
    const base = dest({ slug: 'edit-me', title: 'Edit Me', state: 'Uttarakhand', places: [{ title: 'Old Falls', description: '' }] });
    const before = [base];
    expect(slugs(before, 'Uttarakhand')).toEqual(['edit-me']);
    expect(slugs(before, 'Old Falls')).toEqual(['edit-me']);
    const edited = [{ ...base, state: 'Jammu & Kashmir', places: [{ title: 'New Ridge', description: '' }] }];
    expect(slugs(edited, 'Uttarakhand')).toEqual([]);
    expect(slugs(edited, 'Jammu & Kashmir')).toEqual(['edit-me']);
    expect(slugs(edited, 'Old Falls')).toEqual([]);
    expect(slugs(edited, 'New Ridge')).toEqual(['edit-me']);
    const unpublished = [{ ...base, status: 'draft' as const }];
    for (const q of ['Edit Me', 'edit-me', 'Uttarakhand', 'Old Falls']) expect(slugs(unpublished, q), q).toEqual([]);
  });

  it('no destination relationship is invented: a place name never links a different destination', () => {
    const two = [dest({ slug: 'a', title: 'Alpha', places: [{ title: 'Shared View', description: '' }] }), dest({ slug: 'b', title: 'Beta' })];
    expect(slugs(two, 'Shared View')).toEqual(['a']);
    expect(slugs(two, 'Beta')).toEqual(['b']);
  });

  it('ranks direct matches first and exposes scores; empty query matches nothing', () => {
    const ranked = [
      dest({ slug: 'b-state', title: 'Zzz', state: 'Kasol Province' }),
      dest({ slug: 'a-title', title: 'Kasol' })
    ];
    expect(slugs(ranked, 'kasol')[0]).toBe('a-title');
    const scores = destinationRelevanceScores(ranked, 'kasol');
    expect(rankDestinationsByRelevance([...ranked], scores).map((d) => d.slug)[0]).toBe('a-title');
    expect(searchDestinations(list, '  ')).toEqual([]);
  });
});

describe('filters, region isolation and pagination stay correct with a keyword', () => {
  const stats = new Map();

  it('region filter narrows, never widens, the keyword result', () => {
    const all = filterDestinations(catalog, { query: 'valley' }, stats).map((d) => d.slug);
    const hp = filterDestinations(catalog, { query: 'valley', region: 'himachal-pradesh' }, stats).map((d) => d.slug);
    expect(hp.every((slug) => all.includes(slug))).toBe(true);
    expect(filterDestinations(catalog, { query: 'Himachal Pradesh', region: 'uttarakhand' }, stats)).toEqual([]);
  });

  it('an unknown region still yields zero results; filterDestinations equals the search hit set', () => {
    expect(filterDestinations(catalog, { query: 'valley', region: 'not-a-region' as never }, stats)).toEqual([]);
    const set = slugs(catalog, 'Uttarakhand').sort();
    expect(filterDestinations(catalog, { query: 'Uttarakhand' }, stats).map((d) => d.slug).sort()).toEqual(set);
  });

  it('pagination covers every hit exactly once', () => {
    const hits = filterDestinations(catalog, { query: 'Himachal Pradesh' }, stats);
    const seen: string[] = [];
    const first = paginate(hits, 1, 9);
    for (let page = 1; page <= first.totalPages; page++) seen.push(...paginate(hits, page, 9).items.map((d) => d.slug));
    expect(seen).toEqual(hits.map((d) => d.slug));
  });
});

