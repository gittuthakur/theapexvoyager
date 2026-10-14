import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GlobalSearchResults, buildNavItems, describeView, type GlobalSearchResultsProps } from '@/components/modules/globalSearch/GlobalSearchResults';
import { flattenResults, type GlobalSearchView } from '@/lib/globalSearchClient';
import type { GlobalSearchResponse } from '@/lib/globalSearchServer';
import type { GlobalSearchItem } from '@/lib/search/globalSearch';

const routeItem = (n: number, origin = 'Delhi', destination = `Stop ${n}`): GlobalSearchItem => ({
  id: `transport:r${n}`,
  type: 'transport',
  title: `${origin} → ${destination}`,
  subtitle: 'Intercity Transfer · 12 hours',
  href: `/transport?pickup=${origin}&destination=${encodeURIComponent(destination)}`,
  reason: 'route'
});
const destination: GlobalSearchItem = { id: 'destination:manali', type: 'destination', title: 'Manali', href: '/destinations/manali', reason: 'title-exact' };

function response(transport: GlobalSearchItem[], status: 'ok' | 'timeout' | 'error' = 'ok'): GlobalSearchResponse {
  const empty = { status: 'ok' as const, items: [] as GlobalSearchItem[] };
  return {
    query: 'q',
    sections: { destinations: { status: 'ok', items: [destination] }, regions: empty, journeys: empty, experiences: empty, stays: empty, experts: empty, transport: { status, items: transport } },
    total: 1 + transport.length,
    partial: status !== 'ok'
  };
}
const noop = () => undefined;
const render = (view: GlobalSearchView, extra: Partial<GlobalSearchResultsProps> = {}) =>
  renderToStaticMarkup(<GlobalSearchResults view={view} listboxId="lb" onHover={noop} onNavigate={noop} onRetry={noop} onPopular={noop} {...extra} />);
const results = (body: GlobalSearchResponse): GlobalSearchView => ({ phase: 'results', query: 'Delhi', response: body });

describe('Transport rows in the Header results', () => {
  it('renders a labelled Transport group after every other section, with accessible option rows and real route links', () => {
    const html = render(results(response([routeItem(1, 'Delhi', 'Manali'), routeItem(2)])));
    expect(html).toContain('>Transport<');
    expect(html).toContain('role="group" aria-labelledby="lb-h-transport"');
    expect(html).toContain('Delhi → Manali');
    expect(html).toContain('Intercity Transfer · 12 hours');
    expect(html).toContain('href="/transport?pickup=Delhi&amp;destination=Manali"');
    expect(html).toContain('role="option"');
    expect(html.indexOf('>Destinations<')).toBeLessThan(html.indexOf('>Transport<'));
    expect(html).not.toMatch(/₹|fare|price|available|<img/i);
  });

  it('is part of keyboard navigation in display order, with no "See all" row even at the cap', () => {
    const view = results(response([1, 2, 3, 4, 5].map((n) => routeItem(n))));
    const keys = buildNavItems(view).map((item) => item.key);
    expect(keys).toEqual(['destination:manali', 'transport:r1', 'transport:r2', 'transport:r3', 'transport:r4', 'transport:r5']);
    expect(flattenResults((view as { response: GlobalSearchResponse }).response).map((i) => i.id)).toEqual(keys);
    expect(render(view)).not.toContain('See all transport');
  });

  it('a Transport timeout keeps the other sections, names Transport in the partial warning and is never "no results"', () => {
    const view = results(response([], 'timeout'));
    const html = render(view);
    expect(html).toContain('Manali');
    expect(html).toContain('Some results couldn’t be loaded (Transport)');
    expect(html).toContain('Try again');
    expect(html).not.toContain('No results');
    expect(describeView(view)).toContain('some results could not be loaded');
  });

  it('the idle tip mentions transport routes', () => {
    expect(render({ phase: 'idle' })).toContain('transport routes');
  });
});
