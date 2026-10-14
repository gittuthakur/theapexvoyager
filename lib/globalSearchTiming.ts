import type { GlobalSearchSectionKey } from '@/lib/search/globalSearch';

/**
 * Server-side timing diagnostics for GET /api/search.
 *
 * What this is: a handful of integers and one of four fixed words per metric, sent as a standard `Server-Timing`
 * header so a slow response can be explained (how long the database connection took, which section was the straggler,
 * what each section's outcome was) without any log access.
 *
 * What it deliberately is NOT:
 *  - It is SERVER time inside the request handler only. It excludes the browser's network, Vercel routing and the
 *    function's own start-up before the handler runs, so it must never be read as the latency a visitor saw.
 *  - It carries no query text, no database/host/collection names, no error text or stack, no addresses or rate-limit
 *    keys, and no record data. Metric names and descriptions come from the fixed lists below - nothing from a request
 *    or an error ever reaches the header - so the set of possible headers is small and fixed (low cardinality).
 *  - Without a `Timing-Allow-Origin` header (none is sent) browsers expose it to the page's own origin only.
 *  - It adds no database call and cannot change the response body or status.
 */

export type TimedOutcome = 'ok' | 'timeout' | 'error' | 'skipped';

export interface GlobalSearchTimings {
  /** Database connection acquisition (before any section starts). Absent when no connection was needed (meaningless text). */
  connect?: { ms: number; outcome: Exclude<TimedOutcome, 'skipped'> };
  /** Time from the moment the section reads started until that section's answer was ready, and how it ended. */
  sections: Partial<Record<GlobalSearchSectionKey, { ms: number; outcome: TimedOutcome }>>;
}

export const createTimings = (): GlobalSearchTimings => ({ sections: {} });

const SECTION_ORDER: readonly GlobalSearchSectionKey[] = ['destinations', 'regions', 'journeys', 'experiences', 'stays', 'experts', 'transport'];
const OUTCOMES: readonly TimedOutcome[] = ['ok', 'timeout', 'error', 'skipped'];
/** No real request lasts longer; anything bigger is a clock fault and is clamped rather than reported. */
const MAX_REPORTED_MS = 600_000;

const clean = (ms: number): number => (Number.isFinite(ms) && ms > 0 ? Math.min(Math.round(ms), MAX_REPORTED_MS) : 0);
const outcomeWord = (outcome: string): TimedOutcome => (OUTCOMES.includes(outcome as TimedOutcome) ? (outcome as TimedOutcome) : 'error');

/** `connect;dur=2401;desc="ok", destinations;dur=1752;desc="timeout", ..., total;dur=4903` */
export function formatServerTiming(timings: GlobalSearchTimings, totalMs: number): string {
  const parts: string[] = [];
  if (timings.connect) parts.push(`connect;dur=${clean(timings.connect.ms)};desc="${outcomeWord(timings.connect.outcome)}"`);
  for (const key of SECTION_ORDER) {
    const entry = timings.sections[key];
    if (entry) parts.push(`${key};dur=${clean(entry.ms)};desc="${outcomeWord(entry.outcome)}"`);
  }
  parts.push(`total;dur=${clean(totalMs)}`);
  return parts.join(', ');
}
