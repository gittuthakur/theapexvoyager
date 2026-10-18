/**
 * C4-B2-1 — mode switch for the (not yet wired) Google Places shared request budget. DARK: nothing imports this module yet.
 * Pure: it only interprets an environment object that the caller passes in.
 *
 * Environment variable: GOOGLE_API_BUDGET_MODE
 *
 *   off     - DEFAULT. The budget does nothing at all: no store access, no counting, no blocking.
 *   shadow  - count usage and report what WOULD have been blocked, but never block and never let a store problem affect the caller.
 *   enforce - block a Google request when its budget is exhausted, misconfigured or cannot be checked (fail closed).
 *
 * Only an explicit `shadow` or `enforce` (ignoring case and surrounding whitespace) leaves `off`. Unset, empty, unrecognised and
 * look-alike values (`on`, `true`, `enforced`, `enforcing`, `block`, `stop-new-writes`, typos ...) all resolve to `off`, so a typo
 * can never turn blocking on by accident. Nothing sets this variable in any environment.
 */
export type GoogleApiBudgetMode = 'off' | 'shadow' | 'enforce';

export const GOOGLE_API_BUDGET_MODE_ENV = 'GOOGLE_API_BUDGET_MODE';

export function googleApiBudgetMode(env: Record<string, string | undefined>): GoogleApiBudgetMode {
  const raw = env[GOOGLE_API_BUDGET_MODE_ENV];
  if (typeof raw !== 'string') return 'off';
  const value = raw.trim().toLowerCase();
  return value === 'shadow' || value === 'enforce' ? value : 'off';
}
