// A failed Google Places call (network unreachable, quota, timeout) has no positive
// result to store in Mongo, so without this, every page render pays the full 8s
// timeout again for the same (destination, category) pair until Google recovers.
// This is a short, in-memory, per-process cache of recent failures only — it's not
// meant to be durable or shared across instances, just to stop one bad network
// window from making every concurrent request equally slow.
const NEGATIVE_CACHE_TTL_MS = 10 * 60 * 1000;
const recentFailures = new Map<string, number>();

export function isRecentFailure(key: string): boolean {
  const expiresAt = recentFailures.get(key);
  if (expiresAt === undefined) return false;
  if (Date.now() > expiresAt) {
    recentFailures.delete(key);
    return false;
  }
  return true;
}

export function markFailure(key: string): void {
  recentFailures.set(key, Date.now() + NEGATIVE_CACHE_TTL_MS);
}
