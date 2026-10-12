import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseExperienceUrlState, shouldAdoptUrlChange } from '@/lib/experienceUrlState';

describe('experiences listing URL state', () => {
  it('parses every facet and falls back safely for missing or invalid values', () => {
    expect(parseExperienceUrlState('')).toEqual({
      query: '', region: '', categories: [], durations: [], budgets: [], bestFor: [], seasons: [], difficulties: [], sort: 'recommended'
    });
    const state = parseExperienceUrlState('q=kul&region=Uttarakhand&category=Adventure,Culture&sort=price-asc&adults=3&travelStartDate=2026-12-10');
    expect(state).toMatchObject({ query: 'kul', region: 'Uttarakhand', categories: ['Adventure', 'Culture'], sort: 'price-asc' });
    expect(parseExperienceUrlState('sort=bogus').sort).toBe('recommended');
  });

  // Regression: typing "kul", waiting past the 300ms URL debounce, then typing "u" used to lose
  // focus (and, in production, scramble the text) because the page remounted the listing on every
  // query-string change. The component's OWN address-bar write must never be re-adopted.
  it('ignores the listing\'s own address-bar write but adopts every other change', () => {
    expect(shouldAdoptUrlChange('q=kul', 'q=kul')).toBe(false);
    expect(shouldAdoptUrlChange('q=kul&adults=3', 'q=kul&adults=3')).toBe(false);
    expect(shouldAdoptUrlChange(null, 'q=kul')).toBe(true); // external navigation, nothing pushed yet
    expect(shouldAdoptUrlChange('q=kul', 'category=Adventure')).toBe(true); // hero / tile / homepage search
    expect(shouldAdoptUrlChange('q=kulu', 'q=kul')).toBe(true); // browser Back/Forward
  });

  it('the page must not remount the listing by keying it on the query string', () => {
    const page = readFileSync(path.join(process.cwd(), 'app/experiences/page.tsx'), 'utf8');
    expect(page).not.toMatch(/listingKey/);
    expect(page).not.toMatch(/<ExperiencesListing[^>]*\bkey=/s);
  });
});
