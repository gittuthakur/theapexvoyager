import { NextResponse } from 'next/server';
import { withGoogleBudgetShadow } from '@/lib/googleApiBudgetShadow';
import { isLocalDevelopment } from '@/lib/env';
import { images } from '@/config/images.config';
import { clampPhotoWidth, snapPhotoWidth } from '@/lib/placePhotoUrl';
import { InMemoryRateStore, clientKey, isPhotoProxyDisabled, photoRateLimits } from '@/lib/photoProxyGuard';
import { ExclusionLookupError, getActiveExclusionSet } from '@/services/properties/propertyExclusion.service';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

// Local dev never calls Google's Photo Media endpoint — it's billed per request, same
// as Text Search. Picking deterministically off the photo `name` (rather than randomly)
// keeps the same mock place showing the same image across re-renders and reloads.
const LOCAL_PLACEHOLDER_IMAGES = [
  images.destinations.manali,
  images.destinations.kinnaur,
  images.destinations.spitiValley,
  images.destinations.dharamshala,
  images.destinations.shimla,
  images.destinations.kasol
];

function pickLocalPlaceholder(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return LOCAL_PLACEHOLDER_IMAGES[hash % LOCAL_PLACEHOLDER_IMAGES.length];
}

// Photo-cost protection P1. Every check below that can reject a request runs BEFORE any call to
// Google, so a malformed, scripted or over-limit request never becomes a billable upstream request.
//  - Only `name` and `w` are accepted, each at most once. A different query string would otherwise
//    be ignored by this handler but still be a distinct CDN cache key, i.e. a fresh upstream call.
//  - `name` must match a strict Places photo resource-name shape with length limits.
//  - `w` must be an integer. A width that is not one of PHOTO_WIDTH_BUCKETS is redirected to the
//    canonical bucket (no upstream call), so each photo has a small, bounded set of URLs.
//  - Upstream failures are answered once, with a short-lived error response, and never retried here.
const ALLOWED_PARAMS = new Set(['name', 'w']);
const PHOTO_NAME_PATTERN = /^places\/[A-Za-z0-9_.=-]{1,255}\/photos\/[A-Za-z0-9_.=-]{1,2048}$/;

// Per serverless instance only: best-effort burst damping, not a spending cap (see lib/photoProxyGuard.ts).
const rateStore = new InMemoryRateStore();
const MINUTE_MS = 60_000;

const ERROR_CACHE_NOT_FOUND = 'public, max-age=60, s-maxage=300';
const ERROR_CACHE_TRANSIENT = 'public, max-age=15, s-maxage=30';
const ERROR_CACHE_CONFIGURATION = 'public, max-age=0, s-maxage=10';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
}

// ONE response for "this photo does not exist for you": used for a genuine Google 404 AND for a photo that belongs
// to an owner-excluded property, so the two are byte-for-byte indistinguishable to a caller.
function photoNotFound() {
  return NextResponse.json({ error: 'Photo not found' }, { status: 404, headers: { 'Cache-Control': ERROR_CACHE_NOT_FOUND } });
}

// Fix B: the Place ID of a validated resource name `places/<PLACE_ID>/photos/<TOKEN>` (PHOTO_NAME_PATTERN above
// guarantees exactly this shape, so the second segment is always the Place ID).
function placeIdOf(photoName: string): string {
  return photoName.split('/')[1];
}

