import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GlobalSearchResults, buildNavItems, describeView, optionId, type GlobalSearchResultsProps } from '@/components/modules/globalSearch/GlobalSearchResults';
import { POPULAR_SEARCHES, type GlobalSearchView } from '@/lib/globalSearchClient';
import type { GlobalSearchResponse } from '@/lib/globalSearchServer';
import type { GlobalSearchItem } from '@/lib/search/globalSearch';

const item = (type: GlobalSearchItem['type'], slug: string, title = slug, subtitle?: string): GlobalSearchItem => ({
  id: `${type}:${slug}`, type, title, subtitle, href: `/${type}s/${slug}`, reason: 'title-exact'
});
function response(sections: Partial<Record<'destinations' | 'regions' | 'journeys' | 'experiences' | 'experts', GlobalSearchItem[]>>, failed: string[] = []): GlobalSearchResponse {
  const out = {} as GlobalSearchResponse['sections'];
  for (const key of ['destinations', 'regions', 'journeys', 'experiences', 'experts'] as const) out[key] = { status: failed.includes(key) ? 'timeout' : 'ok', items: sections[key] ?? [] };
  const total = Object.values(out).reduce((n, s) => n + s.items.length, 0);
  return { query: 'q', sections: out, total, partial: failed.length > 0 };
}
const noop = () => undefined;
const render = (view: GlobalSearchView, extra: Partial<GlobalSearchResultsProps> = {}) =>
  renderToStaticMarkup(<GlobalSearchResults view={view} listboxId="lb" onHover={noop} onNavigate={noop} onRetry={noop} onPopular={noop} {...extra} />);

describe('idle', () => {
  it('shows only the popular-search chips (query text, no results), and a hint', () => {
    const html = render({ phase: 'idle' });
    for (const chip of POPULAR_SEARCHES) expect(html).toContain(chip);
    expect(html).toContain('at least 2 letters');
    expect(html).not.toContain('role="listbox"');
    expect(html).not.toContain('No results');
  });
  it('the chips are not claims about availability: no price, count or "available" wording', () => {
    expect(POPULAR_SEARCHES.join(' ')).not.toMatch(/₹|available|from \d|\d+ (stays|journeys)/i);
  });
});

describe('loading', () => {
  it('shows a spinner and "Searching", never "No results"', () => {
    const html = render({ phase: 'loading', query: 'Spiti', slow: false });
    expect(html).toContain('Searching');
    expect(html).not.toContain('No results');
    expect(html).not.toContain('Still searching');
  });
  it('adds the cold-start hint only when slow', () => {
    expect(render({ phase: 'loading', query: 'Spiti', slow: true })).toContain('Still searching');
  });
});

describe('results', () => {
  const view: GlobalSearchView = {
    phase: 'results',
    query: 'Spiti',
    response: response({ destinations: [item('destination', 'spiti-valley', 'Spiti Valley', 'Lahaul and Spiti, Himachal Pradesh')], journeys: [item('journey', 'spiti-valley-adventure', 'Spiti Valley Adventure', 'Spiti · 7 Days')], experts: [item('expert', 'asha', 'Asha Verma', 'Mountain Planner')] })
  };

  it('renders grouped, labelled sections with each record\'s own URL and subtitle', () => {
    const html = render(view);
    expect(html).toContain('role="listbox"');
    expect(html).toContain('role="group"');
    expect(html.indexOf('Destinations')).toBeLessThan(html.indexOf('Journeys'));
    expect(html.indexOf('Journeys')).toBeLessThan(html.indexOf('Travel Experts'));
    expect(html).toContain('href="/destinations/spiti-valley"');
    expect(html).toContain('href="/journeys/spiti-valley-adventure"');
    expect(html).toContain('href="/experts/asha"');
    expect(html).toContain('Lahaul and Spiti, Himachal Pradesh');
    expect(html).not.toContain('Regions'); // empty sections are not rendered
    expect(html).not.toContain('Experiences');
  });

  it('every result is an option with a stable id; only the active one is selected', () => {
    const html = render(view, { activeKey: 'journey:spiti-valley-adventure' });
    expect(html).toContain(`id="${optionId('lb', 'journey:spiti-valley-adventure')}"`);
    expect(html.match(/aria-selected="true"/g)?.length).toBe(1);
    expect(html.match(/role="option"/g)?.length).toBe(3);
    expect(render(view).match(/aria-selected="true"/g)).toBeNull();
  });

  it('a complete answer has no partial warning', () => {
    expect(render(view)).not.toContain('incomplete');
  });
});

