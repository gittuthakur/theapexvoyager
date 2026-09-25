/**
 * Phase P2A — shared, dependency-free helpers for the `/api/places/photo` proxy's `w`
 * (maxWidthPx) parameter. Deliberately has zero other imports (no server-only fetch/
 * API-key logic) so it's safe to import from BOTH the server route
 * (app/api/places/photo/route.ts) and client-rendered card components
 * (components/modules/StaysGrid.tsx) without pulling anything server-only into a
 * client bundle.
 *
 * Root cause this exists to fix (Phase P1 audit → Phase P2A): every photo URL stored in
 * PlaceCache/mock data was built via lib/googlePlaces.ts's `toProxiedPhotoUrl` with its
 * flat 1200px default, and every render site requested that same 1200px image
 * regardless of whether it was displayed as a 360×192 card photo or a 56×56 thumbnail
 * (up to a measured 22x more pixels than ever rendered). Since photo URLs are persisted
 * as full strings in MongoDB at discovery time, fixing this at the SOURCE (changing
 * `toProxiedPhotoUrl`'s default) would only help newly-discovered places — every
 * already-cached property would keep serving oversized thumbnails forever. Rewriting
 * the `w` parameter at RENDER time instead (via `withPhotoWidth`) fixes every property,
 * old and new, without touching PlaceCache, discovery, or mock-data generation at all.
 */

// Google's Places (New) Photo Media endpoint documents a valid range of roughly
// 1–4800px for maxWidthPx/maxHeightPx. This app never legitimately needs anywhere near
// that ceiling — the largest real on-screen use today is PropertyPhotoGallery's hero
// slot — so a much tighter local ceiling is enforced regardless of what any caller
// (proxy query string or render-time helper) asks for.
export const MIN_PHOTO_WIDTH_PX = 32;
export const MAX_PHOTO_WIDTH_PX = 1600;
export const DEFAULT_PHOTO_WIDTH_PX = 800;

/** Strict, safe numeric clamp — never NaN/Infinity/negative, never above the ceiling.
 *  Used by the proxy route to validate the incoming `w` query param (untrusted input)
 *  and by `withPhotoWidth` below to validate a render-time width request. */
export function clampPhotoWidth(value: unknown): number {
  // `null`/`undefined`/`''` all mean "not provided" (e.g. a query param that was never
  // set) and must fall back to the default — NOT be coerced by `Number(null) === 0`
  // (finite!) into clamping down to the minimum, which would silently change existing
  // callers that omit `w` entirely from "800px default" to "32px minimum".
  if (value === null || value === undefined || value === '') return DEFAULT_PHOTO_WIDTH_PX;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return DEFAULT_PHOTO_WIDTH_PX;
  return Math.min(MAX_PHOTO_WIDTH_PX, Math.max(MIN_PHOTO_WIDTH_PX, Math.round(num)));
}

/**
 * Rewrites an EXISTING `/api/places/photo` URL's own `w` parameter to a slot-appropriate
 * width — the photo `name` (and therefore exactly which Google photo is requested, and
 * which real property it belongs to) is never touched, only the size requested for it.
 * A URL that isn't recognizably one of this app's own photo-proxy URLs is returned
 * completely unchanged (never rewritten, never treated as a generic image URL) — this
 * is a targeted rewrite for a known, trusted internal URL shape, never an open rewriter.
 */
export function withPhotoWidth(photoUrl: string, widthPx: number): string {
  if (typeof photoUrl !== 'string' || !photoUrl.startsWith('/api/places/photo?')) return photoUrl;
  try {
    // Second arg is a required-but-unused base for relative-URL parsing only — never
    // sent anywhere, never part of the returned string.
    const url = new URL(photoUrl, 'http://localhost');
    url.searchParams.set('w', String(clampPhotoWidth(widthPx)));
    return `${url.pathname}${url.search}`;
  } catch {
    return photoUrl;
  }
}
