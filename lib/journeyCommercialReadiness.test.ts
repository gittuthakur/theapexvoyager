import { describe, expect, it } from 'vitest';
import { getCommercialBlockers, isCommerciallyContentComplete } from './journeyCommercialReadiness';

describe('getCommercialBlockers — missing commercial data blockers', () => {
  it('an empty draft reports every blocker, including OWNER_APPROVAL_REQUIRED and CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED', () => {
    const blockers = getCommercialBlockers({ status: 'draft' });
    expect(blockers).toEqual([
      'MISSING_PRICE',
      'MISSING_HOTEL_PLAN',
      'MISSING_TRANSPORT_PLAN',
      'MISSING_OCCUPANCY',
      'MISSING_PICKUP_INFO',
      'MISSING_DROP_INFO',
      'MISSING_MEAL_PLAN',
      'MISSING_INCLUSIONS',
      'MISSING_EXCLUSIONS',
      'CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED',
      'OWNER_APPROVAL_REQUIRED'
    ]);
  });

  it('MISSING_PRICE clears once a real positive price is set', () => {
    const blockers = getCommercialBlockers({ status: 'draft', price: 19999 });
    expect(blockers).not.toContain('MISSING_PRICE');
  });

  it('price = 0 still reports MISSING_PRICE — never treated as "set"', () => {
    const blockers = getCommercialBlockers({ status: 'draft', price: 0 });
    expect(blockers).toContain('MISSING_PRICE');
  });

  it('MISSING_HOTEL_PLAN clears with either a hotelCategoryDescription or a populated stayOptions list', () => {
    expect(getCommercialBlockers({ hotelCategoryDescription: 'Standard hotels' })).not.toContain('MISSING_HOTEL_PLAN');
    expect(getCommercialBlockers({ stayOptions: [{ id: 'standard' }] })).not.toContain('MISSING_HOTEL_PLAN');
    expect(getCommercialBlockers({ stayOptions: [] })).toContain('MISSING_HOTEL_PLAN');
  });

  it('MISSING_TRANSPORT_PLAN clears with either a transportType or a populated transportOptions list', () => {
    expect(getCommercialBlockers({ transportType: 'Private SUV' })).not.toContain('MISSING_TRANSPORT_PLAN');
    expect(getCommercialBlockers({ transportOptions: [{ id: 'suv' }] })).not.toContain('MISSING_TRANSPORT_PLAN');
  });

  it('MISSING_OCCUPANCY requires BOTH minTravellers and roomsIncluded', () => {
    expect(getCommercialBlockers({ minTravellers: 2 })).toContain('MISSING_OCCUPANCY');
    expect(getCommercialBlockers({ roomsIncluded: 1 })).toContain('MISSING_OCCUPANCY');
    expect(getCommercialBlockers({ minTravellers: 2, roomsIncluded: 1 })).not.toContain('MISSING_OCCUPANCY');
  });

  it('MISSING_INCLUSIONS/MISSING_EXCLUSIONS clear only with a non-empty array', () => {
    expect(getCommercialBlockers({ inclusions: [] })).toContain('MISSING_INCLUSIONS');
    expect(getCommercialBlockers({ inclusions: ['Breakfast'] })).not.toContain('MISSING_INCLUSIONS');
    expect(getCommercialBlockers({ exclusions: [] })).toContain('MISSING_EXCLUSIONS');
    expect(getCommercialBlockers({ exclusions: ['Flights'] })).not.toContain('MISSING_EXCLUSIONS');
  });

  it('MISSING_PICKUP_INFO/MISSING_DROP_INFO/MISSING_MEAL_PLAN each clear only with real, non-empty free text', () => {
    expect(getCommercialBlockers({})).toContain('MISSING_PICKUP_INFO');
    expect(getCommercialBlockers({ pickupInfo: 'Chandigarh Airport' })).not.toContain('MISSING_PICKUP_INFO');
    expect(getCommercialBlockers({})).toContain('MISSING_DROP_INFO');
    expect(getCommercialBlockers({ dropInfo: 'Chandigarh Airport' })).not.toContain('MISSING_DROP_INFO');
    expect(getCommercialBlockers({})).toContain('MISSING_MEAL_PLAN');
    expect(getCommercialBlockers({ mealPlan: 'Daily breakfast only (CP)' })).not.toContain('MISSING_MEAL_PLAN');
  });

  it('CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED is present by default (undefined/false), for both draft and published, and clears ONLY when usesGeneralCancellationPolicy is exactly true (Phase 4B)', () => {
    expect(getCommercialBlockers({ status: 'draft' })).toContain('CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED');
    expect(getCommercialBlockers({ status: 'published' })).toContain('CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED');
    expect(getCommercialBlockers({ status: 'draft', usesGeneralCancellationPolicy: false })).toContain(
      'CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED'
    );
    expect(getCommercialBlockers({ status: 'draft', usesGeneralCancellationPolicy: true })).not.toContain(
      'CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED'
    );
  });

  it('OWNER_APPROVAL_REQUIRED is the only blocker left for a draft with every field-level blocker resolved, including usesGeneralCancellationPolicy: true', () => {
    const complete = {
      status: 'draft' as const,
      price: 19999,
      hotelCategoryDescription: 'Standard',
      transportType: 'Private SUV',
      minTravellers: 2,
      roomsIncluded: 1,
      pickupInfo: 'Chandigarh Airport',
      dropInfo: 'Chandigarh Airport',
      mealPlan: 'Daily breakfast only (CP)',
      inclusions: ['Breakfast'],
      exclusions: ['Flights'],
      usesGeneralCancellationPolicy: true
    };
    expect(getCommercialBlockers(complete)).toEqual(['OWNER_APPROVAL_REQUIRED']);
  });

  it('resolving usesGeneralCancellationPolicy but nothing else still leaves every other blocker in place', () => {
    const blockers = getCommercialBlockers({ status: 'draft', usesGeneralCancellationPolicy: true });
    expect(blockers).not.toContain('CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED');
    expect(blockers).toEqual([
      'MISSING_PRICE',
      'MISSING_HOTEL_PLAN',
      'MISSING_TRANSPORT_PLAN',
      'MISSING_OCCUPANCY',
      'MISSING_PICKUP_INFO',
      'MISSING_DROP_INFO',
      'MISSING_MEAL_PLAN',
      'MISSING_INCLUSIONS',
      'MISSING_EXCLUSIONS',
      'OWNER_APPROVAL_REQUIRED'
    ]);
  });

  it('zero blockers once status is actually published and usesGeneralCancellationPolicy is true', () => {
    const complete = {
      status: 'published' as const,
      price: 19999,
      hotelCategoryDescription: 'Standard',
      transportType: 'Private SUV',
      minTravellers: 2,
      roomsIncluded: 1,
      pickupInfo: 'Chandigarh Airport',
      dropInfo: 'Chandigarh Airport',
      mealPlan: 'Daily breakfast only (CP)',
      inclusions: ['Breakfast'],
      exclusions: ['Flights'],
      usesGeneralCancellationPolicy: true
    };
    expect(getCommercialBlockers(complete)).toEqual([]);
  });
});

