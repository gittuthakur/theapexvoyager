import { describe, expect, it } from 'vitest';
import { filterExperiences, sortExperiences } from '@/lib/experienceFilters';
import { experienceRelevanceScores, rankExperiencesByRelevance, searchExperiences, type RelatedDestinationRef } from '@/lib/search/experienceSearch';
import type { Experience } from '@/types/experience';

function exp(partial: Partial<Experience> & { slug: string; title: string }): Experience {
  return {
    id: partial.slug,
    location: 'Manali',
    region: 'Himachal Pradesh',
    category: 'Adventure',
    subCategory: '',
    mood: 'adventure',
    shortDescription: '',
    description: '',
    image: '',
    gallery: [],
    duration: '3 Hours',
    durationBand: 'half-day',
    groupSize: '',
    groupSizeMax: 8,
    price: 1000,
    currency: 'INR',
    bestFor: [],
    seasons: [],
    highlights: [],
    whatYoullExperience: [],
    inclusions: [],
    exclusions: [],
    meetingPoint: '',
    whatToBring: [],
    availability: {} as Experience['availability'],
    verified: false,
    ...partial
  } as Experience;
}

const slugs = (list: Experience[], query: string, dests: RelatedDestinationRef[] = []) => searchExperiences(list, query, dests).map((hit) => hit.experience.slug);

const catalog = [
  exp({ slug: 'spiti-homestay', title: 'Spiti Valley Village Homestay', location: 'Kaza, Spiti Valley', category: 'Culture', subCategory: 'Homestay', mood: 'local-life', highlights: ['Butter tea with a local family'] }),
  exp({ slug: 'dal-shikara', title: 'Dal Lake Sunrise Shikara', location: 'Srinagar', region: 'Jammu & Kashmir', category: 'Romance', mood: 'romantic-escapes' }),
  exp({ slug: 'rafting', title: 'Beas River Rafting', location: 'Kullu', category: 'Adventure', subCategory: 'River Rafting', mood: 'wild-offbeat', shortDescription: 'Near Manali and Spiti Valley road.' }),
  exp({ slug: 'ganga-aarti', title: 'Ganga Aarti Spiritual Evening', location: 'Rishikesh, Joshimath Road', region: 'Uttarakhand', category: 'Culture', mood: 'slow-soulful' })
];

