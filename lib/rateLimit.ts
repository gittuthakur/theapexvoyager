// In-memory, per-process sliding-window limiter — same "best effort, not durable
// across instances" tradeoff as lib/negativeCache.ts. Its job isn't to be a perfect
// distributed rate limit; it's to blunt a single bot/script hammering one warm
// instance with repeated requests for brand-new (never-cached) destinations, which is
// the one case request coalescing (lib/requestCoalescing.ts) can't help with — each
// such request is a legitimately distinct cache key, so there's no lock to contend on.
const WINDOW_MS = 60 * 1000;
const hits = new Map<string, { count: number; windowStart: number }>();

export function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
