import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GlobalSearchResults, buildNavItems, describeView, type GlobalSearchResultsProps } from '@/components/modules/globalSearch/GlobalSearchResults';
import type { GlobalSearchView } from '@/lib/globalSearchClient';
import type { GlobalSearchResponse } from '@/lib/globalSearchServer';
import type { GlobalSearchItem } from '@/lib/search/globalSearch';

const stay = (n: number, title = `Stay ${n}`): GlobalSearchItem => ({ id: `stay:ChIJ${n}`, type: 'stay', title, subtitle: 'Kaza, Spiti Valley', href: `/stays/property/ChIJ${n}`, reason: 'stay' });
const destination: GlobalSearchItem = { id: 'destination:spiti-valley', type: 'destination', title: 'Spiti Valley', subtitle: 'Himachal', href: '/destinations/spiti-valley', reason: 'title-exact' };

function response(stays: GlobalSearchItem[], staysStatus: 'ok' | 'timeout' | 'error' = 'ok'): GlobalSearchResponse {
  const empty = { status: 'ok' as const, items: [] as GlobalSearchItem[] };
  const sections = { destinations: { status: 'ok' as const, items: [destination] }, regions: empty, journeys: empty, experiences: empty, stays: { status: staysStatus, items: stays }, experts: empty };
  return { query: 'q', sections, total: 1 + stays.length, partial: staysStatus !== 'ok' };
}
const noop = () => undefined;
const render = (view: GlobalSearchView, extra: Partial<GlobalSearchResultsProps> = {}) =>
  renderToStaticMarkup(<GlobalSearchResults view={view} listboxId="lb" onHover={noop} onNavigate={noop} onRetry={noop} onPopular={noop} {...extra} />);
const results = (query: string, body: GlobalSearchResponse): GlobalSearchView => ({ phase: 'results', query, response: body });

describe('Stays rows in the Header results', () => {
  it('renders a labelled Stays group with the property name, locality, real detail link and the neutral stay icon - and no photograph', () => {
    const html = render(results('Kaza', response([stay(1, 'Hotel Spiti Heritage'), stay(2)])));
    expect(html).toContain('>Stays<');
    expect(html).toContain('Hotel Spiti Heritage');
    expect(html).toContain('Kaza, Spiti Valley');
    expect(html).toContain('href="/stays/property/ChIJ1"');
    expect(html).toContain('🏨');
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/places\/photo|googleusercontent|rating|₹/i);
  });

  it('sits after the Destinations group', () => {
    const html = render(results('Kaza', response([stay(1)])));
    expect(html.indexOf('Destinations')).toBeLessThan(html.indexOf('>Stays<'));
  });

  it('offers "See all stays" only at the cap, with the exact encoded query, and claims no count', () => {
    const five = render(results('Navisha Luxury Villa & Treehouse Cottages', response([1, 2, 3, 4, 5].map((n) => stay(n)))));
    expect(five).toContain('href="/stays/search?q=Navisha%20Luxury%20Villa%20%26%20Treehouse%20Cottages"');
    expect(five).toContain('See all stays for');
    expect(five).not.toMatch(/\d+ (more|stays|results)/i);
    const two = render(results('Kaza', response([stay(1), stay(2)])));
    expect(two).not.toContain('/stays/search');
    expect(two).not.toContain('See all stays');
  });
});

describe('Stays partial states', () => {
  it('a Stays timeout keeps the other sections, names Stays in the warning and offers a manual retry - it is not "no stays"', () => {
    const view = results('Kaza', response([], 'timeout'));
    const html = render(view);
    expect(html).toContain('Spiti Valley');
    expect(html).toContain('Some results couldn’t be loaded (Stays)');
    expect(html).toContain('Try again');
    expect(html).not.toContain('No results');
    expect(html).not.toContain('>Stays</p>');
    expect(describeView(view)).toContain('some results could not be loaded');
  });

  it('a Stays error behaves the same, and with nothing else found the warning is "not a complete answer"', () => {
    const only = response([], 'error');
    only.sections.destinations = { status: 'ok', items: [] };
    only.total = 0;
    const html = render(results('Kaza', only));
    expect(html).toContain('not a complete answer');
    expect(html).not.toContain('No results found');
  });
});

describe('Stays keyboard navigation', () => {
  it('walks results in display order, the stays after the destination, then its "See all" link at the cap', () => {
    const view = results('Kaza', response([1, 2, 3, 4, 5].map((n) => stay(n))));
    const keys = buildNavItems(view).map((nav) => nav.key);
    expect(keys).toEqual(['destination:spiti-valley', 'stay:ChIJ1', 'stay:ChIJ2', 'stay:ChIJ3', 'stay:ChIJ4', 'stay:ChIJ5', 'see-all:stays']);
    expect(buildNavItems(view)[buildNavItems(view).length - 1]).toMatchObject({ href: '/stays/search?q=Kaza', kind: 'see-all' });
  });

  it('other sections stay navigable when Stays failed', () => {
    const keys = buildNavItems(results('Kaza', response([], 'timeout'))).map((nav) => nav.key);
    expect(keys).toEqual(['destination:spiti-valley']);
  });
});
