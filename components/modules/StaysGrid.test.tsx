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
    expect(html).toContain('Property information sourced from Google');
  });

  it('a curated stay with a real Maps link (googleMapsUri set via enrichment) shows the Maps button but NEVER the Google attribution', () => {
    const html = renderToStaticMarkup(
      <StayCard stay={baseStay({ source: 'curated', placeId: 'curated:test-property', googleMapsUri: 'https://maps.google.com/?cid=999' })} />
    );
    expect(html).toContain('View on Google Maps');
    expect(html).not.toContain('Property information sourced from Google');
  });

  it('a curated stay with no Google enrichment at all shows neither the Maps button nor the attribution', () => {
    const html = renderToStaticMarkup(<StayCard stay={baseStay({ source: 'curated', placeId: 'curated:test-property', googleMapsUri: undefined })} />);
    expect(html).not.toContain('View on Google Maps');
    expect(html).not.toContain('Property information sourced from Google');
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
