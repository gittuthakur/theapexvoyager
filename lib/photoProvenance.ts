/**
 * C3-B1 — photo provenance and persistence-safety foundation (DARK: nothing imports this module yet).
 *
 * Why it exists. Google's Places Photos documentation says a photo name cannot be cached and may expire, and that Places
 * content must not be stored beyond the allowed exceptions
 * (https://developers.google.com/maps/documentation/places/web-service/place-photos). Today the site persists Google photo
 * names inside `/api/places/photo?name=...` URLs (see the acknowledged legacy list in lib/photoPersistenceRatchet.test.ts).
 * This module is the vocabulary a future change can use to keep Google photo identifiers out of anything that is stored,
 * while still letting genuinely owned or licensed images be stored.
 *
 * Rules it enforces:
 *   - There are exactly two image sources: `first-party` and `google-transient`.
 *   - First-party status is an EXPLICIT claim (`source: 'first-party'` plus `rights: 'owned' | 'licensed'`). It is never
 *     inferred from a URL, a host name or a local path, and a claim is refused if the URL is Google-origin (the Google photo
 *     proxy, a Google photo host or a Google photo name), so a wrong label can never launder Google content.
 *   - A Google photo identifier lives only inside a `GoogleTransientImage`, which cannot be serialized (JSON.stringify
 *     throws), has no enumerable data, and is not assignable to `PersistableImageRecord`.
 *   - Google-origin content is never relabelled as first-party.
 *
 * This module does not touch MongoDB, Google, the environment, the network or any existing write path.
 */

export const IMAGE_SOURCES = ['first-party', 'google-transient'] as const;
export type ImageSource = (typeof IMAGE_SOURCES)[number];

export const FIRST_PARTY_RIGHTS = ['owned', 'licensed'] as const;
export type FirstPartyRights = (typeof FIRST_PARTY_RIGHTS)[number];

/** The only image shape that may be persisted. A Google transient image is deliberately not a member. */
export interface FirstPartyImageRecord {
  readonly source: 'first-party';
  readonly rights: FirstPartyRights;
  /** `https://...` or a site-relative path. Never a Google photo URL (enforced by `sanitizeForPersistence`). */
  readonly url: string;
  readonly alt?: string;
  readonly credit?: string;
}
export type PersistableImageRecord = FirstPartyImageRecord;

export type RejectionReason =
  | 'not-an-object'
  | 'missing-provenance'
  | 'unknown-provenance'
  | 'google-transient'
  | 'missing-rights'
  | 'invalid-rights'
  | 'blank-url'
  | 'malformed-url'
  | 'unsupported-url'
  | 'google-origin-url'
  | 'photo-token-in-field'
  | 'malformed-field';

export type PersistenceDecision =
  | { readonly ok: true; readonly record: PersistableImageRecord; /** Unknown input fields that were NOT copied. */ readonly droppedFields: readonly string[] }
  | { readonly ok: false; readonly reason: RejectionReason };

// Same resource-name shape app/api/places/photo/route.ts accepts. Duplicated on purpose: this module must stay dependency-free.
const PHOTO_NAME_EXACT = /^places\/[A-Za-z0-9_.=-]{1,255}\/photos\/[A-Za-z0-9_.=-]{1,2048}$/;
const PHOTO_NAME_IN_TEXT = /places\/[A-Za-z0-9_.=-]+\/photos\/[A-Za-z0-9_.=-]+/i;
const PROXY_PATH = /\/api\/places\/photo(?![A-Za-z0-9_-])/i;
const LEGACY_PHOTO_REFERENCE = /[?&;]photo_?reference=/i;
// Hosts that serve Google Places / Maps photo bytes or metadata.
const GOOGLE_PHOTO_HOST = /(?:^|[/.@])(?:places\.googleapis\.com|maps\.googleapis\.com|(?:[a-z0-9-]+\.)?googleusercontent\.com|(?:[a-z0-9-]+\.)?ggpht\.com)(?![A-Za-z0-9-])/i;

