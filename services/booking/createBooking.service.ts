import crypto from 'node:crypto';
import { connectDB } from '@/lib/mongodb';
import { Booking, computeQuoteFingerprint, type BookingDocument } from '@/models/Booking';
import { validateCustomerInput, type CustomerValidationField } from '@/lib/customerValidation';
import { verifyJourneyQuoteToken } from './journeyQuote.service';

/**
 * Server-only Booking-creation service (Phase 9D). Creates only `PENDING_PAYMENT`
 * Bookings — no payment, no email/WhatsApp, no supplier confirmation, no UI. Price and
 * journey identity come EXCLUSIVELY from a verified signed quote token
 * (services/booking/journeyQuote.service.ts's `verifyJourneyQuoteToken`); nothing here
 * ever re-reads MongoDB for current Journey pricing or trusts any client-supplied
 * total/status/journey field. The raw token itself is never persisted — only its
 * one-way SHA-256 fingerprint (models/Booking.ts's `computeQuoteFingerprint`).
 *
 * PAYMENT-MODE DISCLOSURE: every Booking created here uses `paymentMode: 'FULL'` with
 * `payableNowMinorUnits` set to the full total and `balanceMinorUnits: 0`. This is a
 * PROVISIONAL, schema-compatible technical placeholder only — it is NOT a finalized
 * FULL-vs-ADVANCE business/payment policy decision, no payment order is created
 * anywhere in this phase, and no UI or customer-facing copy may claim "pay the full
 * amount now" on the strength of this value alone. The owner must explicitly decide
 * FULL vs. ADVANCE (and, if ADVANCE, the deposit rule) before any real payment-
 * collection phase is built against this field.
 */

export type CreateBookingRejection =
  | { reason: 'INVALID_QUOTE' }
  | { reason: 'EXPIRED_QUOTE' }
  | { reason: 'CONFIGURATION_ERROR' }
  | { reason: 'INVALID_CUSTOMER'; field: CustomerValidationField }
  | { reason: 'CONFLICT' }
  | { reason: 'SERVER_ERROR' };

export type CreateBookingResult = { ok: true; booking: BookingDocument; idempotentReplay: boolean } | { ok: false; rejection: CreateBookingRejection };

export interface CreateBookingInput {
  /** Already format-validated by the route (lib/idempotencyKey.ts) before this is called. */
  idempotencyKey: string;
  quoteToken: string;
  customer: Record<string, unknown>;
}

/**
 * Deterministic canonical fingerprint of "the logical request" — used to decide whether
 * a repeated Idempotency-Key is a legitimate replay of the SAME request (same quote,
 * same customer) or a genuinely different one reusing the same key (a client bug or an
 * attempted key-reuse), which must be rejected with 409 rather than silently served.
 *
 * Deliberately built from already-normalized, already-persisted fields only
 * (quoteFingerprint + customer name/phone/email) — NOT `specialRequests` (a customer
 * correcting a typo in their notes on retry shouldn't manufacture a false conflict) and
 * NOT the raw quote token (never available again once verified — see this file's own
 * top comment). Because every input is already a plain string, a fixed-shape
 * `JSON.stringify` (always the same key order) is a sufficient canonical serialization;
 * no dedicated canonicalization library is needed for four flat string fields.
 *
 * This is also why NO new "request fingerprint" field was added to models/Booking.ts:
 * this same function can be recomputed at conflict-check time from an EXISTING
 * Booking's own already-stored `quoteFingerprint`/`customer` fields, so comparing "is
 * this the same logical request" never requires persisting anything beyond what the
 * schema already had.
 */
