import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RegionTourCard from '@/components/modules/regions/RegionTourCard';
import RegionBookingStayCard from '@/components/modules/regions/RegionBookingStayCard';
import type { TourPackage } from '@/types/tour';

const tour = { id: 't1', slug: 't1', title: 'Tirthan Valley Escape', category: 'x', location: 'Tirthan', price: '₹9,999', duration: '3 days' } as TourPackage;

describe('cards with a missing image render the branded placeholder, not a blank box', () => {
  it('RegionTourCard: no image -> placeholder, content and link kept', () => {
    const html = renderToStaticMarkup(<RegionTourCard tour={tour} />);
    expect(html).toContain('data-photo-fallback');
    expect(html).not.toContain('<img');
    expect(html).toContain('Tirthan Valley Escape');
    expect(html).toContain('₹9,999');
    expect(html).toContain('href="/journeys"');
    expect(html).toContain('h-48');
  });

  it('RegionTourCard: with an image -> photo, no placeholder', () => {
    const html = renderToStaticMarkup(<RegionTourCard tour={{ ...tour, image: '/images/x.jpg' }} />);
    expect(html).toContain('<img');
    expect(html).not.toContain('data-photo-fallback');
  });

  it('RegionBookingStayCard: no photo -> placeholder; photo -> image', () => {
    const base = { id: 's', name: 'Stay', providerUrl: 'https://example.com' };
    const without = renderToStaticMarkup(<RegionBookingStayCard {...base} />);
    expect(without).toContain('data-photo-fallback');
    expect(without).not.toContain('<img');
    const withPhoto = renderToStaticMarkup(<RegionBookingStayCard {...base} photoUrl="/images/x.jpg" />);
    expect(withPhoto).toContain('<img');
    expect(withPhoto).not.toContain('data-photo-fallback');
  });

  it('destination page tour card: missing image falls back to the placeholder (source guard)', () => {
    const src = readFileSync('app/destinations/[slug]/page.tsx', 'utf8');
    expect(src).toContain("import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder'");
    expect(src).toMatch(/tour\.image \? \([\s\S]*?\) : \(\s*<MediaPlaceholder fill \/>\s*\)/);
  });
});
