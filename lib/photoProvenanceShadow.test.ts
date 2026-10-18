import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  MAX_SHADOW_ENTRY_LENGTH,
  MAX_SHADOW_PHOTOS_PER_PROPERTY,
  MAX_SHADOW_PROPERTIES,
  PHOTO_SHADOW_FIELDS,
  emptyPhotoShadowSummary,
  logPhotoShadowSummary,
  mergePhotoShadowSummaries,
  summarizePhotoShadow,
  type PhotoShadowSummary
} from './photoProvenanceShadow';

const NAME_A = 'places/ChIJsecretPlaceA/photos/AUacShTokenAAAA1111';
const NAME_B = 'places/ChIJsecretPlaceB/photos/AUacShTokenBBBB2222';
const proxy = (name: string, w = 1200) => `/api/places/photo?name=${encodeURIComponent(name)}&w=${w}`;
const OWN = 'https://cdn.example.com/own/lobby.jpg';

describe('counts', () => {
  it('counts Google proxy photos, photo-name tokens, unknown sources, and empties, exactly', () => {
    const summary = summarizePhotoShadow([
      [proxy(NAME_A), proxy(NAME_B, 640)], // 2 google, 2 tokens
      [OWN, '/images/own.jpg'], // 2 unknown
      [], // without photos
      undefined, // without photos
      null, // without photos
      [proxy(NAME_A), OWN] // 1 google, 1 unknown
    ]);
    expect(summary).toEqual({
      propertiesScanned: 6,
      photosScanned: 6,
      googleOriginPhotos: 3,
      photoNameTokenPhotos: 3,
      unknownPhotoSources: 3,
      propertiesWithoutPhotos: 3,
      malformedPhotoEntries: 0,
      skippedForBounds: 0
    });
  });

  it('counts a Google host URL as Google-origin but not as a photo-name token', () => {
    const summary = summarizePhotoShadow([['https://lh3.googleusercontent.com/p/AF1QipAbCd']]);
    expect(summary.googleOriginPhotos).toBe(1);
    expect(summary.photoNameTokenPhotos).toBe(0);
  });

  it('never counts a non-Google URL as first-party: provenance is not inferred, it is "unknown"', () => {
    const summary = summarizePhotoShadow([['https://images.unsplash.com/photo-1?w=800', '/images/places-to-stay.jpg']]);
    expect(summary.unknownPhotoSources).toBe(2);
    expect(summary.googleOriginPhotos).toBe(0);
    expect(PHOTO_SHADOW_FIELDS).not.toContain('firstPartyPhotos');
  });

  it('counts encoded and double-encoded photo names', () => {
    const summary = summarizePhotoShadow([[`/media/${encodeURIComponent(NAME_A)}.jpg`, `/x?r=${encodeURIComponent(encodeURIComponent(NAME_B))}`]]);
    expect(summary.photoNameTokenPhotos).toBe(2);
  });

  it('an empty list of properties gives all zeros', () => {
    expect(summarizePhotoShadow([])).toEqual(emptyPhotoShadowSummary());
  });
});

describe('missing, null, malformed and mixed photo values', () => {
  it.each([
    ['a string', 'x'],
    ['a number', 7],
    ['true', true],
    ['an object', { 0: proxy(NAME_A), length: 1 }],
    ['a function', () => 1]
  ])('a non-array photo value (%s) counts as no photos plus one malformed entry', (_label, value) => {
    expect(summarizePhotoShadow([value])).toMatchObject({ propertiesScanned: 1, propertiesWithoutPhotos: 1, malformedPhotoEntries: 1, photosScanned: 0 });
  });

  it('counts non-string and blank entries as malformed and keeps counting the rest', () => {
    const summary = summarizePhotoShadow([[proxy(NAME_A), null, undefined, 5, {}, ['nested'], '', '   ', OWN]]);
    expect(summary).toMatchObject({ photosScanned: 2, googleOriginPhotos: 1, unknownPhotoSources: 1, malformedPhotoEntries: 7 });
  });

  it('skips array holes without counting them', () => {
    const list: unknown[] = [OWN, undefined, OWN];
    delete list[1];
    expect(summarizePhotoShadow([list]).photosScanned).toBe(2);
  });

  it('treats a non-array outer value as nothing to scan, and never throws', () => {
    for (const bad of [null, undefined, 'x', 5, {}, new Map()]) {
      expect(summarizePhotoShadow(bad)).toEqual(emptyPhotoShadowSummary());
    }
  });
});

