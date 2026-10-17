import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Stay, StayType } from '@/types/stay';

// next/link is replaced by a probe that writes the props it receives into the markup, so the prefetch setting (which Next
// consumes and never renders) can be asserted on the real StayCard / StaysGridView output.
vi.mock('next/link', () => ({
  default: ({ href, prefetch, children, className }: { href: string; prefetch?: boolean | null; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-prefetch={String(prefetch)} data-probe-link="true">
      {children}
    </a>
  )
}));

import { StayCard, StaysGridView } from './StaysGrid';

const photo = (id: string) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJx/photos/${id}`)}&w=1200`;

function stay(overrides: Partial<Stay> = {}): Stay {
  return {
    placeId: 'ChIJ-google-1',
    name: 'Google Property',
    slug: 'google-property',
    stayType: 'hotel',
    photos: [photo('a'), photo('b'), photo('c'), photo('d')],
    destinationSlug: 'manali',
    source: 'google',
    ...overrides
  };
}

const probeLinks = (html: string) => [...html.matchAll(/<a [^>]*data-probe-link="true"[^>]*>/g)].map((m) => m[0]);
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

describe('StayCard detail link', () => {
  it('turns Next prefetching off', () => {
    const links = probeLinks(renderToStaticMarkup(<StayCard stay={stay()} />));
    expect(links).toHaveLength(1);
    expect(attr(links[0], 'data-prefetch')).toBe('false');
  });

  it('a Google-sourced card still links to its property page by Place ID', () => {
    const [link] = probeLinks(renderToStaticMarkup(<StayCard stay={stay({ placeId: 'ChIJ-abc_123' })} />));
    expect(attr(link, 'href')).toBe('/stays/property/ChIJ-abc_123');
    expect(attr(link, 'class')).toBe('cursor-hover block');
  });

  it('a curated card still links to its curated hotel page by slug, with prefetch off', () => {
    const [link] = probeLinks(
      renderToStaticMarkup(<StayCard stay={stay({ source: 'curated', placeId: 'curated:my-hotel', slug: 'my-hotel' })} />)
    );
    expect(attr(link, 'href')).toBe('/stays/my-hotel');
    expect(attr(link, 'data-prefetch')).toBe('false');
  });
});

describe('StaysGridView with the prefetch change', () => {
  const stays = Array.from({ length: 30 }, (_, i) =>
    stay({ placeId: i < 3 ? `curated:c${i}` : `ChIJ-${i}`, slug: `p-${i}`, name: `Property ${i}`, source: i < 3 ? 'curated' : 'google', stayType: 'hotel' as StayType })
  );
  const html = renderToStaticMarkup(
    <StaysGridView
      stays={stays}
      visibleCount={24}
      activeType="all"
      availableTypes={['hotel']}
      showTypeChips
      announcement=""
      onSelectType={() => {}}
      onLoadMore={() => {}}
    />
  );

  it('every rendered card link has prefetch off and the right href', () => {
    const links = probeLinks(html);
    expect(links).toHaveLength(24);
    expect(links.every((l) => attr(l, 'data-prefetch') === 'false')).toBe(true);
    expect(attr(links[0], 'href')).toBe('/stays/p-0');
    expect(attr(links[3], 'href')).toBe('/stays/property/ChIJ-3');
  });

  it('P5-A Load more, the count line and the filter chips are unchanged', () => {
    expect(html).toContain('Load more stays');
    expect(html.replace(/<[^>]+>/g, ' ')).toContain('Showing 24 of 30 stays');
    expect(html).toContain('All Stays');
  });

  it('Google branding is intact: logo on Google cards only, never on curated ones', () => {
    expect((html.match(/data-google-maps-attribution="logo"/g) ?? []).length).toBe(21);
    expect(html).toContain('alt="Google Maps"');
  });

  it('stays view-only: no booking, pricing, availability or enquiry wording', () => {
    const text = html.replace(/<[^>]+>/g, ' ').toLowerCase();
    for (const word of ['book now', 'check availability', 'enquire', 'whatsapp', 'per night', 'starting from', 'contact for pricing']) {
      expect(text).not.toContain(word);
    }
  });

  it('photos are untouched: 4 per card at the canonical widths', () => {
    expect((html.match(/<img[^>]+api(?:%2F|\/)places(?:%2F|\/)photo/g) ?? []).length).toBe(24 * 4);
    const widths = new Set([...html.matchAll(/api\/places\/photo\?[^"]*?w(?:=|%3D)(\d+)/g)].map((m) => m[1]));
    expect([...widths].sort()).toEqual(['192', '640']);
  });
});

describe('scope guard', () => {
  const src = readFileSync(new URL('./StaysGrid.tsx', import.meta.url), 'utf8');

  it('StaysGrid.tsx has exactly one <Link>, and it is the card link with prefetch={false}', () => {
    expect(src.match(/<Link\b/g)).toHaveLength(1);
    expect(src).toContain('<Link href={href} prefetch={false} className="cursor-hover block">');
  });
});