const MAX_URL_LENGTH = 2048;
const MAX_ALT_LENGTH = 300;
const MAX_CREDIT_LENGTH = 200;
const MAX_WALK_DEPTH = 32;
const MAX_WALK_NODES = 50_000;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** The text as written plus once- and twice-percent-decoded, so encoding cannot hide a token. */
function variants(value: string): string[] {
  const once = safeDecode(value);
  const twice = safeDecode(once);
  return [...new Set([value, once, twice])];
}

/** True when a string carries a Google photo name, the Google photo proxy path or a legacy photo reference. */
export function containsGooglePhotoToken(value: unknown): boolean {
  if (typeof value !== 'string' || value === '') return false;
  return variants(value).some((text) => PHOTO_NAME_IN_TEXT.test(text) || PROXY_PATH.test(text) || LEGACY_PHOTO_REFERENCE.test(text));
}

/** True when a URL string points at, or is built from, Google photo content (proxy, Google photo host, or a photo name). */
export function isGoogleOriginImageUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value === '') return false;
  return containsGooglePhotoToken(value) || variants(value).some((text) => GOOGLE_PHOTO_HOST.test(text));
}

/**
 * An in-memory handle for one Google photo. It is the ONLY place a photo name may live, and it is built to resist being
 * stored by accident: the name is a true private field (not enumerable, not copied by spread or Object.assign),
 * `JSON.stringify` throws, and `String()` / `util.inspect` reveal nothing. Use `reveal()` for the in-memory request that needs
 * the name, and never put its result in anything persisted.
 */
export class GoogleTransientImage {
  readonly #photoName: string;

  private constructor(photoName: string) {
    this.#photoName = photoName;
  }

  /** Null for anything that is not a well-formed Places photo resource name. */
  static from(photoName: unknown): GoogleTransientImage | null {
    if (typeof photoName !== 'string' || !PHOTO_NAME_EXACT.test(photoName) || photoName.includes('..')) return null;
    return new GoogleTransientImage(photoName);
  }

  get source(): 'google-transient' {
    return 'google-transient';
  }

  /** The Place ID part (Place IDs are exempt from Google's caching restrictions; the photo token part is not). */
  get placeId(): string {
    return this.#photoName.split('/')[1];
  }

  /** The full photo name, for an immediate in-memory use only. */
  reveal(): string {
    return this.#photoName;
  }

  toJSON(): never {
    throw new Error('A Google transient image cannot be serialized or persisted.');
  }

