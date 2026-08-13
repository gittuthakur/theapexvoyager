import { connectDB } from '@/lib/mongodb';
import { Hotel, type HotelDocument } from '@/models/Hotel';
import type { HotelCategory, HotelPackage } from '@/types';

function toHotelPackage(doc: HotelDocument): HotelPackage {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    location: doc.location,
    pricePerNight: doc.pricePerNight,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    category: doc.category,
    description: doc.description,
    images: doc.images,
    amenities: doc.amenities,
    featured: doc.featured
  };
}

export async function getHotels(filter?: { category?: HotelCategory; destination?: string }): Promise<HotelPackage[]> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filter?.category) {
    query.category = filter.category;
  }
  if (filter?.destination) {
    query.location = new RegExp(filter.destination.trim(), 'i');
  }

  const docs = await Hotel.find(query).sort({ featured: -1, createdAt: 1 }).lean<HotelDocument[]>();
  return docs.map(toHotelPackage);
}

export async function getHotelBySlug(slug: string): Promise<HotelPackage | null> {
  await connectDB();
  const doc = await Hotel.findOne({ slug }).lean<HotelDocument | null>();
  return doc ? toHotelPackage(doc) : null;
}
