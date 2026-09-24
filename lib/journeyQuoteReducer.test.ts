import { describe, expect, it } from 'vitest';
import { INITIAL_QUOTE_STATE, quoteReducer, type QuoteState } from './journeyQuoteReducer';
import type { VerifiedJourneyQuote } from './journeyQuoteClient';

const SAMPLE_QUOTE: VerifiedJourneyQuote = {
  journeySlug: 'manali-premium-escape',
  journeyName: 'Manali Premium Escape',
  destination: 'Manali',
  duration: '5 Days / 4 Nights',
  addOnLabels: [],
  travelDate: '2099-06-15',
  adults: 2,
  children: 0,
  currency: 'INR',
  totalMinorUnits: 2_000_000,
  totalFormatted: '₹20,000',
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:15:00.000Z'
};

describe('quoteReducer — initial and basic transitions', () => {
  it('starts idle', () => {
    expect(INITIAL_QUOTE_STATE).toEqual({ status: 'idle' });
  });

  it('REQUEST_STARTED moves to loading with the given sequenceId', () => {
    const state = quoteReducer(INITIAL_QUOTE_STATE, { type: 'REQUEST_STARTED', sequenceId: 1 });
    expect(state).toEqual({ status: 'loading', sequenceId: 1 });
  });

  it('REQUEST_SUCCEEDED (matching sequence) moves loading to success', () => {
    const loading: QuoteState = { status: 'loading', sequenceId: 1 };
    const state = quoteReducer(loading, { type: 'REQUEST_SUCCEEDED', sequenceId: 1, token: 'tok', quote: SAMPLE_QUOTE });
    expect(state).toEqual({ status: 'success', sequenceId: 1, token: 'tok', quote: SAMPLE_QUOTE });
  });

  it('REQUEST_FAILED (matching sequence) moves loading to error', () => {
    const loading: QuoteState = { status: 'loading', sequenceId: 1 };
    const state = quoteReducer(loading, { type: 'REQUEST_FAILED', sequenceId: 1, kind: 'NOT_FOUND' });
    expect(state).toEqual({ status: 'error', sequenceId: 1, kind: 'NOT_FOUND' });
  });

  it('REQUEST_INVALID_RESPONSE (matching sequence) moves loading to a generic error', () => {
    const loading: QuoteState = { status: 'loading', sequenceId: 1 };
    const state = quoteReducer(loading, { type: 'REQUEST_INVALID_RESPONSE', sequenceId: 1 });
    expect(state).toEqual({ status: 'error', sequenceId: 1, kind: 'GENERIC' });
  });

  it('SELECTIONS_CHANGED always resets to idle, regardless of prior state', () => {
    const success: QuoteState = { status: 'success', sequenceId: 1, token: 'tok', quote: SAMPLE_QUOTE };
    expect(quoteReducer(success, { type: 'SELECTIONS_CHANGED' })).toEqual({ status: 'idle' });
    const error: QuoteState = { status: 'error', sequenceId: 1, kind: 'GENERIC' };
    expect(quoteReducer(error, { type: 'SELECTIONS_CHANGED' })).toEqual({ status: 'idle' });
  });

  it('RESET always resets to idle', () => {
    const success: QuoteState = { status: 'success', sequenceId: 1, token: 'tok', quote: SAMPLE_QUOTE };
    expect(quoteReducer(success, { type: 'RESET' })).toEqual({ status: 'idle' });
  });
});

describe('quoteReducer — stale-response protection (race safety)', () => {
  it('ignores a REQUEST_SUCCEEDED for a sequenceId older than the one currently loading', () => {
    const loadingNewer: QuoteState = { status: 'loading', sequenceId: 2 };
    const state = quoteReducer(loadingNewer, { type: 'REQUEST_SUCCEEDED', sequenceId: 1, token: 'stale', quote: SAMPLE_QUOTE });
    expect(state).toBe(loadingNewer); // unchanged — stale response discarded
  });

  it('ignores a REQUEST_FAILED for a superseded sequenceId', () => {
    const loadingNewer: QuoteState = { status: 'loading', sequenceId: 2 };
    const state = quoteReducer(loadingNewer, { type: 'REQUEST_FAILED', sequenceId: 1, kind: 'GENERIC' });
    expect(state).toBe(loadingNewer);
  });

  it('ignores a late response arriving after selections already changed back to idle', () => {
    const idle: QuoteState = { status: 'idle' };
    const state = quoteReducer(idle, { type: 'REQUEST_SUCCEEDED', sequenceId: 1, token: 'stale', quote: SAMPLE_QUOTE });
    expect(state).toBe(idle);
  });

  it('ignores a late response arriving after a NEW request already succeeded', () => {
    const alreadySucceeded: QuoteState = { status: 'success', sequenceId: 2, token: 'fresh', quote: SAMPLE_QUOTE };
    const state = quoteReducer(alreadySucceeded, { type: 'REQUEST_SUCCEEDED', sequenceId: 1, token: 'stale', quote: SAMPLE_QUOTE });
    expect(state).toBe(alreadySucceeded); // the newer, already-settled result is never overwritten by a late older one
  });

  it('accepts a REQUEST_SUCCEEDED only for the exact sequenceId currently being awaited', () => {
    const loading: QuoteState = { status: 'loading', sequenceId: 5 };
    const stale = quoteReducer(loading, { type: 'REQUEST_SUCCEEDED', sequenceId: 4, token: 'stale', quote: SAMPLE_QUOTE });
    expect(stale).toBe(loading);
    const current = quoteReducer(loading, { type: 'REQUEST_SUCCEEDED', sequenceId: 5, token: 'current', quote: SAMPLE_QUOTE });
    expect(current).toEqual({ status: 'success', sequenceId: 5, token: 'current', quote: SAMPLE_QUOTE });
  });
});

describe('quoteReducer — expiry', () => {
  it('EXPIRED transitions a matching, current success state to expired', () => {
    const success: QuoteState = { status: 'success', sequenceId: 3, token: 'tok', quote: SAMPLE_QUOTE };
    const state = quoteReducer(success, { type: 'EXPIRED', sequenceId: 3 });
    expect(state).toEqual({ status: 'expired', sequenceId: 3 });
  });

  it('EXPIRED is a no-op against a non-success state', () => {
    const loading: QuoteState = { status: 'loading', sequenceId: 3 };
    expect(quoteReducer(loading, { type: 'EXPIRED', sequenceId: 3 })).toBe(loading);
    const idle: QuoteState = { status: 'idle' };
    expect(quoteReducer(idle, { type: 'EXPIRED', sequenceId: 1 })).toBe(idle);
  });

  it('EXPIRED is a no-op when the sequenceId no longer matches the current success (superseded)', () => {
    const newerSuccess: QuoteState = { status: 'success', sequenceId: 4, token: 'newer', quote: SAMPLE_QUOTE };
    const state = quoteReducer(newerSuccess, { type: 'EXPIRED', sequenceId: 3 });
    expect(state).toBe(newerSuccess);
  });
});
