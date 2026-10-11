export interface NumericParam {
  /** The parsed number — only ever set for a real, finite, non-negative value. */
  value?: number;
  /** True when the param was supplied but is not a real non-negative number
   *  (`?maxPrice=abc`, `?minSeats=-2`, `Infinity`) — as distinct from simply not supplied. */
  invalid: boolean;
}

/**
 * Parses a numeric URL filter (a price ceiling, a minimum seat count). Mirrors
 * parseValidPriceMax's rule (finite and >= 0) but also reports whether a supplied value
 * was rejected, so a page can show an honest invalid-filter state instead of silently
 * dropping the filter and falling through to the complete, unfiltered inventory.
 */
export function parseNonNegativeNumberParam(raw?: string): NumericParam {
  if (raw === undefined || raw.trim() === '') return { invalid: false };
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return { invalid: true };
  return { value: parsed, invalid: false };
}
