import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';
import {
  GoogleTransientImage,
  containsGooglePhotoToken,
  describeProvenance,
  findGooglePhotoTokenPaths,
  isGoogleOriginImageUrl,
  sanitizeForPersistence,
  sanitizeImageList,
  stripGooglePhotoTokens,
  type PersistableImageRecord
} from './photoProvenance';

const PHOTO_NAME = 'places/ChIJabc123_-XYZ/photos/AUacShhTokenValue0123456789';
const PROXY_URL = `/api/places/photo?name=${encodeURIComponent(PHOTO_NAME)}&w=640`;
const first = (overrides: Record<string, unknown> = {}) => ({ source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/hotel/lobby.jpg', ...overrides });

describe('valid first-party records', () => {
  it('accepts an https image with explicit rights and returns a new frozen record', () => {
    const input = first({ alt: 'Lobby', credit: 'Photo: The Apex Voyager' });
    const decision = sanitizeForPersistence(input);
    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.record).toEqual({ source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/hotel/lobby.jpg', alt: 'Lobby', credit: 'Photo: The Apex Voyager' });
    expect(Object.isFrozen(decision.record)).toBe(true);
    expect(decision.record).not.toBe(input);
  });

  it('accepts a site-relative path and licensed rights', () => {
    const decision = sanitizeForPersistence(first({ rights: 'licensed', url: '/images/stays/lobby.webp' }));
    expect(decision.ok && decision.record.url).toBe('/images/stays/lobby.webp');
  });

  it('trims the url and drops blank optional text', () => {
    const decision = sanitizeForPersistence(first({ url: '  https://cdn.example.com/a.jpg  ', alt: '   ' }));
    expect(decision.ok).toBe(true);
    if (decision.ok) expect(decision.record).toEqual({ source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/a.jpg' });
  });

  it('copies only known fields and reports the unknown ones it dropped, sorted', () => {
    const decision = sanitizeForPersistence(first({ zeta: 1, photoName: PHOTO_NAME, alpha: 2 }));
    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.droppedFields).toEqual(['alpha', 'photoName', 'zeta']);
    expect(JSON.stringify(decision.record)).not.toContain('places/');
  });

  it('is reported as first-party by describeProvenance', () => {
    expect(describeProvenance(first())).toBe('first-party');
  });
});

describe('transient Google images', () => {
  it('can be created only from a well-formed Places photo name', () => {
    const image = GoogleTransientImage.from(PHOTO_NAME);
    expect(image).not.toBeNull();
    expect(image?.source).toBe('google-transient');
    expect(image?.placeId).toBe('ChIJabc123_-XYZ');
    expect(image?.reveal()).toBe(PHOTO_NAME);
    for (const bad of ['', '   ', 'places/x/photos/', 'places//photos/abc', 'photos/abc', `${PHOTO_NAME}/../x`, 'places/a/photos/b c', null, undefined, 42, {}, []]) {
      expect(GoogleTransientImage.from(bad)).toBeNull();
    }
  });

  it('cannot be serialized: JSON.stringify throws, and nothing leaks through String, inspect, spread or keys', () => {
    const image = GoogleTransientImage.from(PHOTO_NAME)!;
    expect(() => JSON.stringify(image)).toThrow(/cannot be serialized/);
    expect(() => JSON.stringify({ photos: [image] })).toThrow();
    expect(String(image)).toBe('[GoogleTransientImage]');
    expect(inspect(image)).toBe('[GoogleTransientImage]');
    expect(Object.keys(image)).toEqual([]);
    expect({ ...image }).toEqual({});
    expect(Object.assign({}, image)).toEqual({});
    expect(Object.getOwnPropertyNames(image)).toEqual([]);
  });

  it('is never persistable, and is reported as google-transient', () => {
    const image = GoogleTransientImage.from(PHOTO_NAME)!;
    expect(sanitizeForPersistence(image)).toEqual({ ok: false, reason: 'google-transient' });
    expect(sanitizeForPersistence({ source: 'google-transient', rights: 'owned', url: 'https://x.example/a.jpg' })).toEqual({ ok: false, reason: 'google-transient' });
    expect(describeProvenance(image)).toBe('google-transient');
  });

  it('is not assignable to the persistable type (compile-time guard, enforced by tsc)', () => {
    const image = GoogleTransientImage.from(PHOTO_NAME)!;
    // @ts-expect-error a Google transient image is not a PersistableImageRecord
    const persistable: PersistableImageRecord = image;
    expect(persistable).toBe(image);
  });
});

describe('Google photo names and proxy URLs cannot be persisted', () => {
  it.each([
    ['proxy URL', PROXY_URL],
    ['absolute proxy URL', `https://www.theapexvoyager.in${PROXY_URL}`],
    ['encoded photo name in a custom path', `/media/${encodeURIComponent(PHOTO_NAME)}.jpg`],
    ['raw photo name in a query', `https://cdn.example.com/x?ref=${PHOTO_NAME}`],
    ['double-encoded proxy path', `/api%252Fplaces%252Fphoto?name=x`],
    ['Places media endpoint', `https://places.googleapis.com/v1/${PHOTO_NAME}/media?maxWidthPx=400`],
    ['legacy photo reference', 'https://example.com/photo?photo_reference=AbCd'],
    ['googleusercontent photo host', 'https://lh3.googleusercontent.com/p/AF1QipAbCdEf'],
    ['ggpht host', 'https://lh5.ggpht.com/abc'],
    ['mixed-case proxy path', '/API/Places/Photo?name=x']
  ])('rejects a first-party label on a Google-origin URL: %s', (_label, url) => {
    expect(sanitizeForPersistence(first({ url }))).toEqual({ ok: false, reason: 'google-origin-url' });
  });

  it('rejects a photo name in alt or credit text', () => {
    expect(sanitizeForPersistence(first({ alt: `View ${PHOTO_NAME}` }))).toEqual({ ok: false, reason: 'photo-token-in-field' });
    expect(sanitizeForPersistence(first({ credit: PROXY_URL }))).toEqual({ ok: false, reason: 'photo-token-in-field' });
  });

  it('a misleading first-party label never authorizes a Google proxy URL and never relabels it', () => {
    const misleading = { source: 'first-party', rights: 'licensed', url: PROXY_URL };
    expect(sanitizeForPersistence(misleading).ok).toBe(false);
    expect(describeProvenance(misleading)).toBe('unknown');
  });

  it('does not treat ordinary first-party URLs as Google', () => {
    for (const url of ['https://images.unsplash.com/photo-123?w=800', '/images/places-to-stay.jpg', 'https://cdn.example.com/photos/lobby.jpg', 'https://example.com/places/manali/hotels']) {
      expect(isGoogleOriginImageUrl(url)).toBe(false);
      expect(sanitizeForPersistence(first({ url })).ok).toBe(true);
    }
  });

  it('detects tokens in plain strings', () => {
    expect(containsGooglePhotoToken(PHOTO_NAME)).toBe(true);
    expect(containsGooglePhotoToken(PROXY_URL)).toBe(true);
    expect(containsGooglePhotoToken('A quiet hotel near the river')).toBe(false);
    expect(containsGooglePhotoToken('')).toBe(false);
    expect(containsGooglePhotoToken(undefined)).toBe(false);
    expect(containsGooglePhotoToken(42)).toBe(false);
  });
});

describe('unknown, missing and malformed input is rejected safely', () => {
  it.each([
    [null, 'not-an-object'],
    [undefined, 'not-an-object'],
    ['https://cdn.example.com/a.jpg', 'not-an-object'],
    [42, 'not-an-object'],
    [[], 'not-an-object'],
    [new Map(), 'not-an-object'],
    [new Date(), 'not-an-object'],
    [{}, 'missing-provenance'],
    [{ url: 'https://cdn.example.com/a.jpg', rights: 'owned' }, 'missing-provenance'],
    [{ source: '', url: 'https://cdn.example.com/a.jpg' }, 'missing-provenance'],
    [{ source: null }, 'missing-provenance'],
    [{ source: 'stock', rights: 'owned', url: 'https://cdn.example.com/a.jpg' }, 'unknown-provenance'],
    [{ source: 'First-Party', rights: 'owned', url: 'https://cdn.example.com/a.jpg' }, 'unknown-provenance'],
    [{ source: 7 }, 'unknown-provenance'],
    [{ source: 'first-party', url: 'https://cdn.example.com/a.jpg' }, 'missing-rights'],
    [{ source: 'first-party', rights: 'stolen', url: 'https://cdn.example.com/a.jpg' }, 'invalid-rights'],
    [{ source: 'first-party', rights: 1, url: 'https://cdn.example.com/a.jpg' }, 'invalid-rights']
  ])('%j -> %s', (input, reason) => {
    expect(sanitizeForPersistence(input)).toEqual({ ok: false, reason });
    expect(describeProvenance(input)).toBe('unknown');
  });

  it.each([
    [{ source: 'first-party', rights: 'owned' }, 'malformed-url'],
    [{ source: 'first-party', rights: 'owned', url: 5 }, 'malformed-url'],
    [{ source: 'first-party', rights: 'owned', url: '' }, 'blank-url'],
    [{ source: 'first-party', rights: 'owned', url: '    ' }, 'blank-url'],
    [{ source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/a b.jpg' }, 'malformed-url'],
    [{ source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/a\n.jpg' }, 'malformed-url'],
    [{ source: 'first-party', rights: 'owned', url: `https://cdn.example.com/${'a'.repeat(2100)}` }, 'malformed-url'],
    [{ source: 'first-party', rights: 'owned', url: 'http://cdn.example.com/a.jpg' }, 'unsupported-url'],
    [{ source: 'first-party', rights: 'owned', url: 'javascript:alert(1)' }, 'unsupported-url'],
    [{ source: 'first-party', rights: 'owned', url: 'data:image/png;base64,AAAA' }, 'unsupported-url'],
    [{ source: 'first-party', rights: 'owned', url: '//cdn.example.com/a.jpg' }, 'unsupported-url'],
    [{ source: 'first-party', rights: 'owned', url: 'a.jpg' }, 'unsupported-url'],
    [{ source: 'first-party', rights: 'owned', url: 'https://' }, 'malformed-url'],
    [{ source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/a.jpg', alt: 5 }, 'malformed-field'],
    [{ source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/a.jpg', credit: 'x'.repeat(201) }, 'malformed-field']
  ])('%j -> %s', (input, reason) => {
    expect(sanitizeForPersistence(input)).toEqual({ ok: false, reason });
  });

  it('rejects objects with a custom prototype (e.g. a class instance posing as a record)', () => {
    class Fake {
      source = 'first-party';
      rights = 'owned';
      url = 'https://cdn.example.com/a.jpg';
    }
    expect(sanitizeForPersistence(new Fake())).toEqual({ ok: false, reason: 'not-an-object' });
  });

  it('never throws on hostile input', () => {
    const cyclic: Record<string, unknown> = { source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/a.jpg' };
    cyclic.self = cyclic;
    expect(() => sanitizeForPersistence(cyclic)).not.toThrow();
    expect(() => sanitizeForPersistence({ source: 'first-party', rights: 'owned', url: '%E0%A4%A' })).not.toThrow();
    expect(() => sanitizeForPersistence(Object.create(null))).not.toThrow();
    expect(() => stripGooglePhotoTokens(cyclic)).not.toThrow();
  });
});

describe('determinism and no mutation', () => {
  it('produces identical output for identical input, and never changes the input', () => {
    const input = Object.freeze(first({ alt: 'Lobby', extra: { nested: [PROXY_URL] } }));
    const snapshot = JSON.stringify(input);
    const a = sanitizeForPersistence(input);
    const b = sanitizeForPersistence(input);
    expect(a).toEqual(b);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('sanitizeImageList keeps order, reports rejections by index, and does not touch the array', () => {
    const inputs = Object.freeze([first({ url: 'https://cdn.example.com/1.jpg' }), { url: PROXY_URL }, first({ url: 'https://cdn.example.com/3.jpg' }), GoogleTransientImage.from(PHOTO_NAME), first({ url: PROXY_URL })]);
    const snapshot = inputs.length;
    const result = sanitizeImageList(inputs);
    expect(result.records.map((r) => r.url)).toEqual(['https://cdn.example.com/1.jpg', 'https://cdn.example.com/3.jpg']);
    expect(result.rejected).toEqual([
      { index: 1, reason: 'missing-provenance' },
      { index: 3, reason: 'google-transient' },
      { index: 4, reason: 'google-origin-url' }
    ]);
    expect(inputs.length).toBe(snapshot);
    expect(sanitizeImageList(inputs)).toEqual(result);
  });

  it('sanitizeImageList rejects a non-array', () => {
    expect(sanitizeImageList('x')).toEqual({ records: [], rejected: [{ index: -1, reason: 'not-an-object' }] });
    expect(sanitizeImageList(undefined).records).toEqual([]);
  });
});

describe('stripGooglePhotoTokens (generic persistable data)', () => {
  const proposed = () => ({
    name: 'Hotel Alpha',
    placeId: 'ChIJabc123',
    photos: [PROXY_URL, 'https://cdn.example.com/own.jpg', PROXY_URL],
    nested: { image: PROXY_URL, keep: 'yes', deeper: [{ src: PHOTO_NAME }, { src: '/images/own.jpg' }] },
    created: new Date('2026-01-02T03:04:05Z'),
    count: 3,
    flag: false,
    nothing: null
  });

  it('removes every Google photo identifier, keeps everything else, and lists the removed paths', () => {
    const { value, removedPaths } = stripGooglePhotoTokens(proposed());
    expect(value).toEqual({
      count: 3,
      created: new Date('2026-01-02T03:04:05Z'),
      flag: false,
      name: 'Hotel Alpha',
      nested: { deeper: [{}, { src: '/images/own.jpg' }], keep: 'yes' },
      nothing: null,
      photos: ['https://cdn.example.com/own.jpg'],
      placeId: 'ChIJabc123'
    });
    expect(removedPaths).toEqual(['nested.deeper[0].src', 'nested.image', 'photos[0]', 'photos[2]']);
    expect(JSON.stringify(value)).not.toContain('places/');
    expect(JSON.stringify(value)).not.toContain('api/places/photo');
  });

  it('is deterministic regardless of key order, and does not mutate its input', () => {
    const a = proposed();
    const b = Object.fromEntries(Object.entries(proposed()).reverse());
    const snapshot = JSON.stringify(a);
    expect(JSON.stringify(stripGooglePhotoTokens(a).value)).toBe(JSON.stringify(stripGooglePhotoTokens(b).value));
    expect(JSON.stringify(a)).toBe(snapshot);
  });

  it('removes GoogleTransientImage instances, and never throws while doing so', () => {
    const result = stripGooglePhotoTokens({ list: [GoogleTransientImage.from(PHOTO_NAME), 'ok'] });
    expect(result.value).toEqual({ list: ['ok'] });
    expect(result.removedPaths).toEqual(['list[0]']);
  });

  it('removes what it cannot prove safe: functions, symbols, class instances, cycles', () => {
    const cyclic: Record<string, unknown> = { a: 1 };
    cyclic.self = cyclic;
    const result = stripGooglePhotoTokens({ fn: () => 1, sym: Symbol('x'), map: new Map(), set: new Set(), cyclic });
    expect(result.value).toEqual({ cyclic: { a: 1 } });
    expect(result.removedPaths).toEqual(['cyclic.self', 'fn', 'map', 'set', 'sym']);
  });

  it('removes a key whose name is itself a photo token', () => {
    const result = stripGooglePhotoTokens({ [PHOTO_NAME]: 'x', safe: 1 });
    expect(result.value).toEqual({ safe: 1 });
  });

  it('findGooglePhotoTokenPaths reports without changing anything', () => {
    const input = proposed();
    expect(findGooglePhotoTokenPaths(input)).toEqual(['nested.deeper[0].src', 'nested.image', 'photos[0]', 'photos[2]']);
    expect(findGooglePhotoTokenPaths({ ok: 'fine', n: 1 })).toEqual([]);
  });

  it('handles primitives and nullish roots', () => {
    expect(stripGooglePhotoTokens('plain').value).toBe('plain');
    expect(stripGooglePhotoTokens(PROXY_URL)).toEqual({ value: undefined, removedPaths: ['(root)'] });
    expect(stripGooglePhotoTokens(null).value).toBeNull();
    expect(stripGooglePhotoTokens(undefined).value).toBeUndefined();
  });
});

describe('hostile input: accessors, prototypes and size', () => {
  it('rejects a record whose field is a getter, without ever invoking it (no changing value between check and use)', () => {
    let calls = 0;
    const hostile: Record<string, unknown> = { source: 'first-party', url: 'https://cdn.example.com/a.jpg' };
    Object.defineProperty(hostile, 'rights', {
      enumerable: true,
      get() {
        calls += 1;
        return calls <= 3 ? 'owned' : 'stolen';
      }
    });
    expect(sanitizeForPersistence(hostile)).toEqual({ ok: false, reason: 'malformed-field' });
    expect(calls).toBe(0);
  });

  it.each(['source', 'rights', 'url', 'alt', 'credit'])('rejects an accessor on %s', (field) => {
    const record: Record<string, unknown> = { source: 'first-party', rights: 'owned', url: 'https://cdn.example.com/a.jpg' };
    Object.defineProperty(record, field, { enumerable: true, get: () => 'https://cdn.example.com/b.jpg' });
    expect(sanitizeForPersistence(record)).toEqual({ ok: false, reason: 'malformed-field' });
  });

  it('does not read inherited fields (a polluted prototype cannot supply provenance or rights)', () => {
    const proto = { source: 'first-party', rights: 'owned' };
    const record = Object.assign(Object.create(null) as Record<string, unknown>, { url: 'https://cdn.example.com/a.jpg' });
    Object.setPrototypeOf(record, proto);
    expect(sanitizeForPersistence(record)).toEqual({ ok: false, reason: 'not-an-object' });
    const plain: Record<string, unknown> = { url: 'https://cdn.example.com/a.jpg' };
    expect(sanitizeForPersistence(plain)).toEqual({ ok: false, reason: 'missing-provenance' });
  });

  it('stripGooglePhotoTokens never invokes a getter and never throws on one; the accessor is dropped and reported', () => {
    let calls = 0;
    const input: Record<string, unknown> = { a: 1 };
    Object.defineProperty(input, 'b', {
      enumerable: true,
      get() {
        calls += 1;
        throw new Error('boom');
      }
    });
    const result = stripGooglePhotoTokens(input);
    expect(result.value).toEqual({ a: 1 });
    expect(result.removedPaths).toEqual(['b']);
    expect(calls).toBe(0);
  });

  it('handles array accessors and holes without invoking anything', () => {
    let calls = 0;
    const list: unknown[] = ['ok', undefined, 'also ok'];
    delete list[1];
    Object.defineProperty(list, '3', { enumerable: true, configurable: true, get: () => (calls += 1) });
    const result = stripGooglePhotoTokens(list);
    expect(result.value).toEqual(['ok', 'also ok']);
    expect(result.removedPaths).toEqual(['[3]']);
    expect(calls).toBe(0);
  });

  it('drops a "__proto__" key instead of changing the copy prototype', () => {
    const parsed = JSON.parse('{"__proto__":{"polluted":true},"ok":1}');
    const result = stripGooglePhotoTokens(parsed);
    expect(result.value).toEqual({ ok: 1 });
    expect(Object.getPrototypeOf(result.value)).toBe(Object.prototype);
    expect((result.value as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(result.removedPaths).toEqual(['__proto__']);
  });

  it('bounds recursion depth: a very deep structure is cut off, not crashed on', () => {
    let deep: Record<string, unknown> = { leaf: 'x' };
    for (let i = 0; i < 20000; i += 1) deep = { child: deep };
    const result = stripGooglePhotoTokens(deep);
    expect(result.removedPaths.length).toBeGreaterThan(0);
    expect(() => JSON.stringify(result.value)).not.toThrow();
  });

  it('bounds total work: a huge flat array is truncated with a marker, quickly', () => {
    const huge = Array.from({ length: 300_000 }, (_, i) => i);
    const started = Date.now();
    const result = stripGooglePhotoTokens(huge);
    expect(Date.now() - started).toBeLessThan(2000);
    expect((result.value as unknown[]).length).toBeLessThan(60_000);
    expect(result.removedPaths).toContain('(truncated: input too large)');
  });

  it('scans pathological megabyte strings in a bounded time', () => {
    const started = Date.now();
    for (const text of ['places/'.repeat(150_000), 'places/a'.repeat(120_000), 'a.'.repeat(500_000), `places/${'a'.repeat(1_000_000)}`, 'places/a/photo'.repeat(80_000)]) {
      expect(containsGooglePhotoToken(text)).toBe(false);
    }
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('still detects a token inside a very long string', () => {
    expect(containsGooglePhotoToken(`${'x'.repeat(500_000)}${PHOTO_NAME}${'y'.repeat(500_000)}`)).toBe(true);
  });
});
