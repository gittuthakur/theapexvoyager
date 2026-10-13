import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GLOBAL_SEARCH_CLIENT,
  createGlobalSearchController,
  failedSections,
  flattenResults,
  isSearchable,
  seeAllHref,
  type GlobalSearchControllerDeps,
  type GlobalSearchView
} from '@/lib/globalSearchClient';
import type { GlobalSearchResponse } from '@/lib/globalSearchServer';

const D = GLOBAL_SEARCH_CLIENT.debounceMs;

function response(query: string, items: Partial<Record<'destinations' | 'regions' | 'journeys' | 'experiences' | 'experts', string[]>> = {}, partial: Array<string> = []): GlobalSearchResponse {
  const sections = {} as GlobalSearchResponse['sections'];
  for (const key of ['destinations', 'regions', 'journeys', 'experiences', 'experts'] as const) {
    sections[key] = { status: partial.includes(key) ? 'timeout' : 'ok', items: (items[key] ?? []).map((slug) => ({ id: `${key}:${slug}`, type: 'destination', title: slug, href: `/${slug}`, reason: 'title-exact' })) } as never;
  }
  const total = Object.values(sections).reduce((n, s) => n + s.items.length, 0);
  return { query, sections, total, partial: partial.length > 0 };
}

type Pending = { url: string; signal: AbortSignal; resolve: (r: { status: number; headers?: Record<string, string>; body?: unknown }) => void; reject: (e: unknown) => void };

function harness() {
  const pending: Pending[] = [];
  const calls: string[] = [];
  let clock = 1_000_000;
  const fetchMock: GlobalSearchControllerDeps['fetch'] = (url, init) =>
    new Promise((resolve, reject) => {
      calls.push(decodeURIComponent(url.split('q=')[1]));
      const entry: Pending = {
        url,
        signal: init.signal,
        reject,
        resolve: ({ status, headers = {}, body }) => resolve({ ok: status >= 200 && status < 300, status, headers: { get: (name: string) => headers[name.toLowerCase()] ?? null } as unknown as Headers, json: async () => body })
      };
      init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      pending.push(entry);
    });
  const controller = createGlobalSearchController({ fetch: fetchMock, setTimeout: (cb, ms) => setTimeout(cb, ms), clearTimeout: (h) => clearTimeout(h as never), now: () => clock });
  const views: GlobalSearchView[] = [];
  controller.subscribe(() => views.push(controller.getView()));
  return { controller, pending, calls, views, advanceClock: (ms: number) => { clock += ms; } };
}
const ok = (body: GlobalSearchResponse) => ({ status: 200, body });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('what is searchable', () => {
  it('needs two meaningful characters and at most 80', () => {
    expect(isSearchable('a')).toBe(false);
    expect(isSearchable(' a ')).toBe(false);
    expect(isSearchable('[[')).toBe(false);
    expect(isSearchable('a!')).toBe(false);
    expect(isSearchable('ab')).toBe(true);
    expect(isSearchable('  Spiti   Valley ')).toBe(true);
    expect(isSearchable('x'.repeat(80))).toBe(true);
    expect(isSearchable('x'.repeat(81))).toBe(false);
  });
});

