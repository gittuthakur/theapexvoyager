import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StayCard } from './StaysGrid';
import type { Stay } from '@/types/stay';

const stored = (id: string) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJabc123/photos/${id}`)}&w=1200`;

function stay(overrides: Partial<Stay> = {}): Stay {
  return {
    placeId: 'ChIJabc123',
    name: 'Test Property',
    slug: 'test-property',
    stayType: 'hotel',
    photos: [stored('p0'), stored('p1'), stored('p2')],
    destinationSlug: 'manali',
    source: 'google',
    rating: 4.6,
    userRatingCount: 120,
    googleMapsUri: 'https://maps.google.com/?cid=1',
    ...overrides
  };
}

describe('StayCard photo modes', () => {
  it('legacy (no cardPhotoMode): stored photos and thumbnails exactly as before, no by-place URL', () => {
    const html = renderToStaticMarkup(<StayCard stay={stay()} />);
    expect(html).toContain('api/places/photo?name');
    expect(html).not.toContain('by-place');
  });

  it('display-time: one by-place image carrying the place ID, no stored name, no thumbnails', () => {
    const html = renderToStaticMarkup(<StayCard stay={stay({ cardPhotoMode: 'display-time' })} />);
    expect(html).toContain('/api/places/photo/by-place?placeId=ChIJabc123');
    expect(html).not.toContain('places%2FChIJabc123%2Fphotos');
    expect(html).not.toContain('api/places/photo?name');
    expect(html.match(/by-place\?placeId/g)?.length).toBe(1);
  });

  it('display-time keeps ratings, review count, Google Maps link and attribution visible', () => {
    const html = renderToStaticMarkup(<StayCard stay={stay({ cardPhotoMode: 'display-time' })} />);
    expect(html).toContain('4.6');
    expect(html).toContain('(120)');
    expect(html).toContain('View on Google Maps');
    expect(html).toContain('Property information sourced from');
  });

  it('unavailable (pilot, not selected): the "No photo available" panel and no image request at all', () => {
    const html = renderToStaticMarkup(<StayCard stay={stay({ cardPhotoMode: 'unavailable' })} />);
    expect(html).toContain('No photo available');
    expect(html).not.toContain('/api/places/photo');
    expect(html).toContain('4.6');
  });

  it('a curated stay ignores the field entirely', () => {
    const html = renderToStaticMarkup(<StayCard stay={stay({ source: 'curated', placeId: 'curated:x', slug: 'x', cardPhotoMode: 'display-time', photos: [] })} />);
    expect(html).not.toContain('by-place');
  });
});
