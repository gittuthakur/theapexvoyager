import { describe, expect, it } from 'vitest';
import catalog from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import journeyCatalog from '@/lib/search/__fixtures__/journeyCatalogSnapshot.json';
import {
  GLOBAL_SEARCH_LIMITS,
  destinationSection,
  experienceSection,
  expertSection,
  journeySection,
  parseGlobalSearchQuery,
  regionSection,
  type RegionRef
} from '@/lib/search/globalSearch';
import { searchDestinations } from '@/lib/search/destinationSearch';
import { searchExperiences } from '@/lib/search/experienceSearch';
import { searchPackages } from '@/lib/search/journeySearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';
import type { TravelExpert } from '@/types/expert';

// Real published catalog (the P1/P2 snapshots): 70 destinations, 28 journeys, 23 experiences.
const destinations = catalog.destinations as unknown as Destination[];
const experiences = catalog.experiences as unknown as Experience[];
const journeys = journeyCatalog.journeys as unknown as TravelPackage[];
const refs = destinations.map((d) => ({ slug: d.slug, title: d.title, state: d.state }));
const slugs = (items: Array<{ id: string }>) => items.map((item) => item.id.split(':')[1]);

describe('parseGlobalSearchQuery', () => {
  it('accepts a normal query, collapsing whitespace', () => {
    expect(parseGlobalSearchQuery('  Spiti   Valley ')).toEqual({ ok: true, query: 'Spiti Valley', normalized: 'spiti valley', meaningless: false });
  });
  it('rejects missing, too-short, too-long and control-character queries', () => {
    expect(parseGlobalSearchQuery(undefined)).toMatchObject({ ok: false, code: 'QUERY_REQUIRED' });
    expect(parseGlobalSearchQuery('')).toMatchObject({ ok: false, code: 'QUERY_REQUIRED' });
    expect(parseGlobalSearchQuery('   ')).toMatchObject({ ok: false, code: 'QUERY_REQUIRED' });
    expect(parseGlobalSearchQuery('a')).toMatchObject({ ok: false, code: 'QUERY_TOO_SHORT' });
    expect(parseGlobalSearchQuery(' a ')).toMatchObject({ ok: false, code: 'QUERY_TOO_SHORT' });
    expect(parseGlobalSearchQuery('x'.repeat(81))).toMatchObject({ ok: false, code: 'QUERY_TOO_LONG' });
    expect(parseGlobalSearchQuery('x'.repeat(5000))).toMatchObject({ ok: false, code: 'QUERY_TOO_LONG' });
    expect(parseGlobalSearchQuery('ab\u0000cd')).toMatchObject({ ok: false, code: 'QUERY_INVALID' });
    expect(parseGlobalSearchQuery('ab\u001bcd')).toMatchObject({ ok: false, code: 'QUERY_INVALID' });
    expect(parseGlobalSearchQuery(['a', 'b'])).toMatchObject({ ok: false, code: 'QUERY_REQUIRED' });
  });
  it('counts characters, not UTF-16 units, and allows the exact bounds', () => {
    expect(parseGlobalSearchQuery('x'.repeat(80))).toMatchObject({ ok: true });
    expect(parseGlobalSearchQuery('ab')).toMatchObject({ ok: true });
    expect(parseGlobalSearchQuery('🏔️'.repeat(40))).toMatchObject({ ok: true });
  });
  it('marks text that normalizes to nothing as meaningless, so no data source is read', () => {
    for (const q of ['[[', '()', '<>', '!!', '..']) expect(parseGlobalSearchQuery(q), q).toMatchObject({ ok: true, meaningless: true });
    // two raw characters are valid input, but one letter is not a meaningful search
    expect(parseGlobalSearchQuery('a!')).toMatchObject({ ok: true, meaningless: true });
  });
});

