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

export interface TravelAgencySchemaInput {
  name: string;
  url: string;
  telephone?: string;
  email?: string;
  /** Verified profile URLs only (e.g. config/footer.config.ts's socialLinks) — never a placeholder/unconfirmed link. */
  sameAs?: string[];
}

// No street address is included here — no verified, confirmed business address exists
// in the codebase to publish (see components/layout/Footer.tsx's removed placeholder
// address). Add a `address: { '@type': 'PostalAddress', ... }` field once a real one is
// confirmed; schema.org does not require it for a valid TravelAgency entry.
export function buildTravelAgencySchema(input: TravelAgencySchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: input.name,
    url: input.url,
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.sameAs && input.sameAs.length > 0 ? { sameAs: input.sameAs } : {})
  };
}

export interface WebSiteSchemaInput {
  name: string;
  url: string;
}

export function buildWebSiteSchema(input: WebSiteSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL. */
  url: string;
}

export function buildBreadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

// Only ever call this with FAQ content that is actually visible/rendered on the same
// page — never a fabricated or off-page question set (Google's FAQPage guidelines
// require the markup to match what a visitor can actually read).
export function buildFaqPageSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
