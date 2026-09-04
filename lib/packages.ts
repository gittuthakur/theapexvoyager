import { cache } from 'react';
import { connectDB } from '@/lib/mongodb';
import { Journey, type JourneyDocument } from '@/models/Journey';
import type { TravelPackage } from '@/types/package';

export function toTravelPackage(doc: JourneyDocument): TravelPackage {
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
    faqs: doc.faqs,
    regionId: doc.regionId ? String(doc.regionId) : undefined
  };
}

/** Journeys live in MongoDB (see models/Journey.ts, seeded from config/packages.config.ts by scripts/seed.ts). */
export async function getAllPackages(): Promise<TravelPackage[]> {
  await connectDB();
  const docs = await Journey.find().sort({ featured: -1, createdAt: 1 }).lean<JourneyDocument[]>();
  const packages = docs.map(toTravelPackage);
  // Ensure all Mongoose/MongoDB specific objects are converted to plain JSON-safe objects
  return JSON.parse(JSON.stringify(packages));
}

export async function getFeaturedPackages(limit = 6): Promise<TravelPackage[]> {
  const all = await getAllPackages();
  const featured = all.filter((pkg) => pkg.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

// React's cache() request-memoizes this by `slug` — it's called independently by
// both generateMetadata and the page body for /journeys/[slug] (each needs its own
// authoritative lookup; neither can read the other's result directly), which
// otherwise means two identical MongoDB round-trips per request. Scoped to a single
// render pass by React's own contract (a fresh cache per incoming request, nothing
// shared across requests) — not persistent/ISR caching, so a document edit is
// visible on the very next request exactly as before. Every current caller
// (app/journeys/[slug]/page.tsx, app/api/journeys/[slug]/route.ts,
// app/experts/[slug]/page.tsx, app/experts/page.tsx, lib/bookingContext.ts) is a
// Server Component or Route Handler, so this is safe everywhere it's already used.
export const getPackageBySlug = cache(async (slug: string): Promise<TravelPackage | undefined> => {
  await connectDB();
  const doc = await Journey.findOne({ slug }).lean<JourneyDocument | null>();
  // Nested subdocuments (itinerary, addOns, stayOptions, ...) still carry Mongoose
  // ObjectId `_id` fields after .lean() — strip them so this is safe to pass as a
  // Server Component prop into a Client Component (see getAllPackages above).
  return doc ? JSON.parse(JSON.stringify(toTravelPackage(doc))) : undefined;
});

export async function getPackagesByDestinationSlug(destinationSlug: string): Promise<TravelPackage[]> {
  const all = await getAllPackages();
  return all.filter((pkg) => pkg.destinationSlugs?.includes(destinationSlug));
}
