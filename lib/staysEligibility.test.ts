import { describe, expect, it } from 'vitest';
import { STAY_LOCATION_RULES } from '@/config/stayLocations.config';
import { eligibleLocationsMatch, eligibleStayLocations, isAuthoredStayLocation, isEligibleStayLocation } from '@/lib/staysEligibility';

describe('public eligibility of cached stay rows', () => {
  const eligible = eligibleStayLocations(['manali', 'bir-billing', 'kedarnath', 'dharamshala', 'mcleod-ganj', 'sangla-valley', 'kinnaur', 'spiti-valley']);

  it('is the published destination plus that destination\'s CURRENT stay location', () => {
    expect(isEligibleStayLocation('bir-billing', 'Bir', eligible)).toBe(true);
    expect(isEligibleStayLocation('spiti-valley', 'Kaza', eligible)).toBe(true);
    expect(isEligibleStayLocation('kedarnath', 'Guptkashi', eligible)).toBe(true);
    expect(isEligibleStayLocation('sangla-valley', 'Sangla', eligible)).toBe(true);
  });

  it('orphan slugs, test slugs and unpublished destinations are never eligible', () => {
    for (const [slug, location] of [['kaza', 'Kaza'], ['bir', 'Bir'], ['sangla', 'Sangla'], ['guptkashi', 'Guptkashi'], ['gushaini', 'Gushaini'], ['spiti-valley-verify2', 'Kaza']] as const) {
      expect(isEligibleStayLocation(slug, location, eligible), slug).toBe(false);
    }
    // a rule exists but the destination is not published (not in the list passed in)
    expect(isEligibleStayLocation('chamba', 'Chamba', eligible)).toBe(false);
  });

  it('stale rows fetched under a location a rule no longer uses are not eligible', () => {
    expect(isEligibleStayLocation('dharamshala', 'McLeod Ganj', eligible)).toBe(false);
    expect(isEligibleStayLocation('kinnaur', 'Kinnaur', eligible)).toBe(false);
    expect(isEligibleStayLocation('dharamshala', 'Dharamshala', eligible)).toBe(true);
    expect(isEligibleStayLocation('mcleod-ganj', 'McLeod Ganj', eligible)).toBe(true);
  });

  it('builds a Mongo match from the pairs, and a match-nothing filter when none are eligible', () => {
    expect(eligibleLocationsMatch([{ destinationSlug: 'manali', searchLocation: 'Manali' }])).toEqual({ $or: [{ destinationSlug: 'manali', searchLocation: 'Manali' }] });
    expect(eligibleLocationsMatch([])).toEqual({ _id: { $exists: false } });
  });

  it('new published destinations with an authored rule become eligible with no code change', () => {
    const rule = STAY_LOCATION_RULES[0];
    expect(eligibleStayLocations([rule.slug])).toEqual([{ destinationSlug: rule.slug, searchLocation: rule.primaryStayLocation }]);
    expect(eligibleStayLocations([])).toEqual([]);
  });

  it('isAuthoredStayLocation is the database-free rule check used by getStaysForDestination', () => {
    expect(isAuthoredStayLocation('manali', 'Manali')).toBe(true);
    expect(isAuthoredStayLocation('manali', 'Kullu')).toBe(false);
    expect(isAuthoredStayLocation('kaza', 'Kaza')).toBe(false);
  });
});
