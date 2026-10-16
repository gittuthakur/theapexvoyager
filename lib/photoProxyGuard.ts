/**
 * Cost-protection helpers for the Google Places photo proxy (app/api/places/photo/route.ts).
 *
 * IMPORTANT LIMITS: the rate limiter below is IN-MEMORY and therefore PER SERVERLESS INSTANCE. On Vercel,
 * instances are created and discarded freely and do not share memory, so this is best-effort damping of
 * bursts, not a spending cap and not a distributed limit. A real global budget needs a shared atomic
 * store (see the P1 report) and explicit owner approval; none is added here.
 *
 * Callers must count the per-client allowance first and consume the shared per-instance allowance only for
 * requests that pass it, so one over-limit client cannot starve everyone else on the instance. Remaining
 * limits: clients behind one shared address (for example carrier-grade NAT) share a per-client allowance, and
 * a distributed attacker using many addresses can still reach the per-instance ceiling.
 */

import { getClientIp } from '@/lib/clientIp';

export interface RateStore {
  /** Records one hit for `key` and returns whether it is still within `limit` hits per `windowMs`. */
  hit(key: string, limit: number, windowMs: number, now?: number): boolean;
}

const MAX_TRACKED_KEYS = 5000;

/** Fixed-window counters, bounded in size so an attacker cannot grow the map without limit. */
export class InMemoryRateStore implements RateStore {
  private readonly windows = new Map<string, { resetAt: number; count: number }>();

  hit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
    const current = this.windows.get(key);
    if (!current || current.resetAt <= now) {
      this.prune(now);
      this.windows.set(key, { resetAt: now + windowMs, count: 1 });
      return limit >= 1;
    }
    current.count += 1;
    return current.count <= limit;
  }

  private prune(now: number): void {
    if (this.windows.size < MAX_TRACKED_KEYS) return;
    for (const [key, entry] of this.windows) if (entry.resetAt <= now) this.windows.delete(key);
    // Still full of live windows: drop the oldest entries rather than grow.
    while (this.windows.size >= MAX_TRACKED_KEYS) {
      const oldest = this.windows.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.windows.delete(oldest);
    }
  }

  /** For tests. */
  clear(): void {
    this.windows.clear();
  }
}

/** The per-client rate-limit key: the shared, spoof-resistant extraction in lib/clientIp.ts (platform headers first,
 *  then the right-most `x-forwarded-for` entry, else one shared "unknown" bucket rather than skipping the limit). */
export function clientKey(headers: Pick<Headers, 'get'>): string {
  return getClientIp(headers);
}

/** Kill switch: anything other than an explicit "disabled" keeps today's behaviour. */
export function isPhotoProxyDisabled(env: Record<string, string | undefined>): boolean {
  return env.GOOGLE_PHOTO_PROXY_MODE?.trim().toLowerCase() === 'disabled';
}

export const DEFAULT_PER_CLIENT_PER_MINUTE = 240;
export const DEFAULT_PER_INSTANCE_PER_MINUTE = 1500;

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return raw !== undefined && Number.isInteger(value) && value > 0 ? value : fallback;
}

export function photoRateLimits(env: Record<string, string | undefined>) {
  return {
    perClient: positiveInt(env.GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE, DEFAULT_PER_CLIENT_PER_MINUTE),
    perInstance: positiveInt(env.GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE, DEFAULT_PER_INSTANCE_PER_MINUTE)
  };
}
