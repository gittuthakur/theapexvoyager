// Write-time preservation rule for PlaceCache refresh upserts.
//
// Google omits `photos` for a place with no photos or on a partial/transient response, and
// placePhotoUrls() then returns []. Writing that [] through `findOneAndUpdate(..., doc)` ($set)
// replaced a record's previously stored photos with nothing. This drops an EMPTY incoming
// `photos` from the update, so:
//  - existing record + empty incoming photos -> stored photos are left untouched;
//  - new record + empty incoming photos      -> the schema default (`[]`) applies on insert,
//    exactly as before (see models/PlaceCache.ts, `photos: { default: [] }`);
//  - non-empty incoming photos               -> written as-is, replacing the old ones
//    (existing photo handling and attribution rules are unchanged).
//
// rating / userRatingCount need no special handling: an `undefined` value is already stripped
// from the update by Mongoose (verified for the repo's Mongoose version), so an omitted rating
// or review count never overwrites a stored one.
// No new storage or caching of photo data is introduced by this rule.
export function omitEmptyPhotos<T extends { photos?: readonly string[] }>(doc: T): Omit<T, 'photos'> | T {
  if (doc.photos && doc.photos.length > 0) return doc;
  const { photos: _omitted, ...rest } = doc;
  void _omitted;
  return rest;
}