describe('typing: debounce, abort, stale responses', () => {
  it('requests nothing for too-short text, and nothing while typing quickly; one request after the pause', async () => {
    const h = harness();
    h.controller.setQuery('s');
    h.controller.setQuery('sp');
    h.controller.setQuery('spi');
    h.controller.setQuery('spit');
    h.controller.setQuery('spiti');
    expect(h.calls).toEqual([]);
    await vi.advanceTimersByTimeAsync(D - 1);
    expect(h.calls).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.calls).toEqual(['spiti']);
    expect(h.controller.requestCount()).toBe(1);
  });

  it('shows loading (never "no results") from the first meaningful keystroke until the answer arrives', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    expect(h.controller.getView()).toMatchObject({ phase: 'loading', query: 'Spiti' });
    await vi.advanceTimersByTimeAsync(D);
    expect(h.controller.getView()).toMatchObject({ phase: 'loading' });
    h.pending[0].resolve(ok(response('Spiti', { destinations: ['spiti-valley'] })));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'results', query: 'Spiti' });
  });

  it('aborts the superseded request and ignores its late answer', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    const first = h.pending[0];
    h.controller.setQuery('Spiti Valley');
    expect(first.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(D);
    expect(h.calls).toEqual(['Spiti', 'Spiti Valley']);
    // the OLD answer arrives late, after the new request started: it must never be displayed
    first.resolve(ok(response('Spiti', { destinations: ['old-result'] })));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'loading', query: 'Spiti Valley' });
    h.pending[1].resolve(ok(response('Spiti Valley', { destinations: ['new-result'] })));
    await vi.advanceTimersByTimeAsync(0);
    const view = h.controller.getView();
    expect(view.phase === 'results' && flattenResults(view.response).map((i) => i.id)).toEqual(['destinations:new-result']);
  });

  it('a stale response that arrives out of order never replaces a newer one', async () => {
    const h = harness();
    h.controller.setQuery('Manali');
    await vi.advanceTimersByTimeAsync(D);
    h.controller.setQuery('Manali Leh');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[1].resolve(ok(response('Manali Leh', { journeys: ['newer'] })));
    await vi.advanceTimersByTimeAsync(0);
    h.pending[0].resolve(ok(response('Manali', { journeys: ['older'] })));
    await vi.advanceTimersByTimeAsync(0);
    const view = h.controller.getView();
    expect(view.phase === 'results' && view.query).toBe('Manali Leh');
    expect(view.phase === 'results' && flattenResults(view.response).map((i) => i.id)).toEqual(['journeys:newer']);
  });

  it('deleting back below two characters clears everything and cancels the request', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    const inFlight = h.pending[0];
    h.controller.setQuery('S');
    expect(inFlight.signal.aborted).toBe(true);
    expect(h.controller.getView()).toEqual({ phase: 'idle' });
    inFlight.resolve(ok(response('Spiti', { destinations: ['x'] })));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toEqual({ phase: 'idle' });
  });

  it('typing then deleting rapidly sends no request at all', async () => {
    const h = harness();
    for (const text of ['Sp', 'Spi', 'Sp', 'S', '', 'Ka', 'K']) h.controller.setQuery(text);
    await vi.advanceTimersByTimeAsync(D * 3);
    expect(h.calls).toEqual([]);
  });

  it('the same effective text (extra spaces) is not requested again, and a new word is', async () => {
    const h = harness();
    h.controller.setQuery('Spiti Valley');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve(ok(response('Spiti Valley', { destinations: ['spiti-valley'] })));
    await vi.advanceTimersByTimeAsync(0);
    h.controller.setQuery('  Spiti   Valley  ');
    await vi.advanceTimersByTimeAsync(D * 2);
    expect(h.calls).toEqual(['Spiti Valley']);
  });

  it('NEVER reuses a completed answer: returning to an earlier query asks the server again, so nothing stale can survive', async () => {
    const h = harness();
    h.controller.setQuery('Kasol');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve(ok(response('Kasol', { destinations: ['kasol'], journeys: ['kasol-kheerganga-tosh'] })));
    await vi.advanceTimersByTimeAsync(0);
    h.controller.setQuery('Kaso');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[1].resolve(ok(response('Kaso', { destinations: ['kasol'] })));
    await vi.advanceTimersByTimeAsync(0);
    h.controller.setQuery('Kasol'); // back to the first text
    expect(h.controller.getView()).toMatchObject({ phase: 'loading', query: 'Kasol' }); // no instant answer from memory
    await vi.advanceTimersByTimeAsync(D);
    expect(h.calls).toEqual(['Kasol', 'Kaso', 'Kasol']);
  });

  describe('freshness: a change in what is public is visible the next time the same text is searched', () => {
    const search = async (h: ReturnType<typeof harness>, text: string, answer: GlobalSearchResponse) => {
      h.controller.setQuery(text);
      await vi.advanceTimersByTimeAsync(D);
      h.pending[h.pending.length - 1].resolve(ok(answer));
      await vi.advanceTimersByTimeAsync(0);
    };
    const ids = (h: ReturnType<typeof harness>) => { const v = h.controller.getView(); return v.phase === 'results' ? flattenResults(v.response).map((i) => i.id) : v.phase; };

    it('an unpublished journey disappears, a hidden destination disappears, a renamed experience shows its new title, a deactivated expert leaves', async () => {
      const h = harness();
      await search(h, 'Spiti', response('Spiti', { journeys: ['old-journey', 'kept'], destinations: ['old-destination'], experts: ['old-expert'], experiences: ['exp'] }));
      expect(ids(h)).toEqual(expect.arrayContaining(['journeys:old-journey', 'destinations:old-destination', 'experts:old-expert']));
      h.controller.setQuery('Spit');
      await vi.advanceTimersByTimeAsync(D);
      h.pending[h.pending.length - 1].resolve(ok(response('Spit', { journeys: ['kept'] })));
      await vi.advanceTimersByTimeAsync(0);
      await search(h, 'Spiti', response('Spiti', { journeys: ['kept'] })); // the server no longer returns the hidden records
      expect(ids(h)).toEqual(['journeys:kept']);
      expect(h.calls).toEqual(['Spiti', 'Spit', 'Spiti']);
    });

    it('a title change is shown after searching the same text again', async () => {
      const h = harness();
      const renamed = response('Gurez', { experiences: ['gurez'] });
      renamed.sections.experiences.items[0].title = 'New Name';
      await search(h, 'Gurez', response('Gurez', { experiences: ['gurez'] }));
      await search(h, 'Gure', response('Gure', { experiences: ['gurez'] }));
      await search(h, 'Gurez', renamed);
      const v = h.controller.getView();
      expect(v.phase === 'results' && flattenResults(v.response)[0].title).toBe('New Name');
    });

    it('a server failure is never hidden behind an earlier successful answer', async () => {
      const h = harness();
      await search(h, 'Manali', response('Manali', { destinations: ['manali'] }));
      h.controller.setQuery('Manal');
      await vi.advanceTimersByTimeAsync(D);
      h.pending[h.pending.length - 1].resolve({ status: 500 });
      await vi.advanceTimersByTimeAsync(0);
      h.controller.setQuery('Manali'); // the same text that succeeded before
      await vi.advanceTimersByTimeAsync(D);
      h.pending[h.pending.length - 1].resolve({ status: 500 });
      await vi.advanceTimersByTimeAsync(0);
      expect(h.controller.getView()).toMatchObject({ phase: 'error', kind: 'server' });
    });

    it('the open overlay keeps no copy of any answer after it closes', async () => {
      const h = harness();
      await search(h, 'Spiti', response('Spiti', { destinations: ['spiti-valley'] }));
      h.controller.close();
      expect(h.controller.getView()).toEqual({ phase: 'idle' });
      h.controller.setQuery('Spiti');
      expect(h.controller.getView()).toMatchObject({ phase: 'loading' });
    });
  });
});

