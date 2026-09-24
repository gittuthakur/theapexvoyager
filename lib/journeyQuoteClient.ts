import { validateJourneyTravelDate } from './dateValidation';

/**
 * Phase 9E — pure, framework-free client-side helpers for the Journey booking modal's
 * server-verified price UI. Deliberately has zero React/DOM dependency so it can be
 * unit-tested under this repo's existing node-environment Vitest config (no jsdom/RTL is
 * installed here — see components/modules/PackageBookingModal.tsx's own doc comment on
 * why the stateful wiring itself is kept to a thin, effectively-untested layer on top of
 * this file and journeyQuoteReducer.ts).
 *
 * Every function here is either a pure transform or a runtime validator — no `fetch`
 * call lives in this file. The actual request is made by the modal itself via
 * `lib/api.ts`'s `postJSON`, using `buildQuoteRequestPayload`'s output as the body and
 * `validateQuoteResponse` to check the result before ever trusting it.
 */

export interface QuoteSelections {
  journeySlug: string;
  /** ISO `YYYY-MM-DD`. */
  travelDate: string;
  adults: number;
  children: number;
  stayOptionId?: string;
  transportOptionId?: string;
  paceId?: string;
  addOnIds: string[];
}

export interface JourneyQuoteRequestPayload {
  journeySlug: string;
  travelDate: string;
  adults: number;
  children: number;
  stayOptionId?: string;
  transportOptionId?: string;
  paceId?: string;
  addOnIds: string[];
}

/**
 * Builds EXACTLY the payload `POST /api/journey-quotes` accepts — never a client-
 * computed total/price/currency/label (see quote.types.ts's own contract: the server
 * derives all of that itself from the verified journeySlug + option IDs). An
 * empty-string option ID (this modal's initial `useState('')` when a Journey has no
 * stay/transport options at all) is sent as `undefined`, never `''` — the server's own
 * contract treats `undefined` as "use the journey's default option" but would reject an
 * empty string outright as an unknown option ID.
 */
export function buildQuoteRequestPayload(selections: QuoteSelections): JourneyQuoteRequestPayload {
  return {
    journeySlug: selections.journeySlug,
    travelDate: selections.travelDate,
    adults: selections.adults,
    children: selections.children,
    stayOptionId: selections.stayOptionId || undefined,
    transportOptionId: selections.transportOptionId || undefined,
    paceId: selections.paceId || undefined,
    // Deduplicated defensively on the client too, even though the server also dedupes
    // (journeyQuote.service.ts) — this modal's own UI can never produce a duplicate via
    // toggleAddOn's include/exclude logic, but this stays correct even if that changes.
    addOnIds: Array.from(new Set(selections.addOnIds))
  };
}

/** Mirrors the exact rules `POST /api/journey-quotes` itself enforces (journeySlug
 *  present, travelDate a valid non-past calendar date, adults >= 1) — reusing
 *  `validateJourneyTravelDate` (lib/dateValidation.ts) rather than a second, potentially
 *  drifting date rule. This is a client-side pre-check only, purely to avoid firing a
 *  request the server would trivially reject; the server's own validation remains
 *  authoritative regardless of what this returns. */
export function canRequestQuote(selections: QuoteSelections): boolean {
  if (!selections.journeySlug) return false;
  if (!validateJourneyTravelDate(selections.travelDate).valid) return false;
  if (!Number.isInteger(selections.adults) || selections.adults < 1) return false;
  if (!Number.isInteger(selections.children) || selections.children < 0) return false;
  return true;
}

export type QuoteErrorKind = 'INVALID_SELECTIONS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE' | 'GENERIC';

/** Maps a `POST /api/journey-quotes` HTTP status to one of a small, fixed set of
 *  customer-safe error categories — an `undefined` status (a network failure, or any
 *  error shape that isn't `lib/api.ts`'s `ApiError`) falls into the same generic bucket
 *  as an unmapped 5xx, never a distinct "network" category the UI would need extra copy
 *  for (Phase 9E's Section E deliberately groups "500/network" together). */
export function mapQuoteErrorStatus(status: number | undefined): QuoteErrorKind {
  switch (status) {
    case 400:
      return 'INVALID_SELECTIONS';
    case 404:
      return 'NOT_FOUND';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'GENERIC';
  }
}

/** Fixed, approved copy only — never the server's own `error` message body, which could
 *  (harmlessly today, but not guaranteed forever) carry more detail than this UI should
 *  surface. See this file's own top comment on why raw response text is never rendered. */
export const QUOTE_ERROR_MESSAGES: Record<QuoteErrorKind, string> = {
  INVALID_SELECTIONS: 'Please review your selections and try again.',
  NOT_FOUND: 'This package is currently unavailable.',
  RATE_LIMITED: 'Too many requests — please try again in a moment.',
  SERVICE_UNAVAILABLE: 'Quotation is temporarily unavailable — please try again shortly.',
  GENERIC: 'Something went wrong. Please try again.'
};

