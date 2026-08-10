export interface TouristTripSchemaInput {
  name: string;
  description: string;
  image: string;
  url: string;
  priceFrom?: { amount: number; currency: string };
  ratingValue?: number;
  reviewCount?: number;
  areaServed?: string[];
}

export function buildTouristTripSchema(input: TouristTripSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: input.name,
    description: input.description,
    image: input.image,
    url: input.url,
    ...(input.areaServed ? { touristType: input.areaServed } : {}),
    ...(input.priceFrom
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: input.priceFrom.currency,
            price: input.priceFrom.amount,
            availability: 'https://schema.org/InStock'
          }
        }
      : {}),
    ...(input.ratingValue && input.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.ratingValue,
            reviewCount: input.reviewCount
          }
        }
      : {})
  };
}
