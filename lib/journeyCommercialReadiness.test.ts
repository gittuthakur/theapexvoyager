import { describe, expect, it } from 'vitest';
import { getCommercialBlockers, isCommerciallyContentComplete } from './journeyCommercialReadiness';

describe('getCommercialBlockers — missing commercial data blockers', () => {
  it('an empty draft reports every blocker, including OWNER_APPROVAL_REQUIRED', () => {
    const blockers = getCommercialBlockers({ status: 'draft' });
    expect(blockers).toEqual([
      'MISSING_PRICE',
      'MISSING_HOTEL_PLAN',
      'MISSING_TRANSPORT_PLAN',
      'MISSING_OCCUPANCY',
      'MISSING_INCLUSIONS',
      'MISSING_EXCLUSIONS',
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

  it('OWNER_APPROVAL_REQUIRED is present for a draft even with every field-level blocker resolved', () => {
    const complete = {
      status: 'draft' as const,
      price: 19999,
      hotelCategoryDescription: 'Standard',
      transportType: 'Private SUV',
      minTravellers: 2,
      roomsIncluded: 1,
      inclusions: ['Breakfast'],
      exclusions: ['Flights']
    };
    expect(getCommercialBlockers(complete)).toEqual(['OWNER_APPROVAL_REQUIRED']);
  });

  it('OWNER_APPROVAL_REQUIRED is absent once status is actually published', () => {
    const complete = {
      status: 'published' as const,
      price: 19999,
      hotelCategoryDescription: 'Standard',
      transportType: 'Private SUV',
      minTravellers: 2,
      roomsIncluded: 1,
      inclusions: ['Breakfast'],
      exclusions: ['Flights']
    };
    expect(getCommercialBlockers(complete)).toEqual([]);
  });
});

describe('isCommerciallyContentComplete — never a publish trigger, only a content-completeness read', () => {
  it('is false while any field-level blocker remains', () => {
    expect(isCommerciallyContentComplete({ status: 'draft' })).toBe(false);
  });

  it('is true once every field-level blocker is resolved, EVEN THOUGH the Journey is still a draft', () => {
    const complete = {
      status: 'draft' as const,
      price: 19999,
      hotelCategoryDescription: 'Standard',
      transportType: 'Private SUV',
      minTravellers: 2,
      roomsIncluded: 1,
      inclusions: ['Breakfast'],
      exclusions: ['Flights']
    };
    // "Content complete" is deliberately NOT the same claim as "published" or "safe to
    // publish automatically" — this function only ever reports field completeness.
    expect(isCommerciallyContentComplete(complete)).toBe(true);
    expect(complete.status).toBe('draft');
  });
});
