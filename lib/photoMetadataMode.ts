/**
 * D1-3a — mode switch for fetching FRESH Google photo metadata (author credits, per-photo Google Maps link, report
 * link) on Google-sourced property pages. Pure: it only interprets an environment object that the caller passes in.
 * Nothing calls it yet, and no environment file or production variable is configured by this change.
 *
 * Environment variable: GOOGLE_PHOTO_METADATA_MODE
 *
 *   legacy   - DEFAULT. The site behaves exactly as it does today: stored photo URLs, no fresh Google call, no credit.
 *              This only preserves current behaviour. It is NOT a statement that the current behaviour complies with
 *              Google's policies (stored photo names and uncredited photos are open compliance gaps).
 *   fresh    - fetch fresh photo metadata on demand and show credited photos (future stage; see lib/googlePhotoFetch.ts).
 *   disabled - kill switch: make no fresh Google call and show no Google photos on that page.
 *
 * Unset, empty or unrecognised values resolve to `legacy`, so a typo can never switch the feature on or off by accident.
 * Matching ignores case and surrounding whitespace.
 */
export type PhotoMetadataMode = 'legacy' | 'fresh' | 'disabled';

export const PHOTO_METADATA_MODE_ENV = 'GOOGLE_PHOTO_METADATA_MODE';

export function photoMetadataMode(env: Record<string, string | undefined>): PhotoMetadataMode {
  const raw = env[PHOTO_METADATA_MODE_ENV]?.trim().toLowerCase();
  return raw === 'fresh' || raw === 'disabled' ? raw : 'legacy';
}