export function computeBookingRequestFingerprint(input: { quoteFingerprint: string; customerName: string; customerPhone: string; customerEmail: string }): string {
  const canonical = JSON.stringify({
    quoteFingerprint: input.quoteFingerprint,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

const BOOKING_REFERENCE_PREFIX = 'TAV-';
// 12 random bytes -> 24 uppercase hex characters, 96 bits of crypto-random entropy —
// unguessable even under a future public booking-reference lookup surface, and
// `crypto.randomBytes` (never `Math.random()`, which is not cryptographically secure
// and must never be used for anything identifier-shaped that stands in for a real
// financial record). Raised from 5 bytes/40 bits (Phase 9D's initial cut) after
// pre-commit security review flagged 40 bits as insufficient headroom for that future
// surface.
const BOOKING_REFERENCE_RANDOM_BYTES = 12;
// Bounded, not infinite — see this file's own createBooking() doc comment. With ~2^96
// possible references, exhausting 5 independently-random attempts is astronomically
// unlikely; if it ever happens, this fails closed to SERVER_ERROR rather than looping.
const MAX_REFERENCE_ATTEMPTS = 5;

function generateBookingReferenceCandidate(): string {
  return `${BOOKING_REFERENCE_PREFIX}${crypto.randomBytes(BOOKING_REFERENCE_RANDOM_BYTES).toString('hex').toUpperCase()}`;
}

/** Inspects a MongoDB/Mongoose duplicate-key error (E11000) and reports which of this
 *  schema's two unique indexes it came from — `bookingReference` (an astronomically
 *  unlikely random collision, safe to retry with a fresh reference) or `idempotencyKey`
 *  (a genuine repeated request, safe to resolve by reading back the existing document
 *  and comparing fingerprints — see createBooking() below). Returns `null` for any
 *  other error shape, which the caller treats as an unrecoverable SERVER_ERROR. */
function getDuplicateKeyField(error: unknown): 'idempotencyKey' | 'bookingReference' | null {
  if (!error || typeof error !== 'object') return null;
  const err = error as { code?: number; keyPattern?: Record<string, unknown> };
  if (err.code !== 11000 || !err.keyPattern) return null;
  if ('idempotencyKey' in err.keyPattern) return 'idempotencyKey';
  if ('bookingReference' in err.keyPattern) return 'bookingReference';
  return null;
}

/**
 * Resolves an existing Booking found under the caller's Idempotency-Key against the
 * freshly-computed fingerprint of the current request: an exact match is a legitimate
 * replay (the existing document is returned as-is, never re-verified, never re-created);
 * a mismatch is a genuine conflict (the same key reused for a logically different
 * request), rejected without ever revealing anything about the existing document.
 * Shared by both call sites in createBooking() below — the initial idempotency-key
 * lookup and the duplicate-key race-recovery path — so there is exactly one place that
 * decides "same request or not."
 */
function resolveAgainstExisting(existing: BookingDocument, requestFingerprint: string): CreateBookingResult {
  const existingFingerprint = computeBookingRequestFingerprint({
    quoteFingerprint: existing.quoteFingerprint,
    customerName: existing.customer.name,
    customerPhone: existing.customer.phone,
    customerEmail: existing.customer.email ?? ''
  });

  if (existingFingerprint === requestFingerprint) {
    return { ok: true, booking: existing, idempotentReplay: true };
  }
  // Never leaks the existing booking's data on a genuine conflict.
  return { ok: false, rejection: { reason: 'CONFLICT' } };
}

/**
 * Creates a `PENDING_PAYMENT` Booking from a verified quote, or safely returns an
 * existing one on a genuine idempotent replay.
 *
 * Idempotency-key lookup ordering (pre-commit security correction over Phase 9D's
 * initial cut): this now reads for `idempotencyKey` BEFORE attempting quote
 * verification, specifically so that a replay of an already-created booking succeeds
 * even after the original quote has since expired, or even if the signing secret has
 * since rotated/gone missing — the persisted Booking is already the authoritative
 * record at that point, and re-verifying a token that's no longer needed would only
 * ever turn a legitimate replay into a spurious 410/503. Quote verification therefore
 * only ever runs on the "no existing booking for this key yet" path, where it is still
 * strictly required.
 *
 * This initial read is NOT the source of race safety, and is never treated as such —
 * see the user-facing note in resolveAgainstExisting()'s own doc comment. Two
 * concurrent requests with the same Idempotency-Key can both miss this read and both
 * reach `Booking.create()`; the schema's own unique index on `idempotencyKey`
 * (models/Booking.ts) is what actually guarantees only one of them succeeds. The loser
 * catches the resulting duplicate-key error and resolves it through the exact same
 * `resolveAgainstExisting()` call as the "found on the initial read" path — there is no
 * separate "is this a race" branch to get wrong.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  if (typeof input.quoteToken !== 'string' || input.quoteToken.length === 0) {
    return { ok: false, rejection: { reason: 'INVALID_QUOTE' } };
  }

  const customerResult = validateCustomerInput(input.customer);
  if (!customerResult.valid) return { ok: false, rejection: { reason: 'INVALID_CUSTOMER', field: customerResult.field } };
  const customer = customerResult.customer;

  // A plain SHA-256 hash of the raw token bytes — never a signature verification, and
  // never dependent on the token still being unexpired or the signing secret still
  // being valid. This is deliberate: it is exactly what lets a replay be resolved below
  // without needing either of those things to still hold.
  const quoteFingerprint = computeQuoteFingerprint(input.quoteToken);
  const requestFingerprint = computeBookingRequestFingerprint({
    quoteFingerprint,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email
  });

  await connectDB();

  const existing = await Booking.findOne({ idempotencyKey: input.idempotencyKey });
  if (existing) {
    return resolveAgainstExisting(existing, requestFingerprint);
  }

  // Verification only — never re-reads MongoDB for current Journey pricing, never
  // trusts anything from the request beyond the token itself. See
  // journeyQuote.service.ts's own doc comment: this call does no I/O and returns
  // almost immediately, so there is no meaningful window of "unnecessary work" between
  // this check and the DB write below. Reached only when no existing Booking was found
  // for this Idempotency-Key — see this function's own top comment.
  const verification = verifyJourneyQuoteToken(input.quoteToken);
  if (!verification.ok) {
    if (verification.reason === 'EXPIRED') return { ok: false, rejection: { reason: 'EXPIRED_QUOTE' } };
    if (verification.reason === 'CONFIGURATION_ERROR') return { ok: false, rejection: { reason: 'CONFIGURATION_ERROR' } };
    // MALFORMED, UNSUPPORTED_VERSION, and INVALID_SIGNATURE are all customer-facing
    // "invalid quote" — see quote.types.ts's own doc comment on why those three are
    // cryptographically indistinguishable and therefore deliberately not exposed as
    // separate reasons here either.
    return { ok: false, rejection: { reason: 'INVALID_QUOTE' } };
  }
  const snapshot = verification.snapshot;

  // FULL is a PROVISIONAL technical placeholder, not a finalized payment/business
  // policy — see this file's own top-level doc comment. No UI or copy anywhere may
  // present this as "pay the full amount now"; no payment order is created in this
  // phase at all. DEPOSIT exists in the schema (models/Booking.ts's PAYMENT_MODES) for
  // a future business-approved deposit percentage/fixed-amount rule, but no such rule
  // exists anywhere in this codebase today (the Phase 9 audit was explicit: never
  // invent a markup or deposit percentage). Choosing FULL here trivially satisfies the
  // schema's own payableNowMinorUnits + balanceMinorUnits === totalMinorUnits invariant
  // without guessing any business number — it is the smallest schema-compatible choice,
  // not a claim about how payment will actually work. The owner must explicitly decide
  // FULL vs. ADVANCE before any real payment-collection phase begins.
  const money = {
    currency: 'INR' as const,
    totalMinorUnits: snapshot.totalMinorUnits,
    payableNowMinorUnits: snapshot.totalMinorUnits,
    balanceMinorUnits: 0,
    paymentMode: 'FULL' as const
  };

  const baseDoc = {
    idempotencyKey: input.idempotencyKey,
    customer,
    journeySlug: snapshot.journeySlug,
    journeySnapshot: {
      name: snapshot.journeyName,
      destination: snapshot.destination,
      duration: snapshot.duration,
      stayOptionLabel: snapshot.stayOptionLabel,
      transportOptionLabel: snapshot.transportOptionLabel,
      paceLabel: snapshot.paceLabel,
      addOnLabels: snapshot.addOnLabels
    },
    travelDate: snapshot.travelDate,
    adults: snapshot.adults,
    children: snapshot.children,
    money,
    quoteFingerprint,
    quoteIssuedAt: new Date(snapshot.issuedAt),
    quoteExpiresAt: new Date(snapshot.expiresAt)
    // status/paymentStatus/fulfilmentStatus are deliberately omitted — the schema's own
    // defaults (models/Booking.ts) are exactly PENDING_PAYMENT/NOT_INITIATED/
    // NOT_STARTED, which are already the correct initial values for a just-created,
    // payment-not-yet-attempted booking. No new enum values were invented.
  };

  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    const bookingReference = generateBookingReferenceCandidate();
    try {
      const created = await Booking.create({ ...baseDoc, bookingReference });
      return { ok: true, booking: created, idempotentReplay: false };
    } catch (error) {
      const duplicateField = getDuplicateKeyField(error);

      if (duplicateField === 'bookingReference') {
        continue; // astronomically-unlikely random collision — retry with a fresh one
      }

      if (duplicateField === 'idempotencyKey') {
        // Lost a race to a concurrent identical (or conflicting) request — see this
        // function's own top comment on why this is safe without a preliminary lock.
        const raceWinner = await Booking.findOne({ idempotencyKey: input.idempotencyKey });
        if (!raceWinner) {
          // The row that caused our conflict is gone by the time we re-read (e.g.
          // deleted between the write and this read) — cannot safely resolve either
          // way; fail closed rather than silently create a second document.
          return { ok: false, rejection: { reason: 'SERVER_ERROR' } };
        }
        return resolveAgainstExisting(raceWinner, requestFingerprint);
      }

      // Any other error shape — never surfaced in detail to the caller.
      return { ok: false, rejection: { reason: 'SERVER_ERROR' } };
    }
  }

  return { ok: false, rejection: { reason: 'SERVER_ERROR' } };
}
