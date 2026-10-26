import { describe, expect, it } from 'vitest';
import { buildCard } from '@/lib/assistant/cards';
import { buildStartingFromLabel } from '@/lib/journeyPriceDisplay';
import { fixturePackage } from '@/lib/assistant/testFixtures';

describe('buildCard', () => {
  it('links to the real journey page and uses the site price formatter', () => {
    const card = buildCard(fixturePackage());
    expect(card.url).toBe('/journeys/fixture-kashmir-escape');
    expect(card.priceLabel).toBe(buildStartingFromLabel(24999));
    expect(card.priceLabel).toMatch(/Starting From .*24,999 per person\*/);
  });

  it('shows inclusions verbatim, only when they exist, capped', () => {
    expect(buildCard(fixturePackage()).inclusions).toEqual(['Fixture inclusion one', 'Fixture inclusion two']);
    expect(buildCard(fixturePackage({ inclusions: [] })).inclusions).toBeUndefined();
    expect(buildCard(fixturePackage({ inclusions: ['a', 'b', 'c', 'd', 'e', 'f'] })).inclusions).toHaveLength(4);
    expect(buildCard(fixturePackage({ inclusions: ['  ', ''] })).inclusions).toBeUndefined();
  });

  it('never shows a price for an invalid stored price', () => {
    for (const price of [0, -1, Number.NaN, undefined as unknown as number]) {
      expect(buildCard(fixturePackage({ price })).priceLabel).toBeUndefined();
    }
  });

  it('only passes through local or https images', () => {
    expect(buildCard(fixturePackage({ image: '/images/a.jpg' })).image).toBe('/images/a.jpg');
    expect(buildCard(fixturePackage({ image: 'https://example.com/a.jpg' })).image).toBe('https://example.com/a.jpg');
    for (const image of ['//evil.example/a.jpg', 'javascript:alert(1)', 'http://example.com/a.jpg', 'data:image/png;base64,xx']) {
      expect(buildCard(fixturePackage({ image })).image).toBeUndefined();
    }
  });

  it('encodes the slug in the link', () => {
    expect(buildCard(fixturePackage({ slug: 'a b/c' })).url).toBe('/journeys/a%20b%2Fc');
  });
});
