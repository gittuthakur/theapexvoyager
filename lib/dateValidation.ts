// Extracted from app/api/booking-requests/route.ts (Phase 9B) so the new server-side
// Journey quote service (services/booking/journeyQuote.service.ts) can share the exact
// same travel-date rules as the existing enquiry route, rather than a second,
// potentially-drifting copy. Behavior is unchanged from the original inline logic.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** The business's own "today", independent of the server host's OS timezone (Vercel runs
 *  UTC) — this site only serves India-based travel, so IST is the one timezone every
 *  travelDate should be judged against, using the same ISO YYYY-MM-DD string-comparison
 *  convention lib/pricing.ts already uses for seasonal pricing windows. IST has no DST,
 *  so a fixed +5:30 offset is exact, not an approximation. */
export function todayISOInIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Rejects a structurally-plausible but impossible date (e.g. "2026-02-30", which
 *  `new Date(...)` would otherwise silently roll over to March 2) by round-tripping the
 *  parsed value back through its UTC fields. Only accepts strict `YYYY-MM-DD` — the
 *  regex has no optional groups, so "2026-2-3" or a trailing time component both fail
 *  before ever reaching `Date.UTC`. */
export function isValidCalendarDateISO(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export type TravelDateValidationResult = { valid: true } | { valid: false; reason: 'INVALID_FORMAT' | 'PAST_DATE' };

/** Combines both existing checks in the same order the route already applies them:
 *  format/calendar-validity first, then "not in the past" against IST "today" — so a
 *  caller can distinguish the two failure reasons without re-deriving either check
 *  itself. Uses whole-date (YYYY-MM-DD) string comparison throughout, deliberately never
 *  constructing a local-timezone `Date` from the input — that's what avoids the
 *  UTC/local-time off-by-one error a naive `new Date(travelDate) < new Date()` comparison
 *  would be exposed to right at the IST midnight boundary. */
export function validateJourneyTravelDate(value: string): TravelDateValidationResult {
  if (!value || !isValidCalendarDateISO(value)) return { valid: false, reason: 'INVALID_FORMAT' };
  if (value < todayISOInIST()) return { valid: false, reason: 'PAST_DATE' };
  return { valid: true };
}
