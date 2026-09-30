import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { draftJourneys } from './draftJourneys.config';
import { images } from '@/config/images.config';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import type { DraftTravelPackageInput } from '@/types/package';

// Phase 6 — Batch 2 commercialization (see docs/phase-6-batch-2-commercial-readiness.md).
// Locks in the owner-approved prices, itinerary-verified pickup/drop, real curated
// images, and package-specific safety wording for these 8 target Journey drafts.

const TARGET_SLUGS = [
  'shimla-short-escape',
  'manali-short-escape',
  'kasol-manikaran-weekend',
  'dalhousie-khajjiar-chamba',
  'bir-billing-palampur',
  'mussoorie-weekend',
  'valley-of-flowers-hemkund-sahib-trek',
  'rishikesh-adventure-package'
] as const;

const APPROVED_PRICES: Record<string, number> = {
  'shimla-short-escape': 7999,
  'manali-short-escape': 8999,
  'kasol-manikaran-weekend': 6999,
  'dalhousie-khajjiar-chamba': 10999,
  'bir-billing-palampur': 9999,
  'mussoorie-weekend': 7999,
  'valley-of-flowers-hemkund-sahib-trek': 12999,
  'rishikesh-adventure-package': 8999
};

const EXPECTED_IMAGES: Record<string, string> = {
  'shimla-short-escape': images.destinations.shimla,
  'manali-short-escape': images.destinations.manali,
  'kasol-manikaran-weekend': images.destinations.kasol,
  'dalhousie-khajjiar-chamba': images.destinations.dalhousie,
  'bir-billing-palampur': images.destinations.birBilling,
  'mussoorie-weekend': images.destinations.mussoorie,
  'valley-of-flowers-hemkund-sahib-trek': images.destinations.hemkundSahib,
  'rishikesh-adventure-package': images.destinations.rishikesh
};

function getTarget(slug: string): DraftTravelPackageInput {
  const journey = draftJourneys.find((j) => j.slug === slug);
  if (!journey) throw new Error(`Phase 6 target draft "${slug}" not found`);
  return journey;
}

describe('Phase 6 Batch 2 — all 8 remain draft with exact approved prices and real images', () => {
  it('all 8 remain status: draft', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).status, slug).toBe('draft');
    }
  });

  it('all 8 approved prices match exactly', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).price, slug).toBe(APPROVED_PRICES[slug]);
    }
  });

  it('all 8 images match the expected real curated Destination photo and exist on disk', () => {
    for (const slug of TARGET_SLUGS) {
      const image = getTarget(slug).image;
      expect(image, slug).toBe(EXPECTED_IMAGES[slug]);
      expect(fs.existsSync(path.join('public', image as string)), `${slug} image on disk`).toBe(true);
    }
  });

  it('none of the 8 uses a generic fallback or the Ladakh placeholder', () => {
    const genericPaths = new Set(['/images/img-hero-hero.jpg', '/images/hero-hero.jpg', '/images/feature-tour-hero.jpg', '/images/destination-hero-img.jpg']);
    for (const slug of TARGET_SLUGS) {
      expect(genericPaths.has(getTarget(slug).image as string), slug).toBe(false);
    }
  });
});

describe('Phase 6 Batch 2 — commercial readiness resolves to exactly OWNER_APPROVAL_REQUIRED', () => {
  it('every target package has zero remaining blockers except the permanent OWNER_APPROVAL_REQUIRED', () => {
    for (const slug of TARGET_SLUGS) {
      const journey = getTarget(slug);
      const blockers = getCommercialBlockers({
        status: journey.status,
        price: journey.price,
        hotelCategoryDescription: journey.hotelCategoryDescription,
        stayOptions: journey.stayOptions,
        transportType: journey.transportType,
        transportOptions: journey.transportOptions,
        minTravellers: journey.minTravellers,
        roomsIncluded: journey.roomsIncluded,
        pickupInfo: journey.pickupInfo,
        dropInfo: journey.dropInfo,
        mealPlan: journey.mealPlan,
        inclusions: journey.inclusions,
        exclusions: journey.exclusions,
        usesGeneralCancellationPolicy: journey.usesGeneralCancellationPolicy
      });
      expect(blockers, `${slug} blockers`).toEqual(['OWNER_APPROVAL_REQUIRED']);
    }
  });

  it('all 8 carry usesGeneralCancellationPolicy: true and minTravellers/roomsIncluded matching double-sharing (2/1)', () => {
    for (const slug of TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.usesGeneralCancellationPolicy, slug).toBe(true);
      expect(journey.minTravellers, slug).toBe(2);
      expect(journey.roomsIncluded, slug).toBe(1);
    }
  });

  it('all 8 accommodation descriptions stay a category, never naming a specific hotel', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).hotelCategoryDescription, slug).toMatch(/equivalent/i);
    }
  });
});

