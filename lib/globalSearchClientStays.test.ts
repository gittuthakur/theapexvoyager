import { describe, expect, it, vi } from 'vitest';
import {
  GLOBAL_SEARCH_CLIENT,
  GLOBAL_SEARCH_SECTIONS,
  createGlobalSearchController,
  failedSections,
  flattenResults,
  seeAllHref,
  type GlobalSearchControllerDeps
} from '@/lib/globalSearchClient';
import type { GlobalSearchResponse } from '@/lib/globalSearchServer';
import { GLOBAL_SEARCH_LIMITS, type GlobalSearchItem } from '@/lib/search/globalSearch';

const stay = (n: number): GlobalSearchItem => ({ id: `stay:ChIJ${n}`, type: 'stay', title: `Stay ${n}`, subtitle: 'Kaza, Spiti Valley', href: `/stays/property/ChIJ${n}`, reason: 'stay' });
const experience: GlobalSearchItem = { id: 'experience:x', type: 'experience', title: 'X', href: '/experiences/x', reason: 'title-exact' };

function response(stays: GlobalSearchItem[], staysStatus: 'ok' | 'timeout' | 'error' = 'ok'): GlobalSearchResponse {
  const empty = { status: 'ok' as const, items: [] as GlobalSearchItem[] };
  return {
    query: 'Kaza',
    sections: { destinations: empty, regions: empty, journeys: empty, experiences: { status: 'ok', items: [experience] }, stays: { status: staysStatus, items: stays }, experts: empty, transport: empty },
    total: stays.length + 1,
    partial: staysStatus !== 'ok'
  };
}

describe('client: the Stays section', () => {
  it('is displayed between Experiences and Travel Experts', () => {
    expect(GLOBAL_SEARCH_SECTIONS.map((s) => s.key)).toEqual(['destinations', 'regions', 'journeys', 'experiences', 'stays', 'experts', 'transport']);
    expect(GLOBAL_SEARCH_SECTIONS.find((s) => s.key === 'stays')?.label).toBe('Stays');
  });

  it('flattens results in display order, so keyboard navigation reaches stays after experiences', () => {
    expect(flattenResults(response([stay(1), stay(2)])).map((item) => item.id)).toEqual(['experience:x', 'stay:ChIJ1', 'stay:ChIJ2']);
  });

  it('a Stays timeout or error is a failed section (never "no stays")', () => {
    expect(failedSections(response([], 'timeout'))).toEqual(['stays']);
    expect(failedSections(response([], 'error'))).toEqual(['stays']);
    expect(failedSections(response([stay(1)], 'ok'))).toEqual([]);
  });

  it('tolerates an older response without a Stays key', () => {
    const old = response([]);
    delete (old.sections as Partial<typeof old.sections>).stays;
    expect(flattenResults(old).map((i) => i.id)).toEqual(['experience:x']);
    expect(failedSections(old)).toEqual([]);
  });

  it('"See all" goes to the stays listing with the exact encoded query, only when the section returned its cap, and claims no count', () => {
    const cap = GLOBAL_SEARCH_LIMITS.perSection;
    expect(seeAllHref('stays', 'Kaza', cap, cap)).toBe('/stays/search?q=Kaza');
    expect(seeAllHref('stays', 'Navisha Luxury Villa & Treehouse Cottages', cap, cap)).toBe('/stays/search?q=Navisha%20Luxury%20Villa%20%26%20Treehouse%20Cottages');
    expect(seeAllHref('stays', 'Kaza', cap - 1, cap)).toBeNull();
    expect(seeAllHref('stays', 'Kaza', 0, cap)).toBeNull();
    // The target round-trips to the exact query text.
    const href = seeAllHref('stays', 'Bir & "Billing" 100%', cap, cap) as string;
    expect(new URL(href, 'https://x.test').searchParams.get('q')).toBe('Bir & "Billing" 100%');
  });
});

describe('client rules are unchanged by the Stays section', () => {
  function harness(body: GlobalSearchResponse) {
    const timers: Array<{ at: number; fn: () => void; id: number }> = [];
    let now = 0;
    let nextId = 1;
    const fetch = vi.fn(async () => ({ ok: true, status: 200, headers: new Headers(), json: async () => body }));
    const deps: GlobalSearchControllerDeps = {
      fetch: fetch as unknown as GlobalSearchControllerDeps['fetch'],
      setTimeout: (fn, ms) => {
        const id = nextId++;
        timers.push({ at: now + ms, fn, id });
        return id;
      },
      clearTimeout: (handle) => {
        const index = timers.findIndex((t) => t.id === handle);
        if (index >= 0) timers.splice(index, 1);
      },
      now: () => now
    };
    const advance = async (ms: number) => {
      now += ms;
      for (const timer of timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at)) {
        timers.splice(timers.indexOf(timer), 1);
        timer.fn();
      }
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };
    return { controller: createGlobalSearchController(deps), fetch, advance };
  }

  it('still debounces 300 ms, asks once, makes no automatic retry after a partial Stays timeout, and shows the partial answer', async () => {
    const { controller, fetch, advance } = harness(response([], 'timeout'));
    controller.setQuery('Kaza');
    await advance(GLOBAL_SEARCH_CLIENT.debounceMs - 1);
    expect(fetch).not.toHaveBeenCalled();
    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    await advance(60_000);
    expect(fetch).toHaveBeenCalledTimes(1);
    const view = controller.getView();
    expect(view.phase).toBe('results');
    if (view.phase === 'results') {
      expect(view.response.partial).toBe(true);
      expect(view.response.sections.experiences.items).toHaveLength(1);
    }
  });

  it('a manual retry asks again exactly once', async () => {
    const { controller, fetch, advance } = harness(response([stay(1)]));
    controller.setQuery('Kaza');
    await advance(GLOBAL_SEARCH_CLIENT.debounceMs);
    controller.retry();
    await advance(0);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