describe('experience search over structured fields', () => {
  it('title, slug and spelling variants are consistent', () => {
    expect(slugs(catalog, 'Spiti Valley Village Homestay')[0]).toBe('spiti-homestay');
    expect(slugs(catalog, 'spiti-homestay')[0]).toBe('spiti-homestay');
    expect(slugs(catalog, 'spiti-valley')).toEqual(['spiti-homestay']);
    expect(slugs(catalog, 'Spiti  Valley')).toEqual(['spiti-homestay']);
  });

  it('location parts, region, category, sub-category, mood and highlights are searchable', () => {
    expect(slugs(catalog, 'Kaza')).toEqual(['spiti-homestay']);
    expect(slugs(catalog, 'Jammu & Kashmir')).toEqual(['dal-shikara']);
    expect(slugs(catalog, 'Uttarakhand')).toEqual(['ganga-aarti']);
    expect(slugs(catalog, 'Homestay')).toEqual(['spiti-homestay']);
    expect(slugs(catalog, 'River Rafting')).toEqual(['rafting']);
    expect(slugs(catalog, 'romantic escapes')).toEqual(['dal-shikara']);
    expect(slugs(catalog, 'butter tea')).toEqual(['spiti-homestay']); // highlight text: fallback tier
  });

  it('a description mention never outranks (or joins) a real title/location match', () => {
    // rafting's short description mentions "Spiti Valley", but real matches exist so it is dropped.
    expect(slugs(catalog, 'Spiti Valley')).toEqual(['spiti-homestay']);
    // With no structured match the description is a fallback.
    expect(slugs(catalog, 'near manali and')).toEqual(['rafting']);
  });

  it('a highlight that names a place in passing never adds noise next to a real match', () => {
    const list = [exp({ slug: 'real', title: 'Pahalgam Pony Ride', location: 'Pahalgam' }), exp({ slug: 'passing', title: 'Meadow Picnic', location: 'Doodhpathri', highlights: ['Quieter than Gulmarg or Pahalgam'] })];
    expect(slugs(list, 'Pahalgam')).toEqual(['real']);
    expect(slugs(list, 'Gulmarg')).toEqual(['passing']);
  });

  it('destination relationships come only from a real location phrase, never invented', () => {
    const dests = [{ slug: 'joshimath', title: 'Joshimath (Jyotirmath)', state: 'Uttarakhand' }, { slug: 'kasol', title: 'Kasol', state: 'Himachal Pradesh' }];
    expect(slugs(catalog, 'Jyotirmath', dests)).toEqual(['ganga-aarti']);
    expect(slugs(catalog, 'joshimath', dests)).toEqual(['ganga-aarti']);
    expect(slugs(catalog, 'Kasol', dests)).toEqual([]);
    expect(slugs(catalog, 'Jyotirmath')).toEqual([]);
  });

  it('new and edited experiences are found automatically; drafts never appear', () => {
    const next = [...catalog, exp({ slug: 'new-trek', title: 'Brand New Ridge Trek', location: 'Chitkul', category: 'Adventure' })];
    expect(slugs(next, 'Brand New')).toEqual(['new-trek']);
    expect(slugs(next, 'Chitkul')).toEqual(['new-trek']);
    expect(slugs(next.map((e) => (e.slug === 'new-trek' ? { ...e, title: 'Renamed Trek' } : e)), 'Renamed')).toEqual(['new-trek']);
    const withDraft = [...catalog, { ...exp({ slug: 'draft-x', title: 'Secret Draft Experience', location: 'Manali' }), status: 'draft' } as Experience];
    for (const q of ['Secret', 'secret-draft-experience', 'Manali', 'Himachal Pradesh', 'Adventure']) expect(slugs(withDraft, q), q).not.toContain('draft-x');
  });

  // P2.1 regression: "Homestay" found only the experience with "Homestay" in its TITLE and missed one
  // whose sub-category is "Village Homestay", because sub-categories matched only from their start.
  describe('multi-word sub-categories', () => {
    const list = [
      exp({ slug: 'titled', title: 'Valley Village Homestay', location: 'Kaza', category: 'Culture', subCategory: 'Village Homestay' }),
      exp({ slug: 'sub-only', title: 'Offbeat Village Experience', location: 'Gurez', category: 'Offbeat', subCategory: 'Village Homestay' }),
      exp({ slug: 'other', title: 'River Walk', location: 'Kullu', category: 'Nature', subCategory: 'Nature Trek' })
    ];

    it('a single word at ANY position of the sub-category matches', () => {
      expect(slugs(list, 'Homestay').sort()).toEqual(['sub-only', 'titled']);
      expect(slugs(list, 'homestay')[0]).toBe('titled'); // exact-ish title match still ranks first
      expect(slugs(list, 'Trek')).toEqual(['other']);
      expect(slugs(list, 'Village').sort()).toEqual(['sub-only', 'titled']);
    });

    it('the full sub-category and case/whitespace/slug variants still match', () => {
      expect(slugs(list, 'Village Homestay').sort()).toEqual(['sub-only', 'titled']);
      expect(slugs(list, '  VILLAGE   homestay ').sort()).toEqual(['sub-only', 'titled']);
      expect(slugs(list, 'village-homestay').sort()).toEqual(['sub-only', 'titled']);
    });

    it('fragments of words and absent words do not match', () => {
      // (Title matching keeps its long-standing substring rule, so use records whose TITLE lacks these.)
      const subOnly = list.filter((e) => e.slug !== 'titled');
      expect(slugs(subOnly, 'home')).toEqual([]);
      expect(slugs(subOnly, 'stay')).toEqual([]);
      expect(slugs(subOnly, 'ilage')).toEqual([]);
      expect(slugs(subOnly, 'camping')).toEqual([]);
    });

    it('a newly added experience with a multi-word sub-category is found with no code change', () => {
      const next = [...list, exp({ slug: 'new-one', title: 'Plain Title', location: 'Chitkul', category: 'Wellness', subCategory: 'Sunrise Yoga Retreat' })];
      expect(slugs(next, 'Yoga')).toEqual(['new-one']);
      expect(slugs(next, 'Retreat')).toEqual(['new-one']);
      expect(slugs(next, 'Sunrise Yoga Retreat')).toEqual(['new-one']);
    });

    it('does not broaden description or highlight matching', () => {
      const text = [exp({ slug: 'desc', title: 'Plain', location: 'Manali', subCategory: 'Walk', shortDescription: 'A homestay nearby', highlights: ['homestay dinner'] }), ...list];
      expect(slugs(text, 'Homestay').sort()).toEqual(['sub-only', 'titled']); // description-only hit is dropped next to structured matches
    });
  });

  it('edits to mood, category and location are reflected immediately', () => {
    const base = exp({ slug: 'edit-me', title: 'Plain Outing', location: 'Manali', category: 'Adventure', mood: 'adventure' });
    expect(slugs([base], 'Manali')).toEqual(['edit-me']);
    expect(slugs([base], 'Wellness')).toEqual([]);
    expect(slugs([base], 'slow soulful')).toEqual([]);
    const edited = { ...base, category: 'Wellness' as const, mood: 'slow-soulful' as const, location: 'Rishikesh', region: 'Uttarakhand' as const };
    expect(slugs([edited], 'Wellness')).toEqual(['edit-me']);
    expect(slugs([edited], 'slow soulful')).toEqual(['edit-me']);
    expect(slugs([edited], 'Rishikesh')).toEqual(['edit-me']);
    expect(slugs([edited], 'Manali')).toEqual([]);
    expect(slugs([edited], 'Uttarakhand')).toEqual(['edit-me']);
    expect(slugs([edited], 'Himachal Pradesh')).toEqual([]);
  });

  it('keyword + filters narrow; relevance orders only the default sort; explicit sort wins', () => {
    const list = [exp({ slug: 'weak', title: 'Plain Walk', location: 'Spiti Valley', price: 500 }), exp({ slug: 'strong', title: 'Spiti Valley Safari', location: 'Kaza', price: 9000 })];
    const filtered = filterExperiences(list, { query: 'spiti valley' });
    const scores = experienceRelevanceScores(list, 'spiti valley');
    expect(rankExperiencesByRelevance(sortExperiences(filtered, 'recommended'), scores).map((e) => e.slug)).toEqual(['strong', 'weak']);
    expect(sortExperiences(filtered, 'price-asc').map((e) => e.slug)).toEqual(['weak', 'strong']);
    expect(filterExperiences(catalog, { query: 'Spiti Valley', region: 'Uttarakhand' })).toEqual([]);
    expect(filterExperiences(catalog, { query: 'adventure', categories: ['Culture'] })).toEqual([]);
    expect(searchExperiences(catalog, '   ')).toEqual([]);
  });
});

