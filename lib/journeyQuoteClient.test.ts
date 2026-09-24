import { describe, expect, it } from 'vitest';
import {
  buildQuoteRequestPayload,
  canRequestQuote,
  formatCountdown,
  isQuoteExpired,
  mapQuoteErrorStatus,
  QUOTE_ERROR_MESSAGES,
  remainingMs,
  validateQuoteResponse,
  type QuoteSelections
} from './journeyQuoteClient';

const BASE_SELECTIONS: QuoteSelections = {
  journeySlug: 'manali-premium-escape',
  travelDate: '2099-06-15',
  adults: 2,
  children: 1,
  stayOptionId: 'deluxe',
  transportOptionId: 'suv',
  paceId: 'relaxed',
  addOnIds: ['addon-cab']
};

describe('buildQuoteRequestPayload', () => {
  it('sends exactly the fields the API accepts, with the exact IDs from selections', () => {
    expect(buildQuoteRequestPayload(BASE_SELECTIONS)).toEqual({
      journeySlug: 'manali-premium-escape',
      travelDate: '2099-06-15',
      adults: 2,
      children: 1,
      stayOptionId: 'deluxe',
      transportOptionId: 'suv',
      paceId: 'relaxed',
      addOnIds: ['addon-cab']
    });
  });

  it('deduplicates add-on IDs', () => {
    const payload = buildQuoteRequestPayload({ ...BASE_SELECTIONS, addOnIds: ['addon-cab', 'addon-cab', 'addon-guide'] });
    expect(payload.addOnIds).toEqual(['addon-cab', 'addon-guide']);
  });

  it('omits an empty-string option ID as undefined, never as an empty string', () => {
    const payload = buildQuoteRequestPayload({ ...BASE_SELECTIONS, stayOptionId: '', transportOptionId: '', paceId: '' });
    expect(payload.stayOptionId).toBeUndefined();
    expect(payload.transportOptionId).toBeUndefined();
    expect(payload.paceId).toBeUndefined();
  });

  it('never includes a price/total/currency/label field — only IDs and traveller counts', () => {
    const payload = buildQuoteRequestPayload(BASE_SELECTIONS) as unknown as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['addOnIds', 'adults', 'children', 'journeySlug', 'paceId', 'stayOptionId', 'transportOptionId', 'travelDate']);
    expect(payload.total).toBeUndefined();
    expect(payload.price).toBeUndefined();
    expect(payload.currency).toBeUndefined();
  });
});

describe('canRequestQuote', () => {
  it('accepts a fully valid, future-dated selection', () => {
    expect(canRequestQuote(BASE_SELECTIONS)).toBe(true);
  });

  it('rejects a missing journeySlug', () => {
    expect(canRequestQuote({ ...BASE_SELECTIONS, journeySlug: '' })).toBe(false);
  });

  it('rejects an invalid (malformed) travel date — no request should ever be attempted', () => {
    expect(canRequestQuote({ ...BASE_SELECTIONS, travelDate: 'not-a-date' })).toBe(false);
  });

  it('rejects a past travel date', () => {
    expect(canRequestQuote({ ...BASE_SELECTIONS, travelDate: '2020-01-01' })).toBe(false);
  });

  it('rejects fewer than 1 adult', () => {
    expect(canRequestQuote({ ...BASE_SELECTIONS, adults: 0 })).toBe(false);
  });

  it('rejects a negative children count', () => {
    expect(canRequestQuote({ ...BASE_SELECTIONS, children: -1 })).toBe(false);
  });
});

describe('mapQuoteErrorStatus', () => {
  it('maps every documented status to its category', () => {
    expect(mapQuoteErrorStatus(400)).toBe('INVALID_SELECTIONS');
    expect(mapQuoteErrorStatus(404)).toBe('NOT_FOUND');
    expect(mapQuoteErrorStatus(429)).toBe('RATE_LIMITED');
    expect(mapQuoteErrorStatus(503)).toBe('SERVICE_UNAVAILABLE');
  });

  it('maps a 500 and an undefined (network failure) status to the same generic category', () => {
    expect(mapQuoteErrorStatus(500)).toBe('GENERIC');
    expect(mapQuoteErrorStatus(undefined)).toBe('GENERIC');
  });

  it('every category has a fixed, non-empty user-facing message', () => {
    for (const kind of Object.keys(QUOTE_ERROR_MESSAGES) as (keyof typeof QUOTE_ERROR_MESSAGES)[]) {
      expect(QUOTE_ERROR_MESSAGES[kind].length).toBeGreaterThan(0);
    }
  });
});

function validQuoteResponse(overrides: Record<string, unknown> = {}, quoteOverrides: Record<string, unknown> = {}) {
  return {
    token: '1.payload.signature',
    availabilityStatus: 'NOT_CONFIRMED',
    quote: {
      journeySlug: 'manali-premium-escape',
      journeyName: 'Manali Premium Escape',
      destination: 'Manali',
      duration: '5 Days / 4 Nights',
      addOnLabels: ['Private Cab'],
      travelDate: '2099-06-15',
      adults: 2,
      children: 1,
      currency: 'INR',
      totalMinorUnits: 2_500_000,
      totalFormatted: '₹25,000',
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:15:00.000Z',
      ...quoteOverrides
    },
    ...overrides
  };
}

