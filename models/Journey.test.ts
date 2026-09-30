import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { Journey } from './Journey';

async function getValidationError(doc: InstanceType<typeof Journey>): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error as mongoose.Error.ValidationError;
  }
}

function baseJourneyData(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'test-journey',
    name: 'Test Journey',
    destination: 'Manali, Himachal Pradesh',
    duration: '5 Days / 4 Nights',
    category: 'Adventure',
    shortDescription: 'A test journey.',
    highlights: ['Highlight one'],
    itinerary: [{ day: 1, title: 'Arrival', description: 'Arrive and settle in.' }],
    ...overrides
  };
}

describe('Journey model — status defaults to draft (Phase 2 publish workflow)', () => {
  it('defaults to draft when status is omitted — a new Journey is never accidentally public', () => {
    const doc = new Journey(baseJourneyData());
    expect(doc.status).toBe('draft');
  });

  it('rejects an undocumented status value', async () => {
    const doc = new Journey(baseJourneyData({ status: 'archived' }));
    const error = await getValidationError(doc);
    expect(error?.errors?.status).toBeDefined();
  });
});

describe('Journey model — draft-safe incomplete commercial fields (Part 6 of the Phase 2 brief)', () => {
  it('a draft with no price, inclusions, exclusions, or image passes validation', async () => {
    const doc = new Journey(baseJourneyData({ status: 'draft' }));
    expect(await getValidationError(doc)).toBeUndefined();
    expect(doc.price).toBeUndefined();
    expect(doc.inclusions).toEqual([]);
    expect(doc.exclusions).toEqual([]);
  });

  it('a draft with a real, complete set of fields still passes (drafts may be content-complete, just not commercially approved)', async () => {
    const doc = new Journey(
      baseJourneyData({
        status: 'draft',
        idealTraveller: 'Families and small groups',
        bestTimeToVisit: 'March to June, weather permitting'
      })
    );
    expect(await getValidationError(doc)).toBeUndefined();
  });
});

describe('Journey model — a published Journey must be commercially complete (prevents a fake public ₹0 price)', () => {
  it('rejects publishing with no price', async () => {
    const doc = new Journey(baseJourneyData({ status: 'published', inclusions: ['x'], exclusions: ['y'], image: '/images/x.jpg' }));
    const error = await getValidationError(doc);
    expect(error?.message).toMatch(/positive price/);
  });

  it('rejects publishing with price = 0 — never treated as "unset" and never silently allowed', async () => {
    const doc = new Journey(
      baseJourneyData({ status: 'published', price: 0, inclusions: ['x'], exclusions: ['y'], image: '/images/x.jpg' })
    );
    const error = await getValidationError(doc);
    expect(error?.message).toMatch(/positive price/);
  });

  it('rejects publishing with a negative price', async () => {
    const doc = new Journey(
      baseJourneyData({ status: 'published', price: -100, inclusions: ['x'], exclusions: ['y'], image: '/images/x.jpg' })
    );
    const error = await getValidationError(doc);
    expect(error?.message).toMatch(/positive price/);
  });

  it('rejects publishing with no inclusions', async () => {
    const doc = new Journey(baseJourneyData({ status: 'published', price: 9999, exclusions: ['y'], image: '/images/x.jpg' }));
    const error = await getValidationError(doc);
    expect(error?.message).toMatch(/inclusion/);
  });

  it('rejects publishing with no exclusions', async () => {
    const doc = new Journey(baseJourneyData({ status: 'published', price: 9999, inclusions: ['x'], image: '/images/x.jpg' }));
    const error = await getValidationError(doc);
    expect(error?.message).toMatch(/exclusion/);
  });

  it('rejects publishing with no image', async () => {
    const doc = new Journey(baseJourneyData({ status: 'published', price: 9999, inclusions: ['x'], exclusions: ['y'] }));
    const error = await getValidationError(doc);
    expect(error?.message).toMatch(/image/);
  });

  it('accepts a fully complete published Journey', async () => {
    const doc = new Journey(
      baseJourneyData({ status: 'published', price: 9999, inclusions: ['x'], exclusions: ['y'], image: '/images/x.jpg' })
    );
    expect(await getValidationError(doc)).toBeUndefined();
  });
});

describe('Journey model — slug uniqueness (duplicate-slug protection)', () => {
  it('slug carries a unique index — enforced at the MongoDB level, not application code', () => {
    // Mongoose surfaces a field-level `unique: true` via the compiled schema path's
    // options — this is a static assertion the constraint still exists after the
    // Phase 2 schema edits, not a live-database round trip (a real duplicate-key
    // rejection is already covered by MongoDB itself and by this project's existing
    // upsert-by-slug convention throughout scripts/seed.ts and lib/packages.ts).
    expect(Journey.schema.path('slug').options.unique).toBe(true);
  });
});

describe('Journey model — Phase 2C commercial fields, existing-6 backward compatibility', () => {
  it('a published Journey shaped exactly like the 6 live packages — with NONE of the new commercial fields set — still validates', async () => {
    // Mirrors the real shape of manali-premium-escape etc.: no pickupInfo, dropInfo,
    // mealPlan, transportType, minTravellers or roomsIncluded at all. The pre-validate
    // hook must never have been extended to require these, or every live package would
    // start failing validation on its next save() without any content change.
    const doc = new Journey(
      baseJourneyData({ status: 'published', price: 12999, inclusions: ['Breakfast'], exclusions: ['Flights'], image: '/images/manali.jpg' })
    );
    expect(await getValidationError(doc)).toBeUndefined();
    expect(doc.pickupInfo).toBeUndefined();
    expect(doc.mealPlan).toBeUndefined();
    expect(doc.minTravellers).toBeUndefined();
  });

  it('the new commercial fields are accepted and stored when provided, on a draft', () => {
    const doc = new Journey(
      baseJourneyData({
        status: 'draft',
        pickupInfo: 'Chandigarh Airport or Railway Station',
        dropInfo: 'Chandigarh Airport or Railway Station',
        mealPlan: 'Daily breakfast only (CP)',
        transportType: 'Private SUV throughout',
        minTravellers: 2,
        roomsIncluded: 1
      })
    );
    expect(doc.pickupInfo).toBe('Chandigarh Airport or Railway Station');
    expect(doc.mealPlan).toBe('Daily breakfast only (CP)');
    expect(doc.minTravellers).toBe(2);
  });

  it('a draft remains a draft even once every new commercial field is populated — these fields never affect status', async () => {
    const doc = new Journey(
      baseJourneyData({
        status: 'draft',
        pickupInfo: 'Chandigarh Airport',
        dropInfo: 'Chandigarh Airport',
        mealPlan: 'Daily breakfast (CP)',
        transportType: 'Private SUV',
        minTravellers: 2,
        roomsIncluded: 1
      })
    );
    expect(await getValidationError(doc)).toBeUndefined();
    expect(doc.status).toBe('draft');
  });
});
