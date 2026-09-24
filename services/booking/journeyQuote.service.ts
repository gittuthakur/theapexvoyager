import crypto from 'node:crypto';
import { getPackageBySlug } from '@/lib/packages';
import { calculateBookingPrice, type BookingConfig } from '@/lib/pricing';
import { validateJourneyTravelDate } from '@/lib/dateValidation';
import type { JourneyQuote, JourneyQuoteLineItem, JourneyQuoteRequest, JourneyQuoteResult, JourneyQuoteSnapshot, QuoteVerificationResult } from './quote.types';

/**
 * Server-only Journey quotation service (Phase 9B — see the Phase 9 audit's Section E).
 *
 * A quote is deliberately a signed, stateless token, never a MongoDB document: nothing
 * about a quote — issued or abandoned — is ever persisted (no new collection, no TTL
 * cleanup, no write of any kind). The amount a future payment step would ever charge
 * comes from *inside* a verified token, never from a fresh client-supplied field —
 * `verifyJourneyQuoteToken` never re-reads MongoDB or re-runs pricing; it only checks
 * that the token it was handed is the exact, unmodified one this service issued and
 * that it hasn't expired.
 *
 * Rejection here is intentionally STRICTER than the existing free-enquiry route
 * (app/api/booking-requests/route.ts): an explicitly-supplied but unknown stay/
 * transport/pace/add-on ID is always rejected outright, never silently substituted
 * with a default. Silently falling back is a defensible choice for a non-binding
 * enquiry; it would be the wrong one for something that will eventually gate a real
 * charge.
 */

export const MAX_JOURNEY_TRAVELLERS = 20;

export type TravellerValidationResult = { valid: true; adults: number; children: number } | { valid: false };

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/** Strict by design — rejects booleans, floats, NaN, negative numbers, and numeric
 *  strings (e.g. `"2"`), not just out-of-range integers. The real booking UI
 *  (PackageBookingModal.tsx) always sends genuine JS numbers via JSON, so this never
 *  rejects a real request; it only closes an input-validation gap a malformed/malicious
 *  request could otherwise use. Children's individual ceiling is deliberately derived
 *  from `MAX_JOURNEY_TRAVELLERS` (never a second hardcoded 19) — at least one adult is
 *  always required, so children alone can never legitimately reach the full combined cap. */
export function validateJourneyTravellerCounts(adultsRaw: unknown, childrenRaw: unknown): TravellerValidationResult {
  if (!isBoundedInteger(adultsRaw, 1, MAX_JOURNEY_TRAVELLERS)) return { valid: false };
  if (!isBoundedInteger(childrenRaw, 0, MAX_JOURNEY_TRAVELLERS - 1)) return { valid: false };
  if (adultsRaw + childrenRaw > MAX_JOURNEY_TRAVELLERS) return { valid: false };
  return { valid: true, adults: adultsRaw, children: childrenRaw };
}

const TOKEN_VERSION = 1;
const QUOTE_TTL_MS = 15 * 60 * 1000;
// A deliberately conservative floor, not a full entropy check (impossible to verify
// from length alone) — 32 characters matches common guidance for an HMAC secret (e.g.
// NextAuth's own AUTH_SECRET recommendation of 32+ random characters) and is cheap to
// enforce without a dependency. Documented in the Phase 9B report as the chosen rule.
const MIN_SECRET_LENGTH = 32;
// Allows for ordinary clock/processing skew between issuing and verifying a token
// (e.g. a slow request) without ever accepting a token whose issuedAt is wildly in the
// future — which would only ever happen from a forged payload (impossible under a
// valid signature) or a genuine server-clock bug, not a normal request.
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function loadSigningSecret(): { ok: true; secret: string } | { ok: false } {
  const raw = process.env.BOOKING_QUOTE_SECRET;
  if (typeof raw !== 'string' || raw.length < MIN_SECRET_LENGTH) return { ok: false };
  return { ok: true, secret: raw };
}

function toMinorUnits(rupees: number): number {
  return Math.round(rupees * 100);
}

/** The version segment is signed alongside the payload — never just the payload alone
 *  — so the version is cryptographically bound to it, not merely checked as a separate,
 *  out-of-band prefix. This matters the day a second token version exists: without this
 *  binding, a payload/signature pair validly produced for one version's signing input
 *  could conceivably be replayed under a different version label and still pass HMAC
 *  verification, since the signature itself would say nothing about which version it
 *  was computed for. Binding closes that off entirely, independent of (and in addition
 *  to) the fact that `verifyJourneyQuoteToken` already also rejects any version other
 *  than `TOKEN_VERSION` outright before it would even reach this check. */
