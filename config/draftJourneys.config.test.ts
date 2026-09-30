import { describe, expect, it } from 'vitest';
import { draftJourneys } from './draftJourneys.config';
import { destinations } from './destinations.config';
import { packages } from './packages.config';
import { ladakhDestinationDrafts } from './ladakhFoundation.config';

const REAL_DESTINATION_SLUGS = new Set([
  ...destinations.map((d) => d.slug),
  ...ladakhDestinationDrafts.map((d) => d.slug)
]);
const DESTINATION_STATE_BY_SLUG = new Map<string, string | undefined>([
  ...destinations.map((d): [string, string | undefined] => [d.slug, d.state]),
  ...ladakhDestinationDrafts.map((d): [string, string | undefined] => [d.slug, d.state])
]);
const LIVE_PACKAGE_SLUGS = new Set(packages.map((p) => p.slug));

// The exact 5 Phase 3C Ladakh Journey drafts — the only drafts permitted to reference a
// Ladakh destination slug (Phase 3C brief, Part 1: "create ONLY these 5 canonical
// journeys").
const LADAKH_JOURNEY_SLUGS = new Set([
  'leh-nubra-pangong-tour',
  'leh-nubra-pangong-turtuk-tour',
  'leh-nubra-pangong-hanle-tour',
  'ladakh-hanle-tso-moriri-tour',
  'srinagar-leh-ladakh-tour'
]);