describe('bounded and safe on hostile input', () => {
  it('examines at most MAX_SHADOW_PROPERTIES properties and reports the rest as skipped', () => {
    const many = Array.from({ length: MAX_SHADOW_PROPERTIES + 500 }, () => [OWN]);
    const summary = summarizePhotoShadow(many);
    expect(summary.propertiesScanned).toBe(MAX_SHADOW_PROPERTIES);
    expect(summary.skippedForBounds).toBe(500);
  });

  it('examines at most MAX_SHADOW_PHOTOS_PER_PROPERTY entries of one property', () => {
    const summary = summarizePhotoShadow([Array.from({ length: MAX_SHADOW_PHOTOS_PER_PROPERTY + 40 }, () => OWN)]);
    expect(summary.photosScanned).toBe(MAX_SHADOW_PHOTOS_PER_PROPERTY);
    expect(summary.skippedForBounds).toBe(40);
  });

  it('does not run the matchers on an over-long entry (counted malformed), so a huge string cannot stall it', () => {
    const started = Date.now();
    const summary = summarizePhotoShadow([['places/'.repeat(500_000), `${'a'.repeat(MAX_SHADOW_ENTRY_LENGTH + 1)}`]]);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(summary).toMatchObject({ photosScanned: 0, malformedPhotoEntries: 2 });
  });

  it('processes the maximum workload quickly', () => {
    const big = Array.from({ length: MAX_SHADOW_PROPERTIES }, () => Array.from({ length: 10 }, (_, i) => (i % 2 ? proxy(NAME_A) : OWN)));
    const started = Date.now();
    const summary = summarizePhotoShadow(big);
    expect(Date.now() - started).toBeLessThan(3000);
    expect(summary.photosScanned).toBe(MAX_SHADOW_PROPERTIES * 10);
  });

  it('never runs a getter: an accessor is counted as malformed, and nothing throws', () => {
    let calls = 0;
    const photos: unknown[] = [OWN];
    Object.defineProperty(photos, '1', {
      enumerable: true,
      configurable: true,
      get() {
        calls += 1;
        throw new Error('boom');
      }
    });
    const outer: unknown[] = [photos];
    Object.defineProperty(outer, '1', {
      enumerable: true,
      configurable: true,
      get() {
        calls += 1;
        throw new Error('boom');
      }
    });
    const summary = summarizePhotoShadow(outer);
    expect(calls).toBe(0);
    expect(summary).toMatchObject({ propertiesScanned: 2, photosScanned: 1, malformedPhotoEntries: 1, propertiesWithoutPhotos: 1 });
  });

  it('returns whatever it counted if something unexpected happens, instead of throwing', () => {
    const hostile = new Proxy([[OWN]], {
      getOwnPropertyDescriptor() {
        throw new Error('trap');
      }
    });
    expect(() => summarizePhotoShadow(hostile)).not.toThrow();
  });

  it('is deterministic', () => {
    const input = [[proxy(NAME_A), OWN, null], undefined, [OWN]];
    expect(summarizePhotoShadow(input)).toEqual(summarizePhotoShadow(input));
  });

  it('never mutates its input (frozen input is fine)', () => {
    const input = Object.freeze([Object.freeze([proxy(NAME_A), OWN, 5]), Object.freeze([])]);
    const snapshot = JSON.stringify(input);
    expect(() => summarizePhotoShadow(input)).not.toThrow();
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('output is numbers only: no photo identifier, name or Place ID can appear', () => {
  const summary = summarizePhotoShadow([[proxy(NAME_A), proxy(NAME_B), OWN], [`https://lh3.googleusercontent.com/p/AF1QipSECRET`]]);

  it('every field is a non-negative integer, and there are no other fields', () => {
    expect(Object.keys(summary).sort()).toEqual([...PHOTO_SHADOW_FIELDS].sort());
    for (const value of Object.values(summary)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('the serialized summary contains none of the input text', () => {
    const json = JSON.stringify(summary);
    for (const secret of ['places/', 'ChIJ', 'secret', 'AUacSh', 'TokenAAAA', 'TokenBBBB', 'api/places', '/photos/', 'googleusercontent', 'SECRET', 'cdn.example.com', 'lobby']) {
      expect(json).not.toContain(secret);
    }
    expect(json).toMatch(/^\{("[A-Za-z]+":\d+,?)+\}$/);
  });

  it('the log line is one fixed-label line of numbers, with no input text', () => {
    const log = vi.fn();
    logPhotoShadowSummary('stays-refresh', summary, log);
    expect(log).toHaveBeenCalledTimes(1);
    const rendered = JSON.stringify(log.mock.calls[0]);
    expect(log.mock.calls[0][0]).toBe('[photo-shadow]');
    expect(log.mock.calls[0][1]).toMatchObject({ source: 'stays-refresh', googleOriginPhotos: 3 });
    for (const secret of ['places/', 'ChIJ', 'AUacSh', 'TokenAAAA', 'TokenBBBB', 'api/places', 'googleusercontent', 'cdn.example.com', 'SECRET']) expect(rendered).not.toContain(secret);
  });

  it('the log helper writes 0 for any value that is not a finite non-negative integer, and never throws', () => {
    const log = vi.fn();
    const poisoned = { ...summary, googleOriginPhotos: proxy(NAME_A) as unknown as number, photosScanned: -3, unknownPhotoSources: Number.NaN, skippedForBounds: 1.5 } as PhotoShadowSummary;
    logPhotoShadowSummary('destination-search', poisoned, log);
    const line = log.mock.calls[0][1] as Record<string, unknown>;
    expect(line).toMatchObject({ source: 'destination-search', googleOriginPhotos: 0, photosScanned: 0, unknownPhotoSources: 0, skippedForBounds: 0 });
    expect(JSON.stringify(line)).not.toContain('places');
    expect(() => logPhotoShadowSummary('stays-refresh', summary, () => { throw new Error('logger down'); })).not.toThrow();
  });
});

describe('merge', () => {
  it('adds counts, ignores undefined and invalid values, and returns a new object', () => {
    const a = summarizePhotoShadow([[proxy(NAME_A)]]);
    const b = summarizePhotoShadow([[OWN], []]);
    const merged = mergePhotoShadowSummaries(a, b);
    expect(merged).toMatchObject({ propertiesScanned: 3, photosScanned: 2, googleOriginPhotos: 1, unknownPhotoSources: 1, propertiesWithoutPhotos: 1 });
    expect(merged).not.toBe(a);
    expect(mergePhotoShadowSummaries(undefined, undefined)).toEqual(emptyPhotoShadowSummary());
    expect(mergePhotoShadowSummaries(a, { ...b, photosScanned: Number.NaN, googleOriginPhotos: -5 } as PhotoShadowSummary).googleOriginPhotos).toBe(1);
  });

  it('only ever adds non-negative integers: fractions, negatives, NaN, Infinity and strings are ignored', () => {
    const base = summarizePhotoShadow([[proxy(NAME_A)]]);
    const bad = { ...emptyPhotoShadowSummary(), photosScanned: 1.5, googleOriginPhotos: Number.POSITIVE_INFINITY, unknownPhotoSources: -1, propertiesScanned: Number.NaN, skippedForBounds: '7' as unknown as number } as PhotoShadowSummary;
    const merged = mergePhotoShadowSummaries(base, bad);
    expect(merged).toEqual(base);
    for (const value of Object.values(merged)) expect(Number.isInteger(value)).toBe(true);
  });
});

describe('module hygiene', () => {
  const source = readFileSync(new URL('./photoProvenanceShadow.ts', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('has no database, network, model, environment or file access', () => {
    for (const forbidden of ['mongoose', '@/models', 'connectDB', 'fetch(', 'process.env', 'readFile', 'writeFile', 'googlePlaces', 'XMLHttpRequest']) {
      expect(source, forbidden).not.toContain(forbidden);
    }
  });

  it('imports only the two approved C3-B1 helpers', () => {
    expect(source.match(/from\s*['"][^'"]+['"]/g)).toEqual(["from '@/lib/photoProvenance'"]);
    expect(source).toContain('import { containsGooglePhotoToken, isGoogleOriginImageUrl }');
  });
});
