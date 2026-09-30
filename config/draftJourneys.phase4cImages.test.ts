import { describe, expect, it } from 'vitest';
import { draftJourneys } from './draftJourneys.config';
import { images } from '@/config/images.config';
import type { DraftTravelPackageInput } from '@/types/package';

// Phase 4C-R — publication blocker recovery: each of the 10 target Journeys gets a real,
// already-resolving curated Destination image (see docs/phase-4c-r-blocker-recovery.md),
// never a fabricated path, never the Ladakh generic placeholder. This file locks in the
// exact resolved image per package and guards against a future edit silently regressing
// price/status/commercial data while touching this file.

const TARGET_SLUGS = [
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

const EXPECTED_IMAGES: Record<string, string> = {
  'shimla-manali-tour-package': images.destinations.manali,
  'kinnaur-spiti-circuit': images.destinations.spitiValley,
  'kasol-kheerganga-tosh': images.destinations.kasol,
  'jibhi-tirthan-valley': images.destinations.kasol,
  'kashmir-family-tour': images.destinations.srinagar,
  'kashmir-pahalgam-gulmarg-sonamarg-tour': images.destinations.pahalgam,
  'char-dham-yatra': images.destinations.kedarnath,
  'kedarnath-badrinath-yatra': images.destinations.badrinath,
  'nainital-corbett-mussoorie-tour': images.destinations.nainital,
  'auli-chopta-tungnath-tour': images.destinations.auli
};

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

const LADAKH_GENERIC_PLACEHOLDER = '/images/img-hero-hero.jpg';
const CURATED_DESTINATION_IMAGES = new Set<string>(Object.values(images.destinations));

function getTarget(slug: string): DraftTravelPackageInput {
  const journey = draftJourneys.find((j) => j.slug === slug);
  if (!journey) throw new Error(`Phase 4C-R target draft "${slug}" not found`);
  return journey;
}

describe('Phase 4C-R — all 10 target Journeys carry a real, resolved curated image', () => {
  it('matches the exact resolved image per package', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).image, slug).toBe(EXPECTED_IMAGES[slug]);
    }
  });

  it('every resolved image is a genuine, already-published curated Destination photo — never invented, never a bare/arbitrary path', () => {
    for (const slug of TARGET_SLUGS) {
      const image = getTarget(slug).image;
      expect(image, slug).toBeTruthy();
      expect(CURATED_DESTINATION_IMAGES.has(image as string), `${slug}'s image "${image}" is not a known curated destination image`).toBe(true);
    }
  });

  it('never uses the Ladakh generic hero placeholder as a substitute', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).image, slug).not.toBe(LADAKH_GENERIC_PLACEHOLDER);
    }
  });
});

describe('Phase 4C-R — everything else about the 10 target Journeys remains exactly unchanged', () => {
  it('all 10 remain status: draft', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).status, slug).toBe('draft');
    }
  });

  it('all 10 approved prices are exactly unchanged', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).price, slug).toBe(APPROVED_PRICES[slug]);
    }
  });

  it('all 10 still carry their Phase 4B commercial fields untouched', () => {
    for (const slug of TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.pickupInfo, `${slug} pickupInfo`).toBeTruthy();
      expect(journey.dropInfo, `${slug} dropInfo`).toBeTruthy();
      expect(journey.mealPlan, `${slug} mealPlan`).toBeTruthy();
      expect(journey.transportType, `${slug} transportType`).toBeTruthy();
      expect(journey.minTravellers, `${slug} minTravellers`).toBe(2);
      expect(journey.roomsIncluded, `${slug} roomsIncluded`).toBe(1);
      expect(journey.usesGeneralCancellationPolicy, `${slug} usesGeneralCancellationPolicy`).toBe(true);
      expect(journey.inclusions.length, `${slug} inclusions`).toBeGreaterThan(0);
      expect(journey.exclusions.length, `${slug} exclusions`).toBeGreaterThan(0);
    }
  });
});

describe('Phase 4C-R — the 6 live packages and Ladakh foundation images were not touched by this file', () => {
  it('the live packages config file is untouched (no image-related edit leaked there)', async () => {
    const { packages } = await import('./packages.config');
    expect(packages.find((p) => p.slug === 'manali-premium-escape')?.image).toBe(images.destinations.manali);
    expect(packages.find((p) => p.slug === 'spiti-valley-adventure')?.image).toBe(images.destinations.spitiValley);
  });

  it('the Ladakh destination drafts still use the generic placeholder untouched (their own separate, legitimate use of it)', async () => {
    const { ladakhDestinationDrafts } = await import('./ladakhFoundation.config');
    expect(ladakhDestinationDrafts.every((d) => d.image === LADAKH_GENERIC_PLACEHOLDER)).toBe(true);
  });
});