  toString(): string {
    return '[GoogleTransientImage]';
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return '[GoogleTransientImage]';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

type OwnRead = { readonly kind: 'absent' } | { readonly kind: 'accessor' } | { readonly kind: 'value'; readonly value: unknown };

/** Reads one own DATA property exactly once. An accessor (getter/setter) is reported, never invoked, so a value cannot change between
 *  the check and the use, and no input code runs. (A Proxy can still lie about its descriptors; plain records are expected.) */
function readOwn(object: object, key: string): OwnRead {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (descriptor === undefined) return { kind: 'absent' };
  if ('get' in descriptor || 'set' in descriptor) return { kind: 'accessor' };
  return { kind: 'value', value: descriptor.value };
}

function hasControlOrSpace(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

function validateFirstPartyUrl(raw: unknown): { ok: true; url: string } | { ok: false; reason: RejectionReason } {
  if (typeof raw !== 'string') return { ok: false, reason: 'malformed-url' };
  const url = raw.trim();
  if (url === '') return { ok: false, reason: 'blank-url' };
  if (url.length > MAX_URL_LENGTH || hasControlOrSpace(url)) return { ok: false, reason: 'malformed-url' };
  const siteRelative = url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');
  if (!siteRelative && !url.startsWith('https://')) return { ok: false, reason: 'unsupported-url' };
  try {
    new URL(url, 'https://site.invalid');
  } catch {
    return { ok: false, reason: 'malformed-url' };
  }
  if (isGoogleOriginImageUrl(url)) return { ok: false, reason: 'google-origin-url' };
  return { ok: true, url };
}

function validateText(value: unknown, max: number): { ok: true; text: string | undefined } | { ok: false; reason: RejectionReason } {
  if (value === undefined) return { ok: true, text: undefined };
  if (typeof value !== 'string') return { ok: false, reason: 'malformed-field' };
  const text = value.trim();
  if (text.length > max) return { ok: false, reason: 'malformed-field' };
  if (containsGooglePhotoToken(text) || isGoogleOriginImageUrl(text)) return { ok: false, reason: 'photo-token-in-field' };
  return { ok: true, text: text === '' ? undefined : text };
}

/**
 * Decides whether a proposed image record may be persisted, and returns a NEW frozen first-party record if so. It never
 * mutates its input, copies only the known fields, and never turns Google-origin content into a first-party record.
 */
export function sanitizeForPersistence(input: unknown): PersistenceDecision {
  if (input instanceof GoogleTransientImage) return { ok: false, reason: 'google-transient' };
  if (!isPlainObject(input)) return { ok: false, reason: 'not-an-object' };

  // Every field is read exactly once, as plain data, before anything is validated; the record is built from these same values.
  const reads = {
    source: readOwn(input, 'source'),
    rights: readOwn(input, 'rights'),
    url: readOwn(input, 'url'),
    alt: readOwn(input, 'alt'),
    credit: readOwn(input, 'credit')
  };
  if (Object.values(reads).some((read) => read.kind === 'accessor')) return { ok: false, reason: 'malformed-field' };
  const valueOf = (read: OwnRead): unknown => (read.kind === 'value' ? read.value : undefined);

  const source = valueOf(reads.source);
  if (source === undefined || source === null || source === '') return { ok: false, reason: 'missing-provenance' };
  if (typeof source !== 'string' || !(IMAGE_SOURCES as readonly string[]).includes(source)) return { ok: false, reason: 'unknown-provenance' };
  if (source === 'google-transient') return { ok: false, reason: 'google-transient' };

  const rights = valueOf(reads.rights);
  if (rights === undefined) return { ok: false, reason: 'missing-rights' };
  if (typeof rights !== 'string' || !(FIRST_PARTY_RIGHTS as readonly string[]).includes(rights)) return { ok: false, reason: 'invalid-rights' };

  const url = validateFirstPartyUrl(valueOf(reads.url));
  if (!url.ok) return url;
  const alt = validateText(valueOf(reads.alt), MAX_ALT_LENGTH);
  if (!alt.ok) return alt;
  const credit = validateText(valueOf(reads.credit), MAX_CREDIT_LENGTH);
  if (!credit.ok) return credit;

  const known = new Set(['source', 'rights', 'url', 'alt', 'credit']);
  const droppedFields = Object.keys(input)
    .filter((key) => !known.has(key))
    .sort();

  const record: FirstPartyImageRecord = Object.freeze({
    source: 'first-party' as const,
    rights: rights as FirstPartyRights,
    url: url.url,
    ...(alt.text !== undefined ? { alt: alt.text } : {}),
    ...(credit.text !== undefined ? { credit: credit.text } : {})
  });
  return { ok: true, record, droppedFields: Object.freeze(droppedFields) };
}

export interface SanitizedImageList {
  readonly records: readonly PersistableImageRecord[];
  readonly rejected: readonly { readonly index: number; readonly reason: RejectionReason }[];
}

/** List form of `sanitizeForPersistence`: keeps the order of accepted records and reports every rejection by index. */
export function sanitizeImageList(inputs: unknown): SanitizedImageList {
  if (!Array.isArray(inputs)) return { records: [], rejected: [{ index: -1, reason: 'not-an-object' }] };
  const records: PersistableImageRecord[] = [];
  const rejected: { index: number; reason: RejectionReason }[] = [];
  inputs.forEach((input, index) => {
    const decision = sanitizeForPersistence(input);
    if (decision.ok) records.push(decision.record);
    else rejected.push({ index, reason: decision.reason });
  });
  return { records, rejected };
}

/** `first-party` only for a record that passes `sanitizeForPersistence`; `google-transient` only for the real class; else `unknown`. */
export function describeProvenance(input: unknown): ImageSource | 'unknown' {
  if (input instanceof GoogleTransientImage) return 'google-transient';
  return sanitizeForPersistence(input).ok ? 'first-party' : 'unknown';
}

const REMOVED = Symbol('removed');

export interface StrippedValue {
  /** A deep copy with every Google photo identifier removed. `undefined` if the whole value had to go. */
  readonly value: unknown;
  /** Paths (`a.b[2]`) of everything removed, in a stable order. */
  readonly removedPaths: readonly string[];
}

/**
 * Deep-copies an arbitrary value for storage, removing any string that carries a Google photo identifier or Google photo
 * URL, any GoogleTransientImage, and anything it cannot prove safe (functions, symbols, class instances, cycles, excessive
 * depth). Never mutates the input; the result and its removed-path list are deterministic for a given input.
 */
export function stripGooglePhotoTokens(input: unknown): StrippedValue {
  const removedPaths: string[] = [];
  const active = new WeakSet<object>();
  let visited = 0;
  let truncated = false;

  function clean(value: unknown, path: string, depth: number): unknown {
    const remove = (): typeof REMOVED => {
      removedPaths.push(path === '' ? '(root)' : path);
      return REMOVED;
    };
    visited += 1;
    if (visited > MAX_WALK_NODES) {
      truncated = true; // bounded work: everything past the budget is dropped, and one marker is reported at the end
      return REMOVED;
    }
    if (typeof value === 'string') return isGoogleOriginImageUrl(value) ? remove() : value;
    if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value !== 'object') return remove(); // bigint, symbol, function
    if (value instanceof GoogleTransientImage) return remove();
    if (depth > MAX_WALK_DEPTH || active.has(value)) return remove();
    if (value instanceof Date) return new Date(value.getTime());

    active.add(value);
    try {
      if (Array.isArray(value)) {
        const out: unknown[] = [];
        for (let index = 0; index < value.length; index += 1) {
          const read = readOwn(value, String(index));
          if (read.kind === 'absent') continue; // a hole
          const childPath = `${path}[${index}]`;
          if (read.kind === 'accessor') {
            removedPaths.push(childPath);
            continue;
          }
          const cleaned = clean(read.value, childPath, depth + 1);
          if (cleaned !== REMOVED) out.push(cleaned);
          if (truncated) break;
        }
        return out;
      }
      if (!isPlainObject(value)) return remove(); // Map, Set, Buffer, other class instances
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(value).sort()) {
        const childPath = path === '' ? key : `${path}.${key}`;
        // '__proto__' would change the copy's prototype if assigned; a key that is itself a Google token is dropped too.
        if (key === '__proto__' || isGoogleOriginImageUrl(key)) {
          removedPaths.push(childPath);
          continue;
        }
        const read = readOwn(value, key);
        if (read.kind !== 'value') {
          removedPaths.push(childPath); // an accessor is never invoked and never copied
          continue;
        }
        const cleaned = clean(read.value, childPath, depth + 1);
        if (cleaned !== REMOVED) out[key] = cleaned;
        if (truncated) break;
      }
      return out;
    } finally {
      active.delete(value);
    }
  }

  const result = clean(input, '', 0);
  if (truncated) removedPaths.push('(truncated: input too large)');
  return { value: result === REMOVED ? undefined : result, removedPaths };
}

/** Paths of every Google photo identifier found in a value, without changing it. */
export function findGooglePhotoTokenPaths(input: unknown): readonly string[] {
  return stripGooglePhotoTokens(input).removedPaths;
}
