import type { GlobalSearchItem, GlobalSearchSectionKey } from '@/lib/search/globalSearch';
import type { GlobalSearchResponse } from '@/lib/globalSearchServer';

/**
 * Client-side controller for the Header Global Search. Framework-free (no React, no DOM, no globals): `fetch`,
 * timers and the clock are injected, so every rule below is unit-tested in a plain Node environment.
 *
 * Rules, in one place:
 *  - nothing is ever requested for text with fewer than 2 meaningful characters, or while the search is closed;
 *  - typing is debounced; every keystroke aborts the superseded request AND bumps a sequence token, so a
 *    response for an earlier query can never be shown after a newer one was typed;
 *  - the same effective query is not requested again while it is already pending or on screen (extra spaces or a
 *    repeated identical value are a no-op). Completed responses are NEVER stored for reuse: returning to an earlier
 *    query always asks the server again, so an unpublished journey, a hidden destination, a renamed experience or a
 *    deactivated expert cannot stay in the suggestions, and a server failure cannot be hidden behind an old answer;
 *  - there are NO automatic retries of any kind: retry is always a user action;
 *  - 429 honours Retry-After and blocks new requests until it has passed; a partial response is never presented
 *    as an authoritative "no results";
 *  - close() aborts the pending request and clears every timer.
 */

export const GLOBAL_SEARCH_CLIENT = {
  minMeaningfulCharacters: 2,
  maxQueryLength: 80,
  debounceMs: 300,
  /** Shows the "still searching" hint (cold server instances can take several seconds). */
  slowAfterMs: 3000,
  /** Gives up on a request that has not answered by then (the server's own worst case is below this). */
  requestTimeoutMs: 12000,
  defaultRetryAfterSeconds: 30,
  maxRetryAfterSeconds: 120
} as const;

/** The section keys in display order, with their user-facing labels. */
export const GLOBAL_SEARCH_SECTIONS: ReadonlyArray<{ key: GlobalSearchSectionKey; label: string }> = [
  { key: 'destinations', label: 'Destinations' },
  { key: 'regions', label: 'Regions' },
  { key: 'journeys', label: 'Journeys' },
  { key: 'experiences', label: 'Experiences' },
  { key: 'stays', label: 'Stays' },
  { key: 'experts', label: 'Travel Experts' }
];

/**
 * Suggestions shown before anything is typed. They are only query text (never claims about availability): each was
 * checked against the live catalog and returns real results. A chip that stops matching simply shows the real
 * "no results" message.
 */
export const POPULAR_SEARCHES: readonly string[] = ['Spiti Valley', 'Manali', 'Kashmir', 'Rishikesh', 'Honeymoon', 'Trekking'];

export type SearchErrorKind = 'network' | 'timeout' | 'server' | 'invalid' | 'rate-limited';

export type GlobalSearchView =
  | { phase: 'idle' }
  | { phase: 'loading'; query: string; slow: boolean }
  | { phase: 'results'; query: string; response: GlobalSearchResponse }
  | { phase: 'empty'; query: string }
  | { phase: 'error'; query: string; kind: SearchErrorKind; retryAfterSeconds?: number };

