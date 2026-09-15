import { connectDB } from '@/lib/mongodb';
import { PlaceCacheLock } from '@/models/PlaceCacheLock';

// Coalesces concurrent Google Places cache-miss fetches for the same key (lib/stays.ts
// uses `${destinationSlug}:${stayType}:${location}`) so that N simultaneous visitors
// hitting an uncached destination trigger at most one real Google Places call, not N.
// Two layers, cheapest first:
//  1. An in-process Map catches concurrent requests served by the same warm
//     serverless instance/process — the common case, and free (no extra Mongo round trip).
//  2. A short-lived Mongo lock document (models/PlaceCacheLock.ts) catches the same
//     race across separate instances, which Vercel can and does spin up concurrently
//     under real traffic — an in-process Map alone can't see across instances.
// A request that loses the race never calls Google; it gets `COALESCE_LOCKED` back
// instead, meaning "another request is already fetching this — try again shortly."
export const COALESCE_LOCKED = Symbol('coalesce-locked');

const inFlight = new Map<string, Promise<unknown>>();

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000);
}

export async function coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T | typeof COALESCE_LOCKED> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T | typeof COALESCE_LOCKED>;
  }

  const promise = (async (): Promise<T | typeof COALESCE_LOCKED> => {
    await connectDB();
    try {
      await PlaceCacheLock.create({ key });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return COALESCE_LOCKED;
      }
      throw error;
    }

    try {
      return await fetcher();
    } finally {
      // Release as soon as this fetch settles (success or failure) rather than waiting
      // out the full TTL, so a genuinely new miss for the same key isn't blocked any
      // longer than the fetch itself took. The TTL index remains a safety net only.
      await PlaceCacheLock.deleteOne({ key }).catch(() => undefined);
    }
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
