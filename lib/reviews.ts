import { connectDB } from '@/lib/mongodb';
import { Review as ReviewModel, type ReviewDocument } from '@/models/Review';
import { DEMO_REVIEWS } from '@/config/reviews.config';
import type { Destination, Review, Testimonial } from '@/types';

const STYLE_CHIP_BY_KEYWORD: Array<{ keyword: string; chip: string }> = [
  { keyword: 'wellness', chip: 'Wellness' },
  { keyword: 'family', chip: 'Family' },
  { keyword: 'honeymoon', chip: 'Honeymoon' },
  { keyword: 'romantic', chip: 'Honeymoon' },
  { keyword: 'culture', chip: 'Cultural' },
  { keyword: 'adventure', chip: 'Adventure' }
];

/** Best-effort match against TestimonialSection's fixed style-chip vocabulary (Adventure/Family/Honeymoon/Cultural/Wellness). */
function inferStyleChip(destination?: Destination): string | undefined {
  const haystack = [...(destination?.travelStyles ?? []), destination?.category].filter(Boolean).map((value) => value!.toLowerCase());
  return STYLE_CHIP_BY_KEYWORD.find(({ keyword }) => haystack.some((value) => value.includes(keyword)))?.chip;
}

function toReview(doc: ReviewDocument): Review {
  return {
    id: String(doc._id),
    destinationSlug: doc.destinationSlug,
    author: doc.author,
    location: doc.location,
    rating: doc.rating,
    quote: doc.quote,
    tripTitle: doc.tripTitle,
    tripDate: doc.tripDate,
    verified: doc.verified,
    source: doc.source
  };
}

// This page is server-rendered per-request, so the fallback path below would otherwise
// re-log on every single page load. Once per process is enough to flag "you haven't
// seeded reviews yet" without spamming the dev console.
let hasWarnedEmptyReviews = false;

/**
 * Reviews live in MongoDB once real ones exist (see models/Review.ts). Until then —
 * or if the database is unreachable — this falls back to config/reviews.config.ts's
 * clearly-marked DEMO_REVIEWS, following the same DB-then-static-fallback convention
 * as getAllPackages() in lib/packages.ts. Run `npm run db:seed` to populate the
 * DEMO_REVIEWS into MongoDB so this stops hitting the fallback.
 */
export async function getReviewsForDestinationsPage(): Promise<Review[]> {
  try {
    await connectDB();
    const docs = await ReviewModel.find().sort({ createdAt: -1 }).lean<ReviewDocument[]>();
    if (docs.length > 0) {
      return JSON.parse(JSON.stringify(docs.map(toReview)));
    }
    if (!hasWarnedEmptyReviews) {
      console.warn('Review.find() returned no results — falling back to demo reviews. Run `npm run db:seed` to populate them.');
      hasWarnedEmptyReviews = true;
    }
  } catch (error) {
    console.error('Failed to fetch reviews from the database — falling back to demo reviews', error);
  }
  return DEMO_REVIEWS;
}

export interface DestinationRating {
  rating: number;
  count: number;
}

/**
 * Real per-destination star ratings, averaged from actual Review documents — never a
 * fabricated number. A destinationSlug with no reviews simply has no entry, so callers
 * (e.g. journey cards deriving a rating from their linked destinations) can tell "no
 * rating yet" apart from "rated 0" and omit the badge entirely instead of faking one.
 */
export async function getDestinationRatingsMap(): Promise<Map<string, DestinationRating>> {
  const reviews = await getReviewsForDestinationsPage();
  const totals = new Map<string, { total: number; count: number }>();

  for (const review of reviews) {
    if (!review.destinationSlug) continue;
    const entry = totals.get(review.destinationSlug) ?? { total: 0, count: 0 };
    entry.total += review.rating;
    entry.count += 1;
    totals.set(review.destinationSlug, entry);
  }

  return new Map(
    Array.from(totals.entries()).map(([slug, { total, count }]) => [slug, { rating: Math.round((total / count) * 10) / 10, count }])
  );
}

/**
 * Lets the already-built TestimonialSection component (which renders Testimonial[])
 * render Review[] unchanged. `destinationsBySlug` is optional — when passed, it fills
 * in `region`/`category` from the review's linked destination so TestimonialSection's
 * region/style tabs have real matches instead of only ever showing "All".
 */
export function reviewToTestimonial(review: Review, destinationsBySlug?: Map<string, Destination>): Testimonial {
  const destination = review.destinationSlug ? destinationsBySlug?.get(review.destinationSlug) : undefined;
  return {
    id: review.id,
    author: review.author,
    location: review.location,
    rating: review.rating,
    quote: review.quote,
    tourTitle: review.tripTitle,
    tripDate: review.tripDate,
    verified: review.verified,
    source: review.source,
    region: destination?.state,
    category: inferStyleChip(destination)
  };
}
