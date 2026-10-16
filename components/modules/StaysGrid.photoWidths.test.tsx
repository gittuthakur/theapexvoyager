import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StayCard } from './StaysGrid';
import { PropertyPhotoGallery } from './stays/PropertyPhotoGallery';
import { PHOTO_WIDTH_BUCKETS } from '@/lib/placePhotoUrl';
import type { Stay } from '@/types/stay';

// Stored photo URLs are built at discovery time with the 1200px default (see lib/googlePlaces.ts).
const stored = (id: string) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJabc123/photos/${id}`)}&w=1200`;

function stay(overrides: Partial<Stay> = {}): Stay {
  return {
    placeId: 'ChIJabc123',
    name: 'Test Property',
    slug: 'test-property',
    stayType: 'hotel',
    photos: [stored('p0'), stored('p1'), stored('p2'), stored('p3')],
    destinationSlug: 'manali',
    source: 'google',
    rating: 4.6,
    userRatingCount: 120,
    ...overrides
  };
}

function photoWidths(html: string): number[] {
  return [...html.matchAll(/api\/places\/photo\?[^"]*?w(?:=|%3D)(\d+)/g)].map((m) => Number(m[1]));
}

describe('photo consumers still render, using only canonical widths', () => {
  it('a Google stay card still shows its photo, thumbnails, rating and Maps link', () => {
    const html = renderToStaticMarkup(<StayCard stay={stay()} />);
    expect(html).toContain('Test Property');
    expect(html).toContain('4.6');
    expect(html).toContain('View on Google Maps');
    const widths = photoWidths(html);
    expect(widths.length).toBeGreaterThanOrEqual(4);
    for (const width of widths) expect(PHOTO_WIDTH_BUCKETS).toContain(width);
  });

  it('the property gallery still renders its hero and thumbnails with stored canonical widths', () => {
    const html = renderToStaticMarkup(<PropertyPhotoGallery photos={stay().photos} propertyName="Test Property" />);
    expect(html).toContain('Open photo gallery for Test Property');
    const widths = photoWidths(html);
    expect(widths.length).toBeGreaterThan(0);
    for (const width of widths) expect(PHOTO_WIDTH_BUCKETS).toContain(width);
  });

  it('a card without photos still shows the safe fallback', () => {
    expect(renderToStaticMarkup(<StayCard stay={stay({ photos: [] })} />)).toContain('No photo available');
  });

  it('introduces no booking, price or availability wording on the card', () => {
    expect(renderToStaticMarkup(<StayCard stay={stay()} />)).not.toMatch(/book now|check availability|starting from|per night|₹/i);
  });
});