const CONTEXT = { journeySlug: 'manali-premium-escape', travelDate: '2099-06-15', adults: 2, children: 1 };

describe('validateQuoteResponse', () => {
  it('accepts a fully valid, matching response', () => {
    const result = validateQuoteResponse(validQuoteResponse(), CONTEXT);
    expect(result).not.toBeNull();
    expect(result?.token).toBe('1.payload.signature');
    expect(result?.quote.totalFormatted).toBe('₹25,000');
  });

  it('rejects a non-object response', () => {
    expect(validateQuoteResponse(null, CONTEXT)).toBeNull();
    expect(validateQuoteResponse('a string', CONTEXT)).toBeNull();
    expect(validateQuoteResponse(42, CONTEXT)).toBeNull();
  });

  it('rejects a missing/empty token', () => {
    expect(validateQuoteResponse(validQuoteResponse({ token: '' }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({ token: undefined }), CONTEXT)).toBeNull();
  });

  it('rejects a token that is not exactly 3 dot-separated segments', () => {
    expect(validateQuoteResponse(validQuoteResponse({ token: 'onlyonepart' }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({ token: 'a.b' }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({ token: 'a.b.c.d' }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({ token: 'a..c' }), CONTEXT)).toBeNull(); // empty middle segment
  });

  it('rejects a journeySlug mismatch', () => {
    const result = validateQuoteResponse(validQuoteResponse({}, { journeySlug: 'a-different-journey' }), CONTEXT);
    expect(result).toBeNull();
  });

  it('rejects a travelDate mismatch', () => {
    expect(validateQuoteResponse(validQuoteResponse({}, { travelDate: '2099-06-16' }), CONTEXT)).toBeNull();
  });

  it('rejects an adults/children mismatch', () => {
    expect(validateQuoteResponse(validQuoteResponse({}, { adults: 3 }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({}, { children: 0 }), CONTEXT)).toBeNull();
  });

  it('rejects a currency other than exactly INR', () => {
    expect(validateQuoteResponse(validQuoteResponse({}, { currency: 'USD' }), CONTEXT)).toBeNull();
  });

  it('rejects a non-positive, non-safe-integer, or wrong-type totalMinorUnits', () => {
    expect(validateQuoteResponse(validQuoteResponse({}, { totalMinorUnits: 0 }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({}, { totalMinorUnits: -100 }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({}, { totalMinorUnits: 1.5 }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({}, { totalMinorUnits: Number.MAX_SAFE_INTEGER + 10 }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({}, { totalMinorUnits: '2500000' }), CONTEXT)).toBeNull();
  });

  it('rejects a missing/empty totalFormatted', () => {
    expect(validateQuoteResponse(validQuoteResponse({}, { totalFormatted: '' }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({}, { totalFormatted: undefined }), CONTEXT)).toBeNull();
  });

  it('rejects an availabilityStatus other than exactly NOT_CONFIRMED', () => {
    expect(validateQuoteResponse(validQuoteResponse({ availabilityStatus: 'CONFIRMED' }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({ availabilityStatus: undefined }), CONTEXT)).toBeNull();
  });

  it('rejects an invalid issuedAt/expiresAt', () => {
    expect(validateQuoteResponse(validQuoteResponse({}, { issuedAt: 'not-a-date' }), CONTEXT)).toBeNull();
    expect(validateQuoteResponse(validQuoteResponse({}, { expiresAt: 'not-a-date' }), CONTEXT)).toBeNull();
  });

  it('rejects expiresAt <= issuedAt', () => {
    expect(
      validateQuoteResponse(validQuoteResponse({}, { issuedAt: '2026-01-01T00:15:00.000Z', expiresAt: '2026-01-01T00:15:00.000Z' }), CONTEXT)
    ).toBeNull();
    expect(
      validateQuoteResponse(validQuoteResponse({}, { issuedAt: '2026-01-01T00:15:00.000Z', expiresAt: '2026-01-01T00:00:00.000Z' }), CONTEXT)
    ).toBeNull();
  });

  it('rejects a missing quote object', () => {
    expect(validateQuoteResponse({ token: '1.a.b', availabilityStatus: 'NOT_CONFIRMED' }, CONTEXT)).toBeNull();
  });
});

describe('expiry helpers', () => {
  it('remainingMs never goes negative past expiry', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(remainingMs(past)).toBe(0);
  });

  it('remainingMs computes the correct positive gap before expiry', () => {
    const now = Date.now();
    const future = new Date(now + 90_000).toISOString();
    expect(remainingMs(future, now)).toBe(90_000);
  });

  it('isQuoteExpired is true exactly at and after the expiry instant', () => {
    const now = 1_000_000;
    const expiresAt = new Date(now).toISOString();
    expect(isQuoteExpired(expiresAt, now)).toBe(true);
    expect(isQuoteExpired(expiresAt, now - 1)).toBe(false);
    expect(isQuoteExpired(expiresAt, now + 1)).toBe(true);
  });

  it('formatCountdown renders M:SS, zero-padded seconds, never negative', () => {
    expect(formatCountdown(15 * 60 * 1000)).toBe('15:00');
    expect(formatCountdown(3_000)).toBe('0:03');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-5000)).toBe('0:00');
  });
});
