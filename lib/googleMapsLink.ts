/**
 * THE single place a Google Maps deep link is ever constructed from a Place ID — every
 * Stay surface that offers a "View on Google Maps" action calls this, never builds its
 * own URL string. Prefers a real, provider-returned `googleMapsUri` (Google's own exact
 * URL for this place, from a Text Search response) over generating one; generates one
 * from `placeId` only when no `googleMapsUri` was ever captured. Returns `undefined`
 * (never a fabricated/empty-string link) when neither exists, so a caller can render no
 * button at all rather than a broken one — see this file's callers.
 *
 * IMPORTANT — this function proves only that a Maps LINK is genuine; it says nothing
 * about whether the REST of a property's displayed content (name/description/photos)
 * also came from Google. A curated Hotel can be enriched with a real, matched Google
 * place (lib/stays.ts's enrichHotelsWithPlaces) purely to get a working Maps link and a
 * supplementary rating/photos, while its title/description/amenities remain The Apex
 * Voyager India's own catalog data. Every caller must gate a "Property information
 * sourced from Google" attribution line on its own record's actual content provenance
 * (e.g. a Stay's `source === 'google'`), never on `buildGoogleMapsUrl`'s return value
 * alone — 2026-09 correction, see app/stays/stayInformationalOnly.test.ts.
 */
export function buildGoogleMapsUrl(params: { googleMapsUri?: string; placeId?: string }): string | undefined {
  if (params.googleMapsUri) return params.googleMapsUri;
  if (params.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(params.placeId)}`;
  }
  return undefined;
}
