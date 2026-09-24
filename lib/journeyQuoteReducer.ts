import type { QuoteErrorKind, VerifiedJourneyQuote } from './journeyQuoteClient';

/**
 * Pure state machine for the Journey booking modal's server-verified price UI
 * (Phase 9E). Kept entirely framework-free and side-effect-free so it can be unit
 * tested directly under this repo's node-environment Vitest config — every race/
 * staleness/invalidation rule in Phase 9E's Section G is expressed here as a plain
 * `(state, action) => state` transition, not as `useEffect` timing that would need a
 * DOM/jsdom environment (not installed in this repo) to exercise.
 *
 * The actual `fetch`/AbortController/timer wiring lives in the thin React hook
 * (components/modules/PackageBookingModal.tsx's own `useJourneyQuote`), which only
 * ever dispatches actions into this reducer — it never re-implements any of the
 * decisions made here.
 */

export type QuoteState =
  | { status: 'idle' }
  | { status: 'loading'; sequenceId: number }
  | { status: 'success'; sequenceId: number; token: string; quote: VerifiedJourneyQuote }
  | { status: 'expired'; sequenceId: number }
  | { status: 'error'; sequenceId: number; kind: QuoteErrorKind };

export type QuoteAction =
  /** Any tracked selection changed, or the modal closed/reopened — always resets to
   *  `idle` outright, discarding any in-flight request's eventual result (via the
   *  sequence-id guard below) and any previously-shown price. */
  | { type: 'SELECTIONS_CHANGED' }
  | { type: 'REQUEST_STARTED'; sequenceId: number }
  | { type: 'REQUEST_SUCCEEDED'; sequenceId: number; token: string; quote: VerifiedJourneyQuote }
  | { type: 'REQUEST_FAILED'; sequenceId: number; kind: QuoteErrorKind }
  | { type: 'REQUEST_INVALID_RESPONSE'; sequenceId: number }
  | { type: 'EXPIRED'; sequenceId: number }
  | { type: 'RESET' };

/** A result only ever applies while its own request is still the one actually being
 *  waited on — a response (success, failure, or invalid-shape) arriving for a
 *  `sequenceId` that isn't the current `loading` one is a stale response from a
 *  superseded request (selections changed again, or a manual retry started a newer one)
 *  and is silently ignored, never allowed to overwrite whatever the current state is. */
function isAwaitingThisRequest(state: QuoteState, sequenceId: number): boolean {
  return state.status === 'loading' && state.sequenceId === sequenceId;
}

export const INITIAL_QUOTE_STATE: QuoteState = { status: 'idle' };

export function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case 'SELECTIONS_CHANGED':
    case 'RESET':
      return INITIAL_QUOTE_STATE;

    case 'REQUEST_STARTED':
      return { status: 'loading', sequenceId: action.sequenceId };

    case 'REQUEST_SUCCEEDED':
      if (!isAwaitingThisRequest(state, action.sequenceId)) return state;
      return { status: 'success', sequenceId: action.sequenceId, token: action.token, quote: action.quote };

    case 'REQUEST_FAILED':
      if (!isAwaitingThisRequest(state, action.sequenceId)) return state;
      return { status: 'error', sequenceId: action.sequenceId, kind: action.kind };

    case 'REQUEST_INVALID_RESPONSE':
      if (!isAwaitingThisRequest(state, action.sequenceId)) return state;
      // Malformed/mismatched response — never a distinct user-facing category (Phase
      // 9E's Section F: discard and show a generic quote error, same copy as any other
      // unexpected failure).
      return { status: 'error', sequenceId: action.sequenceId, kind: 'GENERIC' };

    case 'EXPIRED':
      // Only a still-current, still-successful quote can expire — an already-
      // superseded or already-errored state has nothing left to expire.
      if (state.status !== 'success' || state.sequenceId !== action.sequenceId) return state;
      return { status: 'expired', sequenceId: action.sequenceId };

    default:
      return state;
  }
}
