import { siteConfig } from '@/config/site.config';

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

export interface JourneyProductSchemaInput {
  /** The journey's actual rendered H1 (JOURNEY_SEO_OVERRIDES[pkg.slug]?.h1 ?? pkg.name) — never a separate marketing title. */
  name: string;
  /** Must be real, visibly rendered page content — never hidden/meta-only copy (e.g. pkg.shortDescription, which this route never renders). */
  description: string;
  /** Relative (e.g. "/images/foo.jpg") or already-absolute — resolved safely either way, never naively concatenated. */
  image: string;
  /** Exact canonical journey URL. */
  url: string;
  category: string;
  price: number;
}

// Real Places-photo URLs (Google, https://...) are already absolute; every locally
// stored journey image is a root-relative path — this leaves the former untouched and
// only ever prefixes the latter, so it's safe for both without ever double-prefixing.
function toAbsoluteImageUrl(image: string): string {
  if (/^https?:\/\//i.test(image)) return image;
  return `${siteConfig.url}${image.startsWith('/') ? '' : '/'}${image}`;
}

// Deliberately excludes availability, aggregateRating, review, sku/gtin/mpn,
// priceValidUntil, and any discount/lowPrice/highPrice field — none of these are backed
// by real data today (no capacity tracking, zero real reviews site-wide, no product
// identifiers, no "was" price). Adding any of them here would be exactly the kind of
// invented structured-data claim Google's own policies (and this app's own honest-empty
// philosophy elsewhere — see lib/stays.ts, components/modules/stays/*) explicitly warn
// against. Extend this once a real per-journey signal actually exists — e.g. a
// `journeyId`-linked, approved+verified Review (see models/Review.ts).
export function buildJourneyProductSchema(input: JourneyProductSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: toAbsoluteImageUrl(input.image),
    url: input.url,
    category: input.category,
    offers: {
      '@type': 'Offer',
      url: input.url,
      priceCurrency: 'INR',
      price: input.price
    }
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
