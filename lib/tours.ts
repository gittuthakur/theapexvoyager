import { connectDB } from '@/lib/mongodb';
import { escapeRegExp } from '@/lib/regex';
import { Tour, type TourDocument } from '@/models/Tour';
import { resolveLocalImage } from '@/lib/contentImage.server';
import type { TourPackage } from '@/types';

export function toTourPackage(doc: TourDocument): TourPackage {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    badge: doc.badge,
    location: doc.location,
    price: doc.price,
    priceUnit: doc.priceUnit,
    duration: doc.duration,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    highlights: doc.highlights,
    description: doc.description,
    image: resolveLocalImage(doc.image),
    destinationSlug: doc.destinationSlug,
    featured: doc.featured,
    maxGuests: doc.maxGuests,
    difficulty: doc.difficulty,
    itinerary: doc.itinerary,
    inclusions: doc.inclusions,
    exclusions: doc.exclusions,
    faqs: doc.faqs,
    regionId: doc.regionId ? String(doc.regionId) : undefined
  };
}

// The homepage's "Explore by Travel Style" cards link here with these slugs — none
// of them are literal Tour.category values, so each maps to a broader keyword
// pattern matched against category/title/description instead of an exact field.
const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  adventure: 'adventure',
  luxury: 'luxury|premium|resort',
  honeymoon: 'honeymoon|romantic',
  family: 'family',
  'road-trips': 'road|highway',
  offbeat: 'offbeat|hidden|remote',
  camping: 'camp'
};

export async function getTours(filter?: { destination?: string; category?: string }): Promise<TourPackage[]> {
  await connectDB();

  const clauses: Record<string, unknown>[] = [];
  if (filter?.destination) {
    const pattern = new RegExp(escapeRegExp(filter.destination.trim()), 'i');
    clauses.push({ $or: [{ location: pattern }, { destinationSlug: pattern }, { title: pattern }] });
  }
  if (filter?.category) {
    // A known key maps to a trusted, hand-authored alternation pattern (real regex
    // syntax, e.g. "luxury|premium|resort") — only escape the fallback, where an
    // unrecognized (client-supplied) category value would otherwise reach RegExp raw.
    const term = CATEGORY_SEARCH_TERMS[filter.category] ?? escapeRegExp(filter.category);
    const pattern = new RegExp(term, 'i');
    clauses.push({ $or: [{ category: pattern }, { title: pattern }, { description: pattern }] });
  }
  const query: Record<string, unknown> = clauses.length > 0 ? { $and: clauses } : {};

  const docs = await Tour.find(query).sort({ featured: -1, createdAt: 1 }).lean<TourDocument[]>();
  return docs.map(toTourPackage);
}

export async function getTourBySlug(slug: string): Promise<TourPackage | null> {
  await connectDB();
  const doc = await Tour.findOne({ slug }).lean<TourDocument | null>();
  return doc ? toTourPackage(doc) : null;
}

// Precise destinationSlug match for the destinations "graph" (app/api/destinations/[slug]/route.ts)
// — unlike getTours()'s destination filter, which is a free-text regex over location/title.
export async function getToursByDestinationSlug(destinationSlug: string): Promise<TourPackage[]> {
  await connectDB();
  const docs = await Tour.find({ destinationSlug }).sort({ featured: -1, createdAt: 1 }).lean<TourDocument[]>();
  return docs.map(toTourPackage);
}

