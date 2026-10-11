import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { summarizeOccupancy } from '@/components/modules/search/OccupancyField';
import type { OccupancyDetails } from '@/types';

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8').replace(/\r\n/g, '\n');

const party: OccupancyDetails = { adults: 2, children: 1, rooms: 3, pets: true };

describe('OccupancyField: rooms and pets only where a consumer exists', () => {
  it('still summarises rooms and pets by default (callers that use them are unaffected)', () => {
    expect(summarizeOccupancy(party)).toBe('2 Adults · 1 Child · Pets · 3 Rooms');
  });
  it('omits rooms and pets when hidden, keeping adults and children', () => {
    expect(summarizeOccupancy(party, { showRooms: false, showPets: false })).toBe('2 Adults · 1 Child');
  });
  it('can hide them independently', () => {
    expect(summarizeOccupancy(party, { showRooms: false })).toBe('2 Adults · 1 Child · Pets');
    expect(summarizeOccupancy(party, { showPets: false })).toBe('2 Adults · 1 Child · 3 Rooms');
  });
  it('the stepper, switch and assistance-animal modal are all gated on the same props', () => {
    const src = read('components', 'modules', 'search', 'OccupancyField.tsx');
    expect(src).toContain('{showRooms ? (');
    expect(src).toContain('{showPets ? (');
    expect(src).toContain('{showPets ? <ServiceAnimalModal');
  });
});

describe('every search surface that collects party size hides rooms and pets (no consumer reads them)', () => {
  for (const file of [
    ['components', 'GlobalSearchFilter.tsx'],
    ['components', 'modules', 'StaysHeroSearch.tsx'],
    ['components', 'modules', 'StaySearch.tsx'],
    ['components', 'modules', 'journeys', 'JourneysHeroSearch.tsx']
  ]) {
    it(file.join('/'), () => {
      const src = read(...file);
      const all = src.match(/<OccupancyField /g) ?? [];
      const hidden = src.match(/<OccupancyField [^>]*showRooms=\{false\} showPets=\{false\}/g) ?? [];
      expect(all.length).toBeGreaterThan(0);
      expect(hidden).toHaveLength(all.length);
    });
  }
});

describe('DateRangeField: only working date selection is shown', () => {
  const src = read('components', 'modules', 'search', 'DateRangeField.tsx');
  it('the flexible-date tab, window pills and month buttons are off by default', () => {
    expect(src).toContain('showFlexibleOptions = false');
    expect(src).toContain('{showFlexibleOptions ? (');
  });
  it('past days stay blocked and a same-day check-out is ignored', () => {
    expect(src).toContain('minDate={today}');
    expect(src).toContain('isSameDay(day, value.checkIn)');
  });
  it('no caller opts back in to the non-functional flexible UI', () => {
    for (const file of [
      ['components', 'GlobalSearchFilter.tsx'],
      ['components', 'modules', 'StaysHeroSearch.tsx'],
      ['components', 'modules', 'StaySearch.tsx'],
      ['components', 'modules', 'journeys', 'JourneysHeroSearch.tsx']
    ]) {
      expect(read(...file)).not.toContain('showFlexibleOptions');
    }
  });
});

describe('preferences survive the explorers rebuilding their own URL', () => {
  it('JourneysExplorer copies valid preferences into the query it writes', () => {
    expect(read('components', 'modules', 'journeys', 'JourneysExplorer.tsx')).toContain('copyTripPreferences(new URLSearchParams(window.location.search), params)');
  });
  it('ExperiencesListing copies valid preferences into the query it writes', () => {
    expect(read('components', 'modules', 'experiences', 'ExperiencesListing.tsx')).toContain('copyTripPreferences(new URLSearchParams(window.location.search), params)');
  });
  it('the Experts and Experiences page forms (which build a fresh query) keep saved preferences when refined', () => {
    expect(read('components', 'modules', 'experts', 'ExpertsHeroSearch.tsx')).toContain('copyTripPreferences(new URLSearchParams(window.location.search), params)');
    expect(read('components', 'modules', 'experiences', 'ExperiencesHero.tsx')).toContain('copyTripPreferences(new URLSearchParams(window.location.search), params)');
  });
  it('JourneysHeroSearch re-seeds dates and party from the URL (refresh / Back / Forward) and emits them on submit', () => {
    const src = read('components', 'modules', 'journeys', 'JourneysHeroSearch.tsx');
    expect(src).toContain('setDateRange(rangeFromSearch(params))');
    expect(src).toContain('setOccupancy(occupancyFromSearch(params))');
    expect(src).toContain('journeyPreferenceParams(dateRange, occupancy)');
  });
});

describe('preferences are shown as preferences on the pages that receive them', () => {
  for (const page of ['journeys', 'experiences', 'experts']) {
    it(`/${page} renders TripPreferencesNote from validated preferences`, () => {
      const src = read('app', page, 'page.tsx');
      expect(src).toContain('readTripPreferences(resolvedSearchParams)');
      expect(src).toContain('<TripPreferencesNote preferences={preferences} />');
    });
  }
  it('/stays/search validates dates/guests and passes only validated values on to the stay cards', () => {
    const src = read('app', 'stays', 'search', 'page.tsx');
    expect(src).toContain('readStayPreferences(');
    expect(src).toContain('STAY_PREFERENCES_DISCLAIMER');
    expect(src).not.toContain("'Any dates · Any guests'");
  });
});

describe('Journeys travel-style options come from live published categories', () => {
  it('the homepage passes the categories of getAllPackages() (published only) into the panel', () => {
    const src = read('app', 'page.tsx');
    expect(src).toContain('const journeyCategories = getPackageCategories(allPackages);');
    expect(src).toContain('journeyCategories={journeyCategories.length > 0 ? journeyCategories : undefined}');
  });
});
