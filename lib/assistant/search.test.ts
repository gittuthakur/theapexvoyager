import { describe, expect, it } from 'vitest';
import { searchJourneys } from '@/lib/assistant/search';
import { catalogue } from '@/lib/assistant/testFixtures';

const slugs = (criteria: Parameters<typeof searchJourneys>[1]) => searchJourneys(catalogue(), criteria).map((pkg) => pkg.slug);

describe('searchJourneys', () => {
  it('matches a destination word against name, destination, slugs and highlights', () => {
    expect(slugs({ destination: 'Kashmir' })).toEqual(['fixture-kashmir-escape']);
    expect(slugs({ destination: 'gulmarg' })).toEqual(['fixture-kashmir-escape']);
    expect(slugs({ destination: 'Himachal' })).toEqual(expect.arrayContaining(['fixture-manali-break', 'fixture-spiti-loop']));
  });

  it('ignores generic product words instead of matching everything', () => {
    expect(slugs({ destination: 'tour package trip' })).toEqual(slugs({}));
    expect(slugs({ destination: 'Goa tour package' })).toEqual([]);
  });

  it('returns nothing, rather than relaxing a constraint, when nothing matches', () => {
    expect(slugs({ destination: 'Kashmir', budgetPerPerson: 5000 })).toEqual([]);
    expect(slugs({ destination: 'Kashmir', nightsMin: 12 })).toEqual([]);
  });

  it('filters on budget per person using the stored starting price', () => {
    expect(slugs({ budgetPerPerson: 13000 })).toEqual(expect.arrayContaining(['fixture-manali-break', 'fixture-rishikesh-rush']));
    expect(slugs({ budgetPerPerson: 13000 })).not.toContain('fixture-kashmir-escape');
  });

  it('filters on nights with one night of tolerance', () => {
    expect(slugs({ nightsMin: 5, nightsMax: 5 })).toEqual(expect.arrayContaining(['fixture-kashmir-escape', 'fixture-manali-break']));
    expect(slugs({ nightsMin: 5, nightsMax: 5 })).not.toContain('fixture-spiti-loop');
    expect(slugs({ nightsMin: 7 })).toEqual(['fixture-spiti-loop']);
  });

  it('does not treat travellers or month as filters (nothing verifies availability)', () => {
    expect(slugs({ destination: 'Kashmir', travellers: 40, month: 'january' })).toEqual(['fixture-kashmir-escape']);
  });

  it('prefers featured packages among equal matches and respects the limit', () => {
    expect(slugs({})[0]).toBe('fixture-spiti-loop');
    expect(searchJourneys(catalogue(), {}, 2)).toHaveLength(2);
  });

  it('only ever returns packages it was given', () => {
    const given = catalogue();
    const result = searchJourneys(given, { destination: 'Himachal' });
    for (const pkg of result) expect(given).toContain(pkg);
    expect(searchJourneys([], { destination: 'Kashmir' })).toEqual([]);
  });
});
