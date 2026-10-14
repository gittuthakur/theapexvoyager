import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import StaysHeroSearch from './StaysHeroSearch';
import StaySearch from './StaySearch';

describe('Stays search fields keep property name and destination distinct', () => {
  it('the /stays hero offers a separate, labelled Property name field (q) next to Destination', () => {
    const html = renderToStaticMarkup(<StaysHeroSearch />);
    expect(html).toContain('Property name');
    
    expect(html).toContain('Hotel or homestay name');
    expect(html).toContain('Destination');
  });

  it('the results-page form pre-fills each field from its own param, never one into the other', () => {
    const html = renderToStaticMarkup(<StaySearch defaultDestination="Manali" defaultQuery="Navisha" />);
    expect(html).toMatch(/name="q"[^>]*value="Navisha"|value="Navisha"/);
    expect(html).toContain('value="Manali"');
    expect(html).not.toContain('value="Manali Navisha"');
  });

  it('adds no booking, price or availability wording', () => {
    const html = renderToStaticMarkup(<StaysHeroSearch />);
    expect(html).not.toMatch(/book now|check availability|starting from|partner/i);
  });
});
