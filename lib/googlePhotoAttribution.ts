/**
 * D1-2 — IN-MEMORY Google photo attribution metadata. Pure and dependency-free on purpose: no I/O, no logging, no
 * imports, and nothing here is persisted or rendered yet (D1-3 will use it for the property detail gallery).
 *
 * WHY THIS EXISTS: every Google Places photo carries the author(s) it must be credited to, a link to the individual
 * photo on Google Maps and a link to report a problem with it. Today only `photo.name` is kept (lib/googlePlaces.ts
 * `placePhotoUrls`) and the rest is discarded. Google's policy (https://developers.google.com/maps/documentation/
 * places/web-service/policies) requires the credit wherever the photo is displayed, so the data has to be carried
 * from the response to the display.
 *
 * WHAT IT IS NOT: a store. The policy says Places content must not be cached or stored beyond the allowed exceptions
 * (only the place ID is exempt) and the Place Photos page says a photo name cannot be cached. Whether author
 * attributions may be stored is UNVERIFIED, so this module only ever produces short-lived in-memory values from a
 * response that is being handled right now. Nothing here may be written to MongoDB, PlaceCache or
 * DestinationSearchCache, logged, or cached.
 *
 * Schema (Google Places API (New) REST reference, `Photo` and `AuthorAttribution`): Photo { name, widthPx, heightPx,
 * authorAttributions[], flagContentUri, googleMapsUri }; AuthorAttribution { displayName, uri, photoUri }. Every
 * value arrives from a network response, so every value is validated and nothing is invented: a missing field stays
 * missing, and an author without a usable name is dropped (and counted), never replaced with a guess.
 */

/** One author a photo must be credited to. `displayName` is required (a credit without a name cannot be shown). */
export interface GooglePhotoAuthorAttribution {
  displayName: string;
  /** The author's profile link, when Google provided a safe https one. */
  uri?: string;
  /** The author's avatar image, when Google provided a safe https one. */
  photoUri?: string;
}

/** A photo with everything needed to credit it, in memory only. */
export interface GooglePhotoMetadata {
  /** Google photo resource name `places/<PLACE_ID>/photos/<TOKEN>`. Never persist it (policy: photo names cannot be cached). */
  name: string;
  widthPx?: number;
  heightPx?: number;
  /** Zero or more authors. Google documents the field as always present but possibly empty. */
  authorAttributions: GooglePhotoAuthorAttribution[];
  /** How many raw author entries could not be used (malformed, no name, unsafe name, over the cap). A photo with
   *  `authorAttributions: []` and `authorsDropped: 0` genuinely has no author; `authorsDropped > 0` means the credit is
   *  incomplete and a caller must not treat the photo as uncredited-by-design. */
  authorsDropped: number;
  /** Link to this individual photo on Google Maps. */
  googleMapsUri?: string;
  /** Link where a user can report a problem with this photo. */
  flagContentUri?: string;
}

// The same shape lib/../app/api/places/photo/route.ts accepts for a photo resource name (kept identical on purpose;
// a test compares the two literals so they cannot drift).
export const PHOTO_RESOURCE_NAME_PATTERN = /^places\/[A-Za-z0-9_.=-]{1,255}\/photos\/[A-Za-z0-9_.=-]{1,2048}$/;

const MAX_PHOTOS = 20;
const MAX_AUTHORS = 10;
const MAX_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 2048;
const MAX_DIMENSION_PX = 20_000;

// Characters that must never reach a displayed credit: C0 and C1 control characters, and the bidirectional
// override/isolate characters that can make a name display as something else (text-direction spoofing). Written as
// numeric code points on purpose, so no invisible character ever appears in this source file.
function isUnsafeTextCode(code: number): boolean {
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f) || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
}

function replaceUnsafeText(text: string): string {
  let out = '';
  for (const char of text) out += isUnsafeTextCode(char.codePointAt(0) ?? 0) ? ' ' : char;
  return out;
}

/** True when the text contains whitespace or a control character anywhere (a link may contain neither). */
function hasWhitespaceOrControl(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x20 || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanDisplayName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = replaceUnsafeText(value).replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 && cleaned.length <= MAX_NAME_LENGTH ? cleaned : undefined;
}

/** Returns the normalized href of a SAFE external link, or undefined. Only absolute https URLs are accepted
 *  (`javascript:`, `data:`, `http:`, relative and malformed values are all rejected), with no embedded credentials,
 *  no whitespace or control characters, and a bounded length. A scheme-relative `//host/path` value is read as https. */
export function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  let candidate = value.trim();
  if (candidate.length === 0 || candidate.length > MAX_URL_LENGTH) return undefined;
  if (hasWhitespaceOrControl(candidate)) return undefined;
  if (candidate.startsWith('//')) candidate = `https:${candidate}`;
  if (!/^https:\/\//i.test(candidate)) return undefined;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

function positiveDimension(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= MAX_DIMENSION_PX ? value : undefined;
}

function normalizeAuthor(raw: unknown): GooglePhotoAuthorAttribution | null {
  if (!isRecord(raw)) return null;
  const displayName = cleanDisplayName(raw.displayName);
  if (!displayName) return null;
  const uri = safeHttpsUrl(raw.uri);
  const photoUri = safeHttpsUrl(raw.photoUri);
  return { displayName, ...(uri ? { uri } : {}), ...(photoUri ? { photoUri } : {}) };
}

/** Normalizes ONE raw photo object from a Places response. Returns null when it is not a usable photo (not an object,
 *  or a missing/invalid resource name). Never throws. */
export function normalizeGooglePhoto(raw: unknown): GooglePhotoMetadata | null {
  if (!isRecord(raw)) return null;
  const name = raw.name;
  if (typeof name !== 'string' || !PHOTO_RESOURCE_NAME_PATTERN.test(name) || name.includes('..')) return null;

  const authors: GooglePhotoAuthorAttribution[] = [];
  let authorsDropped = 0;
  const rawAuthors = raw.authorAttributions;
  if (Array.isArray(rawAuthors)) {
    for (const entry of rawAuthors) {
      const author = authors.length < MAX_AUTHORS ? normalizeAuthor(entry) : null;
      if (author) authors.push(author);
    }
    authorsDropped = rawAuthors.length - authors.length;
  } else if (rawAuthors !== undefined && rawAuthors !== null) {
    // Present but not a list: the credit exists but cannot be read.
    authorsDropped = 1;
  }

  const widthPx = positiveDimension(raw.widthPx);
  const heightPx = positiveDimension(raw.heightPx);
  const googleMapsUri = safeHttpsUrl(raw.googleMapsUri);
  const flagContentUri = safeHttpsUrl(raw.flagContentUri);

  return {
    name,
    ...(widthPx ? { widthPx } : {}),
    ...(heightPx ? { heightPx } : {}),
    authorAttributions: authors,
    authorsDropped,
    ...(googleMapsUri ? { googleMapsUri } : {}),
    ...(flagContentUri ? { flagContentUri } : {})
  };
}

/** Normalizes a raw `photos` array. Unusable entries are skipped; a non-array yields []. Order is preserved. */
export function normalizeGooglePhotos(raw: unknown): GooglePhotoMetadata[] {
  if (!Array.isArray(raw)) return [];
  const photos: GooglePhotoMetadata[] = [];
  for (const entry of raw) {
    if (photos.length >= MAX_PHOTOS) break;
    const photo = normalizeGooglePhoto(entry);
    if (photo) photos.push(photo);
  }
  return photos;
}