describe('Phase 6 Batch 2 — itinerary-verified pickup/drop (no Phase 4A-style conflict)', () => {
  it('Shimla/Manali/Mussoorie/Rishikesh short escapes use their already-established, itinerary-consistent gateway cities', () => {
    expect(getTarget('shimla-short-escape').pickupInfo).toMatch(/chandigarh/i);
    expect(getTarget('manali-short-escape').pickupInfo).toMatch(/chandigarh/i);
    expect(getTarget('mussoorie-weekend').pickupInfo).toMatch(/dehradun/i);
    expect(getTarget('rishikesh-adventure-package').pickupInfo).toMatch(/dehradun/i);
  });

  it('Kasol Manikaran Weekend uses Bhuntar (matching its itinerary), never claims private cab at this starting price', () => {
    const journey = getTarget('kasol-manikaran-weekend');
    expect(journey.pickupInfo).toMatch(/bhuntar/i);
    expect(journey.dropInfo).toMatch(/bhuntar/i);
    expect(journey.transportType).toMatch(/shared\/package-dependent/i);
    expect(journey.transportType).not.toMatch(/private cab throughout/i);
    expect(journey.inclusions.join(' ').toLowerCase()).not.toContain('private cab');
  });

  it('Dalhousie Khajjiar Chamba keeps its real one-way Pathankot -> Chamba route, never a fabricated round trip', () => {
    const journey = getTarget('dalhousie-khajjiar-chamba');
    expect(journey.pickupInfo).toMatch(/pathankot/i);
    expect(journey.dropInfo).toMatch(/drop at chamba/i);
    expect(journey.startingCity).toBe('Pathankot');
    expect(journey.endingCity).toBe('Chamba');
  });

  it('Bir Billing Palampur keeps its real one-way Dharamshala -> Palampur route', () => {
    const journey = getTarget('bir-billing-palampur');
    expect(journey.pickupInfo).toMatch(/dharamshala/i);
    expect(journey.dropInfo).toMatch(/drop at palampur/i);
    expect(journey.startingCity).toBe('Dharamshala');
    expect(journey.endingCity).toBe('Palampur');
  });

  it('Valley of Flowers/Hemkund Sahib: pickup/drop is Joshimath (itinerary-supported), NOT Rishikesh (the unsupported gateway field)', () => {
    const journey = getTarget('valley-of-flowers-hemkund-sahib-trek');
    expect(journey.pickupInfo).toMatch(/joshimath/i);
    expect(journey.dropInfo).toMatch(/joshimath/i);
    expect(journey.pickupInfo).not.toMatch(/drop at rishikesh|pickup from rishikesh/i);
    const flagged = journey.importantNotes?.find((n) => /FLAGGED FOR OWNER CONFIRMATION/.test(n));
    expect(flagged, 'expected a flagged owner-confirmation note about the Rishikesh gateway gap').toBeDefined();
  });
});

describe('Phase 6 Batch 2 — package-specific safety (no unsupported activity silently included)', () => {
  function includesAny(items: string[], patterns: RegExp[]): boolean {
    return items.some((item) => patterns.some((pattern) => pattern.test(item)));
  }

  it('Manali Short Escape never includes Rohtang/Atal Tunnel/snow activities in Inclusions', () => {
    const journey = getTarget('manali-short-escape');
    const risky = [/rohtang/i, /atal tunnel/i, /snow activit/i];
    expect(includesAny(journey.inclusions, risky)).toBe(false);
    expect(includesAny(journey.exclusions, risky)).toBe(true);
  });

  it('Bir Billing Palampur never includes paragliding in Inclusions', () => {
    const journey = getTarget('bir-billing-palampur');
    expect(includesAny(journey.inclusions, [/paragliding/i])).toBe(false);
    expect(includesAny(journey.exclusions, [/paragliding/i])).toBe(true);
  });

  it('Rishikesh Adventure Package never includes rafting/adventure-activity charges in Inclusions', () => {
    const journey = getTarget('rishikesh-adventure-package');
    const risky = [/rafting/i, /adventure-activity/i];
    expect(includesAny(journey.inclusions, risky)).toBe(false);
    expect(includesAny(journey.exclusions, risky)).toBe(true);
  });

  it('Valley of Flowers/Hemkund Sahib never includes pony/porter/helicopter in Inclusions, and accommodation is never called "Deluxe" for the trek nights', () => {
    const journey = getTarget('valley-of-flowers-hemkund-sahib-trek');
    const risky = [/pony/i, /porter/i, /helicopter/i];
    expect(includesAny(journey.inclusions, risky)).toBe(false);
    expect(includesAny(journey.exclusions, risky)).toBe(true);
    // The description explicitly says the trek-night lodging is never called "Deluxe" —
    // that's a negation, not a claim, so check for the honest phrase rather than a bare
    // absence of the word "Deluxe" (which appears once, inside that same negation).
    expect(journey.hotelCategoryDescription).toMatch(/never described as "deluxe"/i);
    expect(journey.hotelCategoryDescription).toMatch(/basic trek-lodge/i);
  });

  it('every one of the 8 ends its Exclusions with the same honest catch-all line', () => {
    for (const slug of TARGET_SLUGS) {
      const journey = getTarget(slug);
      expect(journey.exclusions[journey.exclusions.length - 1]).toBe('Anything not specifically mentioned in Inclusions');
    }
  });
});
