import { connectDB } from '@/lib/mongodb';
import { escapeRegExp } from '@/lib/regex';
import { resolveHotelImages } from '@/lib/hotelImages.server';
import { Hotel, type HotelDocument } from '@/models/Hotel';
import type { HotelCategory, HotelPackage } from '@/types';

export function toHotelPackage(doc: HotelDocument): HotelPackage {
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
    // Drops any locally-referenced image that doesn't actually exist under public/
    // (true for every config/hotels.config.ts seed entry today) rather than
    // substituting an unrelated real photograph — see lib/hotelImages.server.ts.
    images: resolveHotelImages(doc.images),
    amenities: doc.amenities,
    featured: doc.featured,
    verified: doc.verified,
    cancellationPolicy: doc.cancellationPolicy,
    mealPlan: doc.mealPlan,
    regionId: doc.regionId ? String(doc.regionId) : undefined
  };
}

/** `publiclyListed: true` is required in addition to any other filter — see
 *  models/Hotel.ts's field comment for why this is the honest public-visibility gate
 *  (mirrors lib/experts.ts's identical `getAllExperts`/`getExpertBySlug` gate). */
export async function getHotels(filter?: { category?: HotelCategory; destination?: string }): Promise<HotelPackage[]> {
  await connectDB();

  const query: Record<string, unknown> = { publiclyListed: true };
  if (filter?.category) {
    query.category = filter.category;
  }
  if (filter?.destination) {
    query.location = new RegExp(escapeRegExp(filter.destination.trim()), 'i');
  }

  const docs = await Hotel.find(query).sort({ featured: -1, createdAt: 1 }).lean<HotelDocument[]>();
  return docs.map(toHotelPackage);
}

export async function getHotelBySlug(slug: string): Promise<HotelPackage | null> {
  await connectDB();
  const doc = await Hotel.findOne({ slug, publiclyListed: true }).lean<HotelDocument | null>();
  return doc ? toHotelPackage(doc) : null;
}
