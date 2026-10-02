import { describe, expect, it } from 'vitest';
import {
  assertPhase12DraftInventory,
  evaluatePreparationPlan,
  findDraftPublicLeaks,
  preparationOnlyChangesAllowed,
  type Phase12PreparationPlan
} from './phase12DraftPreparationGuard';
import { buildKashmirWinterPlan } from './preparePhase12DraftJourneys';

function makeInventory() {
  return Array.from({ length: 12 }, (_, index) => ({ slug: `draft-${index + 1}`, status: 'draft', duration: '2 Nights / 3 Days' }));
}

const completeEvidence = { ownerApproved: true, supplierConfirmed: true, imageVerified: true };

describe('Phase 12 draft preparation guard', () => {
  it('accepts exactly the current twelve-draft inventory and rejects count/status drift', () => {
    expect(assertPhase12DraftInventory(makeInventory())).toHaveLength(12);
    expect(() => assertPhase12DraftInventory(makeInventory().slice(1))).toThrow('Expected 12 production drafts');
    const changed = makeInventory();
    changed[0].status = 'published';
    expect(() => assertPhase12DraftInventory(changed)).toThrow('non-draft');
  });

  it('requires an exact per-record allowlist and refuses status, slug, duration, or other fields', () => {
    const record = { slug: 'draft-1', status: 'draft', duration: '2 Nights / 3 Days', price: null };
    const allowed: Phase12PreparationPlan = {
      slug: 'draft-1', allowedFields: ['price'], values: { price: 12000 }, evidence: completeEvidence
    };
    expect(evaluatePreparationPlan(record, allowed, ['OWNER_APPROVAL_REQUIRED']).action).toBe('UPDATE');
    expect(evaluatePreparationPlan(record, { ...allowed, slug: 'draft-2' }, []).blockers).toContain('SLUG_MISMATCH');
    for (const field of ['status', 'slug', 'duration']) {
      const plan = { ...allowed, allowedFields: [field], values: { [field]: 'changed' } };
      expect(evaluatePreparationPlan(record, plan, []).action).toBe('REFUSED');
      expect(evaluatePreparationPlan(record, plan, []).blockers).toContain(`PROTECTED_FIELD:${field}`);
    }
    expect(evaluatePreparationPlan(record, { ...allowed, values: { price: 12000, image: '/images/not-approved.jpg' } }, []).action).toBe('REFUSED');
  });

  it('detects conflicting populated values per record rather than overwriting them', () => {
    const record = { slug: 'draft-1', status: 'draft', duration: '2 Nights / 3 Days', price: 15000 };
    const plan: Phase12PreparationPlan = {
      slug: 'draft-1', allowedFields: ['price'], values: { price: 12000 }, evidence: completeEvidence
    };
    const decision = evaluatePreparationPlan(record, plan, []);
    expect(decision.action).toBe('REFUSED');
    expect(decision.conflicts).toEqual(['price']);
  });

  it('is idempotent when every planned value already matches', () => {
    const record = { slug: 'draft-1', status: 'draft', duration: '2 Nights / 3 Days', price: 12000 };
    const plan: Phase12PreparationPlan = {
      slug: 'draft-1', allowedFields: ['price'], values: { price: 12000 }, evidence: completeEvidence
    };
    expect(evaluatePreparationPlan(record, plan, []).action).toBe('ALREADY_CORRECT');
    expect(preparationOnlyChangesAllowed(record, record, plan.values)).toBe(true);
    expect(preparationOnlyChangesAllowed(record, { ...record, status: 'published' }, plan.values)).toBe(false);
  });

  it('requires owner, supplier, image and all non-owner readiness gates before a plan can update', () => {
    const record = { slug: 'draft-1', status: 'draft', duration: '2 Nights / 3 Days', price: null };
    const plan: Phase12PreparationPlan = {
      slug: 'draft-1', allowedFields: ['price'], values: { price: 12000 },
      evidence: { ownerApproved: true, supplierConfirmed: false, imageVerified: false }
    };
    const decision = evaluatePreparationPlan(record, plan, ['OWNER_APPROVAL_REQUIRED', 'MISSING_TRANSPORT_PLAN']);
    expect(decision.action).toBe('REFUSED');
    expect(decision.blockers).toContain('SUPPLIER_CONFIRMATION_REQUIRED');
    expect(decision.blockers).toContain('IMAGE_VERIFICATION_REQUIRED');
    expect(decision.blockers).toContain('READINESS:MISSING_TRANSPORT_PLAN');
  });

  it('checks that every draft remains absent from catalogue and sitemap', () => {
    expect(findDraftPublicLeaks(['a', 'b'], ['live'], ['https://example.test/journeys/live'])).toEqual({
      catalogueLeaks: [], sitemapLeaks: [], isolated: true
    });
    expect(findDraftPublicLeaks(['a'], ['a'], ['https://example.test/journeys/a']).isolated).toBe(false);
  });

  it('captures only the approved Kashmir hotel-only/price direction and refuses unresolved supplier/image gates', () => {
    const record = {
      slug: 'kashmir-winter-snow-tour',
      status: 'draft',
      duration: '4 Nights / 5 Days',
      startingCity: 'Srinagar',
      endingCity: 'Srinagar',
      destinationSlugs: ['srinagar', 'gulmarg', 'pahalgam'],
      price: null,
      image: null,
      itinerary: [
        { day: 1, title: 'Arrival in Srinagar', description: 'Arrive in Srinagar; evening at leisure, houseboat stay where available.' },
        { day: 2, title: 'Srinagar to Gulmarg', description: 'Travel to Gulmarg for its winter Gondola and snow scenery, conditions permitting.' },
        { day: 3, title: 'Gulmarg Winter Activities', description: 'A further day in Gulmarg; skiing/snow activities are subject to season, snowfall and operator availability, not guaranteed.' },
        { day: 4, title: 'Gulmarg to Pahalgam', description: 'Travel to Pahalgam for its winter valley views.' },
        { day: 5, title: 'Departure via Srinagar', description: 'Return to Srinagar for departure.' }
      ]
    };
    const plan = buildKashmirWinterPlan(record);
    const decision = evaluatePreparationPlan(record, plan, ['MISSING_PICKUP_INFO', 'MISSING_DROP_INFO', 'MISSING_MEAL_PLAN', 'MISSING_TRANSPORT_PLAN', 'OWNER_APPROVAL_REQUIRED']);

    expect(plan.values.price).toBe(21999);
    expect(String(plan.values.hotelCategoryDescription)).toContain('Hotel-only base');
    expect(String(plan.values.hotelCategoryDescription)).toContain('Srinagar 1 night, Gulmarg 2 nights, Pahalgam 1 night');
    expect(plan.values.itinerary).toBeDefined();
    expect(plan.values).not.toHaveProperty('pickupInfo');
    expect(plan.values).not.toHaveProperty('dropInfo');
    expect(plan.values).not.toHaveProperty('mealPlan');
    expect(plan.values).not.toHaveProperty('transportType');
    expect(plan.values).not.toHaveProperty('image');
    expect(decision.action).toBe('REFUSED');
    expect(decision.blockers).toContain('SUPPLIER_CONFIRMATION_REQUIRED');
    expect(decision.blockers).toContain('IMAGE_VERIFICATION_REQUIRED');
  });
});