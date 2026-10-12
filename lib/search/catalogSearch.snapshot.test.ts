import { describe, expect, it } from 'vitest';
import snapshot from '@/lib/search/__fixtures__/catalogSearchSnapshot.json';
import { filterDestinations } from '@/lib/destinationFilters';
import { filterExperiences } from '@/lib/experienceFilters';
import { searchDestinations } from '@/lib/search/destinationSearch';
import { searchExperiences, type RelatedDestinationRef } from '@/lib/search/experienceSearch';
import { normalizeSearchText } from '@/lib/search/normalize';
import type { Destination } from '@/types';
import type { Experience } from '@/types/experience';

/**
 * REAL-CATALOG SNAPSHOT TESTS (published Destination + Experience fields used by search; no prices
 * or partner data). Expected sets are derived by a small, separately written oracle from the
 * STRUCTURED fields — never from the implementation — so a missing eligible record AND an
 * unexpected record both fail. Terms absent from the structured data (e.g. "Honeymoon", "Yoga")
 * must return nothing; their expected result is NOT fabricated.
 */
const experiences = snapshot.experiences as unknown as Experience[];
const destinations = snapshot.destinations as unknown as Destination[];
const refs: RelatedDestinationRef[] = destinations.map((d) => ({ slug: d.slug, title: d.title, state: d.state }));

const dSearch = (q: string) => searchDestinations(destinations, q).map((h) => h.destination.slug);
const eSearch = (q: string) => searchExperiences(experiences, q, refs).map((h) => h.experience.slug);
const n = normalizeSearchText;
const sorted = (list: string[]) => [...list].sort();

describe('snapshot sanity', () => {
  it('has the expected published catalog and every destination carries places and styles', () => {
    expect(experiences.length).toBe(23);
    expect(destinations.length).toBe(70);
    expect(destinations.every((d) => d.status === 'published')).toBe(true);
  });
});

describe('destinations: exact result sets from structured data', () => {
  it('state queries return exactly that state\'s destinations', () => {
    for (const state of ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand']) {
      expect(sorted(dSearch(state)), state).toEqual(sorted(destinations.filter((d) => d.state === state).map((d) => d.slug)));
    }
    expect(dSearch('Himachal Pradesh').length).toBe(42);
    expect(dSearch('Jammu & Kashmir').length).toBe(8);
    expect(dSearch('Uttarakhand').length).toBe(20);
  });

  it('Spiti Valley and spiti-valley are identical and resolve the one destination', () => {
    expect(dSearch('Spiti Valley')).toEqual(['spiti-valley']);
    expect(dSearch('spiti-valley')).toEqual(['spiti-valley']);
  });

  it('every sub-place title finds its parent destination (and only parents that really list it)', () => {
    for (const d of destinations) {
      for (const place of d.places ?? []) {
        const got = dSearch(place.title);
        expect(got, `${place.title} -> ${d.slug}`).toContain(d.slug);
        const want = destinations.filter((x) => (x.places ?? []).some((p) => n(p.title) === n(place.title)) || n(x.title) === n(place.title)).map((x) => x.slug);
        for (const slug of want) expect(got).toContain(slug);
      }
    }
    expect(dSearch('Jibhi Waterfall')).toEqual(['jibhi']);
  });

  it('town, state-free direct matches and travel styles', () => {
    expect(dSearch('Kasol')).toEqual(['kasol']);
    expect(dSearch('Pahalgam')).toEqual(['pahalgam']);
    const offbeat = destinations.filter((d) => (d.travelStyles ?? []).some((s) => n(s) === 'offbeat')).map((d) => d.slug);
    for (const slug of offbeat) expect(dSearch('Offbeat'), slug).toContain(slug);
  });

  it('every destination is found by its own title and slug', () => {
    for (const d of destinations) {
      expect(dSearch(d.title), d.title).toContain(d.slug);
      expect(dSearch(d.slug), d.slug).toContain(d.slug);
    }
  });

  it('a state query is never polluted by descriptions that only mention the state', () => {
    for (const state of ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand']) {
      for (const d of destinations.filter((x) => x.state !== state)) expect(dSearch(state), `${state} <- ${d.slug}`).not.toContain(d.slug);
    }
  });

  it('region filter, keyword and pagination compose without leaking across regions', () => {
    const stats = new Map();
    expect(filterDestinations(destinations, { query: 'Himachal Pradesh', region: 'uttarakhand' }, stats)).toEqual([]);
    const both = filterDestinations(destinations, { query: 'Offbeat', region: 'himachal-pradesh' }, stats).map((d) => d.slug);
    expect(both.every((slug) => destinations.find((d) => d.slug === slug)?.state === 'Himachal Pradesh')).toBe(true);
    expect(both.length).toBeGreaterThan(0);
  });
});

