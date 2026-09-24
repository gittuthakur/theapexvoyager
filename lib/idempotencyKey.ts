/**
 * Shared idempotency-key format validation (Phase 9D — see app/api/bookings/route.ts).
 * Kept separate from lib/customerValidation.ts since it's a distinct, protocol-level
 * concern (not customer data) that a future payment-webhook or second write endpoint
 * could reuse unchanged.
 *
 * Accepted format: 16–128 characters from `[A-Za-z0-9._:-]` — deliberately covers a
 * UUID (36 chars, hyphens) and a wide range of other opaque client-generated key
 * schemes without being so permissive that it accepts whitespace, control characters,
 * or CR/LF. The pattern is anchored (`^...$`) over the *entire* trimmed string, so any
 * disallowed character anywhere — including embedded CR/LF — fails the whole match;
 * there is no separate CR/LF-specific check because none is needed.
 */
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;

export type IdempotencyKeyValidationResult = { valid: true; key: string } | { valid: false };

export function validateIdempotencyKey(raw: unknown): IdempotencyKeyValidationResult {
  if (typeof raw !== 'string') return { valid: false };
  const trimmed = raw.trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(trimmed)) return { valid: false };
  return { valid: true, key: trimmed };
}
