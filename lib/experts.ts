import { connectDB } from '@/lib/mongodb';
import { Expert, type ExpertDocument } from '@/models/Expert';
import type { ExpertFacets, TravelExpert } from '@/types/expert';

export function toTravelExpert(doc: ExpertDocument): TravelExpert {
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
    active: doc.active,
    regionIds: doc.regionIds?.map(String)
  };
}

/** Travel Experts live in MongoDB (see models/Expert.ts, seeded from config/experts.config.ts by scripts/seed.ts). */
export async function getAllExperts(): Promise<TravelExpert[]> {
  await connectDB();
  const docs = await Expert.find({ active: true })
    .sort({ featured: -1, createdAt: 1 })
    .lean<ExpertDocument[]>();
  const experts = docs.map(toTravelExpert);
  // Ensure all Mongoose/MongoDB specific objects are converted to plain JSON-safe objects
  return JSON.parse(JSON.stringify(experts));
}

export async function getFeaturedExperts(limit = 3): Promise<TravelExpert[]> {
  const all = await getAllExperts();
  const featured = all.filter((expert) => expert.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getExpertBySlug(slug: string): Promise<TravelExpert | undefined> {
  await connectDB();
  const doc = await Expert.findOne({ slug, active: true }).lean<ExpertDocument | null>();
  return doc ? JSON.parse(JSON.stringify(toTravelExpert(doc))) : undefined;
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
