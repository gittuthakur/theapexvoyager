import crypto from 'node:crypto';
import { HbxApiError } from './hbx.errors';
import type { HbxEnvironment } from './hbx.types';
import { HBX_APPROVED_PRODUCTION_ORIGINS } from '@/config/hbxEnvironment.config';

// Server-only by convention, same trust model this codebase already uses for
// GOOGLE_PLACES_API_KEY (lib/googlePlaces.ts) and MONGODB_URI (lib/mongodb.ts): never
// imported from a Client Component, never prefixed NEXT_PUBLIC_*. Uses `node:crypto`
// (unavailable in the Edge/browser runtime), which additionally makes this module fail
// to even bundle if it were ever accidentally pulled into client code.

const REQUEST_TIMEOUT_MS = 8000;

/** True only when both HBX credentials are present. Every caller must treat "not
 *  configured" as a normal, expected state (no HBX account wired up yet in this
 *  environment) — never throw for it. */
export function isHbxConfigured(): boolean {
  return Boolean(process.env.HOTELBEDS_API_KEY && process.env.HOTELBEDS_SECRET);
}

// Exact, lowercase origins HBX's evaluation/certification environment is confirmed to
// use. Matched by parsed URL origin (scheme+host+port), never by substring — a
// substring check is what let the pre-2026-09-24-audit version of this function
// misclassify a case variant, typo, or unset value as production (see git history /
// that audit's Section C for the full finding).
const KNOWN_TEST_ORIGINS = new Set(['https://api.test.hotelbeds.com']);

/** Parses `rawUrl` and returns its lowercased origin, or `null` for anything missing,
 *  empty, or malformed enough that `new URL()` itself rejects it. Deliberately never
 *  throws — an invalid configured URL must fail closed (this function returning `null`,
 *  which getHbxEnvironment() below treats as "not recognized"), not crash a request. */
function normalizeOrigin(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).origin.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Fail-closed environment classification. Replaces the earlier
 * `!url.includes('api.test.') => 'production'` logic (2026-09-24 audit Section C):
 * that defaulted a missing, empty, mistyped, or case-varied HOTELBEDS_API_BASE_URL to
 * 'production', which could have let evaluation credentials/rates pass the public
 * safety gate on nothing more than a configuration mistake — a fail-OPEN default.
 *
 * The default here is now 'unknown' for anything not explicitly recognized. Reaching
 * 'production' requires BOTH, independently:
 *   1. HOTELBEDS_API_BASE_URL's parsed origin exactly matches an entry in
 *      HBX_APPROVED_PRODUCTION_ORIGINS (config/hbxEnvironment.config.ts — empty until
 *      HBX confirms a real value, never guessed); AND
 *   2. HBX_PRODUCTION_CONFIRMED is exactly the string 'true'.
 * Neither signal alone is ever sufficient — a correct production URL with the flag
 * left at its safe default (false/unset) still classifies as 'unknown', and the flag
 * being true against an unapproved/malformed/typo'd origin still classifies as
 * 'unknown'. Both must be true at once, and they live in different places (one in
 * version-controlled code, one in environment config) so a single mistake in either
 * can never flip production on by itself.
 *
 * Never logs `rawUrl`, the API key, the secret, or the signature — this function reads
 * only HOTELBEDS_API_BASE_URL and HBX_PRODUCTION_CONFIRMED, and returns nothing but the
 * classified label itself.
 */
export function getHbxEnvironment(): HbxEnvironment {
  const origin = normalizeOrigin(process.env.HOTELBEDS_API_BASE_URL);

  if (origin !== null && KNOWN_TEST_ORIGINS.has(origin)) {
    return 'test';
  }

  const productionConfirmedFlag = process.env.HBX_PRODUCTION_CONFIRMED === 'true';
  const isApprovedProductionOrigin = origin !== null && HBX_APPROVED_PRODUCTION_ORIGINS.has(origin);

  if (productionConfirmedFlag && isApprovedProductionOrigin) {
    return 'production';
  }

  return 'unknown';
}

function mask(value: string): string {
  if (value.length <= 4) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

/** Generated fresh per request (HBX signatures are timestamp-bound) — never cached,
 *  never logged in full. Callers only ever see the masked form via `describeAuth()`. */
function signRequest(apiKey: string, secret: string): { signature: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('sha256').update(apiKey + secret + timestamp).digest('hex');
  return { signature, timestamp };
}

/** Safe-to-log diagnostic summary — every value already masked. Used by the internal
 *  diagnostic route (app/api/internal/hbx-diagnostic/route.ts) so a developer can
 *  confirm which credentials/environment were used without ever seeing the real values. */
export function describeHbxAuth(): { configured: boolean; environment: HbxEnvironment; apiKeyMasked: string } {
  const apiKey = process.env.HOTELBEDS_API_KEY ?? '';
  return {
    configured: isHbxConfigured(),
    environment: getHbxEnvironment(),
    apiKeyMasked: apiKey ? mask(apiKey) : '(not set)'
  };
}

export interface HbxRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
}

/** Low-level, server-only HTTP call against the configured HBX base URL. Throws
 *  `HbxApiError` (status + a short, secret-free message) on any non-2xx response, a
 *  timeout, or missing credentials — callers (hbxHotels.service.ts,
 *  hbxAvailability.service.ts) are expected to catch this and degrade to a safe UI
 *  state, never let it propagate to a page render. */
export async function hbxFetch<T>(path: string, options: HbxRequestOptions = {}): Promise<T> {
  const apiKey = process.env.HOTELBEDS_API_KEY;
  const secret = process.env.HOTELBEDS_SECRET;
  const baseUrl = process.env.HOTELBEDS_API_BASE_URL;

  if (!apiKey || !secret || !baseUrl) {
    throw new HbxApiError('HBX credentials are not configured', 503);
  }

  const { signature, timestamp } = signRequest(apiKey, secret);
  void timestamp; // bound into `signature`; kept out of every downstream log

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Api-key': apiKey,
        'X-Signature': signature,
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    // Network failure or AbortSignal timeout — never includes the request URL's query
    // string verbatim in case a future endpoint ever put anything sensitive there.
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new HbxApiError(`Request to ${path} failed: ${message}`, 0);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new HbxApiError(`HBX request to ${path} returned ${response.status}: ${bodyText.slice(0, 300)}`, response.status);
  }

  return (await response.json()) as T;
}
