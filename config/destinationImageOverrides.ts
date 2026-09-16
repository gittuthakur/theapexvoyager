/**
 * Destinations whose configured `image` was found (media-authenticity audit,
 * September 2026) to actually depict a different place — all three previously pointed at
 * Kasol's own photo. Shown with a neutral placeholder instead of a misattributed photo
 * until a verified, rights-cleared image of the destination itself is sourced and added
 * to the Photo Credits page. Remove a slug from this set only once that happens.
 *
 * Chail, Patnitop and Bhaderwah (Destinations Batch A, September 2026) are added for the
 * same reason from day one: no rights-cleared, identity-verified photo of any of the three
 * was found during sourcing, so their `image` field points at the generic destinations-page
 * hero (never a misattributed specific-place photo) and is hidden behind this same
 * placeholder until real photography is sourced.
 */
export const DESTINATIONS_WITHOUT_VERIFIED_IMAGE = new Set<string>([
  'tirthan-valley',
  'jibhi',
  'sainj-valley',
  'chail',
  'patnitop',
  'bhaderwah'
]);
