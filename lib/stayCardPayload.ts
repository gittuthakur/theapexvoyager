/**
 * Server-to-client payload trimming for the stay cards.
 *
 * `StayCard` (components/modules/StaysGrid.tsx, a client component) renders at most four photos: the main image
 * (`photos[0]`) and up to three thumbnails (`photos.slice(1, 4)`). A catalogue Stay carries up to ten stored photo
 * references, and every prop handed to a client component is serialized into the page's HTML, so the unused six
 * references per card were shipped to the browser without ever being rendered.
 *
 * `toCardStay` is applied only where a server page hands a Stay to `StayCard`. Property detail pages and galleries read
 * their own, untouched Stay, so they keep the complete photo list. Nothing is removed from a card: the first four
 * photos, in their original order, are exactly what the card already displayed.
 */

/** The most photos a stay card ever renders. Keep in step with StayCard's main image + three thumbnails. */
export const STAY_CARD_PHOTO_LIMIT = 4;

/**
 * Display-time photo mode (lib/photoDisplayMode.ts): a card then loads its photo from /api/places/photo/by-place (by Place ID)
 * and never uses the stored `photos` references, which hold Google photo names that expire and must not be cached. Such a
 * Stay (`cardPhotoMode` set, to 'display-time' or 'unavailable') therefore ships to the browser with `photos: []`, so the
 * stored names are not serialized into the page HTML or the /api/destinations JSON. A Stay without `cardPhotoMode` (the
 * default legacy mode) is returned as the very same object. Detail pages never go through this, they read their own Stay.
 */
export function withoutLegacyPhotosInDisplayMode<T extends { photos: string[]; cardPhotoMode?: string }>(stay: T): T {
  return stay.cardPhotoMode && stay.photos?.length ? { ...stay, photos: [] } : stay;
}

export function toCardStay<T extends { photos: string[]; cardPhotoMode?: string }>(stay: T): T {
  const stripped = withoutLegacyPhotosInDisplayMode(stay);
  return stripped.photos.length > STAY_CARD_PHOTO_LIMIT ? { ...stripped, photos: stripped.photos.slice(0, STAY_CARD_PHOTO_LIMIT) } : stripped;
}
