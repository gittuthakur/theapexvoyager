import { describe, expect, it } from 'vitest';
import { GOOGLE_REGION_ATTRACTIONS_MODE_ENV, googleRegionAttractionsMode, hasFirstPartyTravelGuide, travelGuideSectionHasData } from './googleRegionAttractionsMode';

const withMode = (value: string | undefined) => ({ [GOOGLE_REGION_ATTRACTIONS_MODE_ENV]: value });

describe('googleRegionAttractionsMode', () => {
  it('uses the documented variable name', () => {
    expect(GOOGLE_REGION_ATTRACTIONS_MODE_ENV).toBe('GOOGLE_REGION_ATTRACTIONS_MODE');
  });

  it('is live when the variable is unset or the environment is empty (today\'s behaviour is the default)', () => {
    expect(googleRegionAttractionsMode({})).toBe('live');
    expect(googleRegionAttractionsMode(withMode(undefined))).toBe('live');
  });

  it.each(['', ' ', '\t', '\n'])('treats an empty or blank value (%j) as live', (value) => {
    expect(googleRegionAttractionsMode(withMode(value))).toBe('live');
  });

  it.each(['live', 'LIVE', ' Live '])('accepts live explicitly (%j)', (value) => {
    expect(googleRegionAttractionsMode(withMode(value))).toBe('live');
  });

  it.each(['disabled', 'DISABLED', 'Disabled', '  disabled  ', '\tdisabled\n'])('turns the search off only for an explicit disabled (%j)', (value) => {
    expect(googleRegionAttractionsMode(withMode(value))).toBe('disabled');
  });

  it.each(['off', 'false', '0', 'no', 'disable', 'disabledd', 'dis abled', 'disabled;live', 'disabled,live', '"disabled"', "'disabled'", 'none', 'shadow', 'enforce', 'undefined', 'null', 'true', 'on', 'stop'])(
    'keeps an unknown value (%j) live during this backward-compatible rollout',
    (value) => {
      expect(googleRegionAttractionsMode(withMode(value))).toBe('live');
    }
  );

  it('never returns anything other than live or disabled', () => {
    for (const value of ['x', 'disabled', ' DISABLED ', '', undefined, 'disabled\u0000', 'disabled​', 'dİsabled']) {
      expect(['live', 'disabled']).toContain(googleRegionAttractionsMode(withMode(value)));
    }
  });

  it('is not affected by any other variable, including other Google switches', () => {
    expect(
      googleRegionAttractionsMode({
        GOOGLE_DESTINATION_LIVE_SEARCH: 'disabled',
        GOOGLE_PHOTO_PROXY_MODE: 'disabled',
        GOOGLE_PHOTO_METADATA_MODE: 'disabled',
        GOOGLE_PHOTO_PERSISTENCE_MODE: 'disabled',
        GOOGLE_PLACES_API_KEY: ''
      })
    ).toBe('live');
  });

  it('does not read process.env itself (the caller passes the environment)', () => {
    const original = process.env[GOOGLE_REGION_ATTRACTIONS_MODE_ENV];
    process.env[GOOGLE_REGION_ATTRACTIONS_MODE_ENV] = 'disabled';
    try {
      expect(googleRegionAttractionsMode({})).toBe('live');
    } finally {
      if (original === undefined) delete process.env[GOOGLE_REGION_ATTRACTIONS_MODE_ENV];
      else process.env[GOOGLE_REGION_ATTRACTIONS_MODE_ENV] = original;
    }
  });
});

describe('hasFirstPartyTravelGuide', () => {
  it('is true when any editorial guide field has text', () => {
    for (const field of ['bestTime', 'howToReach', 'weather', 'localTransport', 'permits', 'responsibleTravel']) {
      expect(hasFirstPartyTravelGuide({ [field]: 'Some real guidance' })).toBe(true);
    }
  });

  it.each([undefined, null, 'text', 5, [], {}, { bestTime: '' }, { bestTime: '   ' }, { bestTime: 5 }, { other: 'x' }])('is false for %j', (guide) => {
    expect(hasFirstPartyTravelGuide(guide)).toBe(false);
  });
});

describe('travelGuideSectionHasData', () => {
  const guide = { bestTime: 'March to June' };

  it('LIVE mode is exactly "there are Google attractions", as before this change', () => {
    expect(travelGuideSectionHasData({ attractionCount: 3, mode: 'live', guide })).toBe(true);
    expect(travelGuideSectionHasData({ attractionCount: 0, mode: 'live', guide })).toBe(false);
    expect(travelGuideSectionHasData({ attractionCount: 0, mode: 'live', guide: {} })).toBe(false);
  });

  it('with attractions it is shown in every mode', () => {
    expect(travelGuideSectionHasData({ attractionCount: 1, mode: 'disabled', guide: {} })).toBe(true);
  });

  it('DISABLED mode keeps the region\'s own guide text visible, and shows nothing for a region with none', () => {
    expect(travelGuideSectionHasData({ attractionCount: 0, mode: 'disabled', guide })).toBe(true);
    expect(travelGuideSectionHasData({ attractionCount: 0, mode: 'disabled', guide: {} })).toBe(false);
    expect(travelGuideSectionHasData({ attractionCount: 0, mode: 'disabled', guide: undefined })).toBe(false);
  });
});

describe('LIVE (default) mode is behaviour-identical to the old Travel Guide visibility rule', () => {
  // The rule before C4-B1 was exactly: the section is shown when there is at least one Google attraction.
  const oldRule = (attractionCount: number) => attractionCount > 0;
  const guides: unknown[] = [
    undefined,
    null,
    {},
    '',
    'text',
    42,
    [],
    { bestTime: 'March to June' },
    { bestTime: '', howToReach: '   ', weather: '' },
    { bestTime: 5, permits: null },
    { bestTime: 'a', howToReach: 'b', weather: 'c', localTransport: 'd', permits: 'e', responsibleTravel: 'f' }
  ];

  it.each([0, 1, 2, 7, 10, 100])('for %i attractions, every guide shape, and every way of being in live mode, the result equals the old rule', (attractionCount) => {
    const liveModes = ['live', 'LIVE', ' live ', '', 'unknown-value', 'off', 'false', 'disabledd'].map((value) => googleRegionAttractionsMode(withMode(value)));
    liveModes.push(googleRegionAttractionsMode({}));
    for (const mode of liveModes) {
      expect(mode).toBe('live');
      for (const guide of guides) expect(travelGuideSectionHasData({ attractionCount, mode, guide })).toBe(oldRule(attractionCount));
    }
  });

  it('disabled mode differs from the old rule in exactly one situation: no attractions AND real first-party guide text', () => {
    const differing: string[] = [];
    for (const attractionCount of [0, 1, 5]) {
      for (const [index, guide] of guides.entries()) {
        if (travelGuideSectionHasData({ attractionCount, mode: 'disabled', guide }) !== oldRule(attractionCount)) differing.push(`${attractionCount}:${index}`);
      }
    }
    // attractionCount 0 with guides 7 ({ bestTime }) and 10 (all six fields); nothing else.
    expect(differing).toEqual(['0:7', '0:10']);
  });
});
