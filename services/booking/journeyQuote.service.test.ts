import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TravelPackage } from '@/types/package';

const getPackageBySlugMock = vi.fn<(slug: string) => Promise<TravelPackage | undefined>>();
vi.mock('@/lib/packages', () => ({ getPackageBySlug: getPackageBySlugMock }));

const { createJourneyQuote, validateJourneyTravellerCounts, MAX_JOURNEY_TRAVELLERS } = await import('./journeyQuote.service');

const VALID_SECRET = 'a'.repeat(32);

const TEST_JOURNEY: TravelPackage = {
  slug: 'test-journey',
  name: 'Test Journey',
  destination: 'Test Destination',
  image: '/images/test.jpg',
  duration: '5 Days / 4 Nights',
  price: 10000,
  category: 'Adventure',
  shortDescription: 'A test journey',
  highlights: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  stayOptions: [
    { id: 'standard', label: 'Standard', extraPrice: 0 },
    { id: 'deluxe', label: 'Deluxe', extraPrice: 2000 }
  ],
  transportOptions: [
    { id: 'shared', label: 'Shared Transport', extraPrice: 0 },
    { id: 'private', label: 'Private Transport', extraPrice: 3000 }
  ],
  pace: [
    { id: 'relaxed', label: 'Relaxed', description: '', priceMultiplier: 1 },
    { id: 'immersive', label: 'Immersive', description: '', priceMultiplier: 1.1 }
  ],
  addOns: [
    { id: 'addon-cab', label: 'Private Cab', price: 1500 },
    { id: 'addon-guide', label: 'Guided Tour', price: 1000 }
  ],
  seasonalPricing: [{ label: 'Peak Season', startDate: '2026-12-20', endDate: '2027-01-05', price: 15000 }]
};

const BASE_REQUEST = {
  journeySlug: 'test-journey',
  travelDate: '2026-11-10',
  adults: 2,
  children: 0,
  addOnIds: []
};

describe('validateJourneyTravellerCounts', () => {
  it('accepts valid adults and children', () => {
    expect(validateJourneyTravellerCounts(2, 1)).toEqual({ valid: true, adults: 2, children: 1 });
  });

  it('requires at least one adult', () => {
    expect(validateJourneyTravellerCounts(1, 0).valid).toBe(true);
    expect(validateJourneyTravellerCounts(0, 0).valid).toBe(false);
  });

  it('rejects negative values', () => {
    expect(validateJourneyTravellerCounts(-1, 0).valid).toBe(false);
    expect(validateJourneyTravellerCounts(1, -1).valid).toBe(false);
  });

  it('rejects floats', () => {
    expect(validateJourneyTravellerCounts(2.5, 0).valid).toBe(false);
    expect(validateJourneyTravellerCounts(2, 1.1).valid).toBe(false);
  });

  it('rejects numeric strings — never coerced', () => {
    expect(validateJourneyTravellerCounts('2', 0).valid).toBe(false);
    expect(validateJourneyTravellerCounts(2, '0').valid).toBe(false);
  });

  it('rejects booleans', () => {
    expect(validateJourneyTravellerCounts(true, 0).valid).toBe(false);
    expect(validateJourneyTravellerCounts(2, false).valid).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateJourneyTravellerCounts(Number.NaN, 0).valid).toBe(false);
  });

  it('rejects adults above the individual maximum', () => {
    expect(validateJourneyTravellerCounts(MAX_JOURNEY_TRAVELLERS + 1, 0).valid).toBe(false);
  });

  it('rejects children above the individual maximum', () => {
    expect(validateJourneyTravellerCounts(1, MAX_JOURNEY_TRAVELLERS).valid).toBe(false);
  });

  it('rejects a combined total above the cap', () => {
    expect(validateJourneyTravellerCounts(15, 10).valid).toBe(false);
  });

  it('accepts a combined total exactly at the cap', () => {
    expect(validateJourneyTravellerCounts(10, 10)).toEqual({ valid: true, adults: 10, children: 10 });
    expect(validateJourneyTravellerCounts(MAX_JOURNEY_TRAVELLERS, 0).valid).toBe(true);
    expect(validateJourneyTravellerCounts(1, MAX_JOURNEY_TRAVELLERS - 1).valid).toBe(true);
  });
});