function computeSignature(versionPart: string, payloadB64: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${versionPart}.${payloadB64}`).digest('base64url');
}

function encodeToken(snapshot: JourneyQuoteSnapshot, secret: string): string {
  const versionPart = String(TOKEN_VERSION);
  const payloadB64 = Buffer.from(JSON.stringify(snapshot), 'utf8').toString('base64url');
  const signatureB64 = computeSignature(versionPart, payloadB64, secret);
  return `${versionPart}.${payloadB64}.${signatureB64}`;
}

export async function createJourneyQuote(request: JourneyQuoteRequest): Promise<JourneyQuoteResult> {
  const secretResult = loadSigningSecret();
  if (!secretResult.ok) return { ok: false, reason: 'CONFIGURATION_ERROR' };

  if (!request.journeySlug) return { ok: false, reason: 'UNKNOWN_JOURNEY' };
  const pkg = await getPackageBySlug(request.journeySlug);
  if (!pkg) return { ok: false, reason: 'UNKNOWN_JOURNEY' };

  const dateResult = validateJourneyTravelDate(request.travelDate);
  if (!dateResult.valid) return { ok: false, reason: 'INVALID_DATE' };

  const travellerResult = validateJourneyTravellerCounts(request.adults, request.children);
  if (!travellerResult.valid) return { ok: false, reason: 'INVALID_TRAVELLER_COUNT' };

  if (request.stayOptionId !== undefined && !pkg.stayOptions?.some((option) => option.id === request.stayOptionId)) {
    return { ok: false, reason: 'UNKNOWN_STAY_OPTION' };
  }
  if (request.transportOptionId !== undefined && !pkg.transportOptions?.some((option) => option.id === request.transportOptionId)) {
    return { ok: false, reason: 'UNKNOWN_TRANSPORT_OPTION' };
  }
  if (request.paceId !== undefined && !pkg.pace?.some((option) => option.id === request.paceId)) {
    return { ok: false, reason: 'UNKNOWN_PACE' };
  }
  // Deduplicated before validation — a repeated ID must never be able to add its price
  // twice (see this service's own top comment and quote.types.ts's addOnIds doc).
  const dedupedAddOnIds = Array.from(new Set(request.addOnIds));
  for (const id of dedupedAddOnIds) {
    if (!pkg.addOns?.some((option) => option.id === id)) return { ok: false, reason: 'UNKNOWN_ADD_ON' };
  }

  const config: BookingConfig = {
    adults: travellerResult.adults,
    children: travellerResult.children,
    travelDate: request.travelDate,
    stayOptionId: request.stayOptionId ?? pkg.stayOptions?.[0]?.id ?? '',
    transportOptionId: request.transportOptionId,
    paceId: request.paceId,
    addOnIds: dedupedAddOnIds
  };

  // The SAME formula the client preview and the existing enquiry route both use — see
  // this file's top comment on why the preview/enquiry/quote calculations must stay
  // aligned rather than each having their own pricing logic.
  const breakdown = calculateBookingPrice(pkg, config);

  const baseMinor = toMinorUnits(breakdown.basePrice);
  const stayMinor = toMinorUnits(breakdown.stayUpgrade);
  const transportMinor = toMinorUnits(breakdown.transportUpgrade);
  const addOnLineItems: JourneyQuoteLineItem[] = breakdown.addOnLines.map((line) => ({ label: line.label, amountMinorUnits: toMinorUnits(line.price) }));
  const addOnsMinorSum = addOnLineItems.reduce((sum, line) => sum + line.amountMinorUnits, 0);
  const totalMinorUnits = toMinorUnits(breakdown.total);
  // The pace multiplier applies to the whole subtotal, not additively — rather than
  // rounding a fractional "pace line" independently (risking a 1-paise mismatch against
  // the independently-rounded total), it's computed as the balancing remainder so
  // `lineItems` always sums EXACTLY to `totalMinorUnits`, never off by a paisa.
  const paceAdjustmentMinorUnits = totalMinorUnits - (baseMinor + stayMinor + transportMinor + addOnsMinorSum);

  const lineItems: JourneyQuoteLineItem[] = [
    { label: breakdown.seasonLabel ? `Base price — ${breakdown.seasonLabel}` : 'Base price', amountMinorUnits: baseMinor },
    ...(stayMinor !== 0 ? [{ label: `Stay upgrade — ${breakdown.stayLabel}`, amountMinorUnits: stayMinor }] : []),
    ...(transportMinor !== 0 && breakdown.transportLabel ? [{ label: `Transport upgrade — ${breakdown.transportLabel}`, amountMinorUnits: transportMinor }] : []),
    ...addOnLineItems,
    ...(paceAdjustmentMinorUnits !== 0
      ? [{ label: breakdown.paceLabel ? `Pace adjustment — ${breakdown.paceLabel}` : 'Pace adjustment', amountMinorUnits: paceAdjustmentMinorUnits }]
      : [])
  ];

  const now = new Date();
  const snapshot: JourneyQuoteSnapshot = {
    journeySlug: pkg.slug,
    journeyName: pkg.name,
    destination: pkg.destination,
    duration: pkg.duration,
    stayOptionId: config.stayOptionId || undefined,
    stayOptionLabel: breakdown.stayLabel,
    transportOptionId: config.transportOptionId,
    transportOptionLabel: breakdown.transportLabel,
    paceId: config.paceId,
    paceLabel: breakdown.paceLabel,
    addOnIds: dedupedAddOnIds,
    addOnLabels: addOnLineItems.map((line) => line.label),
    adults: travellerResult.adults,
    children: travellerResult.children,
    travelDate: request.travelDate,
    lineItems,
    currency: 'INR',
    totalMinorUnits,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString()
  };

  return { ok: true, quote: { token: encodeToken(snapshot, secretResult.secret), snapshot } };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isLineItemArray(value: unknown): value is JourneyQuoteLineItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).label === 'string' &&
        typeof (item as Record<string, unknown>).amountMinorUnits === 'number' &&
        Number.isFinite((item as Record<string, unknown>).amountMinorUnits)
    )
  );
}

/** Strict runtime schema check on the decoded JSON — a valid HMAC signature only proves
 *  the bytes weren't altered after issuance, not that they were ever `JourneyQuoteSnapshot`
 *  shaped in the first place (relevant the day this token format itself changes and an
 *  old, still-technically-validly-signed token from a prior deploy is presented). Every
 *  field is checked; nothing is ever blindly cast. */
function validateSnapshotShape(value: unknown): JourneyQuoteSnapshot | null {
  if (value === null || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;

  if (typeof v.journeySlug !== 'string') return null;
  if (typeof v.journeyName !== 'string') return null;
  if (typeof v.destination !== 'string') return null;
  if (typeof v.duration !== 'string') return null;
  if (v.stayOptionId !== undefined && typeof v.stayOptionId !== 'string') return null;
  if (v.stayOptionLabel !== undefined && typeof v.stayOptionLabel !== 'string') return null;
  if (v.transportOptionId !== undefined && typeof v.transportOptionId !== 'string') return null;
  if (v.transportOptionLabel !== undefined && typeof v.transportOptionLabel !== 'string') return null;
  if (v.paceId !== undefined && typeof v.paceId !== 'string') return null;
  if (v.paceLabel !== undefined && typeof v.paceLabel !== 'string') return null;
  if (!isStringArray(v.addOnIds)) return null;
  if (!isStringArray(v.addOnLabels)) return null;
  if (typeof v.adults !== 'number' || !Number.isInteger(v.adults)) return null;
  if (typeof v.children !== 'number' || !Number.isInteger(v.children)) return null;
  if (typeof v.travelDate !== 'string') return null;
  if (!isLineItemArray(v.lineItems)) return null;
  if (v.currency !== 'INR') return null;
  if (typeof v.totalMinorUnits !== 'number' || !Number.isInteger(v.totalMinorUnits)) return null;
  if (typeof v.issuedAt !== 'string') return null;
  if (typeof v.expiresAt !== 'string') return null;

  return v as unknown as JourneyQuoteSnapshot;
}

/** Verifies a token issued by `createJourneyQuote` — never reloads or reprices the live
 *  Journey, never touches MongoDB. A valid, unexpired token's `snapshot` is returned
 *  exactly as frozen at issuance; a live Journey price change after issuance has no
 *  effect on an already-issued, still-valid token. Every failure path returns only a
 *  coarse `reason` — never the secret, never the raw token, never why a signature
 *  specifically failed — and this function never logs anything itself. */
export function verifyJourneyQuoteToken(token: string): QuoteVerificationResult {
  const secretResult = loadSigningSecret();
  if (!secretResult.ok) return { ok: false, reason: 'CONFIGURATION_ERROR' };

  if (typeof token !== 'string' || token.length === 0) return { ok: false, reason: 'MALFORMED' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'MALFORMED' };
  const [versionPart, payloadB64, signatureB64] = parts;

  if (versionPart !== String(TOKEN_VERSION)) return { ok: false, reason: 'UNSUPPORTED_VERSION' };
  if (!payloadB64 || !signatureB64) return { ok: false, reason: 'MALFORMED' };

  let expectedSignature: Buffer;
  let providedSignature: Buffer;
  try {
    expectedSignature = Buffer.from(computeSignature(versionPart, payloadB64, secretResult.secret), 'base64url');
    providedSignature = Buffer.from(signatureB64, 'base64url');
  } catch {
    return { ok: false, reason: 'MALFORMED' };
  }

  // Length is checked before timingSafeEqual — that function throws on mismatched
  // lengths rather than returning false, and a length mismatch here reveals nothing an
  // attacker doesn't already know (both are fixed-length base64url of a 32-byte HMAC
  // digest whenever the token wasn't tampered with).
  if (expectedSignature.length !== providedSignature.length || !crypto.timingSafeEqual(expectedSignature, providedSignature)) {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  let decodedJson: string;
  try {
    decodedJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return { ok: false, reason: 'MALFORMED' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodedJson);
  } catch {
    return { ok: false, reason: 'MALFORMED' };
  }

  const snapshot = validateSnapshotShape(parsed);
  if (!snapshot) return { ok: false, reason: 'MALFORMED' };

  const issuedAtMs = Date.parse(snapshot.issuedAt);
  const expiresAtMs = Date.parse(snapshot.expiresAt);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs)) return { ok: false, reason: 'MALFORMED' };

  const now = Date.now();
  if (issuedAtMs > now + MAX_CLOCK_SKEW_MS) return { ok: false, reason: 'MALFORMED' };
  if (now > expiresAtMs) return { ok: false, reason: 'EXPIRED' };

  return { ok: true, snapshot };
}
