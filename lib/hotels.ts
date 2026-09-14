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
    regionId: doc.regionId ? String(doc.regionId) : undefined,
    destinationSlugs: doc.destinationSlugs
  };
}

/** `publiclyListed: true` is required in addition to any other filter — see
 *  models/Hotel.ts's field comment for why this is the honest public-visibility gate
 *  (mirrors lib/experts.ts's identical `getAllExperts`/`getExpertBySlug` gate).
 *
 *  Destination matching, in preference order:
 *  1. `destinationSlug` — an explicit `Hotel.destinationSlugs` match (models/Hotel.ts).
 *     No currently-seeded record has this field, so it only ever matches a future
 *     genuine property that was explicitly tagged.
 *  2. `locations` — a candidate-location regex (see lib/stayLocation.ts's
 *     `searchLocations`) against the free-text `location` field, so a destination whose
 *     real accommodation base differs from its own title (e.g. Dharamshala → McLeod
 *     Ganj) still matches. Combined with (1) via OR when both are given, so an
 *     untagged-but-textually-matching record is never silently dropped.
 *  3. `destination` — kept only for any caller not yet passing `locations`; matches a
 *     single raw string exactly as before. */
export async function getHotels(filter?: {
  category?: HotelCategory;
  destination?: string;
  locations?: string[];
  destinationSlug?: string;
}): Promise<HotelPackage[]> {
  await connectDB();

  const query: Record<string, unknown> = { publiclyListed: true };
  if (filter?.category) {
    query.category = filter.category;
  }

  const locationPattern = filter?.locations?.length
    ? filter.locations.map((location) => escapeRegExp(location.trim())).filter(Boolean).join('|')
    : filter?.destination
      ? escapeRegExp(filter.destination.trim())
      : undefined;

  if (filter?.destinationSlug && locationPattern) {
    query.$or = [{ destinationSlugs: filter.destinationSlug }, { location: new RegExp(locationPattern, 'i') }];
  } else if (filter?.destinationSlug) {
    query.destinationSlugs = filter.destinationSlug;
  } else if (locationPattern) {
    query.location = new RegExp(locationPattern, 'i');
  }

  const docs = await Hotel.find(query).sort({ featured: -1, createdAt: 1 }).lean<HotelDocument[]>();
  return docs.map(toHotelPackage);
}

export async function getHotelBySlug(slug: string): Promise<HotelPackage | null> {
  await connectDB();
  const doc = await Hotel.findOne({ slug, publiclyListed: true }).lean<HotelDocument | null>();
  return doc ? toHotelPackage(doc) : null;
}
