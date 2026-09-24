/**
 * Shared, minimal customer-input validators for booking-adjacent endpoints (Phase 9D).
 *
 * The email pattern below is copied verbatim from app/api/booking-requests/route.ts's
 * own private `EMAIL_PATTERN` — not imported from there, since that constant is
 * unexported and modifying that already-hardened, unrelated-scope route is outside this
 * phase's approved file list. Both endpoints therefore share identical email-format
 * behavior and the same Nodemailer address-parser CVE avoidance (GHSA-rcmh-qjqh-p98v,
 * GHSA-mm7p-fcc7-pg87), even though the pattern currently lives in two places. A future,
 * deliberate cleanup could have booking-requests/route.ts import from here instead —
 * not done in this phase to avoid an incidental change to a file outside its scope.
 *
 * Phone validation is genuine reuse, not a copy — `isValidIndianPhone` (lib/whatsapp.ts)
 * is already an exported, shared utility.
 */
import { isValidIndianPhone } from '@/lib/whatsapp';

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MAX_EMAIL_LENGTH = 200;
const MAX_NAME_LENGTH = 120;
export const MAX_SPECIAL_REQUEST_LENGTH = 1000;

// Every C0 control character and DEL — deliberately including \t\n\r, forcing a single
// line of plain text. A real customer name/note has no legitimate reason to contain a
// raw control character; rejecting all of them outright is simpler and safer than
// trying to allow "just newlines" and reason about every other byte in that range.
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

/** `null` = invalid (reject). Trims and collapses internal whitespace runs to a single
 *  space — this also keeps the value stable for services/booking/createBooking.service.ts's
 *  request-fingerprint comparison, so two requests differing only in whitespace are
 *  correctly treated as the same logical request rather than a false conflict. */
export function normalizeCustomerName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return null;
  if (CONTROL_CHAR_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/** `undefined` = not provided (caller decides if that's acceptable); `null` = provided
 *  but invalid (always reject). Lowercased and trimmed — email addresses are
 *  case-insensitive at the domain part and conventionally treated so throughout. */
export function normalizeCustomerEmail(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return undefined; // empty-after-trim reads as "not provided"
  if (trimmed.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/** `null` = invalid. Deliberately does NOT reformat/guess a country code or otherwise
 *  alter an ambiguous number — `isValidIndianPhone` either accepts the number as given
 *  or it's rejected outright. The only normalization applied is stripping spaces and
 *  hyphens, which is lossless (never changes which real number it represents) and
 *  keeps `customer.phone` in a consistent stored form for the existing
 *  `{'customer.phone': 1}` index (models/Booking.ts) and for a future "My Bookings"
 *  lookup. */
export function normalizeCustomerPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  if (!isValidIndianPhone(raw)) return null;
  return raw.replace(/[\s-]/g, '');
}

/** `undefined` = not provided; `null` = provided but invalid. Plain text only — `<`/`>`
 *  are rejected outright (not escaped) so this can never become an HTML/script
 *  injection vector even before any future surface renders it; nothing in this phase
 *  renders it at all, but the schema field this feeds (models/Booking.ts's
 *  `customer.specialRequests`) is expected to eventually appear in an admin view or
 *  customer-facing summary, and rejecting at the source is simpler and safer than
 *  relying on every future render site to escape correctly. */
export function normalizeSpecialRequests(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > MAX_SPECIAL_REQUEST_LENGTH) return null;
  if (CONTROL_CHAR_PATTERN.test(trimmed)) return null;
  if (/[<>]/.test(trimmed)) return null;
  return trimmed;
}

export type CustomerValidationField = 'name' | 'email' | 'phone' | 'specialRequests';

export interface ValidatedCustomer {
  name: string;
  phone: string;
  email: string;
  specialRequests?: string;
}

export type CustomerValidationResult = { valid: true; customer: ValidatedCustomer } | { valid: false; field: CustomerValidationField };

/**
 * Email is required here — unlike app/api/booking-requests/route.ts's non-binding
 * WhatsApp-lead flow (where phone alone is enough since the entire flow is a WhatsApp
 * handoff), this endpoint creates a real PENDING_PAYMENT record that a future payment
 * receipt/refund flow will need to reach the customer by email regardless of WhatsApp
 * availability. No existing contract anywhere in this codebase clearly permits
 * phone-only for a paid booking, so the safe, explicit choice is to require it.
 */
export function validateCustomerInput(input: Record<string, unknown>): CustomerValidationResult {
  const name = normalizeCustomerName(input.name);
  if (name === null) return { valid: false, field: 'name' };

  const phone = normalizeCustomerPhone(input.phone);
  if (phone === null) return { valid: false, field: 'phone' };

  const email = normalizeCustomerEmail(input.email);
  if (email === null || email === undefined) return { valid: false, field: 'email' };

  const specialRequests = normalizeSpecialRequests(input.specialRequests);
  if (specialRequests === null) return { valid: false, field: 'specialRequests' };

  return { valid: true, customer: { name, phone, email, ...(specialRequests !== undefined ? { specialRequests } : {}) } };
}
