import { describe, expect, it } from 'vitest';
import { draftJourneys } from './draftJourneys.config';
import type { DraftTravelPackageInput } from '@/types/package';

// Phase 4 — commercial publication readiness for the first 10 owner-priced Journey
// drafts (see docs/phase-4-owner-commercial-decisions.md, Phase 4 pass). Phase 4A then
// applied the owner's actual commercial decisions (see
// docs/phase-4a-applied-commercial-decisions.md) — pickupInfo/dropInfo/mealPlan/
// transportType/hotelCategoryDescription/minTravellers/roomsIncluded and real,
// owner-approved inclusions/exclusions lists now exist on all 10. Every assertion below
// either locks in that Phase 4A content, or will start failing the moment a future edit
// introduces a real violation (e.g. an inclusions list that quietly implies Gondola/
// safari/helicopter access without approval, or a private-cab claim on the Kasol budget
// package).

const PHASE_4_TARGET_SLUGS = [
  'shimla-manali-tour-package',
  'kinnaur-spiti-circuit',
  'kasol-kheerganga-tosh',
  'jibhi-tirthan-valley',
  'kashmir-family-tour',
  'kashmir-pahalgam-gulmarg-sonamarg-tour',
  'char-dham-yatra',
  'kedarnath-badrinath-yatra',
  'nainital-corbett-mussoorie-tour',
  'auli-chopta-tungnath-tour'
] as const;

const APPROVED_PRICES: Record<string, number> = {
  'shimla-manali-tour-package': 13999,
  'kinnaur-spiti-circuit': 21999,
  'kasol-kheerganga-tosh': 9999,
  'jibhi-tirthan-valley': 11999,
  'kashmir-family-tour': 14999,
  'kashmir-pahalgam-gulmarg-sonamarg-tour': 18999,
  'char-dham-yatra': 19999,
  'kedarnath-badrinath-yatra': 14999,
  'nainital-corbett-mussoorie-tour': 15999,
  'auli-chopta-tungnath-tour': 16999
};

function getTarget(slug: string): DraftTravelPackageInput {
  const journey = draftJourneys.find((j) => j.slug === slug);
  if (!journey) throw new Error(`Phase 4 target draft "${slug}" not found in draftJourneys.config.ts`);
  return journey;
}

// The narrative copy a Phase 4 content audit should scan for tone/superlatives and for
// an accidental "included"/"guaranteed" claim in prose — deliberately EXCLUDES the
// Phase 4A commercial fields (inclusions/exclusions/mealPlan/transportType), which
// correctly use NEGATED phrasing like "not automatically included" that would otherwise
// false-positive against the same risky-phrase regex (see the dedicated
// inclusions/exclusions array checks further below for those fields instead).
function allTextFields(journey: DraftTravelPackageInput): string {
  return [
    journey.name,
    journey.destination,
    journey.shortDescription,
    ...(journey.highlights ?? []),
    ...(journey.itinerary ?? []).flatMap((day) => [day.title, day.description]),
    ...(journey.importantNotes ?? []),
    journey.idealTraveller ?? '',
    journey.bestTimeToVisit ?? ''
  ].join(' \n ');
}

describe('config/draftJourneys.config.ts — Phase 4 target list stays draft with unchanged approved prices', () => {
  it('all 10 Phase 4 target journeys still exist and remain status: draft', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.status, `${slug} should remain draft`).toBe('draft');
    }
  });

  it('all 10 approved starting prices are exactly unchanged from Phase 3', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.price, `${slug} price should be unchanged`).toBe(APPROVED_PRICES[slug]);
    }
  });

  it('all 10 now carry real, non-empty owner-approved inclusions and exclusions lists (Phase 4A)', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.inclusions.length, `${slug} inclusions`).toBeGreaterThan(0);
      expect(journey.exclusions.length, `${slug} exclusions`).toBeGreaterThan(0);
    }
  });

  it('all 10 carry the double-sharing occupancy basis exactly: minTravellers 2, roomsIncluded 1 (Phase 4A global decision)', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.minTravellers, `${slug} minTravellers`).toBe(2);
      expect(journey.roomsIncluded, `${slug} roomsIncluded`).toBe(1);
    }
  });

  it('all 10 carry a real mealPlan, transportType, hotelCategoryDescription, pickupInfo and dropInfo (Phase 4A)', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.mealPlan, `${slug} mealPlan`).toBeTruthy();
      expect(journey.transportType, `${slug} transportType`).toBeTruthy();
      expect(journey.hotelCategoryDescription, `${slug} hotelCategoryDescription`).toBeTruthy();
      expect(journey.pickupInfo, `${slug} pickupInfo`).toBeTruthy();
      expect(journey.dropInfo, `${slug} dropInfo`).toBeTruthy();
    }
  });

  it('no accommodation description names a specific hotel — every one stays a category ending in "equivalent"', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.hotelCategoryDescription, `${slug} hotelCategoryDescription`).toMatch(/equivalent/i);
    }
  });

  it('the Kasol Kheerganga Tosh budget package (₹9,999) never claims a private cab as its transport basis, and explicitly says so', () => {
    const journey = getTarget('kasol-kheerganga-tosh');
    expect(journey.transportType).toMatch(/shared\/package-dependent/i);
    expect(journey.transportType).toMatch(/private cab is not claimed/i);
    expect(journey.inclusions.join(' ').toLowerCase()).not.toContain('private cab');
  });
});

