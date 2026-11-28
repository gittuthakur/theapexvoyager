import { NextResponse } from 'next/server';
import { withGoogleBudgetShadow } from '@/lib/googleApiBudgetShadow';
import { isLocalDevelopment } from '@/lib/env';
import { images } from '@/config/images.config';
import { snapPhotoWidth } from '@/lib/placePhotoUrl';
import { InMemoryRateStore, clientKey, isPhotoProxyDisabled, photoRateLimits } from '@/lib/photoProxyGuard';
import { DISPLAY_PLACE_ID_PATTERN, isPlaceIdAllowedForDisplay, photoDisplayMode } from '@/lib/photoDisplayMode';
import { createConcurrencyGate, createFreshPhotoFetcher, eligiblePlaceIdFrom, type FreshPhotosFailureReason } from '@/lib/googlePhotoFetch';
import { getStayByPlaceIdResult } from '@/lib/stays';
import { PHOTO_DISPLAY_KEY_PATTERN, photoDisplayKey } from '@/lib/photoDisplayKey';

/**
 * DISPLAY-TIME Google photo route for stay listing cards.
 *
 *   GET /api/places/photo/by-place?placeId=<PLACE_ID>&i=<0-9>&w=<width bucket>[&k=<16-hex match key>]
 *
 * Used by the listing cards (no `k`) and by the property detail gallery (with `k`, see lib/photoDisplayKey.ts). Neither ever
 * puts a Google photo name in HTML or in a URL.
 *
 * Google: "You cannot cache a photo name. Also, the name can expire." So no photo name is ever stored. Per request this
 * route (1) checks the Place ID is a public, non-excluded stay we already hold (the same `getStayByPlaceIdResult` check the
 * detail page uses, which fails closed if the owner-exclusion list cannot be read), (2) asks Places API (New) Place Details
 * for ONE field, `photos` (lib/googlePhotoFetch.ts: fixed field mask, 3 s timeout, no retry, nothing cached or stored),
 * (3) fetches the image bytes for the freshly returned name, and (4) streams them back. The name lives only in local
 * variables of this one request: it is never written to MongoDB or any store, never logged and never returned to the client.
 *
 * Only photos whose author credit is fully readable are served (lib/googlePhotoFetch.ts drops the rest), and the credit is
 * returned in `X-Photo-Credit` so the response itself shows the photo is credited. The listing card links to the property
 * page, which shows the full credited gallery (author, photo-specific Google Maps link, report link, Google logo).
 *
 * Caching: the image response is `no-store`. Google's applicable terms for caching Places photo BYTES could not be read
 * (the Service Specific Terms page did not load), so no cache lifetime is claimed. Errors carry short lifetimes because
 * they contain no Google content.
 *
 * Off by default: unless GOOGLE_PHOTO_DISPLAY_MODE=display-time this route answers 404 and does nothing. The existing
 * `/api/places/photo?name=` route is untouched and remains the rollback path.
 */

const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const ALLOWED_PARAMS = new Set(['placeId', 'i', 'w', 'k']);
const MINUTE_MS = 60_000;
const MEDIA_TIMEOUT_MS = 8000;
const MAX_CREDIT_CHARS = 200;
const MAX_CONCURRENT = 6;

const rateStore = new InMemoryRateStore();
const gate = createConcurrencyGate(MAX_CONCURRENT);
const limits = photoRateLimits(process.env);
// The fetcher keeps its own per-client/per-instance counters; they are set to the same limits as the route's so neither is the tighter one.
const fetchFreshPhotos = createFreshPhotoFetcher({ perClientPerMinute: limits.perClient, perInstancePerMinute: limits.perInstance, maxConcurrent: MAX_CONCURRENT });

const NO_STORE = 'no-store';
const SHORT_ERROR = 'public, max-age=15, s-maxage=30';
const SHORT_NOT_FOUND = 'public, max-age=60, s-maxage=60';

const LOCAL_PLACEHOLDER_IMAGES = [images.destinations.manali, images.destinations.kinnaur, images.destinations.spitiValley, images.destinations.dharamshala, images.destinations.shimla, images.destinations.kasol];

function pickLocalPlaceholder(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return LOCAL_PLACEHOLDER_IMAGES[hash % LOCAL_PLACEHOLDER_IMAGES.length];
}

function error(status: number, message: string, cacheControl: string, extra: Record<string, string> = {}) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': cacheControl, ...extra } });
}

function failureResponse(reason: FreshPhotosFailureReason) {
  switch (reason) {
    case 'rate-limited':
      return error(429, 'Too many photo requests', NO_STORE, { 'Retry-After': '30' });
    case 'busy':
      return error(503, 'Photo service busy', NO_STORE, { 'Retry-After': '5' });
    case 'not-found':
    case 'no-photos':
    case 'unusable-photos':
      return error(404, 'Photo not found', SHORT_NOT_FOUND);
    case 'not-configured':
    case 'disabled':
    case 'legacy':
      return error(503, 'Photo service unavailable', NO_STORE);
    default:
      return error(502, 'Photo temporarily unavailable', SHORT_ERROR);
  }
}

