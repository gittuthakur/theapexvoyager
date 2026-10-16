import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StayCard } from './StaysGrid';
import type { Stay } from '@/types/stay';

function baseStay(overrides: Partial<Stay> = {}): Stay {
  return {
    placeId: 'ChIJ-real-google-id',
    name: 'Test Property',
    slug: 'test-property',
    stayType: 'hotel',
    photos: [],
    destinationSlug: 'manali',
    source: 'google',
    ...overrides
  };
}

describe('StayCard — source-aware Google attribution', () => {
  it('a genuinely Google-sourced stay shows both the Maps button and the "sourced from Google" attribution', () => {
    const html = renderToStaticMarkup(<StayCard stay={baseStay({ source: 'google', placeId: 'ChIJ-real-google-id' })} />);
    expect(html).toContain('View on Google Maps');
    // D1-1B: the attribution is the shared GoogleMapsAttribution component. The lead-in is text; the mark is Google's
    // official logo image with the accessible name "Google Maps".
    const visibleText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(visibleText).toContain('Property information sourced from');
    expect(html).toContain('data-google-maps-attribution="logo"');
    expect(html).toContain('alt="Google Maps"');
    expect(html).toContain('/brand/google-maps/GoogleMaps_Logo_DarkGray/GoogleMaps_Logo_DarkGray.svg');
  });

  it('shows exactly ONE Google attribution on a Google-sourced card (the rating pill no longer repeats " · Google")', () => {
    const html = renderToStaticMarkup(<StayCard stay={baseStay({ source: 'google', rating: 4.5, userRatingCount: 120 })} />);
    expect(html.match(/data-google-maps-attribution=/g)).toHaveLength(1);
    expect(html).not.toContain('· Google');
    // The rating and review count themselves are unchanged.
    expect(html).toContain('4.5');
    expect(html).toContain('(120)');
  });

  it('a curated stay with a real Maps link (googleMapsUri set via enrichment) shows the Maps button but NEVER the Google attribution', () => {
    const html = renderToStaticMarkup(
      <StayCard stay={baseStay({ source: 'curated', placeId: 'curated:test-property', googleMapsUri: 'https://maps.google.com/?cid=999' })} />
    );
    expect(html).toContain('View on Google Maps');
    expect(html).not.toContain('Property information sourced from');
    expect(html).not.toContain('data-google-maps-attribution');
  });

  it('a curated stay with no Google enrichment at all shows neither the Maps button nor the attribution', () => {
    const html = renderToStaticMarkup(<StayCard stay={baseStay({ source: 'curated', placeId: 'curated:test-property', googleMapsUri: undefined })} />);
    expect(html).not.toContain('View on Google Maps');
    expect(html).not.toContain('Property information sourced from');
    expect(html).not.toContain('data-google-maps-attribution');
  });

  it('photos are rendered exactly as before: main photo at 640 and thumbnails at 192', () => {
    const photos = ['a', 'b', 'c', 'd'].map((token) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJx/photos/${token}`)}&w=1200`);
    const html = renderToStaticMarkup(<StayCard stay={baseStay({ photos })} />);
    expect(html.match(/w%3D640|w=640/g)?.length ?? 0).toBeGreaterThan(0);
    expect(html.match(/w%3D192|w=192/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("never builds a Maps link from a curated stay's synthetic `curated:` placeId, even without googleMapsUri", () => {
    // If this ever regressed to using `stay.placeId` unconditionally, a curated stay
    // would get a broken/nonsensical Maps link built from `curated:test-property`.
    const html = renderToStaticMarkup(
      <StayCard stay={baseStay({ source: 'curated', placeId: 'curated:test-property', googleMapsUri: undefined })} />
    );
    expect(html).not.toContain('curated%3Atest-property');
    expect(html).not.toContain('curated:test-property');
  });

  it('never renders any commercial CTA regardless of source', () => {
    for (const source of ['google', 'curated'] as const) {
      const html = renderToStaticMarkup(<StayCard stay={baseStay({ source })} />);
      expect(html).not.toContain('WhatsApp');
      expect(html.toLowerCase()).not.toContain('contact for pricing');
      expect(html.toLowerCase()).not.toContain('starting from');
    }
  });
});
