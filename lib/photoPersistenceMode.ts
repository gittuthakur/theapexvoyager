/**
 * C3-B2-1 — mode switch for SHADOW MONITORING of legacy Google photo persistence. Pure: it only interprets an environment
 * object the caller passes in.
 *
 * Environment variable: GOOGLE_PHOTO_PERSISTENCE_MODE
 *
 *   legacy - DEFAULT. Nothing changes. This preserves current behaviour only; it is NOT a statement that the current
 *            behaviour (stored Google photo names) complies with Google's policies.
 *   shadow - count, in aggregate and from data already in memory, how many photos about to be stored are Google-origin.
 *            Changes no database write, no image, no Google request and no response shown to the public.
 *
 * Only an explicit `shadow` (ignoring case and surrounding whitespace) enables shadow counting. Unset, empty, unrecognised and
 * RESERVED values (for example `stop-new-writes` or `enforce`) all resolve to `legacy`, so a typo or an early reference to a
 * future enforcement mode can never change what is stored. No value of this variable enables write enforcement: that needs a
 * separate, owner-approved change.
 */
export type PhotoPersistenceMode = 'legacy' | 'shadow';

export const PHOTO_PERSISTENCE_MODE_ENV = 'GOOGLE_PHOTO_PERSISTENCE_MODE';

export function photoPersistenceMode(env: Record<string, string | undefined>): PhotoPersistenceMode {
  const raw = env[PHOTO_PERSISTENCE_MODE_ENV];
  return typeof raw === 'string' && raw.trim().toLowerCase() === 'shadow' ? 'shadow' : 'legacy';
}
