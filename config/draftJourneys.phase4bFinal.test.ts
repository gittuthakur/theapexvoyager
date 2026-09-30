import { describe, expect, it } from 'vitest';
import { draftJourneys } from './draftJourneys.config';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import type { DraftTravelPackageInput } from '@/types/package';

// Phase 4B — final owner approval applied to the 10 target Journey drafts (see
// docs/phase-4b-final-commercial-approval.md). This file locks in the 6 final owner
// decisions: Kinnaur Spiti/Kasol Kheerganga Tosh/Jibhi Tirthan's resolved pickup/drop
// (with optional-transfer wording, never a fabricated add-on price), Nainital Corbett
// Mussoorie's preserved one-way Kathgodam→Dehradun routing, Kashmir Family Tour's
// explicit 1-night houseboat, and the cancellation-policy resolution mechanism.

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
  if (!journey) throw new Error(`Phase 4B target draft "${slug}" not found`);
  return journey;
}

describe('Phase 4B — all 10 remain draft with exact, unchanged approved prices', () => {
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
});

describe('Phase 4B — final commercial readiness: getCommercialBlockers() resolves to exactly OWNER_APPROVAL_REQUIRED for all 10', () => {
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

  it('all 10 carry usesGeneralCancellationPolicy: true — a verified fact, not a fabricated percentage', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).usesGeneralCancellationPolicy, slug).toBe(true);
    }
  });
});

describe('Phase 4B — Kinnaur Spiti / Kasol Kheerganga Tosh / Jibhi Tirthan: resolved pickup/drop, no unsupported transfer included, no fabricated add-on price', () => {
  it('Kinnaur Spiti: pickup Chandigarh, drop Manali — no return transfer implied included', () => {
    const journey = getTarget('kinnaur-spiti-circuit');
    expect(journey.pickupInfo).toMatch(/chandigarh/i);
    expect(journey.dropInfo).toMatch(/drop at manali/i);
    expect(journey.dropInfo).not.toMatch(/drop at chandigarh/i);
    const transferExclusion = journey.exclusions.find((e) => /manali.{0,5}chandigarh/i.test(e));
    expect(transferExclusion, 'exclusions should list the Manali–Chandigarh transfer').toBeDefined();
    expect(transferExclusion).toMatch(/available on request at additional cost/i);
    // The Chandigarh PICKUP is legitimately included (Day 1 transfer to Shimla) — only
    // the Manali->Chandigarh RETURN transfer must never appear as included.
    const inclusionsText = journey.inclusions.join(' ');
    expect(inclusionsText).not.toMatch(/manali.{0,5}chandigarh/i);
    expect(inclusionsText).not.toMatch(/return transfer/i);
  });

  it('Kasol Kheerganga Tosh: pickup and drop both Bhuntar — Chandigarh transfer excluded, available on request only', () => {
    const journey = getTarget('kasol-kheerganga-tosh');
    expect(journey.pickupInfo).toMatch(/bhuntar/i);
    expect(journey.dropInfo).toMatch(/bhuntar/i);
    const transferExclusion = journey.exclusions.find((e) => /chandigarh/i.test(e));
    expect(transferExclusion, 'exclusions should list the Chandigarh transfer').toBeDefined();
    expect(transferExclusion).toMatch(/available on request at additional cost/i);
  });

  it('Jibhi Tirthan Valley: pickup and drop both Aut — Chandigarh transfer excluded, available on request only', () => {
    const journey = getTarget('jibhi-tirthan-valley');
    expect(journey.pickupInfo).toMatch(/aut/i);
    expect(journey.dropInfo).toMatch(/aut/i);
    const transferExclusion = journey.exclusions.find((e) => /chandigarh/i.test(e));
    expect(transferExclusion, 'exclusions should list the Chandigarh transfer').toBeDefined();
    expect(transferExclusion).toMatch(/available on request at additional cost/i);
  });

  it('Kasol Kheerganga Tosh and Jibhi Tirthan Valley never mention Chandigarh in Inclusions (their pickup/drop is Bhuntar/Aut, not Chandigarh at all)', () => {
    for (const slug of ['kasol-kheerganga-tosh', 'jibhi-tirthan-valley']) {
      const journey = getTarget(slug);
      expect(journey.inclusions.join(' ')).not.toMatch(/chandigarh/i);
    }
  });

  it('addOns stays empty for all 10 — no fabricated add-on price for any optional transfer', () => {
    for (const slug of TARGET_SLUGS) {
      expect(getTarget(slug).addOns, `${slug} addOns`).toEqual([]);
    }
  });
});

describe('Phase 4B — Nainital Corbett Mussoorie: preserved geographically coherent one-way routing', () => {
  it('keeps Kathgodam pickup and Dehradun drop — never restructured to Delhi/Delhi', () => {
    const journey = getTarget('nainital-corbett-mussoorie-tour');
    expect(journey.pickupInfo).toMatch(/kathgodam/i);
    expect(journey.dropInfo).toMatch(/dehradun/i);
    expect(journey.pickupInfo).not.toMatch(/delhi/i);
    expect(journey.dropInfo).not.toMatch(/delhi/i);
    expect(journey.startingCity).toBe('Kathgodam');
    expect(journey.endingCity).toBe('Dehradun');
  });
});

describe('Phase 4B — Kashmir Family Tour: explicit 1-night houseboat, itinerary still exactly 5N/6D', () => {
  const journey = getTarget('kashmir-family-tour');

  it('duration is still exactly "5 Nights / 6 Days"', () => {
    expect(journey.duration).toBe('5 Nights / 6 Days');
  });

  it('the itinerary still has exactly 6 day entries — the houseboat update only edited existing days, never added/removed one', () => {
    expect(journey.itinerary).toHaveLength(6);
    expect(journey.itinerary.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('Day 1 explicitly states a houseboat overnight — no longer just an alternative to a hotel', () => {
    const day1 = journey.itinerary.find((d) => d.day === 1)!;
    expect(day1.description).toMatch(/houseboat/i);
    expect(day1.description).not.toMatch(/houseboat or/i);
  });

  it('Day 2 no longer offers "houseboat or hotel" as an alternative — the houseboat decision is now fixed to Day 1', () => {
    const day2 = journey.itinerary.find((d) => d.day === 2)!;
    expect(day2.description).not.toMatch(/houseboat/i);
  });

  it('no day entry anywhere still contains the old ambiguous "houseboat or" alternative phrasing', () => {
    for (const day of journey.itinerary) {
      expect(day.description).not.toMatch(/houseboat or (a )?hotel/i);
    }
  });

  it('hotelCategoryDescription and inclusions both state the houseboat as a confirmed 1-night inclusion, never naming a specific property', () => {
    expect(journey.hotelCategoryDescription).toMatch(/houseboat\/equivalent/i);
    expect(journey.hotelCategoryDescription).toMatch(/deluxe hotel\/equivalent/i);
    const houseboatInclusion = journey.inclusions.find((i) => /houseboat/i.test(i));
    expect(houseboatInclusion, 'inclusions should state the houseboat night').toBeDefined();
  });

  it('price remains exactly ₹14,999, unchanged by the houseboat update', () => {
    expect(journey.price).toBe(14999);
  });
});
