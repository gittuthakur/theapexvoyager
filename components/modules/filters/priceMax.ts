/**
 * A `priceMax` value is only meaningful as an "up to ₹X" ceiling when it's a real,
 * non-negative number. `NaN`/`Infinity`/a negative value (a malformed or hand-edited
 * URL — `?priceMax=abc`, `?priceMax=-100`) must never be treated or displayed as a
 * legitimate price ceiling. A valid value (including `0` or a decimal) is honored
 * exactly as given — this never invents a pricing policy, only rejects values that
 * cannot be a price at all. Shared by the server-side filter, the active-filter chip,
 * and the slider so all three agree on the same parsed value.
 */
export function parseValidPriceMax(raw?: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