describe('closing', () => {
  it('aborts the pending request and cancels the debounce; nothing is requested after close', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    const inFlight = h.pending[0];
    h.controller.setQuery('Spiti Valley');
    h.controller.close();
    expect(inFlight.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(D * 3);
    expect(h.calls).toEqual(['Spiti']);
    expect(h.controller.getView()).toEqual({ phase: 'idle' });
  });

  it('reopening with the same text searches again', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve(ok(response('Spiti', { destinations: ['spiti-valley'] })));
    await vi.advanceTimersByTimeAsync(0);
    h.controller.close();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    expect(h.calls).toEqual(['Spiti', 'Spiti']);
  });

  it('a response that arrives after close is ignored', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    h.controller.close();
    h.pending[0].resolve(ok(response('Spiti', { destinations: ['x'] })));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toEqual({ phase: 'idle' });
  });
});

describe('results, zero results and partial results', () => {
  it('a real zero is "empty"', async () => {
    const h = harness();
    h.controller.setQuery('zzzzqqq');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve(ok(response('zzzzqqq')));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toEqual({ phase: 'empty', query: 'zzzzqqq' });
  });

  it('zero items with a failed section is NOT an authoritative "no results"', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve(ok(response('Spiti', {}, ['journeys', 'destinations'])));
    await vi.advanceTimersByTimeAsync(0);
    const view = h.controller.getView();
    expect(view.phase).toBe('results');
    expect(view.phase === 'results' && view.response.partial).toBe(true);
    expect(view.phase === 'results' && failedSections(view.response)).toEqual(['destinations', 'journeys']);
  });

  it('keeps the successful sections of a partial response', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve(ok(response('Spiti', { destinations: ['spiti-valley'] }, ['journeys'])));
    await vi.advanceTimersByTimeAsync(0);
    const view = h.controller.getView();
    expect(view.phase === 'results' && flattenResults(view.response).map((i) => i.id)).toEqual(['destinations:spiti-valley']);
  });

  it('flattens in the fixed display order', () => {
    const r = response('x', { experts: ['e'], destinations: ['d'], journeys: ['j'], experiences: ['x'], regions: ['r'] });
    expect(flattenResults(r).map((i) => i.id)).toEqual(['destinations:d', 'regions:r', 'journeys:j', 'experiences:x', 'experts:e']);
  });
});