describe('see all links', () => {
  const five = ['a', 'b', 'c', 'd', 'e'].map((s) => item('destination', s));
  it('appear only for a capped section, point at the real listing, and claim no count', () => {
    const html = render({ phase: 'results', query: 'Adventure', response: response({ destinations: five, regions: [item('region', 'kashmir')], journeys: five.slice(0, 2).map((i) => ({ ...i, type: 'journey' as const, id: i.id.replace('destination', 'journey') })) }) });
    expect(html).toContain('href="/destinations?destination=Adventure"');
    expect(html).toContain('See all destinations for');
    expect(html).not.toContain('/journeys?destination=');
    expect(html).not.toContain('/regions?');
    expect(html).not.toMatch(/See all[^<]*\d/);
  });
  it('are part of keyboard navigation, after their section\'s results', () => {
    const nav = buildNavItems({ phase: 'results', query: 'Adventure', response: response({ destinations: five, journeys: [item('journey', 'j1')] }) });
    expect(nav.map((n) => n.key)).toEqual(['destination:a', 'destination:b', 'destination:c', 'destination:d', 'destination:e', 'see-all:destinations', 'journey:j1']);
    expect(nav.filter((n) => n.kind === 'see-all').length).toBe(1);
  });
  it('are not built for other phases', () => {
    expect(buildNavItems({ phase: 'loading', query: 'x', slow: false })).toEqual([]);
    expect(buildNavItems({ phase: 'idle' })).toEqual([]);
  });
});

describe('empty, partial and error states', () => {
  it('a real zero says "No results found" and offers the chips', () => {
    const html = render({ phase: 'empty', query: 'zzzzqqq' });
    expect(html).toContain('No results found');
    expect(html).toContain('zzzzqqq');
    expect(html).toContain('Popular Searches');
  });

  it('a partial answer with results warns that the list may be incomplete, names the failed section and offers a retry', () => {
    const html = render({ phase: 'results', query: 'Spiti', response: response({ destinations: [item('destination', 'spiti-valley')] }, ['journeys']) });
    expect(html).toContain('may be incomplete');
    expect(html).toContain('Journeys');
    expect(html).toContain('Try again');
    expect(html).toContain('href="/destinations/spiti-valley"');
  });

  it('a partial answer with NOTHING is not presented as "no results"', () => {
    const html = render({ phase: 'results', query: 'Spiti', response: response({}, ['destinations', 'journeys']) });
    expect(html).not.toContain('No results found');
    expect(html).toContain('not a complete answer');
    expect(html).toContain('Try again');
  });

  it('error states have honest copy and a retry, except invalid input', () => {
    for (const kind of ['network', 'timeout', 'server'] as const) {
      const html = render({ phase: 'error', query: 'Spiti', kind });
      expect(html).toContain('role="alert"');
      expect(html).toContain('Try again');
      expect(html).not.toContain('No results');
    }
    expect(render({ phase: 'error', query: 'Spiti', kind: 'invalid' })).not.toContain('Try again');
  });

  it('rate limiting states the wait and creates no retry loop', () => {
    const html = render({ phase: 'error', query: 'Spiti', kind: 'rate-limited', retryAfterSeconds: 42 });
    expect(html).toContain('Too many searches');
    expect(html).toContain('42 seconds');
  });
});

describe('spoken status', () => {
  it('describes each phase for the live region', () => {
    expect(describeView({ phase: 'idle' })).toBe('');
    expect(describeView({ phase: 'loading', query: 'x', slow: false })).toBe('Searching');
    expect(describeView({ phase: 'empty', query: 'zzz' })).toBe('No results for zzz');
    expect(describeView({ phase: 'results', query: 'q', response: response({ destinations: [item('destination', 'a')] }) })).toBe('1 result');
    expect(describeView({ phase: 'results', query: 'q', response: response({ destinations: [item('destination', 'a'), item('destination', 'b')] }, ['journeys']) })).toBe('2 results, some results could not be loaded');
    expect(describeView({ phase: 'error', query: 'q', kind: 'network' })).toMatch(/could not connect/);
  });
});
