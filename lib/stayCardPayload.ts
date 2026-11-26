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

export function toCardStay<T extends { photos: string[] }>(stay: T): T {
  return stay.photos.length > STAY_CARD_PHOTO_LIMIT ? { ...stay, photos: stay.photos.slice(0, STAY_CARD_PHOTO_LIMIT) } : stay;
}