describe('real-catalog accuracy matrix: every section equals the module-level search it delegates to', () => {
  const QUERIES = ['Dharamsala', 'Dharamshala', 'McLeodganj', 'McLeod Ganj', 'Simla', 'Shimla', 'Kaza', 'Kinnaur Spiti', 'Shimla Manali', 'Kasol Kheerganga Tosh', 'Gurez', 'Village Homestay', 'Romantic', 'Adventure', 'Spiti Valley', 'zzzqqq'];
  for (const q of QUERIES) {
    it(`"${q}"`, () => {
      const bySlug = new Map(destinations.map((d) => [d.slug, d]));
      expect(slugs(destinationSection(destinations, q))).toEqual(searchDestinations(destinations, q).slice(0, 5).map((h) => h.destination.slug));
      expect(slugs(journeySection(journeys, destinations, q))).toEqual(searchPackages(journeys, q, bySlug).slice(0, 5).map((h) => h.pkg.slug));
      expect(slugs(experienceSection(experiences, refs, q))).toEqual(searchExperiences(experiences, q, refs).slice(0, 5).map((h) => h.experience.slug));
    });
  }

  it('alias spellings resolve to the real record without inventing associations', () => {
    expect(slugs(destinationSection(destinations, 'Dharamsala'))).toEqual(['dharamshala']);
    expect(slugs(destinationSection(destinations, 'McLeodganj'))).toEqual(['mcleod-ganj']);
    expect(slugs(destinationSection(destinations, 'Simla'))).toEqual(['shimla']);
    expect(slugs(journeySection(journeys, destinations, 'Simla'))).toEqual(expect.arrayContaining(['shimla-manali-tour-package', 'shimla-short-escape']));
    expect(slugs(journeySection(journeys, destinations, 'Dharamsala'))[0]).toBe('dharamshala-dalhousie-escape');
  });

  it('exact titles rank first and carry their own record URL', () => {
    const j = journeySection(journeys, destinations, 'Kasol Kheerganga Tosh');
    expect(j[0]).toMatchObject({ id: 'journey:kasol-kheerganga-tosh', href: '/journeys/kasol-kheerganga-tosh', reason: 'title-exact' });
    const e = experienceSection(experiences, refs, 'Gurez');
    expect(e[0]).toMatchObject({ id: 'experience:gurez-valley-offbeat-village-experience', href: '/experiences/gurez-valley-offbeat-village-experience' });
    const d = destinationSection(destinations, 'McLeod Ganj');
    expect(d[0]).toMatchObject({ id: 'destination:mcleod-ganj', href: '/destinations/mcleod-ganj', reason: 'title-exact' });
  });

  it('does not let a broad description word create results next to a structured match', () => {
    // "Kaza" is a place inside Spiti Valley: the destination comes from its structured places, not from prose.
    expect(destinationSection(destinations, 'Kaza').map((i) => i.reason)).toEqual(['place']);
    // Words absent from the structured data return nothing rather than description noise.
    expect(experienceSection(experiences, refs, 'Gurez').length).toBe(1);
    expect(journeySection(journeys, destinations, 'zzzqqq')).toEqual([]);
  });

  it('fragments and nonsense match nothing', () => {
    // (A fragment of a destination TITLE such as "nali" is the existing P2 title-partial behaviour and is not repeated here.)
    for (const q of ['zzzqqq', 'ilage', 'xqjv']) {
      expect(destinationSection(destinations, q), q).toEqual([]);
      expect(journeySection(journeys, destinations, q), q).toEqual([]);
    }
  });

  it('each section is capped at 5 and items carry only public fields', () => {
    for (const q of ['Adventure', 'Spiti', 'Himachal']) {
      for (const items of [destinationSection(destinations, q), journeySection(journeys, destinations, q), experienceSection(experiences, refs, q)]) {
        expect(items.length).toBeLessThanOrEqual(GLOBAL_SEARCH_LIMITS.perSection);
        for (const item of items) expect(Object.keys(item).sort()).toEqual(expect.arrayContaining(['href', 'id', 'reason', 'title', 'type']));
      }
    }
    const item = destinationSection(destinations, 'Manali')[0];
    expect(Object.keys(item).every((key) => ['id', 'type', 'title', 'subtitle', 'href', 'image', 'reason'].includes(key))).toBe(true);
  });
});

