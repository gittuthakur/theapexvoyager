import { connectDB } from '@/lib/mongodb';
import { Expert, type ExpertDocument } from '@/models/Expert';
import { Region } from '@/models/Region';
import { getCuratedDestinations } from '@/lib/destinations';
import { isPublicExpert, searchExperts, type ExpertSearchContext } from '@/lib/search/expertSearch';
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
    publiclyListed: doc.publiclyListed,
    regionIds: doc.regionIds?.map(String)
  };
}

/** Travel Experts live in MongoDB (see models/Expert.ts, seeded from config/experts.config.ts by
 *  scripts/seed.ts). `publiclyListed: true` is required in addition to `active` — see
 *  models/Expert.ts's field comment for why this is the honest public-visibility gate rather
 *  than `active` alone. */
export async function getAllExperts(options: { maxTimeMS?: number } = {}): Promise<TravelExpert[]> {
  await connectDB();
  // Optional server-side time bound (used by the global search API): with `maxTimeMS` set, MongoDB itself abandons
  // a slow read, so it cannot keep consuming database resources after the caller gave up. Omitted = the query is
  // built exactly as before.
  const query = Expert.find({ active: true, publiclyListed: true }).sort({ featured: -1, createdAt: 1 });
  const docs = await (options.maxTimeMS ? query.maxTimeMS(options.maxTimeMS) : query).lean<ExpertDocument[]>();
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

/** Free-text expert search over the PUBLIC catalog: name, role, expertise, travel styles, linked
 *  destination titles/slugs, linked regions (`regionIds` resolved through real Region records) and,
 *  as a low-confidence fallback, the bio. Context is read only when a query is present, and a
 *  failed context read degrades to the expert's own fields — it never widens or empties results.
 *  Pure matching lives in lib/search/expertSearch.ts. */
export async function searchPublicExperts(experts: TravelExpert[], query: string | undefined): Promise<TravelExpert[]> {
  const eligible = experts.filter(isPublicExpert);
  if (!query?.trim()) return eligible;
  return searchExperts(eligible, query, await loadExpertSearchContext(eligible));
}

async function loadExpertSearchContext(experts: TravelExpert[]): Promise<ExpertSearchContext> {
  const regionIds = Array.from(new Set(experts.flatMap((expert) => expert.regionIds ?? [])));
  const [destinations, regions] = await Promise.all([
    getCuratedDestinations()
      .then((list) => list.map(({ slug, title }) => ({ slug, title })))
      .catch(() => []),
    regionIds.length > 0
      ? Region.find({ _id: { $in: regionIds } })
          .select('name slug')
          .lean<Array<{ _id: unknown; name: string; slug: string }>>()
          .then((docs) => docs.map((doc) => ({ id: String(doc._id), name: doc.name, slug: doc.slug })))
          .catch(() => [])
      : Promise.resolve([])
  ]);
  return { destinations, regions };
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