export async function GET(request: Request) {
  // Off by default: nothing below this line runs, and no Google or database call is made.
  if (photoDisplayMode(process.env) !== 'display-time') return error(404, 'Not found', NO_STORE);

  const { searchParams } = new URL(request.url);
  for (const key of new Set(searchParams.keys())) {
    if (!ALLOWED_PARAMS.has(key) || searchParams.getAll(key).length > 1) return error(400, 'Unsupported query parameter', 'public, max-age=60, s-maxage=300');
  }

  const placeId = searchParams.get('placeId');
  if (!placeId || !DISPLAY_PLACE_ID_PATTERN.test(placeId)) return error(400, 'Invalid or missing place', 'public, max-age=60, s-maxage=300');

  const rawIndex = searchParams.get('i') ?? '0';
  if (!/^[0-9]$/.test(rawIndex)) return error(400, 'Invalid photo index', 'public, max-age=60, s-maxage=300');
  const index = Number(rawIndex);

  // Optional match key (detail page): the photo at this position must still be the one whose credit the page showed.
  const matchKey = searchParams.get('k');
  if (matchKey !== null && !PHOTO_DISPLAY_KEY_PATTERN.test(matchKey)) return error(400, 'Invalid photo key', 'public, max-age=60, s-maxage=300');

  const rawWidth = searchParams.get('w');
  if (rawWidth !== null && !/^\d{1,6}$/.test(rawWidth)) return error(400, 'Invalid width', 'public, max-age=60, s-maxage=300');
  const width = snapPhotoWidth(rawWidth);
  if (rawWidth !== null && String(width) !== rawWidth) {
    const target = new URL(request.url);
    target.search = '';
    target.searchParams.set('placeId', placeId);
    target.searchParams.set('i', String(index));
    target.searchParams.set('w', String(width));
    if (matchKey !== null) target.searchParams.set('k', matchKey);
    return NextResponse.redirect(target, { status: 307, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } });
  }

  // The pilot allowlist is enforced here, before the database and before Google.
  if (!isPlaceIdAllowedForDisplay(placeId, process.env)) return error(404, 'Not found', NO_STORE);

  if (isLocalDevelopment()) return NextResponse.redirect(new URL(pickLocalPlaceholder(placeId), request.url));
  if (isPhotoProxyDisabled(process.env)) return error(503, 'Photo service unavailable', 'public, max-age=30, s-maxage=60');
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return error(503, 'Photo service unavailable', NO_STORE);

  // Per-client allowance first, so one over-limit client cannot starve everyone else on the instance.
  const client = clientKey(request.headers);
  if (!rateStore.hit(`client:${client}`, limits.perClient, MINUTE_MS)) return failureResponse('rate-limited');

  // Eligibility + owner exclusions (fail closed), BEFORE the shared limit and any Google call.
  let lookup;
  try {
    lookup = await getStayByPlaceIdResult(placeId);
  } catch {
    return error(503, 'Photo temporarily unavailable', NO_STORE);
  }
  if (lookup.status === 'unavailable') return error(503, 'Photo temporarily unavailable', NO_STORE);
  const eligible = eligiblePlaceIdFrom(lookup);
  if (!eligible) return error(404, 'Photo not found', SHORT_NOT_FOUND);

  if (!rateStore.hit('instance', limits.perInstance, MINUTE_MS)) return failureResponse('rate-limited');

  const release = gate.tryAcquire();
  if (!release) return failureResponse('busy');
  try {
    // Request 1 of 2: Place Details, `photos` field only. Counted for the validation budget by this single line.
    console.info('[photo-display] google-request kind=place-details');
    const details = await withGoogleBudgetShadow('place-details-metadata', () => fetchFreshPhotos({ placeId: eligible, apiKey, mode: 'fresh', clientKey: client }));
    if (!details.ok) {
      console.error(`[photo-display] place-details failed reason=${details.reason}${details.upstreamStatus ? ` status=${details.upstreamStatus}` : ''}`);
      return failureResponse(details.reason);
    }
    const photo = details.photos[index];
    if (!photo) return error(404, 'Photo not found', SHORT_NOT_FOUND);
    // Detail-page images: serve only if this position still holds the photo whose credit the page displayed. A mismatch
    // (Google reordered its list between the page render and this request) shows no image rather than one with the wrong credit.
    // This check precedes the media request, so a mismatch costs no Place Photos request.
    if (matchKey !== null && (!photo.googleMapsUri || photoDisplayKey(photo.googleMapsUri) !== matchKey)) return error(404, 'Photo not found', SHORT_NOT_FOUND);

    // Request 2 of 2: the image, from the name Google returned a moment ago. The key travels only in a header.
    console.info('[photo-display] google-request kind=photo-media');
    let res: Response;
    try {
      res = await withGoogleBudgetShadow('photo-media', () =>
        fetch(`${PLACES_API_BASE}/${photo.name}/media?maxWidthPx=${width}`, { signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS), cache: 'no-store', headers: { 'X-Goog-Api-Key': apiKey } })
      );
    } catch (failure) {
      console.error(`[photo-display] photo-media request failed (${failure instanceof Error ? failure.name : 'unknown error'})`);
      return error(502, 'Photo temporarily unavailable', SHORT_ERROR);
    }
    if (!res.ok) {
      console.error(`[photo-display] photo-media failed status=${res.status}`);
      return error(res.status === 404 ? 404 : 502, res.status === 404 ? 'Photo not found' : 'Photo temporarily unavailable', res.status === 404 ? SHORT_NOT_FOUND : SHORT_ERROR);
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('image/')) return error(502, 'Photo temporarily unavailable', SHORT_ERROR);
    const buffer = await res.arrayBuffer();

    const credit = photo.authorAttributions
      .map((author) => author.displayName)
      .join(', ')
      .slice(0, MAX_CREDIT_CHARS);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': NO_STORE,
        'X-Content-Type-Options': 'nosniff',
        ...(credit ? { 'X-Photo-Credit': encodeURIComponent(credit) } : {})
      }
    });
  } finally {
    release();
  }
}
