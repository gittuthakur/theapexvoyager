import { connectDB } from '@/lib/mongodb';
import { Experience as ExperienceModel, type ExperienceDocument } from '@/models/Experience';
import type { Experience } from '@/types/experience';

// Pure filter/sort helpers (filterExperiences, sortExperiences, ExperienceFilters,
// ExperienceSortOption) live in lib/experienceFilters.ts, NOT here — this file imports
// models/Experience.ts (mongoose), so a client component importing anything from here
// would pull mongoose into the browser bundle. See that file's header comment.

export function toExperience(doc: ExperienceDocument): Experience {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    location: doc.location,
    region: doc.region,
    regionId: doc.regionId ? String(doc.regionId) : undefined,
    category: doc.category,
    subCategory: doc.subCategory,
    mood: doc.mood,
    shortDescription: doc.shortDescription,
    description: doc.description,
    image: doc.image,
    gallery: doc.gallery,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    duration: doc.duration,
    durationBand: doc.durationBand,
    groupSize: doc.groupSize,
    groupSizeMax: doc.groupSizeMax,
    difficulty: doc.difficulty,
    price: doc.price,
    currency: doc.currency,
    bestFor: doc.bestFor,
    seasons: doc.seasons,
    highlights: doc.highlights,
    whatYoullExperience: doc.whatYoullExperience,
    inclusions: doc.inclusions,
    exclusions: doc.exclusions,
    meetingPoint: doc.meetingPoint,
    whatToBring: doc.whatToBring,
    importantInfo: doc.importantInfo,
    availability: doc.availability,
    verified: doc.verified,
    featured: doc.featured,
    badge: doc.badge,
    basePrice: doc.basePrice,
    commission: doc.commission,
    partner: doc.partner,
    bookingMethod: doc.bookingMethod
  };
}

/**
 * Experience data lives in MongoDB (see models/Experience.ts, seeded from
 * config/experiences.config.ts by scripts/seed.ts).
 */
export async function getAllExperiences(): Promise<Experience[]> {
  await connectDB();
  const docs = await ExperienceModel.find().lean<ExperienceDocument[]>();
  return JSON.parse(JSON.stringify(docs.map(toExperience)));
}

export async function getExperienceBySlug(slug: string): Promise<Experience | undefined> {
  await connectDB();
  const doc = await ExperienceModel.findOne({ slug }).lean<ExperienceDocument | null>();
  return doc ? JSON.parse(JSON.stringify(toExperience(doc))) : undefined;
}

/** Pure, synchronous filter over an already-fetched list — extracted from getExperiencesByDestination so batch callers (lib/destinationStats.ts) can fetch once and filter many times instead of one Mongo round-trip per destination. */
export function filterExperiencesByDestinationTitle(source: Experience[], destinationTitle: string): Experience[] {
  const needle = destinationTitle.trim().toLowerCase();
  if (!needle) return [];
  return source.filter((experience) => experience.location.toLowerCase().includes(needle));
}

/** Case-insensitive substring match against `location` — used by destination pages (lib/destinationStats.ts, app/destinations/[slug]/page.tsx) to surface related bookable experiences for a given place. */
export async function getExperiencesByDestination(destinationTitle: string): Promise<Experience[]> {
  const all = await getAllExperiences();
  return filterExperiencesByDestinationTitle(all, destinationTitle);
}

export async function getFeaturedExperiences(): Promise<Experience[]> {
  const all = await getAllExperiences();
  return all.filter((experience) => experience.featured);
}
