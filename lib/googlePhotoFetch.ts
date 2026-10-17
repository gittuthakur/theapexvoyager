import { InMemoryRateStore, type RateStore } from '@/lib/photoProxyGuard';
import { isLocalDevelopment } from '@/lib/env';
import { normalizeGooglePhotos, type GooglePhotoMetadata } from '@/lib/googlePhotoAttribution';
import type { PhotoMetadataMode } from '@/lib/photoMetadataMode';

/**
 * D1-3a — fetch FRESH Google photo metadata for ONE place, on demand (server side only: it needs the API key).
 *
 * ============================== PRECONDITION - READ BEFORE CALLING ==============================
 * This library does NOT check that a place is eligible to be shown and does NOT check owner exclusions. It does not
 * query any database. A well-formed Place ID is not authorization: without these checks, any caller-chosen ID would
 * become a billable Google request.
 *
 * The caller (the future property detail page) MUST first pass the place through the existing checks
 * (`getStayByPlaceIdResult` in lib/stays.ts: owner-exclusion list read fail-closed, published destination, current
 * stay location, present in PlaceCache) and may only call this library with the Place ID of a record that came back
 * `found`. Never pass a Place ID taken straight from the URL, a query string, a form or any other request input.
 * To make that precondition explicit and reviewable, `fetchFreshPlacePhotos` takes an `EligiblePlaceId`, which can only be
 * produced by `eligiblePlaceIdFrom(lookup)` from a `found` Google-sourced lookup result. That brand is a type-level
 * guard against honest mistakes, NOT a runtime security boundary (a cast can bypass it), so code review of the caller
 * is still required.
 * =================================================================================================
 *
 * What it guarantees: a fixed request (`GET /v1/places/{id}` with the field mask `photos`, never caller-supplied), the
 * API key only in a request header and never in a result, a 3-second timeout, no automatic retry, no response caching
 * and no sharing of one in-flight response between callers, at most 4 concurrent upstream calls per instance and no
 * queue, per-client (30/min) and per-instance (300/min) limits, nothing logged, nothing stored (no MongoDB, no memory
 * of photo names or author data after the call returns), and the function never throws.
 *
 * What it does not guarantee: the limits are in memory and per serverless instance (burst damping, not a spending cap);
 * it does not decide how a caller presents a failure; and whether the request is billed as the documented free "IDs
 * Only" SKU is UNVERIFIED (see the D1-3 design report).
 *
 * Google's policy (https://developers.google.com/maps/documentation/places/web-service/policies): photo names cannot be
 * cached and Places content must not be stored beyond the allowed exceptions, so nothing returned here may be
 * persisted or cached by the caller either.
 */

export const FRESH_PHOTO_LIMITS = {
  perClientPerMinute: 30,
  perInstancePerMinute: 300,
  maxConcurrent: 4,
  timeoutMs: 3000
} as const;

const PLACES_DETAILS_BASE = 'https://places.googleapis.com/v1/places';
/** The ONLY field mask this library ever sends. There is deliberately no parameter to change it. */
const PHOTOS_ONLY_FIELD_MASK = 'photos';
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,255}$/;
const MAX_CLIENT_KEY_LENGTH = 64;
const MAX_RESPONSE_CHARS = 500_000;
const MINUTE_MS = 60_000;

declare const eligibleBrand: unique symbol;
/** A Place ID that has passed the caller's eligibility and owner-exclusion checks. See the PRECONDITION above. */
export type EligiblePlaceId = string & { readonly [eligibleBrand]: true };

/** The only way to obtain an `EligiblePlaceId`: from a lookup that came back `found` for a Google-sourced stay. */
export function eligiblePlaceIdFrom(lookup: { status: string; stay?: { placeId?: unknown; source?: unknown } }): EligiblePlaceId | null {
  if (lookup.status !== 'found' || lookup.stay?.source !== 'google') return null;
  const placeId = lookup.stay.placeId;
  return typeof placeId === 'string' && PLACE_ID_PATTERN.test(placeId) ? (placeId as EligiblePlaceId) : null;
}

export type FreshPhotosFailureReason =
  | 'legacy' // mode is legacy: the caller keeps today's behaviour
  | 'disabled' // kill switch, or local development (never calls Google)
  | 'not-configured' // no API key
  | 'invalid-place-id'
  | 'rate-limited' // OUR per-client or per-instance limit
  | 'busy' // all upstream slots in use; nothing is queued
  | 'timeout'
  | 'upstream-error' // Google 4xx/5xx/429, network failure, malformed or oversized body
  | 'not-found' // Google 404: the place (or its ID) is unknown
  | 'no-photos' // Google returned no photos for the place
  | 'unusable-photos'; // photos came back but none can be shown with a complete credit

export type FreshPhotosResult =
  | {
      ok: true;
      /** Photos that are safe to show: valid name, and every author entry readable (authorsDropped === 0). */
      photos: GooglePhotoMetadata[];
      /** Raw photos Google sent that were NOT returned (malformed, or with an unreadable credit). */
      withheld: number;
    }
  | {
      ok: false;
      reason: FreshPhotosFailureReason;
      /** Google's HTTP status when `reason` is 'upstream-error' or 'not-found'. Safe to log; contains nothing else. */
      upstreamStatus?: number;
    };

export interface FreshPhotosInput {
  placeId: EligiblePlaceId;
  /** The server-side Places API key. Used only as a request header; never returned or logged. */
  apiKey: string | undefined;
  mode: PhotoMetadataMode;
  /** Who is asking, for the per-client limit (use lib/clientIp.ts `getClientIp`). */
  clientKey: string;
}

