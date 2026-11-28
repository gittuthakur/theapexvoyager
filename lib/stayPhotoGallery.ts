import { photoMetadataMode } from '@/lib/photoMetadataMode';
import type { EligiblePlaceId, FreshPhotosInput, FreshPhotosResult } from '@/lib/googlePhotoFetch';
import type { GooglePhotoAuthorAttribution } from '@/lib/googlePhotoAttribution';
import { toProxiedPhotoUrl } from '@/lib/googlePlaces';
import { isPlaceIdAllowedForDisplay, photoDisplayMode } from '@/lib/photoDisplayMode';
import { placePhotoByPlaceUrl } from '@/lib/placePhotoUrl';
import { photoDisplayKey } from '@/lib/photoDisplayKey';

/**
 * D1-3b — decides what the Google-sourced property gallery shows, per GOOGLE_PHOTO_METADATA_MODE.
 *
 *   legacy   (DEFAULT) -> `legacy`: the existing gallery with the stored photos, exactly as before. The fresh fetcher is NOT
 *                         called and no Google request is made.
 *   disabled           -> `unavailable`: no Google call; the page says photos are temporarily unavailable.
 *   fresh              -> fetch fresh photo metadata ONCE for the already-verified place, then:
 *                           - metadata could not be retrieved (timeout, quota, 5xx, our own limits, no key ...) -> `unavailable`
 *                           - Google has no photos, or none can be shown with a complete credit -> `placeholder`
 *                           - otherwise `credited` with only the photos that qualify.
 *
 * Owner-approved fresh-mode rules (they apply ONLY in fresh mode): a photo is shown only if its author credit is complete
 * (the fetcher already withholds photos with authorsDropped > 0) AND it has a valid photo-specific Google Maps link. An old,
 * uncredited stored photo URL is NEVER used in fresh mode, not even as a fallback.
 *
 * PRECONDITION: `eligiblePlaceId` comes from `eligiblePlaceIdFrom(lookup)` on a `found` result of getStayByPlaceIdResult,
 * which has already read the owner-exclusion list (fail closed) and checked the stored, published, eligible record. A null
 * id means the place was not found, excluded, unavailable or not Google-sourced: no Google request is ever made for it.
 * Nothing here is stored or cached, and nothing is logged.
 */

export interface CreditedGalleryPhoto {
  /** Protected photo-proxy URL built from the FRESH photo name (never a stored URL). */
  src: string;
  /** Genuine author credits, possibly several, possibly none (Google may legitimately send none). */
  authors: GooglePhotoAuthorAttribution[];
  /** Link to this individual photo on Google Maps. Always present: a photo without a valid one is not shown. */
  googleMapsUri: string;
  /** Link to report a problem with this photo, when Google provided a safe one. */
  flagContentUri?: string;
}

export type StayGalleryResolution =
  | { kind: 'legacy' }
  | { kind: 'credited'; photos: CreditedGalleryPhoto[] }
  | { kind: 'unavailable' }
  | { kind: 'placeholder' };

export interface StayGalleryDeps {
  env: Record<string, string | undefined>;
  /** Resolves the caller's address for the per-client limit. Only invoked in fresh mode. */
  getClientKey: () => Promise<string>;
  fetchPhotos: (input: FreshPhotosInput) => Promise<FreshPhotosResult>;
}

const PHOTO_WIDTH_PX = 1200;
const MAX_DISPLAY_POSITION = 9;

export async function resolveStayGallery(input: { eligiblePlaceId: EligiblePlaceId | null }, deps: StayGalleryDeps): Promise<StayGalleryResolution> {
  const mode = photoMetadataMode(deps.env);
  // GOOGLE_PHOTO_METADATA_MODE=disabled stays the kill switch for every detail-page Google call, display-time included.
  if (mode === 'disabled') return { kind: 'unavailable' };

  // Display-time photo mode (GOOGLE_PHOTO_DISPLAY_MODE=display-time) does NOT need GOOGLE_PHOTO_METADATA_MODE=fresh. It never
  // uses a stored photo URL and never puts a Google photo name in the page: credits come from one fresh Place Details
  // response, and each image is requested by Place ID + position through /api/places/photo/by-place (no-store).
  const displayTime = photoDisplayMode(deps.env) === 'display-time';
  if (mode === 'legacy' && !displayTime) return { kind: 'legacy' };

  // Fresh mode. Never reach Google for a place that did not pass the eligibility and owner-exclusion checks.
  if (!input.eligiblePlaceId) return { kind: 'unavailable' };
  // A place outside the pilot allowlist gets the placeholder, never its stored (expired) photos, and costs no Google request.
  if (displayTime && !isPlaceIdAllowedForDisplay(input.eligiblePlaceId, deps.env)) return { kind: 'placeholder' };

  let clientKey = 'unknown';
  try {
    clientKey = (await deps.getClientKey()) || 'unknown';
  } catch {
    // An unreadable address falls into the shared "unknown" bucket rather than skipping the limit.
  }

  let result: FreshPhotosResult;
  try {
    result = await deps.fetchPhotos({ placeId: input.eligiblePlaceId, apiKey: deps.env.GOOGLE_PLACES_API_KEY, mode: 'fresh', clientKey });
  } catch {
    return { kind: 'unavailable' };
  }

  if (!result.ok) {
    return result.reason === 'no-photos' || result.reason === 'unusable-photos' ? { kind: 'placeholder' } : { kind: 'unavailable' };
  }

  const photos: CreditedGalleryPhoto[] = [];
  for (const [position, photo] of result.photos.entries()) {
    // Hidden, not repaired: a photo with no valid photo-specific Google Maps link cannot satisfy the "view the source
    // photo on Google Maps" requirement, and an incomplete credit never gets here (the fetcher already withheld it).
    if (!photo.googleMapsUri || photo.authorsDropped > 0) continue;
    // The by-place route addresses a photo by its position (0-9); anything beyond that cannot be requested, so it is not shown.
    if (displayTime && position > MAX_DISPLAY_POSITION) continue;
    photos.push({
      // Display-time: Place ID + position + one-way match key. No photo name ever leaves the server.
      src: displayTime
        ? placePhotoByPlaceUrl(input.eligiblePlaceId, position, PHOTO_WIDTH_PX, photoDisplayKey(photo.googleMapsUri))
        : toProxiedPhotoUrl(photo.name, PHOTO_WIDTH_PX),
      authors: photo.authorAttributions,
      googleMapsUri: photo.googleMapsUri,
      ...(photo.flagContentUri ? { flagContentUri: photo.flagContentUri } : {})
    });
  }
  return photos.length > 0 ? { kind: 'credited', photos } : { kind: 'placeholder' };
}
