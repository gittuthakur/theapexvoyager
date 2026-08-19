import { headers } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Tour, type TourDocument } from '@/models/Tour';
import type { TourPackage } from '@/types';

function toTourPackage(doc: TourDocument): TourPackage {
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
    image: doc.image,
    destinationSlug: doc.destinationSlug,
    featured: doc.featured,
    maxGuests: doc.maxGuests,
    difficulty: doc.difficulty,
    itinerary: doc.itinerary,
    inclusions: doc.inclusions,
    exclusions: doc.exclusions,
    faqs: doc.faqs
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
    const pattern = new RegExp(filter.destination.trim(), 'i');
    clauses.push({ $or: [{ location: pattern }, { destinationSlug: pattern }, { title: pattern }] });
  }
  if (filter?.category) {
    const term = CATEGORY_SEARCH_TERMS[filter.category] ?? filter.category;
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

async function getFeaturedToursFallback(): Promise<TourPackage[]> {
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/tours/featured`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Featured tours fallback request failed with status ${res.status}`);
  }
  const { tours } = (await res.json()) as { tours: TourPackage[] };
  return tours;
}

// The homepage's Featured Tours section should never render empty just because the
// database is unreachable or hasn't been seeded yet — fall back to the static
// /api/tours/featured mock data in either case.
export async function getToursWithFallback(filter?: { destination?: string; category?: string }): Promise<TourPackage[]> {
  try {
    const tours = await getTours(filter);
    if (tours.length > 0) return tours;
    console.warn('getTours() returned no results — falling back to featured tours mock data');
  } catch (error) {
    console.error('Failed to fetch tours from the database — falling back to featured tours mock data', error);
  }
  return getFeaturedToursFallback();
}