// Proxies the Google Places (New) Photo Media endpoint so the API key never has to
// appear in a URL sent to the browser — the client only ever sees /api/places/photo?name=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  for (const key of new Set(searchParams.keys())) {
    if (!ALLOWED_PARAMS.has(key) || searchParams.getAll(key).length > 1) return badRequest('Unsupported query parameter');
  }

  const name = searchParams.get('name');
  if (!name || !PHOTO_NAME_PATTERN.test(name) || name.includes('..')) {
    return badRequest('Invalid or missing photo name');
  }

  // `w` omitted keeps today's behaviour (800). A present `w` must be a plain integer.
  const rawWidth = searchParams.get('w');
  if (rawWidth !== null && !/^-?\d{1,6}$/.test(rawWidth)) {
    return badRequest('Invalid width');
  }
  const maxWidthPx = clampPhotoWidth(rawWidth);
  if (rawWidth !== null) {
    const canonical = snapPhotoWidth(rawWidth);
    if (String(canonical) !== rawWidth) {
      const target = new URL(request.url);
      target.search = '';
      target.searchParams.set('name', name);
      target.searchParams.set('w', String(canonical));
      return NextResponse.redirect(target, { status: 307, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } });
    }
  }

  if (isLocalDevelopment()) {
    return NextResponse.redirect(new URL(pickLocalPlaceholder(name), request.url));
  }

  // Server-side kill switch: GOOGLE_PHOTO_PROXY_MODE=disabled stops every upstream call. Callers
  // already fall back to a placeholder on any non-image response, and the message reveals nothing.
  if (isPhotoProxyDisabled(process.env)) {
    return NextResponse.json({ error: 'Photo service unavailable' }, { status: 503, headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Photo service unavailable' }, { status: 503 });
  }

  const limits = photoRateLimits(process.env);
  // The per-client allowance is checked and counted FIRST. Only a request that passes it may consume the shared
  // per-instance allowance, so one over-limit client cannot exhaust the instance budget and starve other visitors.
  // (Limits: per serverless instance only, and clients behind one shared address, e.g. carrier-grade NAT, share a
  // per-client allowance. See lib/photoProxyGuard.ts.)
  const tooManyRequests = () =>
    NextResponse.json({ error: 'Too many photo requests' }, { status: 429, headers: { 'Retry-After': '30', 'Cache-Control': 'no-store' } });
  if (!rateStore.hit(`client:${clientKey(request.headers)}`, limits.perClient, MINUTE_MS)) return tooManyRequests();

  // Fix B — owner exclusions. A property owner's takedown must hold for a direct photo request too, not only for the
  // pages that link to it. Runs AFTER the per-client check (so an abusive client cannot drive unlimited database
  // reads) and BEFORE the shared per-instance check and any Google call: an excluded or unverifiable request
  // never consumes the instance allowance and never becomes an upstream request. The exclusion list is read fresh
  // each time (no in-memory copy, so no stale answer), through the same service every Stays surface uses.
  // FAILS CLOSED: if the list cannot be read, nothing is fetched from Google. (The service logs the failure itself;
  // this route logs neither the photo name nor the Place ID.)
  // KNOWN LIMIT: this only governs requests that reach this function. A photo already stored in the Vercel CDN, or in a
  // visitor's browser, under the 30-day success `Cache-Control` below is served from that cache without running this
  // code, so an exclusion does not remove already-cached bytes. Purging them is a separate, owner-approved operation.
  let excluded: Set<string>;
  try {
    excluded = await getActiveExclusionSet('google');
  } catch (error) {
    if (error instanceof ExclusionLookupError) {
      return NextResponse.json({ error: 'Photo temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    throw error;
  }
  if (excluded.has(placeIdOf(name))) return photoNotFound();

  if (!rateStore.hit('instance', limits.perInstance, MINUTE_MS)) return tooManyRequests();

  try {
    // The key travels only in the X-Goog-Api-Key request header (same convention as
    // lib/googlePlaces.ts's Text Search calls) — never in the URL itself, so it can't
    // leak into server logs, error messages, or Referer headers the way a `?key=...`
    // query string can.
    const googleUrl = `${PLACES_API_BASE}/${name}/media?maxWidthPx=${maxWidthPx}`;
    // cache: 'no-store' — Next.js's Data Cache caps a single entry at 2MB, and Places
    // photo bytes routinely exceed that (logged as "items over 2MB cannot be cached").
    // Opting this one binary fetch out of the Data Cache avoids that warning; the
    // Cache-Control header below is what actually makes repeat requests from the
    // *browser* (and any CDN in front of this route) skip the network entirely, so no
    // real caching behavior is lost.
    const res = await withGoogleBudgetShadow('photo-media', () => fetch(googleUrl, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
      headers: { 'X-Goog-Api-Key': apiKey }
    }));

    if (!res.ok) {
      // One attempt only, never retried here. Error bodies below are not photo content.
      //  - Google 404 (the photo reference is missing or expired): a genuine "not found", short-cached so
      //    repeated requests for the same dead reference do not each reach Google.
      //  - Google 400/401/403 (a bad request, key, quota, billing or API-enablement problem on OUR side): NOT a
      //    missing photo. Reported as a temporary failure and cached for only seconds, so a fix takes effect
      //    almost at once instead of being masked as "not found".
      //  - Google 429 and 5xx, and anything else: temporary failure, briefly cached.
      // Only the status code is logged (never the URL, headers, key or response body).
      if (res.status === 404) {
        return photoNotFound();
      }
      const configurationProblem = res.status === 400 || res.status === 401 || res.status === 403;
      console.error(`[photo-proxy] upstream responded with status ${res.status}`);
      return NextResponse.json(
        { error: 'Photo temporarily unavailable' },
        { status: 502, headers: { 'Cache-Control': configurationProblem ? ERROR_CACHE_CONFIGURATION : ERROR_CACHE_TRANSIENT } }
      );
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // UNCHANGED by P1 (existing behaviour; whether long-lived caching of Google photo bytes is
        // permitted is an unresolved compliance question — see the P1 report). Not extended here.
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable'
      }
    });
  } catch (error) {
    // Only the error class is logged: fetch errors can carry request details, and none may reach the logs.
    console.error(`[photo-proxy] upstream request failed (${error instanceof Error ? error.name : 'unknown error'})`);
    return NextResponse.json({ error: 'Photo temporarily unavailable' }, { status: 502, headers: { 'Cache-Control': ERROR_CACHE_TRANSIENT } });
  }
}