export interface FreshPhotoFetcherConfig {
  /** Injected for tests; defaults to the global `fetch` looked up at call time. */
  fetchImpl?: typeof fetch;
  rateStore?: RateStore;
  perClientPerMinute?: number;
  perInstancePerMinute?: number;
  maxConcurrent?: number;
  timeoutMs?: number;
  now?: () => number;
  isLocalDev?: () => boolean;
}

export interface ConcurrencyGate {
  /** Returns a release function, or null when every slot is in use (never waits, never queues). */
  tryAcquire(): (() => void) | null;
  readonly active: number;
}

export function createConcurrencyGate(max: number): ConcurrencyGate {
  let active = 0;
  return {
    tryAcquire() {
      if (active >= max) return null;
      active += 1;
      let released = false;
      return () => {
        // Idempotent, so a double release can never open an extra slot.
        if (released) return;
        released = true;
        active -= 1;
      };
    },
    get active() {
      return active;
    }
  };
}

const fail = (reason: FreshPhotosFailureReason, upstreamStatus?: number): FreshPhotosResult => ({ ok: false, reason, ...(upstreamStatus === undefined ? {} : { upstreamStatus }) });

function isTimeout(error: unknown): boolean {
  const name = (error as { name?: unknown } | null)?.name;
  return name === 'TimeoutError' || name === 'AbortError';
}

/** Builds a fetcher with its OWN rate store and concurrency gate (so tests are independent of each other). */
export function createFreshPhotoFetcher(config: FreshPhotoFetcherConfig = {}) {
  const rateStore = config.rateStore ?? new InMemoryRateStore();
  const gate = createConcurrencyGate(config.maxConcurrent ?? FRESH_PHOTO_LIMITS.maxConcurrent);
  const perClient = config.perClientPerMinute ?? FRESH_PHOTO_LIMITS.perClientPerMinute;
  const perInstance = config.perInstancePerMinute ?? FRESH_PHOTO_LIMITS.perInstancePerMinute;
  const timeoutMs = config.timeoutMs ?? FRESH_PHOTO_LIMITS.timeoutMs;
  const isLocalDev = config.isLocalDev ?? isLocalDevelopment;

  return async function fetchFreshPlacePhotos(input: FreshPhotosInput): Promise<FreshPhotosResult> {
    try {
      // 1. Mode. `legacy` and `disabled` never reach Google, and local development never does either.
      if (input.mode === 'legacy') return fail('legacy');
      if (input.mode !== 'fresh' || isLocalDev()) return fail('disabled');

      // 2. Cheap validation first, so malformed requests consume no rate budget and no slot.
      const apiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : '';
      if (!apiKey) return fail('not-configured');
      const placeId: unknown = input.placeId;
      if (typeof placeId !== 'string' || !PLACE_ID_PATTERN.test(placeId)) return fail('invalid-place-id');

      // 3. Limits. The per-client allowance is counted FIRST; only a request that passes it may consume the shared
      //    per-instance allowance (the same ordering as the photo proxy), so one client cannot starve everyone else.
      const clientKey = (typeof input.clientKey === 'string' && input.clientKey ? input.clientKey : 'unknown').slice(0, MAX_CLIENT_KEY_LENGTH);
      const now = config.now?.();
      if (!rateStore.hit(`fresh-photos:client:${clientKey}`, perClient, MINUTE_MS, now)) return fail('rate-limited');
      if (!rateStore.hit('fresh-photos:instance', perInstance, MINUTE_MS, now)) return fail('rate-limited');

      // 4. Concurrency: take a slot or answer `busy` immediately. There is no queue.
      const release = gate.tryAcquire();
      if (!release) return fail('busy');

      try {
        const doFetch = config.fetchImpl ?? globalThis.fetch;
        let response: Response;
        try {
          response = await doFetch(`${PLACES_DETAILS_BASE}/${placeId}`, {
            method: 'GET',
            // The key travels only here; the field mask is a constant, never caller-supplied.
            headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': PHOTOS_ONLY_FIELD_MASK },
            // No Next.js data cache, no HTTP cache: nothing from this response is kept.
            cache: 'no-store',
            signal: AbortSignal.timeout(timeoutMs)
          });
        } catch (error) {
          return fail(isTimeout(error) ? 'timeout' : 'upstream-error');
        }

        if (response.status === 404) return fail('not-found', 404);
        if (!response.ok) return fail('upstream-error', response.status);

        let body: unknown;
        try {
          const text = await response.text();
          if (text.length > MAX_RESPONSE_CHARS) return fail('upstream-error', response.status);
          body = JSON.parse(text);
        } catch (error) {
          return fail(isTimeout(error) ? 'timeout' : 'upstream-error', response.status);
        }
        if (typeof body !== 'object' || body === null || Array.isArray(body)) return fail('upstream-error', response.status);

        const rawPhotos = (body as { photos?: unknown }).photos;
        const rawCount = Array.isArray(rawPhotos) ? rawPhotos.length : 0;
        if (rawCount === 0) return fail('no-photos');

        // A photo is shown only if its credit is fully readable: authorsDropped > 0 means an author exists but cannot
        // be shown, and showing the photo without it would be an uncredited photo.
        const photos = normalizeGooglePhotos(rawPhotos).filter((photo) => photo.authorsDropped === 0);
        if (photos.length === 0) return fail('unusable-photos');
        return { ok: true, photos, withheld: rawCount - photos.length };
      } finally {
        release();
      }
    } catch {
      // Defensive: this function never throws, and never leaks an error message (which could contain request details).
      return fail('upstream-error');
    }
  };
}

/** The shared instance (one rate store and one concurrency gate per server instance). Nothing imports it yet. */
export const fetchFreshPlacePhotos = createFreshPhotoFetcher();
