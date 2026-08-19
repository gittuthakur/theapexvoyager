import { connectDB } from '@/lib/mongodb';
import { Journey, type JourneyDocument } from '@/models/Journey';
import { packages as staticPackages } from '@/config/packages.config';
import type { TravelPackage } from '@/types/package';

function toTravelPackage(doc: JourneyDocument): TravelPackage {
  return {
    slug: doc.slug,
    name: doc.name,
    destination: doc.destination,
    destinationSlugs: doc.destinationSlugs,
    image: doc.image,
    duration: doc.duration,
    price: doc.price,
    category: doc.category,
    shortDescription: doc.shortDescription,
    highlights: doc.highlights,
    itinerary: doc.itinerary,
    inclusions: doc.inclusions,
    exclusions: doc.exclusions,
    stayOptions: doc.stayOptions,
    addOns: doc.addOns,
    seasonalPricing: doc.seasonalPricing,
    featured: doc.featured,
    transportOptions: doc.transportOptions,
    pace: doc.pace,
    signatureMoments: doc.signatureMoments,
    apexPicks: doc.apexPicks,
    faqs: doc.faqs
  };
}

/**
 * Journeys live in MongoDB (see models/Journey.ts, seeded from config/packages.config.ts
 * by scripts/seed.ts). Each function falls back to that static catalog if the database
 * is unreachable or hasn't been seeded yet, so /journeys never renders empty.
 */
export async function getAllPackages(): Promise<TravelPackage[]> {
  try {
    await connectDB();
    const docs = await Journey.find().sort({ featured: -1, createdAt: 1 }).lean<JourneyDocument[]>();
    if (docs.length > 0) {
      const packages = docs.map(toTravelPackage);
      // Ensure all Mongoose/MongoDB specific objects are converted to plain JSON-safe objects
      return JSON.parse(JSON.stringify(packages));
    }
    console.warn('Journey.find() returned no results — falling back to static packages catalog');
  } catch (error) {
    console.error('Failed to fetch journeys from the database — falling back to static packages catalog', error);
  }
  return JSON.parse(JSON.stringify(staticPackages));
}

export async function getFeaturedPackages(limit = 6): Promise<TravelPackage[]> {
  const all = await getAllPackages();
  const featured = all.filter((pkg) => pkg.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getPackageBySlug(slug: string): Promise<TravelPackage | undefined> {
  try {
    await connectDB();
    const doc = await Journey.findOne({ slug }).lean<JourneyDocument | null>();
    // Nested subdocuments (itinerary, addOns, stayOptions, ...) still carry Mongoose
    // ObjectId `_id` fields after .lean() — strip them so this is safe to pass as a
    // Server Component prop into a Client Component (see getAllPackages above).
    if (doc) return JSON.parse(JSON.stringify(toTravelPackage(doc)));
  } catch (error) {
    console.error(`Failed to fetch journey "${slug}" from the database — falling back to static packages catalog`, error);
  }
  return staticPackages.find((pkg) => pkg.slug === slug);
}

export async function getPackagesByDestinationSlug(destinationSlug: string): Promise<TravelPackage[]> {
  const all = await getAllPackages();
  return all.filter((pkg) => pkg.destinationSlugs?.includes(destinationSlug));
}
