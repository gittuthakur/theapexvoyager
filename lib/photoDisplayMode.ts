/**
 * Mode switch for DISPLAY-TIME Google photos on stay listing cards. Pure: it only interprets an environment object that
 * the caller passes in; it reads no database, makes no request and logs nothing.
 *
 * WHY: Google's Place Photos (New) documentation says "You cannot cache a photo name. Also, the name can expire. Ensure you
 * always get the name from a response to a request to Place Details (New), Nearby Search (New), or Text Search (New)."
 * The stored `/api/places/photo?name=...` URLs in PlaceCache are therefore not a compliant source. In `display-time` mode a
 * card asks `/api/places/photo/by-place` for the photo of a stored PLACE ID (place IDs may be stored indefinitely), and
 * that route obtains a fresh photo name from Places API (New) for that single request and never keeps it.
 *
 * Environment variable: GOOGLE_PHOTO_DISPLAY_MODE
 *   legacy       - DEFAULT. Cards behave exactly as before (stored photo URLs, existing proxy). The by-place route answers 404.
 *   display-time - cards use the by-place route.
 * Unset, empty or unrecognised values resolve to `legacy`, so a typo can never switch the feature on.
 *
 * Optional pilot allowlist: GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS (comma-separated Place IDs).
 *   Unset/blank - every eligible stay uses display-time photos (when the mode is `display-time`).
 *   Set         - ONLY the listed Place IDs do. Every other card shows the branded "No photo available" panel with NO image
 *                 request at all, and the by-place route refuses any other Place ID before any Google call. A set value with
 *                 no valid ID fails closed (nothing is allowed). Used for the controlled Preview validation.
 */
export type PhotoDisplayMode = 'legacy' | 'display-time';

export const PHOTO_DISPLAY_MODE_ENV = 'GOOGLE_PHOTO_DISPLAY_MODE';
export const PHOTO_DISPLAY_PILOT_ENV = 'GOOGLE_PHOTO_DISPLAY_PILOT_PLACE_IDS';

/** The same Place ID shape the fresh-photo fetcher library accepts. */
export const DISPLAY_PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,255}$/;

const MAX_PILOT_IDS = 50;

export function photoDisplayMode(env: Record<string, string | undefined>): PhotoDisplayMode {
  return env[PHOTO_DISPLAY_MODE_ENV]?.trim().toLowerCase() === 'display-time' ? 'display-time' : 'legacy';
}

/** null = no pilot restriction. A Set (possibly empty) = only those Place IDs are allowed. */
export function photoDisplayPilotPlaceIds(env: Record<string, string | undefined>): Set<string> | null {
  const raw = env[PHOTO_DISPLAY_PILOT_ENV];
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const ids = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => DISPLAY_PLACE_ID_PATTERN.test(part))
    .slice(0, MAX_PILOT_IDS);
  return new Set(ids);
}

/** Whether the display-time route may serve this Place ID in the current environment. */
export function isPlaceIdAllowedForDisplay(placeId: string, env: Record<string, string | undefined>): boolean {
  if (photoDisplayMode(env) !== 'display-time') return false;
  const pilot = photoDisplayPilotPlaceIds(env);
  return pilot === null || pilot.has(placeId);
}

/** What a listing card should do for a Google-sourced stay. `undefined` means "legacy: render exactly as before". */
export type CardPhotoMode = 'display-time' | 'unavailable';

export function cardPhotoModeFor(placeId: string, env: Record<string, string | undefined>): CardPhotoMode | undefined {
  if (photoDisplayMode(env) !== 'display-time') return undefined;
  return isPlaceIdAllowedForDisplay(placeId, env) ? 'display-time' : 'unavailable';
}