// "best"/"cheapest"/"lowest price"/"100% confirmed" are always forbidden as bare
// marketing claims. "guaranteed" is different: this catalogue's established, honest
// style is to use it in a NEGATION ("not a guaranteed part of every departure", "never
// guaranteed", "are not guaranteed") specifically to hedge a weather/permit/season-
// dependent leg — exactly the opposite of an unsupported superlative claim. Only a bare,
// non-negated "guaranteed" is a violation here. "best avoided"-style advisory phrasing is
// a caution, not a marketing superlative about the package itself — excluded via the
// negative lookahead. Shared at module scope so both the general superlative sweep and
// the Auli-specific special-rule check below use identical negation logic.
const BARE_SUPERLATIVES = /\bbest\b(?!\s+(avoided|done|attempted|visited|experienced))|\b(cheapest|lowest price|100%\s*confirmed)\b/i;
const NEGATED_GUARANTEE = /\b(not|never|isn't|is not|no|without|neither)\b(\s+\w+){0,4}\s+guarantee[ds]?\b/i;

function hasUnsupportedSuperlative(text: string): boolean {
  if (BARE_SUPERLATIVES.test(text)) return true;
  const guaranteeMatches = text.match(/\bguarantee[ds]?\b/gi) ?? [];
  for (const match of guaranteeMatches) {
    const index = text.toLowerCase().indexOf(match.toLowerCase());
    const window = text.slice(Math.max(0, index - 40), index + match.length);
    if (!NEGATED_GUARANTEE.test(window)) return true;
  }
  return false;
}

describe('config/draftJourneys.config.ts — Phase 4 content-quality audit: no unsupported superlatives', () => {
  it('no Phase 4 target journey uses an unsupported superlative anywhere in its visible copy', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      const text = allTextFields(journey);
      expect(hasUnsupportedSuperlative(text), `${slug} contains an unsupported superlative`).toBe(false);
    }
  });
});

describe('config/draftJourneys.config.ts — Phase 4 special package rules (Part 6)', () => {
  it('Kashmir packages never claim the Gondola, pony, or local/union transport as "included" or "guaranteed" in their visible copy', () => {
    const riskyPhrase = /(gondola|pony|union)[^.]{0,40}\b(included|guaranteed)\b|\b(included|guaranteed)\b[^.]{0,40}(gondola|pony|union)/i;
    for (const slug of ['kashmir-family-tour', 'kashmir-pahalgam-gulmarg-sonamarg-tour']) {
      const text = allTextFields(getTarget(slug));
      expect(riskyPhrase.test(text), `${slug} implies an included/guaranteed Gondola, pony, or union transport`).toBe(false);
    }
  });

  it('Char Dham and Kedarnath-Badrinath never claim helicopter, pony, palki, or VIP darshan as "included" or "guaranteed"', () => {
    const riskyPhrase =
      /(helicopter|pony|palki|VIP darshan)[^.]{0,40}\b(included|guaranteed)\b|\b(included|guaranteed)\b[^.]{0,40}(helicopter|pony|palki|VIP darshan)/i;
    for (const slug of ['char-dham-yatra', 'kedarnath-badrinath-yatra']) {
      const text = allTextFields(getTarget(slug));
      expect(riskyPhrase.test(text), `${slug} implies an included/guaranteed helicopter, pony, palki, or VIP darshan`).toBe(false);
    }
  });

  it('the Corbett package never claims the safari as "included" or "guaranteed"', () => {
    const riskyPhrase = /safari[^.]{0,40}\b(included|guaranteed)\b|\b(included|guaranteed)\b[^.]{0,40}safari/i;
    const text = allTextFields(getTarget('nainital-corbett-mussoorie-tour'));
    expect(riskyPhrase.test(text), 'nainital-corbett-mussoorie-tour implies an included/guaranteed safari').toBe(false);
  });

  it('Jibhi Tirthan Valley never promises Jalori Pass or Serolsar Lake access', () => {
    const text = allTextFields(getTarget('jibhi-tirthan-valley'));
    expect(/jalori|serolsar/i.test(text), 'jibhi-tirthan-valley should not mention Jalori/Serolsar at all').toBe(false);
  });

  it('Shimla Manali handles Rohtang/Atal Tunnel access conservatively — hedged, never promised as a guaranteed part of every departure', () => {
    const text = allTextFields(getTarget('shimla-manali-tour-package'));
    expect(/rohtang|atal tunnel/i.test(text)).toBe(true);
    expect(/not (a )?guaranteed part of every departure|depends on (seasonal )?road/i.test(text)).toBe(true);
  });

  it('Auli Chopta Tungnath never guarantees snow, ropeway operation, or trek accessibility — any "guarantee" mention must be a negated hedge', () => {
    const text = allTextFields(getTarget('auli-chopta-tungnath-tour'));
    const matches = text.match(/\bguarantee[ds]?\b/gi) ?? [];
    for (const match of matches) {
      const index = text.toLowerCase().indexOf(match.toLowerCase());
      const window = text.slice(Math.max(0, index - 40), index + match.length);
      expect(NEGATED_GUARANTEE.test(window), `unhedged "${match}" found: "...${window}..."`).toBe(true);
    }
  });

  it('Kinnaur Spiti includes weather/road-access/permit caveats', () => {
    const text = allTextFields(getTarget('kinnaur-spiti-circuit'));
    expect(/permit/i.test(text)).toBe(true);
    expect(/weather|road/i.test(text)).toBe(true);
  });
});

