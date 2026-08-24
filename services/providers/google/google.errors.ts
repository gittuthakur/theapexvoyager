/**
 * Shared failure-isolation wrapper for every Google provider call — guarantees a
 * Google outage (timeout, quota, malformed response) degrades to the given fallback
 * instead of throwing, and logs only the region/query context, never the API key or
 * full request URL/headers.
 */
export async function withGoogleFallback<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[google] ${label} failed — degrading to fallback: ${message}`);
    return fallback;
  }
}