describe('regions', () => {
  const regions: RegionRef[] = [
    { id: 'r1', slug: 'himachal-pradesh', name: 'Himachal Pradesh', shortDescription: 'Snow passes, apple valleys and hill stations.' },
    { id: 'r2', slug: 'kashmir', name: 'Jammu & Kashmir', shortDescription: 'Alpine meadows and houseboats on Dal Lake.' },
    { id: 'r3', slug: 'uttarakhand', name: 'Uttarakhand', shortDescription: 'Riverside yoga towns and sacred ghats.' }
  ];
  const ids = (q: string, list = regions) => regionSection(list, q).map((i) => i.id.split(':')[1]);

  it('finds a region by name, short name, slug and word-start, with its Hub URL', () => {
    expect(ids('Himachal Pradesh')).toEqual(['himachal-pradesh']);
    expect(ids('himachal')).toEqual(['himachal-pradesh']);
    expect(ids('Kashmir')).toEqual(['kashmir']);
    expect(ids('Jammu')).toEqual(['kashmir']);
    expect(ids('jammu and kashmir')).toEqual(['kashmir']);
    expect(ids('uttar')).toEqual(['uttarakhand']);
    expect(regionSection(regions, 'Kashmir')[0]).toMatchObject({ href: '/regions/kashmir', type: 'region', reason: 'title-exact' });
  });
  it('generic region words, fragments and nonsense match nothing; a description is only a fallback', () => {
    expect(ids('pradesh')).toEqual([]);
    expect(ids('zzzqqq')).toEqual([]);
    expect(ids('imachal')).toEqual([]);
    expect(ids('houseboats')).toEqual(['kashmir']);
    expect(ids('Himachal houseboats')).toEqual([]);
  });
  it('a newly published region is searchable at once and a removed one disappears', () => {
    const ladakh: RegionRef = { id: 'r4', slug: 'ladakh', name: 'Ladakh', shortDescription: 'High passes.' };
    expect(ids('Ladakh')).toEqual([]);
    expect(ids('Ladakh', [...regions, ladakh])).toEqual(['ladakh']);
    expect(ids('Kashmir', regions.filter((r) => r.slug !== 'kashmir'))).toEqual([]);
  });
});

describe('experts', () => {
  const expert = (o: Partial<TravelExpert> & Pick<TravelExpert, 'slug' | 'name'>): TravelExpert => ({
    role: 'Trip Planner', profileImage: '/x.jpg', bio: 'Plans journeys.', destinationSlugs: [], travelStyles: [], expertise: [], active: true, publiclyListed: true, ...o
  });
  const regions: RegionRef[] = [{ id: 'r-hp', slug: 'himachal-pradesh', name: 'Himachal Pradesh' }];
  const dests = [{ slug: 'mcleod-ganj', title: 'McLeod Ganj' }, { slug: 'manali', title: 'Manali' }];
  const listed = expert({ slug: 'asha', name: 'Asha Verma', role: 'Mountain Travel Planner', expertise: ['High Altitude Trekking'], destinationSlugs: ['mcleod-ganj'], regionIds: ['r-hp'] });
  const find = (list: TravelExpert[], q: string) => expertSection(list, dests, regions, q).map((i) => i.id);

  it('a publicly listed active expert is found by name, expertise, linked destination (incl. McLeodganj) and region', () => {
    for (const q of ['Asha', 'Trekking', 'McLeodganj', 'McLeod Ganj', 'Himachal']) expect(find([listed], q), q).toEqual(['expert:asha']);
    expect(expertSection([listed], dests, regions, 'Asha')[0]).toMatchObject({ href: '/experts/asha', type: 'expert' });
  });
  it('unlisted, flag-less and inactive experts never appear, even by their own name', () => {
    const hidden = [expert({ slug: 'h1', name: 'Hidden One', publiclyListed: false }), expert({ slug: 'h2', name: 'Hidden Two', publiclyListed: undefined }), expert({ slug: 'h3', name: 'Hidden Three', active: false })];
    for (const q of ['Hidden', 'Hidden One', 'Hidden Two', 'Hidden Three']) expect(find([...hidden, listed], q), q).toEqual([]);
    expect(find([...hidden, listed], 'Asha')).toEqual(['expert:asha']);
  });
  it('a newly listed expert appears and a deactivated one disappears', () => {
    const fresh = expert({ slug: 'new-one', name: 'Zoya Khan', role: 'Winter Planner' });
    expect(find([listed], 'Zoya')).toEqual([]);
    expect(find([listed, fresh], 'Zoya')).toEqual(['expert:new-one']);
    expect(find([listed, { ...fresh, active: false }], 'Zoya')).toEqual([]);
  });
  it('an empty public catalog yields no experts', () => {
    expect(find([], 'Asha')).toEqual([]);
  });
});

