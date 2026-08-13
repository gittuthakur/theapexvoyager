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
    difficulty: doc.difficulty
  };
}

export async function getTours(filter?: { destination?: string }): Promise<TourPackage[]> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filter?.destination) {
    const pattern = new RegExp(filter.destination.trim(), 'i');
    query.$or = [{ location: pattern }, { destinationSlug: pattern }, { title: pattern }];
  }

  const docs = await Tour.find(query).sort({ featured: -1, createdAt: 1 }).lean<TourDocument[]>();
  return docs.map(toTourPackage);
}

export async function getTourBySlug(slug: string): Promise<TourPackage | null> {
  await connectDB();
  const doc = await Tour.findOne({ slug }).lean<TourDocument | null>();
  return doc ? toTourPackage(doc) : null;
}