describe('errors: no automatic retries, ever', () => {
  const seed = async (h: ReturnType<typeof harness>) => {
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
  };

  it('a network failure is an error with a user-driven retry that issues exactly one more request', async () => {
    const h = harness();
    await seed(h);
    h.pending[0].reject(new TypeError('Failed to fetch'));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'error', kind: 'network' });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(h.calls).toEqual(['Spiti']);
    h.controller.retry();
    expect(h.calls).toEqual(['Spiti', 'Spiti']);
    h.pending[1].resolve(ok(response('Spiti', { destinations: ['spiti-valley'] })));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'results' });
  });

  it('HTTP 500 is a server error; HTTP 400 is invalid; neither retries by itself', async () => {
    const h = harness();
    await seed(h);
    h.pending[0].resolve({ status: 500 });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'error', kind: 'server' });
    h.controller.setQuery('Spiti Valley');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[1].resolve({ status: 400, body: { error: { code: 'QUERY_INVALID' } } });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'error', kind: 'invalid' });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(h.calls.length).toBe(2);
  });

  it('a malformed 200 body is a server error, not a result', async () => {
    const h = harness();
    await seed(h);
    h.pending[0].resolve({ status: 200, body: { hello: 'world' } });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'error', kind: 'server' });
  });

  it('gives up on a request that never answers (timeout) and offers retry; a late answer is ignored', async () => {
    const h = harness();
    await seed(h);
    await vi.advanceTimersByTimeAsync(GLOBAL_SEARCH_CLIENT.requestTimeoutMs);
    expect(h.pending[0].signal.aborted).toBe(true);
    expect(h.controller.getView()).toMatchObject({ phase: 'error', kind: 'timeout' });
    expect(h.calls.length).toBe(1);
  });

  it('a slow cold start shows "still searching" after 3s but keeps loading, and a 7 s answer is still shown', async () => {
    const h = harness();
    await seed(h);
    await vi.advanceTimersByTimeAsync(GLOBAL_SEARCH_CLIENT.slowAfterMs);
    expect(h.controller.getView()).toEqual({ phase: 'loading', query: 'Spiti', slow: true });
    await vi.advanceTimersByTimeAsync(4000);
    expect(h.controller.getView()).toMatchObject({ phase: 'loading' });
    h.pending[0].resolve(ok(response('Spiti', { destinations: ['spiti-valley'] })));
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ phase: 'results' });
    expect(h.calls.length).toBe(1);
  });
});

describe('HTTP 429', () => {
  it('honours Retry-After, sends nothing while blocked (typing included) and never retries on its own', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve({ status: 429, headers: { 'retry-after': '45' } });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toEqual({ phase: 'error', query: 'Spiti', kind: 'rate-limited', retryAfterSeconds: 45 });
    h.controller.setQuery('Spiti Valley');
    await vi.advanceTimersByTimeAsync(D * 2);
    expect(h.controller.getView()).toMatchObject({ phase: 'error', kind: 'rate-limited' });
    h.controller.retry();
    expect(h.calls).toEqual(['Spiti']);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(h.calls).toEqual(['Spiti']); // no timer ever fires another request
  });

  it('allows a fresh user retry once the wait has passed; a missing or silly Retry-After uses safe bounds', async () => {
    const h = harness();
    h.controller.setQuery('Spiti');
    await vi.advanceTimersByTimeAsync(D);
    h.pending[0].resolve({ status: 429 });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ retryAfterSeconds: GLOBAL_SEARCH_CLIENT.defaultRetryAfterSeconds });
    h.advanceClock(31_000);
    h.controller.retry();
    expect(h.calls).toEqual(['Spiti', 'Spiti']);
    h.pending[1].resolve({ status: 429, headers: { 'retry-after': '99999' } });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.controller.getView()).toMatchObject({ retryAfterSeconds: GLOBAL_SEARCH_CLIENT.maxRetryAfterSeconds });
  });
});

describe('request volume while typing (what the server sees)', () => {
  it('typing "Dharamsala" at a normal pace costs one request, and a hunt-and-peck pace costs a few', async () => {
    const h = harness();
    const word = 'Dharamsala';
    for (let i = 1; i <= word.length; i++) {
      h.controller.setQuery(word.slice(0, i));
      await vi.advanceTimersByTimeAsync(120); // ~8 characters per second: faster than the debounce
    }
    await vi.advanceTimersByTimeAsync(D);
    expect(h.calls).toEqual(['Dharamsala']);

    const slow = harness();
    for (let i = 2; i <= word.length; i++) {
      slow.controller.setQuery(word.slice(0, i));
      await vi.advanceTimersByTimeAsync(D + 50); // pauses after every character
    }
    expect(slow.calls.length).toBe(word.length - 1); // worst case: one per character, never more
    expect(slow.pending.slice(0, -1).every((p) => p.signal.aborted)).toBe(true);
  });
});

describe('see all links', () => {
  it('exist only for capped sections whose listing page runs the same module search', () => {
    expect(seeAllHref('destinations', 'Spiti Valley', 5, 5)).toBe('/destinations?destination=Spiti%20Valley');
    expect(seeAllHref('journeys', 'Kasol & Tosh', 5, 5)).toBe('/journeys?destination=Kasol%20%26%20Tosh');
    expect(seeAllHref('experiences', 'trek', 5, 5)).toBe('/experiences?q=trek');
    expect(seeAllHref('experts', 'asha', 5, 5)).toBe('/experts?q=asha');
    expect(seeAllHref('regions', 'himachal', 5, 5)).toBeNull();
  });
  it('are not offered when the section returned everything it had (fewer than the cap)', () => {
    for (const section of ['destinations', 'journeys', 'experiences', 'experts'] as const) expect(seeAllHref(section, 'x', 4, 5)).toBeNull();
  });
});