describe('createJourneyQuote', () => {
  beforeEach(() => {
    vi.stubEnv('BOOKING_QUOTE_SECRET', VALID_SECRET);
    getPackageBySlugMock.mockReset();
    getPackageBySlugMock.mockResolvedValue(TEST_JOURNEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loads the journey through the authoritative server data source', async () => {
    await createJourneyQuote(BASE_REQUEST);
    expect(getPackageBySlugMock).toHaveBeenCalledWith('test-journey');
  });

  it('rejects an unknown journey without ever computing a price', async () => {
    getPackageBySlugMock.mockResolvedValue(undefined);
    const result = await createJourneyQuote(BASE_REQUEST);
    expect(result).toEqual({ ok: false, reason: 'UNKNOWN_JOURNEY' });
  });

  it('computes the correct base price (2 adults × 10000, no season match)', async () => {
    const result = await createJourneyQuote(BASE_REQUEST);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quote.snapshot.totalMinorUnits).toBe(2 * 10000 * 100);
    expect(result.quote.snapshot.currency).toBe('INR');
  });

  it('applies a stay-option upgrade correctly', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, stayOptionId: 'deluxe' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quote.snapshot.totalMinorUnits).toBe((2 * 10000 + 2000) * 100);
    expect(result.quote.snapshot.stayOptionLabel).toBe('Deluxe');
  });

  it('applies a transport-option upgrade correctly', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, transportOptionId: 'private' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quote.snapshot.totalMinorUnits).toBe((2 * 10000 + 3000) * 100);
    expect(result.quote.snapshot.transportOptionLabel).toBe('Private Transport');
  });

  it('applies a pace multiplier correctly', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, paceId: 'immersive' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quote.snapshot.totalMinorUnits).toBe(Math.round(2 * 10000 * 1.1 * 100));
  });

  it('applies add-ons correctly', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, addOnIds: ['addon-cab', 'addon-guide'] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quote.snapshot.totalMinorUnits).toBe((2 * 10000 + 1500 + 1000) * 100);
    expect(result.quote.snapshot.addOnLabels.sort()).toEqual(['Guided Tour', 'Private Cab']);
  });

  it('applies seasonal pricing when the travel date falls in a configured window', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, travelDate: '2026-12-25' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quote.snapshot.totalMinorUnits).toBe(2 * 15000 * 100);
  });

  it('line items always sum exactly to totalMinorUnits — no rounding drift', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, paceId: 'immersive', stayOptionId: 'deluxe', addOnIds: ['addon-cab'] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sum = result.quote.snapshot.lineItems.reduce((total, line) => total + line.amountMinorUnits, 0);
    expect(sum).toBe(result.quote.snapshot.totalMinorUnits);
  });

  it('rejects an unknown stay option explicitly, never falling back to a default', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, stayOptionId: 'does-not-exist' });
    expect(result).toEqual({ ok: false, reason: 'UNKNOWN_STAY_OPTION' });
  });

  it('rejects an unknown transport option explicitly', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, transportOptionId: 'does-not-exist' });
    expect(result).toEqual({ ok: false, reason: 'UNKNOWN_TRANSPORT_OPTION' });
  });

  it('rejects an unknown pace explicitly', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, paceId: 'does-not-exist' });
    expect(result).toEqual({ ok: false, reason: 'UNKNOWN_PACE' });
  });

  it('rejects an unknown add-on explicitly', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, addOnIds: ['does-not-exist'] });
    expect(result).toEqual({ ok: false, reason: 'UNKNOWN_ADD_ON' });
  });

  it('duplicate add-on IDs are deduplicated, never double-charged', async () => {
    const once = await createJourneyQuote({ ...BASE_REQUEST, addOnIds: ['addon-cab'] });
    const duplicated = await createJourneyQuote({ ...BASE_REQUEST, addOnIds: ['addon-cab', 'addon-cab', 'addon-cab'] });
    expect(once.ok && duplicated.ok).toBe(true);
    if (!once.ok || !duplicated.ok) return;
    expect(duplicated.quote.snapshot.totalMinorUnits).toBe(once.quote.snapshot.totalMinorUnits);
    expect(duplicated.quote.snapshot.addOnIds).toEqual(['addon-cab']);
  });

  it('rejects an invalid travel date', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, travelDate: '2026-02-30' });
    expect(result).toEqual({ ok: false, reason: 'INVALID_DATE' });
  });

  it('rejects an invalid traveller count', async () => {
    const result = await createJourneyQuote({ ...BASE_REQUEST, adults: 0 });
    expect(result).toEqual({ ok: false, reason: 'INVALID_TRAVELLER_COUNT' });
  });

  it('fails closed with CONFIGURATION_ERROR when the signing secret is missing', async () => {
    vi.unstubAllEnvs();
    const result = await createJourneyQuote(BASE_REQUEST);
    expect(result).toEqual({ ok: false, reason: 'CONFIGURATION_ERROR' });
    expect(getPackageBySlugMock).not.toHaveBeenCalled();
  });

  it('never uses a client-supplied total — there is no such field on the request type at all', async () => {
    // TypeScript already prevents this at compile time (JourneyQuoteRequest has no
    // `total`/`amount` field); this test documents that guarantee at the value level:
    // the same request always produces the same price regardless of anything extra
    // smuggled onto the object.
    const withExtraField = { ...BASE_REQUEST, total: 1, amountMinorUnits: 1 } as typeof BASE_REQUEST;
    const result = await createJourneyQuote(withExtraField);
    const control = await createJourneyQuote(BASE_REQUEST);
    expect(result.ok && control.ok).toBe(true);
    if (!result.ok || !control.ok) return;
    expect(result.quote.snapshot.totalMinorUnits).toBe(control.quote.snapshot.totalMinorUnits);
  });
});