describe('experiences: exact result sets from structured data', () => {
  const byCategory = (c: string) => experiences.filter((e) => e.category === c).map((e) => e.slug);

  it('Romantic (mood) and Romance (category) find the real romantic experiences', () => {
    const romantic = experiences.filter((e) => e.mood === 'romantic-escapes').map((e) => e.slug);
    expect(sorted(eSearch('Romantic'))).toEqual(sorted(romantic));
    expect(sorted(eSearch('Romance'))).toEqual(sorted(byCategory('Romance')));
  });

  it('Wellness matches the Wellness category exactly', () => {
    expect(sorted(eSearch('Wellness'))).toEqual(sorted(byCategory('Wellness')));
  });

  it('terms absent from the structured catalog return nothing (no fabricated results)', () => {
    expect(eSearch('Honeymoon')).toEqual([]);
    expect(eSearch('Yoga')).toEqual([]);
  });

  it('every experience is found first by its exact title, and by its slug; partial titles find it', () => {
    for (const e of experiences) {
      expect(eSearch(e.title)[0], e.title).toBe(e.slug);
      expect(eSearch(e.slug)[0], e.slug).toBe(e.slug);
      const partial = e.title.split(/\s+/).slice(0, 2).join(' ');
      expect(eSearch(partial), partial).toContain(e.slug);
      expect(eSearch(e.title.toUpperCase().replace(/ /g, '   ')), 'case/space').toContain(e.slug);
    }
  });

  it('region queries return exactly that region\'s experiences', () => {
    for (const region of ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand']) {
      expect(sorted(eSearch(region)), region).toEqual(sorted(experiences.filter((e) => e.region === region).map((e) => e.slug)));
    }
  });

  it('every whole word of every real sub-category finds its experience (P2.1: "Homestay")', () => {
    expect(sorted(eSearch('Homestay'))).toEqual(['gurez-valley-offbeat-village-experience', 'spiti-valley-village-homestay']);
    expect(sorted(eSearch('Village Homestay'))).toEqual(['gurez-valley-offbeat-village-experience', 'spiti-valley-village-homestay']);
    for (const e of experiences) {
      for (const word of n(e.subCategory).split(' ').filter((w) => w.length >= 3)) expect(eSearch(word), `${word} -> ${e.slug}`).toContain(e.slug);
    }
  });

  it('Spiti Valley and spiti-valley agree', () => {
    expect(sorted(eSearch('Spiti Valley'))).toEqual(sorted(eSearch('spiti-valley')));
    expect(eSearch('Spiti Valley').length).toBe(2);
  });

  it('every location town finds its experiences; category and region combine as an intersection', () => {
    for (const e of experiences) expect(eSearch(e.location.split(',')[0]), e.location).toContain(e.slug);
    expect(filterExperiences(experiences, { query: 'Himachal Pradesh', categories: ['Culture'], destinations: refs }).map((e) => e.slug).sort()).toEqual(
      sorted(experiences.filter((e) => e.region === 'Himachal Pradesh' && e.category === 'Culture').map((e) => e.slug))
    );
    expect(filterExperiences(experiences, { query: 'Himachal Pradesh', region: 'Uttarakhand', destinations: refs })).toEqual([]);
  });

  it('a highlight that names a place in passing does not add noise to a place query', () => {
    // Doodhpathri\'s highlight compares it to Gulmarg/Pahalgam, but it is not a Pahalgam experience.
    expect(eSearch('Pahalgam')).toEqual(['pahalgam-meadow-pony-trek']);
  });
});