/** The exact fields this UI needs, already validated against the current selections —
 *  never a raw cast of the server's JSON. See `validateQuoteResponse` below. */
export interface VerifiedJourneyQuote {
  journeySlug: string;
  journeyName: string;
  destination: string;
  duration: string;
  stayOptionLabel?: string;
  transportOptionLabel?: string;
  paceLabel?: string;
  addOnLabels: string[];
  travelDate: string;
  adults: number;
  children: number;
  currency: 'INR';
  totalMinorUnits: number;
  totalFormatted: string;
  issuedAt: string;
  expiresAt: string;
}

export interface VerifiedQuoteResult {
  token: string;
  quote: VerifiedJourneyQuote;
}

/** The exact selections the response is checked against — if the server's echoed
 *  journeySlug/travelDate/adults/children don't match what THIS request actually asked
 *  for, the response is discarded outright (see this function's own logic). This is the
 *  cheapest possible defence against a stale/cross-request response ever being trusted,
 *  independent of (and in addition to) the sequence-id-based staleness guard in
 *  journeyQuoteReducer.ts. */
export interface ExpectedQuoteContext {
  journeySlug: string;
  travelDate: string;
  adults: number;
  children: number;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Exactly 3 non-empty, dot-separated segments — matches
 *  services/booking/journeyQuote.service.ts's own token format
 *  (`${version}.${payloadB64}.${signatureB64}`) at the shape level only. This never
 *  decodes or trusts the payload segment itself (see this file's own top comment: the
 *  token is opaque to the client, verified only by the server). */
function isPlausibleTokenShape(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  const parts = value.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Runtime-validates a `POST /api/journey-quotes` response against the exact selections
 * that were sent, before this UI ever treats it as trustworthy. Returns `null` on ANY
 * mismatch or malformed field — never a partially-trusted result. This is the single
 * place that decides "is this a real, current, safe-to-display verified quote," per
 * Phase 9E's Section F contract.
 */
export function validateQuoteResponse(raw: unknown, context: ExpectedQuoteContext): VerifiedQuoteResult | null {
  if (raw === null || typeof raw !== 'object') return null;
  const body = raw as Record<string, unknown>;

  if (!isPlausibleTokenShape(body.token)) return null;
  if (body.quote === null || typeof body.quote !== 'object') return null;
  if (body.availabilityStatus !== 'NOT_CONFIRMED') return null;

  const quote = body.quote as Record<string, unknown>;

  if (quote.journeySlug !== context.journeySlug) return null;
  if (quote.travelDate !== context.travelDate) return null;
  if (quote.adults !== context.adults) return null;
  if (quote.children !== context.children) return null;
  if (quote.currency !== 'INR') return null;
  if (typeof quote.totalMinorUnits !== 'number' || !Number.isSafeInteger(quote.totalMinorUnits) || quote.totalMinorUnits <= 0) return null;
  if (!isNonEmptyString(quote.totalFormatted)) return null;
  if (typeof quote.journeyName !== 'string' || typeof quote.destination !== 'string' || typeof quote.duration !== 'string') return null;
  if (!Array.isArray(quote.addOnLabels) || !quote.addOnLabels.every((label) => typeof label === 'string')) return null;
  if (typeof quote.issuedAt !== 'string' || typeof quote.expiresAt !== 'string') return null;

  const issuedAtMs = Date.parse(quote.issuedAt);
  const expiresAtMs = Date.parse(quote.expiresAt);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs)) return null;
  if (expiresAtMs <= issuedAtMs) return null;

  return {
    token: body.token,
    quote: {
      journeySlug: quote.journeySlug,
      journeyName: quote.journeyName,
      destination: quote.destination,
      duration: quote.duration,
      stayOptionLabel: typeof quote.stayOptionLabel === 'string' ? quote.stayOptionLabel : undefined,
      transportOptionLabel: typeof quote.transportOptionLabel === 'string' ? quote.transportOptionLabel : undefined,
      paceLabel: typeof quote.paceLabel === 'string' ? quote.paceLabel : undefined,
      addOnLabels: quote.addOnLabels as string[],
      travelDate: quote.travelDate,
      adults: quote.adults,
      children: quote.children,
      currency: 'INR',
      totalMinorUnits: quote.totalMinorUnits,
      totalFormatted: quote.totalFormatted,
      issuedAt: quote.issuedAt,
      expiresAt: quote.expiresAt
    }
  };
}

/** Never negative — a caller past `expiresAt` gets exactly `0`, never a negative
 *  countdown. `now` is an injectable parameter purely for deterministic testing; every
 *  real call site omits it and gets the actual current time. */
export function remainingMs(expiresAtISO: string, now: number = Date.now()): number {
  return Math.max(0, Date.parse(expiresAtISO) - now);
}

export function isQuoteExpired(expiresAtISO: string, now: number = Date.now()): boolean {
  return remainingMs(expiresAtISO, now) <= 0;
}

/** `M:SS` — e.g. `14:59`, `0:03`, `0:00`. Never negative (see `remainingMs`). */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