// The 10 Phase 2 drafts the owner approved an indicative starting price for (Phase 3,
// Part 6) — exact figures, never inferred from any other package.
const OWNER_APPROVED_PRICES: Record<string, number> = {
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
// Explicitly kept ON HOLD — no price, per Phase 2B's overlap finding and Phase 3 Part 9.
const ON_HOLD_SLUG = 'dharamshala-mcleodganj-dalhousie-khajjiar-circuit';

const KNOWN_BUSINESS_STATES = new Set(['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand', 'Ladakh']);

function itineraryDayCountFromDuration(duration: string): number | undefined {
  // Every duration string in this catalogue is "<N> Nights / <M> Days" — the itinerary
  // is expected to have exactly M days (matches the convention already used by the 6
  // live packages, verified in the Phase 2 audit).
  const match = duration.match(/(\d+)\s*Days?/i);
  return match ? Number(match[1]) : undefined;
}

describe('config/draftJourneys.config.ts — slug integrity (Phase 2 + Phase 3)', () => {
  it('every draft is explicitly status: draft', () => {
    for (const journey of draftJourneys) {
      expect(journey.status).toBe('draft');
    }
  });

  it('no two drafts share the same slug', () => {
    const slugs = draftJourneys.map((j) => j.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('no draft slug collides with a live, published package slug', () => {
    for (const journey of draftJourneys) {
      expect(LIVE_PACKAGE_SLUGS.has(journey.slug), `draft "${journey.slug}" collides with a live package slug`).toBe(false);
    }
  });
});

describe('config/draftJourneys.config.ts — destination/region validity', () => {
  it('every destinationSlugs entry resolves to a real, curated destination — never an invented slug', () => {
    for (const journey of draftJourneys) {
      for (const slug of journey.destinationSlugs ?? []) {
        expect(REAL_DESTINATION_SLUGS.has(slug), `"${slug}" on ${journey.slug} is not a real destination slug`).toBe(true);
      }
    }
  });

  it('every destinationSlugs entry belongs to one of the business\'s known regions (Himachal Pradesh, Jammu & Kashmir, Uttarakhand)', () => {
    for (const journey of draftJourneys) {
      for (const slug of journey.destinationSlugs ?? []) {
        const state = DESTINATION_STATE_BY_SLUG.get(slug);
        expect(state && KNOWN_BUSINESS_STATES.has(state), `"${slug}" on ${journey.slug} has an unexpected state: ${state}`).toBe(true);
      }
    }
  });

  it('only the 5 Phase 3C Ladakh journeys reference a Ladakh destination slug — every other draft stays within Himachal/Kashmir/Uttarakhand', () => {
    const ladakhSlugs = new Set(ladakhDestinationDrafts.map((d) => d.slug));
    for (const journey of draftJourneys) {
      const referencesLadakh = (journey.destinationSlugs ?? []).some((slug) => ladakhSlugs.has(slug));
      if (LADAKH_JOURNEY_SLUGS.has(journey.slug)) {
        expect(referencesLadakh, `${journey.slug} is a designated Ladakh journey but references no Ladakh destination`).toBe(true);
      } else {
        expect(referencesLadakh, `${journey.slug} unexpectedly references a Ladakh destination`).toBe(false);
      }
    }
  });

  it('contains exactly the 5 expected Ladakh journey slugs, all present in the catalogue', () => {
    const actualSlugs = new Set(draftJourneys.map((j) => j.slug));
    for (const slug of LADAKH_JOURNEY_SLUGS) {
      expect(actualSlugs.has(slug), `expected Ladakh journey "${slug}" to exist`).toBe(true);
    }
  });
});

describe('config/draftJourneys.config.ts — duration matches itinerary day count', () => {
  it('every draft\'s itinerary has exactly as many days as its stated duration', () => {
    for (const journey of draftJourneys) {
      const expectedDays = itineraryDayCountFromDuration(journey.duration);
      expect(expectedDays, `could not parse a day count from "${journey.duration}" on ${journey.slug}`).toBeDefined();
      expect(journey.itinerary?.length, `${journey.slug}: duration says ${expectedDays} days`).toBe(expectedDays);
    }
  });
});

describe('config/draftJourneys.config.ts — commercial pricing (Phase 3, Part 6)', () => {
  it('the 10 owner-approved drafts carry exactly their approved starting price, never a different or inferred value', () => {
    for (const [slug, approvedPrice] of Object.entries(OWNER_APPROVED_PRICES)) {
      const journey = draftJourneys.find((j) => j.slug === slug);
      expect(journey, `expected draft "${slug}" to exist`).toBeDefined();
      expect(journey?.price).toBe(approvedPrice);
      expect(journey?.status).toBe('draft'); // priced, but still never published by this alone
    }
  });

  it('the on-hold Dharamshala circuit has no price — never inferred from a sibling package', () => {
    const journey = draftJourneys.find((j) => j.slug === ON_HOLD_SLUG);
    expect(journey).toBeDefined();
    expect(journey?.price).toBeUndefined();
  });

  it('every OTHER (new Phase 3) draft has no price — never fabricated, never inferred from another package', () => {
    const approvedOrHeld = new Set([...Object.keys(OWNER_APPROVED_PRICES), ON_HOLD_SLUG]);
    const unapproved = draftJourneys.filter((j) => !approvedOrHeld.has(j.slug));
    expect(unapproved.length).toBeGreaterThan(0); // sanity: the Phase 3 packages are actually present
    for (const journey of unapproved) {
      expect(journey.price, `${journey.slug} should have no price set`).toBeUndefined();
    }
  });

  it('no draft anywhere carries inclusions/exclusions — commercial approval for those remains out of scope', () => {
    for (const journey of draftJourneys) {
      expect(journey.inclusions).toEqual([]);
      expect(journey.exclusions).toEqual([]);
    }
  });
});

describe('config/draftJourneys.config.ts — duplicate protection (Phase 2 + Phase 3)', () => {
  it('the previously-stopped duplicate ("a second, Spiti-only Adventure package") was NOT added — only Kinnaur Spiti Circuit and the honestly-differentiated Spiti Winter Expedition touch spiti-valley', () => {
    const spitiRelatedDrafts = draftJourneys.filter((j) => j.destinationSlugs?.includes('spiti-valley'));
    expect(spitiRelatedDrafts.map((j) => j.slug).sort()).toEqual(['kinnaur-spiti-circuit', 'spiti-winter-expedition']);
  });

  it('contains the expected Phase 2 (11) + Phase 3 (18) + Phase 3C Ladakh (5) draft total', () => {
    expect(draftJourneys).toHaveLength(34);
  });
});
