/**
 * The client address a per-source rate limit is keyed on.
 *
 * Vercel documents that it OVERWRITES `x-forwarded-for` (and sets `x-real-ip` and `x-vercel-forwarded-for` to the
 * same client address) instead of forwarding a caller-supplied value, unless an Enterprise "trusted proxy" is
 * configured: https://vercel.com/docs/headers/request-headers. A deployment directly on Vercel is therefore not
 * spoofable through those headers. This helper still does not rely on that alone, because the same code also runs
 * anywhere else (local, another host, or behind a proxy that APPENDS to `x-forwarded-for`), where the LEFT-most entry
 * is whatever the caller wrote. In order of trust:
 *   1. the headers the hosting platform sets itself (`x-vercel-forwarded-for`, then `x-real-ip`);
 *   2. the RIGHT-most `x-forwarded-for` entry (added by the nearest proxy, not by the caller);
 *   3. one shared "unknown" bucket, so a caller who sends nothing usable shares a bucket with every other such
 *      caller instead of getting a fresh one per request.
 * Visitors behind one shared address (for example carrier-grade NAT on a mobile network) necessarily share a bucket.
 * Same order as app/api/search/route.ts.
 */
const MAX_KEY_LENGTH = 64;

function firstEntry(value: string | null): string | undefined {
  const entry = value?.split(',')[0]?.trim();
  return entry ? entry : undefined;
}

export function getClientIp(headers: Pick<Headers, 'get'>): string {
  const platform = firstEntry(headers.get('x-vercel-forwarded-for')) ?? firstEntry(headers.get('x-real-ip'));
  if (platform) return platform.slice(0, MAX_KEY_LENGTH);
  const entries = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const nearestProxy = entries[entries.length - 1];
  return nearestProxy ? nearestProxy.slice(0, MAX_KEY_LENGTH) : 'unknown';
}