describe('isCommerciallyContentComplete — never a publish trigger, only a content-completeness read', () => {
  it('is false while any field-level blocker remains, including an unresolved cancellation policy', () => {
    expect(isCommerciallyContentComplete({ status: 'draft' })).toBe(false);
  });

  it('is true once every field-level blocker is resolved (now including usesGeneralCancellationPolicy: true), EVEN THOUGH the Journey is still a draft', () => {
    const complete = {
      status: 'draft' as const,
      price: 19999,
      hotelCategoryDescription: 'Standard',
      transportType: 'Private SUV',
      minTravellers: 2,
      roomsIncluded: 1,
      pickupInfo: 'Chandigarh Airport',
      dropInfo: 'Chandigarh Airport',
      mealPlan: 'Daily breakfast only (CP)',
      inclusions: ['Breakfast'],
      exclusions: ['Flights'],
      usesGeneralCancellationPolicy: true
    };
    // "Content complete" is deliberately NOT the same claim as "published" or "safe to
    // publish automatically" — this function only ever reports field completeness.
    expect(isCommerciallyContentComplete(complete)).toBe(true);
    expect(complete.status).toBe('draft');
  });

  it('is false when every OTHER field is resolved but usesGeneralCancellationPolicy is missing — that blocker is no longer force-excluded', () => {
    const almostComplete = {
      status: 'draft' as const,
      price: 19999,
      hotelCategoryDescription: 'Standard',
      transportType: 'Private SUV',
      minTravellers: 2,
      roomsIncluded: 1,
      pickupInfo: 'Chandigarh Airport',
      dropInfo: 'Chandigarh Airport',
      mealPlan: 'Daily breakfast only (CP)',
      inclusions: ['Breakfast'],
      exclusions: ['Flights']
    };
    expect(isCommerciallyContentComplete(almostComplete)).toBe(false);
  });
});
