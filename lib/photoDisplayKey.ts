import { createHash } from 'node:crypto';

/**
 * A short, one-way match key for one Google photo, used by the display-time photo route (server only).
 *
 * WHY: the detail page renders credits (author, photo-specific Google Maps link) from ONE Place Details response, while each
 * gallery image is fetched later through /api/places/photo/by-place, which asks Google again and picks a photo BY POSITION.
 * If Google reordered or changed its photo list in between, a credit could end up beside the wrong picture. The page therefore
 * puts this key (derived from the photo's own Google Maps link, which Google gives for every photo that is shown) in the image
 * URL, and the route serves the image only when the photo at that position still has the same key.
 *
 * It is NOT the photo name: Google's photo name is never put in HTML, a URL, a log or storage. The key is a truncated SHA-256 of
 * the photo's public Google Maps link, so it cannot be turned back into one, and it carries no access to any image.
 */
export const PHOTO_DISPLAY_KEY_PATTERN = /^[0-9a-f]{16}$/;

export function photoDisplayKey(googleMapsUri: string): string {
  return createHash('sha256').update(googleMapsUri, 'utf8').digest('hex').slice(0, 16);
}
