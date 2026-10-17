import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StaysGrid, { StaysGridView, type StaysGridViewProps } from './StaysGrid';
import { STAY_TYPES, type Stay, type StayType } from '@/types/stay';

const photo = (id: string) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJx/photos/${id}`)}&w=1200`;

function makeStays(n: number, overrides: (i: number) => Partial<Stay> = () => ({})): Stay[] {
  return Array.from({ length: n }, (_, i) => ({
    placeId: `ChIJ-${i}`,
    name: `Property ${i}`,
    slug: `property-${i}`,
    stayType: 'hotel' as StayType,
    photos: [photo(`a${i}`), photo(`b${i}`), photo(`c${i}`), photo(`d${i}`)],
    destinationSlug: 'manali',
    source: 'google' as const,
    ...overrides(i)
  }));
}

function render(stays: Stay[], visibleCount: number, extra: Partial<StaysGridViewProps> = {}) {
  return renderToStaticMarkup(
    <StaysGridView
      stays={stays}
      visibleCount={visibleCount}
      activeType="all"
      availableTypes={[...STAY_TYPES]}
      showTypeChips
      announcement=""
      onSelectType={() => {}}
      onLoadMore={() => {}}
      {...extra}
    />
  );
}

const cards = (html: string) => (html.match(/<article/g) ?? []).length;
const photoElements = (html: string) => (html.match(/<img[^>]+api%2Fplaces%2Fphoto|<img[^>]+\/api\/places\/photo/g) ?? []).length;
const visibleText = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('StaysGridView — progressive rendering', () => {
  it.each([
    [0, 0],
    [5, 5],
    [23, 23],
    [24, 24],
    [25, 24],
    [94, 24]
  ])('%i stays render %i cards initially', (total, rendered) => {
    expect(cards(render(makeStays(total), 24))).toBe(rendered);
  });

  it('94 stays: 24 cards, 96 photo elements (not 376), "Showing 24 of 94 stays" and a Load more button', () => {
    const html = render(makeStays(94), 24);
    expect(cards(html)).toBe(24);
    expect(photoElements(html)).toBe(24 * 4);
    expect(visibleText(html)).toContain('Showing 24 of 94 stays');
    expect(html).toContain('Load more stays');
  });

  it('the button is a native <button type="button"> with the exact accessible label', () => {
    const html = render(makeStays(94), 24);
    expect(html).toMatch(/<button type="button"[^>]*>Load more stays<\/button>/);
  });

  it('revealing batches: 48, 72 and the final partial 94, each in order with no gaps', () => {
    const stays = makeStays(94);
    for (const [count, rendered] of [[48, 48], [72, 72], [94, 94]] as const) {
      const html = render(stays, count);
      expect(cards(html)).toBe(rendered);
      const names = [...html.matchAll(/<h3[^>]*>Property (\d+)<\/h3>/g)].map((m) => Number(m[1]));
      expect(names).toEqual(Array.from({ length: rendered }, (_, i) => i));
    }
  });

  it('the button disappears when everything is shown, and the count line stays', () => {
    const html = render(makeStays(94), 94);
    expect(html).not.toContain('Load more stays');
    expect(visibleText(html)).toContain('Showing 94 of 94 stays');
  });

  it('24 or fewer stays: no count line, no button (nothing changes for small destinations)', () => {
    for (const total of [1, 24]) {
      const html = render(makeStays(total), 24);
      expect(html).not.toContain('Load more stays');
      expect(html).not.toContain('data-stays-count');
    }
  });

  it('no duplicate cards: every rendered card has a distinct name', () => {
    const html = render(makeStays(94), 94);
    const names = [...html.matchAll(/<h3[^>]*>(Property \d+)<\/h3>/g)].map((m) => m[1]);
    expect(new Set(names).size).toBe(names.length);
  });

  it('the first four cards keep priority loading and the rest stay lazy (unchanged card behaviour)', () => {
    const html = render(makeStays(30), 24);
    expect((html.match(/loading="lazy"/g) ?? []).length).toBe(24 * 4 - 4);
  });

  it('curated stays stay first and are not reordered', () => {
    const stays = [...makeStays(3, (i) => ({ placeId: `curated:c${i}`, name: `Curated ${i}`, source: 'curated' as const })), ...makeStays(40)];
    const html = render(stays, 24);
    const order = [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
    expect(order.slice(0, 4)).toEqual(['Curated 0', 'Curated 1', 'Curated 2', 'Property 0']);
  });
});

describe('StaysGridView — filters', () => {
  it('chips are built from the full set and the count reflects the filtered set', () => {
    const mixed = makeStays(60, (i) => ({ stayType: (i % 2 === 0 ? 'hotel' : 'homestay') as StayType }));
    const hotels = mixed.filter((s) => s.stayType === 'hotel');
    const html = render(hotels, 24, { activeType: 'hotel', availableTypes: ['hotel', 'homestay'] });
    expect(visibleText(html)).toContain('Showing 24 of 30 stays');
    expect(visibleText(html)).toContain('Homestay');
    expect(cards(html)).toBe(24);
  });

  it('the type chips are hidden on single-type pages, as before', () => {
    const html = render(makeStays(30), 24, { showTypeChips: false });
    expect(html).not.toContain('All Stays');
  });
});

describe('StaysGridView — accessibility', () => {
  it('has one polite, atomic live region that is empty until the visitor acts', () => {
    const html = render(makeStays(94), 24);
    expect(html.match(/aria-live="polite"/g)).toHaveLength(1);
    expect(html).toMatch(/role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"[^>]*><\/div>/);
  });

  it('announces the new count in the live region after an action', () => {
    const html = render(makeStays(94), 48, { announcement: 'Showing 48 of 94 stays' });
    expect(html).toMatch(/data-stays-live[^>]*>Showing 48 of 94 stays<\/div>/);
  });

  it('the count line is programmatically focusable (focus target when the button unmounts)', () => {
    expect(render(makeStays(94), 94)).toMatch(/<p[^>]*tabindex="-1"[^>]*data-stays-count/);
  });

  it('the button has a comfortable touch target and a visible focus style', () => {
    const html = render(makeStays(94), 24);
    expect(html).toContain('min-h-11');
    expect(html).toContain('focus-visible:outline');
  });
});

describe('StaysGridView — preserved card behaviour', () => {
  const html = render(makeStays(30), 24);

  it('keeps Google Maps branding and attribution on every Google card', () => {
    expect((html.match(/data-google-maps-attribution="logo"/g) ?? []).length).toBe(24);
    expect(html).toContain('alt="Google Maps"');
  });

  it('keeps photos at the canonical card widths only', () => {
    const widths = new Set([...html.matchAll(/api\/places\/photo\?[^"]*?w(?:=|%3D)(\d+)/g)].map((m) => m[1]));
    expect([...widths].sort()).toEqual(['192', '640']);
  });

  it('stays view-only: no booking, pricing, availability or WhatsApp wording', () => {
    const text = visibleText(html).toLowerCase();
    for (const forbidden of ['book now', 'check availability', 'enquire', 'whatsapp', 'per night', 'starting from', 'contact for pricing']) {
      expect(text).not.toContain(forbidden);
    }
    expect(text).not.toContain('₹');
  });
});

describe('StaysGrid — states before any live data (server render)', () => {
  it('shows the loading skeleton, not a list or the empty message, while loading with no curated stays', () => {
    const html = renderToStaticMarkup(<StaysGrid location="Manali" />);
    expect(html).not.toContain('<article');
    expect(html).not.toContain('Load more stays');
    expect(html).not.toContain('No stays found');
  });
});

describe('StaysGrid source guards', () => {
  const src = readFileSync(new URL('./StaysGrid.tsx', import.meta.url), 'utf8');

  it('filters the full set before slicing, and slices only inside the view', () => {
    expect(src).toMatch(/matchingStays = useMemo\(\(\) => \(activeType === 'all' \? stays : stays\.filter/);
    expect(src).toContain('stays.slice(0, shown)');
  });

  it('card keys stay index-suffixed so blank or repeated ids can never collide', () => {
    expect(src).toContain('key={`${stay.placeId}-${index}`}');
  });

  it('keeps curated-first merge order', () => {
    expect(src).toContain('[...curatedAsStays, ...dedupeAgainstCurated(curatedAsStays, googleStays)]');
  });

  it('every filter change bumps an epoch that is part of the paging key (returning to an already-expanded filter must restart at one batch)', () => {
    expect(src).toContain('setFilterEpoch((epoch) => epoch + 1)');
    expect(src).toContain('activeType, filterEpoch, dataVersion, status]');
  });

  it('clears the live-region text when the destination or dataset changes', () => {
    expect(src).toContain('announcement.context === announcementContext');
  });

  it('never auto-loads: no IntersectionObserver, scroll listener or timer drives loading more', () => {
    expect(src).not.toMatch(/IntersectionObserver|addEventListener\(\s*['"]scroll|setInterval|setTimeout|onScroll/);
  });

  it('does not touch photo URLs, the proxy, the API request shape or widths', () => {
    expect(src).toContain('const CARD_PHOTO_WIDTH_PX = 640');
    expect(src).toContain('const CARD_THUMBNAIL_WIDTH_PX = 192');
    expect(src).toContain("fetch(`/api/destinations?type=stays&location=");
  });
});