describe('config/draftJourneys.config.ts — Phase 4A: risky items are excluded, never included (inclusions/exclusions arrays)', () => {
  function includesAny(items: string[], patterns: RegExp[]): boolean {
    return items.some((item) => patterns.some((pattern) => pattern.test(item)));
  }

  it('Kashmir packages never list Gondola/pony/snow-activity/local-union items in Inclusions, and do list them in Exclusions', () => {
    const riskyPatterns = [/gondola/i, /pony/i, /snow activit/i, /local-union/i];
    for (const slug of ['kashmir-family-tour', 'kashmir-pahalgam-gulmarg-sonamarg-tour']) {
      const journey = getTarget(slug);
      expect(includesAny(journey.inclusions, riskyPatterns), `${slug} inclusions should not list these`).toBe(false);
      expect(includesAny(journey.exclusions, riskyPatterns), `${slug} exclusions should list these`).toBe(true);
    }
  });

  it('Char Dham and Kedarnath-Badrinath never list helicopter/pony/palki/VIP darshan/porter in Inclusions, and do list them in Exclusions', () => {
    const riskyPatterns = [/helicopter/i, /pony/i, /palki/i, /VIP/i, /porter/i];
    for (const slug of ['char-dham-yatra', 'kedarnath-badrinath-yatra']) {
      const journey = getTarget(slug);
      expect(includesAny(journey.inclusions, riskyPatterns), `${slug} inclusions should not list these`).toBe(false);
      expect(includesAny(journey.exclusions, riskyPatterns), `${slug} exclusions should list these`).toBe(true);
    }
  });

  it('the Corbett package never lists the safari in Inclusions, and does list it (with the permit caveat) in Exclusions', () => {
    const journey = getTarget('nainital-corbett-mussoorie-tour');
    expect(includesAny(journey.inclusions, [/safari/i])).toBe(false);
    expect(includesAny(journey.exclusions, [/safari/i])).toBe(true);
  });

  it('Auli Chopta Tungnath never lists the ropeway or trek guide/porter in Inclusions, and does list them in Exclusions', () => {
    const journey = getTarget('auli-chopta-tungnath-tour');
    const riskyPatterns = [/ropeway/i, /guide\/porter/i];
    expect(includesAny(journey.inclusions, riskyPatterns)).toBe(false);
    expect(includesAny(journey.exclusions, riskyPatterns)).toBe(true);
  });

  it('Jibhi Tirthan Valley excludes any Jalori Pass/Serolsar Lake excursion — never lists it as included', () => {
    const journey = getTarget('jibhi-tirthan-valley');
    expect(includesAny(journey.inclusions, [/jalori/i, /serolsar/i])).toBe(false);
    expect(includesAny(journey.exclusions, [/jalori/i, /serolsar/i])).toBe(true);
  });

  it('every one of the 10 ends its Exclusions with the same honest catch-all line', () => {
    for (const slug of PHASE_4_TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.exclusions[journey.exclusions.length - 1]).toBe('Anything not specifically mentioned in Inclusions');
    }
  });
});