export interface GlobalSearchControllerDeps {
  fetch: (input: string, init: { signal: AbortSignal; headers: Record<string, string> }) => Promise<Pick<Response, 'ok' | 'status' | 'headers' | 'json'>>;
  setTimeout: (callback: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  now: () => number;
}

/** Collapses whitespace and trims, the same way the API does before measuring length. */
export function cleanQuery(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/** Letters or digits only: "[[" or "!!" is not a meaningful search and is never sent. */
export function meaningfulCharacterCount(query: string): number {
  return (query.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

export function isSearchable(raw: string): boolean {
  const query = cleanQuery(raw);
  return Array.from(query).length <= GLOBAL_SEARCH_CLIENT.maxQueryLength && meaningfulCharacterCount(query) >= GLOBAL_SEARCH_CLIENT.minMeaningfulCharacters;
}

export const SEARCH_ENDPOINT = '/api/search';

/** Flat, ordered list of every result (the order keyboard navigation and Enter use). */
export function flattenResults(response: GlobalSearchResponse): GlobalSearchItem[] {
  return GLOBAL_SEARCH_SECTIONS.flatMap(({ key }) => response.sections[key]?.items ?? []);
}

/** Sections that failed to complete (timeout/error) - their absence from the list is NOT "no matches". */
export function failedSections(response: GlobalSearchResponse): GlobalSearchSectionKey[] {
  return GLOBAL_SEARCH_SECTIONS.map(({ key }) => key).filter((key) => response.sections[key] && response.sections[key].status !== 'ok');
}

/**
 * "See all" targets: only the listing pages that provably run the SAME module search for the query, and only for a
 * section that returned its full cap (so more may exist). Regions have no listing, and no counts are claimed.
 *   /destinations?destination=  (P2 destination search)   /journeys?destination=  (P1 journey search)
 *   /experiences?q=             (P2 experience search)    /experts?q=               (P3 expert search)
 *   /stays/search?q=            (P4 stay search: the same eligibility and relevance rules the suggestions use)
 */
export function seeAllHref(section: GlobalSearchSectionKey, query: string, itemCount: number, cap: number): string | null {
  if (itemCount < cap) return null;
  const q = encodeURIComponent(query);
  switch (section) {
    case 'destinations':
      return `/destinations?destination=${q}`;
    case 'journeys':
      return `/journeys?destination=${q}`;
    case 'experiences':
      return `/experiences?q=${q}`;
    case 'experts':
      return `/experts?q=${q}`;
    case 'stays':
      return `/stays/search?q=${q}`;
    default:
      return null;
  }
}

function isAbortError(error: unknown): boolean {
  return Boolean(error) && typeof error === 'object' && (error as { name?: string }).name === 'AbortError';
}

function isResponseShape(value: unknown): value is GlobalSearchResponse {
  const body = value as GlobalSearchResponse | null;
  return Boolean(body) && typeof body === 'object' && typeof body!.sections === 'object' && body!.sections !== null && typeof body!.partial === 'boolean' && typeof body!.total === 'number';
}

export interface GlobalSearchController {
  getView(): GlobalSearchView;
  subscribe(listener: () => void): () => void;
  /** Called on every keystroke while the search is OPEN. */
  setQuery(raw: string): void;
  /** User-initiated retry of the current query (never automatic). */
  retry(): void;
  /** Search closed or component unmounted: abort the pending request and clear every timer. */
  close(): void;
  /** For tests/diagnostics: how many requests were issued. */
  requestCount(): number;
}

export function createGlobalSearchController(deps: GlobalSearchControllerDeps): GlobalSearchController {
  const cfg = GLOBAL_SEARCH_CLIENT;
  let view: GlobalSearchView = { phase: 'idle' };
  const listeners = new Set<() => void>();
  let sequence = 0;
  let currentQuery = '';
  let debounceHandle: unknown = null;
  let slowHandle: unknown = null;
  let timeoutHandle: unknown = null;
  let abortController: AbortController | null = null;
  let blockedUntil = 0;
  let requests = 0;

  const set = (next: GlobalSearchView) => {
    view = next;
    listeners.forEach((listener) => listener());
  };
  const clearTimers = () => {
    for (const handle of [debounceHandle, slowHandle, timeoutHandle]) if (handle !== null) deps.clearTimeout(handle);
    debounceHandle = slowHandle = timeoutHandle = null;
  };
  const abortInFlight = () => {
    abortController?.abort();
    abortController = null;
  };
  const remainingBlockSeconds = () => Math.max(0, Math.ceil((blockedUntil - deps.now()) / 1000));

  async function run(query: string) {
    const token = ++sequence;
    requests++;
    abortInFlight();
    const controller = new AbortController();
    abortController = controller;
    set({ phase: 'loading', query, slow: false });
    slowHandle = deps.setTimeout(() => {
      if (token === sequence && view.phase === 'loading') set({ phase: 'loading', query, slow: true });
    }, cfg.slowAfterMs);
    let timedOut = false;
    timeoutHandle = deps.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, cfg.requestTimeoutMs);

    const finish = (next: GlobalSearchView) => {
      if (token !== sequence) return; // a newer query exists: this answer is stale and is dropped
      clearTimers();
      abortController = null;
      set(next);
    };

    try {
      const response = await deps.fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (token !== sequence) return;
      if (response.status === 429) {
        const header = Number(response.headers.get('retry-after'));
        const seconds = Number.isFinite(header) && header > 0 ? Math.min(Math.ceil(header), cfg.maxRetryAfterSeconds) : cfg.defaultRetryAfterSeconds;
        blockedUntil = deps.now() + seconds * 1000;
        return finish({ phase: 'error', query, kind: 'rate-limited', retryAfterSeconds: seconds });
      }
      if (response.status === 400) {
        return finish({ phase: 'error', query, kind: 'invalid' });
      }
      if (!response.ok) {
        return finish({ phase: 'error', query, kind: 'server' });
      }
      const body: unknown = await response.json();
      if (token !== sequence) return;
      if (!isResponseShape(body)) {
        return finish({ phase: 'error', query, kind: 'server' });
      }
      if (body.total === 0 && !body.partial) return finish({ phase: 'empty', query });
      return finish({ phase: 'results', query, response: body });
    } catch (error) {
      if (token !== sequence) return; // superseded or closed: nothing to report
      if (isAbortError(error) && !timedOut) return;
      return finish({ phase: 'error', query, kind: timedOut ? 'timeout' : 'network' });
    }
  }

  function schedule(query: string, immediate: boolean) {
    if (debounceHandle !== null) deps.clearTimeout(debounceHandle);
    debounceHandle = null;
    const start = () => {
      debounceHandle = null;
      if (query !== currentQuery) return;
      if (remainingBlockSeconds() > 0) return set({ phase: 'error', query, kind: 'rate-limited', retryAfterSeconds: remainingBlockSeconds() });
      void run(query);
    };
    if (immediate) start();
    else debounceHandle = deps.setTimeout(start, cfg.debounceMs);
  }

  return {
    getView: () => view,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setQuery(raw) {
      const query = cleanQuery(raw);
      // Identical effective input (extra spaces, same text): nothing to cancel and nothing to request again.
      if (query === currentQuery) return;
      currentQuery = query;
      // Any change supersedes whatever was pending or on screen.
      sequence++;
      abortInFlight();
      clearTimers();
      if (!isSearchable(query)) return set({ phase: 'idle' });
      if (remainingBlockSeconds() > 0) return set({ phase: 'error', query, kind: 'rate-limited', retryAfterSeconds: remainingBlockSeconds() });
      // The old results are removed at once: a stale list must never sit under a newer query.
      set({ phase: 'loading', query, slow: false });
      schedule(query, false);
    },
    retry() {
      if (!isSearchable(currentQuery)) return;
      if (remainingBlockSeconds() > 0) return set({ phase: 'error', query: currentQuery, kind: 'rate-limited', retryAfterSeconds: remainingBlockSeconds() });
      sequence++;
      abortInFlight();
      clearTimers();
      schedule(currentQuery, true);
    },
    close() {
      sequence++;
      abortInFlight();
      clearTimers();
      currentQuery = '';
      if (view.phase !== 'idle') set({ phase: 'idle' });
    },
    requestCount: () => requests
  };
}

/** The controller wired to the real browser: window.fetch, window timers and the system clock. */
export function createBrowserGlobalSearchController(): GlobalSearchController {
  return createGlobalSearchController({
    fetch: (input, init) => window.fetch(input, init),
    setTimeout: (callback, ms) => window.setTimeout(callback, ms),
    clearTimeout: (handle) => window.clearTimeout(handle as number),
    now: () => Date.now()
  });
}
