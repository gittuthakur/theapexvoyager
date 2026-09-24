'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { ApiError, postJSON } from './api';
import { buildQuoteRequestPayload, canRequestQuote, isQuoteExpired, mapQuoteErrorStatus, validateQuoteResponse, type QuoteSelections } from './journeyQuoteClient';
import { INITIAL_QUOTE_STATE, quoteReducer, type QuoteState } from './journeyQuoteReducer';

/**
 * Phase 9E — thin React wiring around the pure `quoteReducer`
 * (lib/journeyQuoteReducer.ts) and the pure helpers in lib/journeyQuoteClient.ts. This
 * file is deliberately kept as small and mechanical as possible: every actual decision
 * (is this response valid, is this the current request, has this quote expired) is made
 * by those pure, unit-tested functions — this hook only ever calls `fetch` (via
 * `postJSON`), manages one `AbortController` and one countdown interval, and dispatches
 * their results. It is NOT covered by an automated test itself (this repo's Vitest
 * config runs in a plain `node` environment with no jsdom/React Testing Library
 * installed — see this repo's Phase 9E final report for why that wasn't added), and is
 * instead verified by live/browser QA per that report's Section K.
 */

const COUNTDOWN_TICK_MS = 1000;

export interface UseJourneyQuoteResult {
  state: QuoteState;
  /** Fetches a fresh quote for the current selections — safe to call repeatedly (each
   *  call aborts any request still in flight first) and a no-op when the current
   *  selections don't pass `canRequestQuote`. */
  requestQuote: () => void;
  /** Aborts any in-flight request and discards any held token/quote immediately —
   *  `PackageBookingModal` calls this on modal close. The modal component itself is
   *  never unmounted while its parent page is (only its visible dialog is, via
   *  FloatingOverlay), so this hook's state would otherwise silently survive a
   *  close/reopen cycle without an explicit reset. */
  resetQuote: () => void;
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && (error as { name?: unknown }).name === 'AbortError';
}

export function useJourneyQuote(selections: QuoteSelections): UseJourneyQuoteResult {
  const [state, dispatch] = useReducer(quoteReducer, INITIAL_QUOTE_STATE);
  const sequenceRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;

  const abortInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const requestQuote = useCallback(() => {
    const current = selectionsRef.current;
    if (!canRequestQuote(current)) return;

    abortInFlight();
    const sequenceId = sequenceRef.current + 1;
    sequenceRef.current = sequenceId;
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: 'REQUEST_STARTED', sequenceId });

    const expectedContext = {
      journeySlug: current.journeySlug,
      travelDate: current.travelDate,
      adults: current.adults,
      children: current.children
    };

    postJSON<unknown>('/api/journey-quotes', buildQuoteRequestPayload(current), { signal: controller.signal })
      .then((raw) => {
        const verified = validateQuoteResponse(raw, expectedContext);
        if (!verified) {
          dispatch({ type: 'REQUEST_INVALID_RESPONSE', sequenceId });
          return;
        }
        dispatch({ type: 'REQUEST_SUCCEEDED', sequenceId, token: verified.token, quote: verified.quote });
      })
      .catch((error: unknown) => {
        // A request this hook itself aborted (selection changed, unmounted, or a manual
        // retry superseded it) is not a user-facing failure — never dispatched.
        if (isAbortError(error)) return;
        const status = error instanceof ApiError ? error.status : undefined;
        dispatch({ type: 'REQUEST_FAILED', sequenceId, kind: mapQuoteErrorStatus(status) });
      });
  }, [abortInFlight]);

  // Invalidate on any tracked-selection change — see journeyQuoteReducer.ts's own doc
  // comment on why this always resets to idle rather than patching the existing quote.
  // Deliberately keyed on a serialized snapshot of the primitive/array fields that
  // matter (never `selections` by reference, which is a fresh object every render) so
  // this effect only re-fires when a value actually changes.
  const selectionsKey = JSON.stringify(selections);
  useEffect(() => {
    abortInFlight();
    dispatch({ type: 'SELECTIONS_CHANGED' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectionsKey IS the selections dependency, by design
  }, [selectionsKey]);

  // Countdown / expiry — server-authoritative: always recomputed from the verified
  // quote's own `expiresAt`, never a client-side timer duration guess.
  useEffect(() => {
    if (state.status !== 'success') return;
    const { sequenceId, quote } = state;

    const checkExpiry = () => {
      if (isQuoteExpired(quote.expiresAt)) dispatch({ type: 'EXPIRED', sequenceId });
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, COUNTDOWN_TICK_MS);

    // Re-checks immediately on regained focus/visibility — a tab backgrounded for
    // longer than the quote's remaining lifetime must not go on showing a long-expired
    // price as if no time passed while it was hidden.
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkExpiry();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [state]);

  // Unmount cleanup — aborts any in-flight request so a late response can never reach a
  // dispatch after the component is gone.
  useEffect(() => abortInFlight, [abortInFlight]);

  const resetQuote = useCallback(() => {
    abortInFlight();
    dispatch({ type: 'RESET' });
  }, [abortInFlight]);

  return { state, requestQuote, resetQuote };
}
