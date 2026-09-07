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

/** Travel Experts live in MongoDB (see models/Expert.ts, seeded from config/experts.config.ts by
 *  scripts/seed.ts). `publiclyListed: true` is required in addition to `active` — see
 *  models/Expert.ts's field comment for why this is the honest public-visibility gate rather
 *  than `active` alone. */
export async function getAllExperts(): Promise<TravelExpert[]> {
  await connectDB();
  const docs = await Expert.find({ active: true, publiclyListed: true })
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
  const doc = await Expert.findOne({ slug, active: true, publiclyListed: true }).lean<ExpertDocument | null>();
  return doc ? JSON.parse(JSON.stringify(toTravelExpert(doc))) : undefined;
}

/** Collapses runs of whitespace to a single space so multi-space/tab input matches
 *  single-spaced catalog data (and vice versa) — same normalization already proven for
 *  Experiences (lib/experienceFilters.ts's normalizeSearchText). */
export function normalizeExpertSearchText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Whether `expert` matches a free-text query against every field a visitor can actually
 *  see on the page — name, bio, role (the badge pill on every card), and expertise (the
 *  tag pills on every card). Deliberately excludes destination/travel style: those already
 *  have their own dedicated filters, and adding them here isn't something this fix was
 *  asked to claim. */
export function matchesExpertQuery(expert: Pick<TravelExpert, 'name' | 'bio' | 'role' | 'expertise'>, query: string): boolean {
  const needle = normalizeExpertSearchText(query);
  if (!needle) return true;
  const haystack = normalizeExpertSearchText(`${expert.name} ${expert.bio} ${expert.role} ${expert.expertise.join(' ')}`);
  return haystack.includes(needle);
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