describe('future records need no search configuration (isolated fixtures)', () => {
  const fresh = (o: Record<string, unknown>) => ({ ...(journeys[0] as unknown as Record<string, unknown>), ...o }) as unknown as TravelPackage;

  it('a new published journey is found automatically; removing it (unpublishing) removes it at once', () => {
    const added = fresh({ slug: 'quillon-meadow-weekend', name: 'Quillon Meadow Weekend', destination: 'Manali', destinationSlugs: ['manali'], category: 'Adventure', status: 'published' });
    expect(slugs(journeySection(journeys, destinations, 'Quillon'))).toEqual([]);
    expect(slugs(journeySection([...journeys, added], destinations, 'Quillon'))).toEqual(['quillon-meadow-weekend']);
    expect(journeySection([...journeys, added], destinations, 'Quillon')[0].href).toBe('/journeys/quillon-meadow-weekend');
    expect(slugs(journeySection(journeys, destinations, 'Quillon'))).toEqual([]);
  });
  it('a draft journey is refused even if a loader returned it', () => {
    const draft = fresh({ slug: 'draft-trip', name: 'Draft Secret Trip', status: 'draft' });
    expect(slugs(journeySection([...journeys, draft], destinations, 'Draft Secret'))).toEqual([]);
  });
  it('a new published destination appears; a draft destination never does', () => {
    const base = destinations[0] as unknown as Record<string, unknown>;
    const added = { ...base, slug: 'new-place', title: 'Newplace Valley', status: 'published' } as unknown as Destination;
    const draft = { ...base, slug: 'draft-place', title: 'Draftplace Valley', status: 'draft' } as unknown as Destination;
    expect(slugs(destinationSection([...destinations, added, draft], 'Newplace'))).toEqual(['new-place']);
    expect(slugs(destinationSection([...destinations, added, draft], 'Draftplace'))).toEqual([]);
  });
  it('a newly eligible experience is searchable and a renamed one is found under its new name only', () => {
    const base = experiences[0] as unknown as Record<string, unknown>;
    const added = { ...base, slug: 'sunrise-yoga-retreat', title: 'Sunrise Yoga Retreat', location: 'Rishikesh, Uttarakhand' } as unknown as Experience;
    expect(slugs(experienceSection([...experiences, added], refs, 'Sunrise Yoga'))).toEqual(['sunrise-yoga-retreat']);
    const renamed = { ...added, title: 'Cedar Grove Retreat' };
    // the new name is searchable and is what is shown (the slug stays the record's stable identity)
    expect(experienceSection([...experiences, renamed], refs, 'Cedar Grove').map((i) => [i.id, i.title])).toEqual([['experience:sunrise-yoga-retreat', 'Cedar Grove Retreat']]);
  });
});
