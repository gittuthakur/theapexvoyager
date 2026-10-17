/**
 * C3-B2-1 — aggregate-only SHADOW counts for legacy Google photo persistence.
 *
 * It answers one question from data ALREADY in memory: of the stored photo values about to be written, how many are Google-origin
 * (and how many embed a Google photo name)? It returns NUMBERS ONLY. It never returns, logs or serializes a photo URL, a photo
 * name or token, a property name, a Place ID or anything about a person, because the only thing it is ever given is the photo
 * VALUE of each property (one entry per property), never the property record. It does not read a database, call Google, touch
 * the environment, or modify its input.
 *
 * Classification (deterministic, via the C3-B1 helpers; this is the ONLY module allowed to import them — see the ratchet):
 *   - a string that is a Google photo proxy URL / Google photo host / contains a photo name -> googleOriginPhotos
 *       (and, if it embeds a photo name or the proxy path, also photoNameTokenPhotos)
 *   - any other non-blank string -> unknownPhotoSources (provenance is never inferred from a URL, so it is NOT counted first-party)
 *   - a blank string, or an entry that is not a string -> malformedPhotoEntries
 *   - a missing / null / empty / non-array photo value -> propertiesWithoutPhotos (a non-array, non-nullish value also adds
 *     one malformedPhotoEntries)
 *
 * Work is bounded: at most MAX_PROPERTIES properties, MAX_PHOTOS_PER_PROPERTY entries per property and MAX_ENTRY_LENGTH
 * characters per entry are examined; anything beyond that is only counted in `skippedForBounds`.
 */
import { containsGooglePhotoToken, isGoogleOriginImageUrl } from '@/lib/photoProvenance';

export interface PhotoShadowSummary {
  propertiesScanned: number;
  photosScanned: number;
  googleOriginPhotos: number;
  photoNameTokenPhotos: number;
  unknownPhotoSources: number;
  propertiesWithoutPhotos: number;
  malformedPhotoEntries: number;
  skippedForBounds: number;
}

export const PHOTO_SHADOW_FIELDS = [
  'propertiesScanned',
  'photosScanned',
  'googleOriginPhotos',
  'photoNameTokenPhotos',
  'unknownPhotoSources',
  'propertiesWithoutPhotos',
  'malformedPhotoEntries',
  'skippedForBounds'
] as const satisfies readonly (keyof PhotoShadowSummary)[];

export const MAX_SHADOW_PROPERTIES = 10_000;
export const MAX_SHADOW_PHOTOS_PER_PROPERTY = 200;
export const MAX_SHADOW_ENTRY_LENGTH = 4096;

export function emptyPhotoShadowSummary(): PhotoShadowSummary {
  return {
    propertiesScanned: 0,
    photosScanned: 0,
    googleOriginPhotos: 0,
    photoNameTokenPhotos: 0,
    unknownPhotoSources: 0,
    propertiesWithoutPhotos: 0,
    malformedPhotoEntries: 0,
    skippedForBounds: 0
  };
}

/** Reads an own DATA element without ever running input code (a getter is treated as malformed). */
function readElement(list: readonly unknown[], index: number): { kind: 'hole' } | { kind: 'accessor' } | { kind: 'value'; value: unknown } {
  const descriptor = Object.getOwnPropertyDescriptor(list, index);
  if (descriptor === undefined) return { kind: 'hole' };
  if ('get' in descriptor || 'set' in descriptor) return { kind: 'accessor' };
  return { kind: 'value', value: descriptor.value };
}

function summarizeOneProperty(photos: unknown, into: PhotoShadowSummary): void {
  if (photos === undefined || photos === null) {
    into.propertiesWithoutPhotos += 1;
    return;
  }
  if (!Array.isArray(photos)) {
    into.propertiesWithoutPhotos += 1;
    into.malformedPhotoEntries += 1;
    return;
  }
  if (photos.length === 0) {
    into.propertiesWithoutPhotos += 1;
    return;
  }
  const examined = Math.min(photos.length, MAX_SHADOW_PHOTOS_PER_PROPERTY);
  if (photos.length > examined) into.skippedForBounds += photos.length - examined;
  for (let index = 0; index < examined; index += 1) {
    const element = readElement(photos, index);
    if (element.kind === 'hole') continue;
    if (element.kind === 'accessor' || typeof element.value !== 'string') {
      into.malformedPhotoEntries += 1;
      continue;
    }
    const entry = element.value;
    if (entry.trim() === '' || entry.length > MAX_SHADOW_ENTRY_LENGTH) {
      into.malformedPhotoEntries += 1;
      continue;
    }
    into.photosScanned += 1;
    if (isGoogleOriginImageUrl(entry)) {
      into.googleOriginPhotos += 1;
      if (containsGooglePhotoToken(entry)) into.photoNameTokenPhotos += 1;
    } else {
      into.unknownPhotoSources += 1;
    }
  }
}

/**
 * `photoValues` holds ONE entry per property: that property's stored photo value (normally a string[]). Returns counts only.
 * Never throws and never modifies its input.
 */
export function summarizePhotoShadow(photoValues: unknown): PhotoShadowSummary {
  const summary = emptyPhotoShadowSummary();
  try {
    if (!Array.isArray(photoValues)) return summary;
    const examined = Math.min(photoValues.length, MAX_SHADOW_PROPERTIES);
    if (photoValues.length > examined) summary.skippedForBounds += photoValues.length - examined;
    for (let index = 0; index < examined; index += 1) {
      const element = readElement(photoValues, index);
      if (element.kind === 'hole') continue;
      summary.propertiesScanned += 1;
      summarizeOneProperty(element.kind === 'value' ? element.value : undefined, summary);
    }
  } catch {
    // Monitoring must never be able to break the caller. Whatever was counted so far is returned as is.
  }
  return summary;
}

/** Adds two summaries (for combining several batches in one run). Missing or invalid input counts as zero. */
export function mergePhotoShadowSummaries(a: PhotoShadowSummary | undefined, b: PhotoShadowSummary | undefined): PhotoShadowSummary {
  const out = emptyPhotoShadowSummary();
  for (const source of [a, b]) {
    if (!source) continue;
    for (const field of PHOTO_SHADOW_FIELDS) {
      const value = source[field];
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0) out[field] += value;
    }
  }
  return out;
}

/** Fixed labels only: the log line can never carry anything the caller typed in. */
export type PhotoShadowSource = 'stays-refresh' | 'destination-search';

/**
 * Emits ONE line: a fixed label plus the numeric fields above. No URL, name, token, Place ID or free text can appear in it.
 * Every value is re-checked to be a finite non-negative integer, and anything else is written as 0.
 */
export function logPhotoShadowSummary(source: PhotoShadowSource, summary: PhotoShadowSummary, log: (...args: unknown[]) => void = console.info): void {
  const line: Record<string, string | number> = { source };
  for (const field of PHOTO_SHADOW_FIELDS) {
    const value = summary[field];
    line[field] = typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
  }
  try {
    log('[photo-shadow]', line);
  } catch {
    // never let logging break the caller
  }
}
