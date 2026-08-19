import { connectDB } from '@/lib/mongodb';
import { Expert, type ExpertDocument } from '@/models/Expert';
import { travelExperts as staticExperts } from '@/config/experts.config';
import type { ExpertFacets, TravelExpert } from '@/types/expert';

function toTravelExpert(doc: ExpertDocument): TravelExpert {
  return {
    slug: doc.slug,
    name: doc.name,
    role: doc.role,
    profileImage: doc.profileImage,
    bio: doc.bio,
    destinationSlugs: doc.destinationSlugs,
    travelStyles: doc.travelStyles,
    expertise: doc.expertise,
    languages: doc.languages,
    journeySlugs: doc.journeySlugs,
    featured: doc.featured,
    active: doc.active
  };
}

/**
 * Travel Experts live in MongoDB (see models/Expert.ts, seeded from
 * config/experts.config.ts by scripts/seed.ts). Each function falls back to that
 * static catalog if the database is unreachable or hasn't been seeded yet, so
 * /experts never renders empty — mirrors lib/packages.ts's getAllPackages pattern.
 */
export async function getAllExperts(): Promise<TravelExpert[]> {
  try {
    await connectDB();
    const docs = await Expert.find({ active: true })
      .sort({ featured: -1, createdAt: 1 })
      .lean<ExpertDocument[]>();
    if (docs.length > 0) {
      const experts = docs.map(toTravelExpert);
      // Ensure all Mongoose/MongoDB specific objects are converted to plain JSON-safe objects
      return JSON.parse(JSON.stringify(experts));
    }
    console.warn('Expert.find() returned no results — falling back to static experts catalog');
  } catch (error) {
    console.error('Failed to fetch travel experts from the database — falling back to static experts catalog', error);
  }
  return JSON.parse(JSON.stringify(staticExperts.filter((expert) => expert.active)));
}

export async function getFeaturedExperts(limit = 3): Promise<TravelExpert[]> {
  const all = await getAllExperts();
  const featured = all.filter((expert) => expert.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getExpertBySlug(slug: string): Promise<TravelExpert | undefined> {
  try {
    await connectDB();
    const doc = await Expert.findOne({ slug, active: true }).lean<ExpertDocument | null>();
    if (doc) return JSON.parse(JSON.stringify(toTravelExpert(doc)));
  } catch (error) {
    console.error(`Failed to fetch expert "${slug}" from the database — falling back to static experts catalog`, error);
  }
  return staticExperts.find((expert) => expert.slug === slug && expert.active);
}

export async function getExpertsByDestinationSlug(destinationSlug: string): Promise<TravelExpert[]> {
  const all = await getAllExperts();
  return all.filter((expert) => expert.destinationSlugs.includes(destinationSlug));
}

/** Distinct filter values across the active catalog — powers the /experts filter chips without hardcoding options. */
export async function getExpertFacets(): Promise<ExpertFacets> {
  const all = await getAllExperts();
  return {
    destinations: Array.from(new Set(all.flatMap((expert) => expert.destinationSlugs))).sort(),
    travelStyles: Array.from(new Set(all.flatMap((expert) => expert.travelStyles))).sort(),
    expertise: Array.from(new Set(all.flatMap((expert) => expert.expertise))).sort()
  };
}
