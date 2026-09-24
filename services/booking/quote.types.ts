/**
 * Server-only Journey quotation contract (Phase 9B). Deliberately scoped to pricing a
 * Journey, never to a customer's identity — name/phone/email are collected only at an
 * actual booking step, which does not exist yet (see the Phase 9 audit's Section F:
 * "Proposed Booking Model", not implemented this phase).
 *
 * Every money value in this file is an integer INR minor unit (paise) — never a
 * floating-point rupee amount. `lib/pricing.ts`'s `calculateBookingPrice()` (rupees,
 * float) remains the single pricing formula; conversion to minor units happens only at
 * this service boundary (see journeyQuote.service.ts's `toMinorUnits`), so the existing
 * enquiry flow and its display code are completely unaffected.
 */

export interface JourneyQuoteRequest {
  journeySlug: string;
  /** ISO `YYYY-MM-DD`. */
  travelDate: string;
  adults: number;
  children: number;
  /** Absent means "use the journey's default option" — same convention as
   *  `BookingConfig` (lib/pricing.ts). An explicitly-supplied but unknown ID is always
   *  rejected (`UNKNOWN_*`), never silently substituted — see journeyQuote.service.ts's
   *  own doc comment for why this is stricter than the existing enquiry route. */
  stayOptionId?: string;
  transportOptionId?: string;
  paceId?: string;
  addOnIds: string[];
}

export interface JourneyQuoteLineItem {
  label: string;
  amountMinorUnits: number;
}

/**
 * Everything frozen into the signed token at quote time — see
 * journeyQuote.service.ts's `createJourneyQuote`/`verifyJourneyQuoteToken`. Intentionally
 * carries no customer PII (see this file's top comment) and no supplier-availability
 * claim (see `expiresAt`'s comment) — this represents a price quotation only, never a
 * booking confirmation and never proof that a hotel/vehicle/supplier seat exists.
 */
export interface JourneyQuoteSnapshot {
  journeySlug: string;
  journeyName: string;
  destination: string;
  duration: string;
  stayOptionId?: string;
  stayOptionLabel?: string;
  transportOptionId?: string;
  transportOptionLabel?: string;
  paceId?: string;
  paceLabel?: string;
  /** Deduplicated — see journeyQuote.service.ts's doc comment on why a repeated add-on
   *  ID can never appear twice here (and therefore can never be double-charged). */
  addOnIds: string[];
  addOnLabels: string[];
  adults: number;
  children: number;
  /** ISO `YYYY-MM-DD` — the same value validated by `validateJourneyTravelDate`
   *  (lib/dateValidation.ts) at quote creation time. */
  travelDate: string;
  /** Always sums exactly to `totalMinorUnits` — see journeyQuote.service.ts's
   *  reconciliation logic. A presentational breakdown, not a set of independently
   *  authoritative charges. */
  lineItems: JourneyQuoteLineItem[];
  currency: 'INR';
  totalMinorUnits: number;
  /** ISO timestamp — when this exact price was computed from MongoDB. */
  issuedAt: string;
  /** ISO timestamp — after this, `verifyJourneyQuoteToken` rejects the token outright
   *  (`EXPIRED`) regardless of how valid its signature is. Default lifetime: 15 minutes
   *  (see journeyQuote.service.ts's `QUOTE_TTL_MS`). Expiry exists because Journey
   *  pricing can change (seasonal windows, a re-seed) — it is NOT a claim that supplier
   *  availability was checked or reserved for this window; no such check happens
   *  anywhere in this phase. */
  expiresAt: string;
}

export interface JourneyQuote {
  /** Opaque, server-signed — see journeyQuote.service.ts's token format. Never a
   *  predictable/sequential database ID; nothing about a quote is ever persisted to
   *  MongoDB (see that file's own doc comment). */
  token: string;
  snapshot: JourneyQuoteSnapshot;
}

export type QuoteRejectionReason =
  | 'UNKNOWN_JOURNEY'
  /** Reserved for a future `Journey.active`/status field — no such field exists on
   *  models/Journey.ts today (confirmed in the Phase 9 audit), so createJourneyQuote()
   *  never actually returns this reason yet. Kept in the union so a later addition of
   *  that field is a non-breaking change here, not a new enum value to thread through
   *  every caller retroactively. */
  | 'INACTIVE_JOURNEY'
  | 'INVALID_DATE'
  | 'INVALID_TRAVELLER_COUNT'
  | 'UNKNOWN_STAY_OPTION'
  | 'UNKNOWN_TRANSPORT_OPTION'
  | 'UNKNOWN_PACE'
  | 'UNKNOWN_ADD_ON'
  /** Signing secret missing, empty, or too weak — see journeyQuote.service.ts's
   *  `loadSigningSecret()`. Never carries a `detail` explaining why, and never appears
   *  from `verifyJourneyQuoteToken` with any information beyond this label — see that
   *  function's own doc comment on why the reason is never exposed further. */
  | 'CONFIGURATION_ERROR';

export type JourneyQuoteResult =
  | { ok: true; quote: JourneyQuote }
  | { ok: false; reason: QuoteRejectionReason };

export type QuoteVerificationReason =
  | 'EXPIRED'
  | 'MALFORMED'
  | 'UNSUPPORTED_VERSION'
  /** Covers a tampered payload, a tampered signature, and a signature produced with a
   *  different secret — all three are cryptographically indistinguishable from each
   *  other under HMAC (that's the point of an HMAC), so they deliberately share one
   *  reason rather than pretending the verifier can tell them apart. */
  | 'INVALID_SIGNATURE'
  | 'CONFIGURATION_ERROR';

export type QuoteVerificationResult =
  | { ok: true; snapshot: JourneyQuoteSnapshot }
  | { ok: false; reason: QuoteVerificationReason };
