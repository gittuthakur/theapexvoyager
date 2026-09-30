import { describe, expect, it } from 'vitest';
import { buildJourneyProductSchema, buildFaqPageSchema } from './schema';

// Phase 4, Part 10/14 — regression guard locking in the honest-structured-data behaviour
// buildJourneyProductSchema already had (see its own doc comment): no fabricated review,
// rating, availability, or discount signal, ever, for any Journey — published or not.
describe('buildJourneyProductSchema — never fabricates reviews, ratings, availability, or a discount', () => {
  const baseInput = {
    name: 'Test Journey',
    description: 'A real, visibly-rendered description.',
    image: '/images/test.jpg',
    url: 'https://www.theapexvoyager.in/journeys/test-journey',
    category: 'Family',
    price: 13999
  };

  it('never includes aggregateRating or review — no rating/review data exists anywhere in this codebase for Journeys', () => {
    const schema = buildJourneyProductSchema(baseInput);
    expect(schema).not.toHaveProperty('aggregateRating');
    expect(schema).not.toHaveProperty('review');
  });

  it('never includes availability, priceValidUntil, highPrice, offerCount, or any other unsupported claim', () => {
    const schema = buildJourneyProductSchema(baseInput);
    expect(schema.offers).not.toHaveProperty('availability');
    expect(schema.offers).not.toHaveProperty('priceValidUntil');
    expect(schema.offers).not.toHaveProperty('highPrice');
    expect(schema.offers).not.toHaveProperty('offerCount');
  });

  it('the offer is an AggregateOffer with lowPrice — never a plain Offer/price, which would misrepresent an indicative "Starting From" figure as a fixed, guaranteed price (Phase 4A honesty fix)', () => {
    const schema = buildJourneyProductSchema(baseInput);
    expect(schema.offers).toEqual({
      '@type': 'AggregateOffer',
      url: baseInput.url,
      priceCurrency: 'INR',
      lowPrice: 13999
    });
  });

  it('omits the offers block entirely rather than fabricate one, when no real price is available', () => {
    expect(buildJourneyProductSchema({ ...baseInput, price: undefined })).not.toHaveProperty('offers');
    expect(buildJourneyProductSchema({ ...baseInput, price: 0 })).not.toHaveProperty('offers');
    expect(buildJourneyProductSchema({ ...baseInput, price: -100 })).not.toHaveProperty('offers');
    expect(buildJourneyProductSchema({ ...baseInput, price: NaN })).not.toHaveProperty('offers');
  });

  it('every other field is still emitted correctly even with no offers block', () => {
    const schema = buildJourneyProductSchema({ ...baseInput, price: undefined });
    expect(schema.name).toBe(baseInput.name);
    expect(schema.category).toBe(baseInput.category);
  });
});

// Phase 4, Part 14 — FAQPage schema must only ever mirror what's actually rendered
// on-page (see buildFaqPageSchema's own doc comment); this locks in that it never
// invents structure beyond the exact FAQ list it's given.
describe('buildFaqPageSchema — mirrors only the given, real FAQ list', () => {
  it('produces exactly one Question/Answer pair per input FAQ, nothing fabricated or added', () => {
    const faqs = [{ question: 'Is this a real question?', answer: 'Yes, a real answer.' }];
    const schema = buildFaqPageSchema(faqs);
    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: faqs[0].question,
      acceptedAnswer: { '@type': 'Answer', text: faqs[0].answer }
    });
  });

  it('produces an empty mainEntity for an empty FAQ list — never a placeholder question', () => {
    expect(buildFaqPageSchema([]).mainEntity).toEqual([]);
  });
});
