import { budgetBands, experiences } from '@/config/experiences.config';
import type {
  Experience,
  ExperienceBestFor,
  ExperienceDifficulty,
  ExperienceDurationBand,
  ExperienceRegion,
  ExperienceSeason,
  ExperienceType
} from '@/types/experience';

/**
 * Experience data is a small, static demo catalog (see config/experiences.config.ts) —
 * no database involved, so these are plain synchronous lookups.
 */
export function getAllExperiences(): Experience[] {
  return experiences;
}

export function getExperienceBySlug(slug: string): Experience | undefined {
  return experiences.find((experience) => experience.slug === slug);
}

/** Case-insensitive substring match against `location` — used by destination pages (lib/destinationStats.ts, app/destinations/[slug]/page.tsx) to surface related bookable experiences for a given place. */
export function getExperiencesByDestination(destinationTitle: string): Experience[] {
  const needle = destinationTitle.trim().toLowerCase();
  if (!needle) return [];
  return experiences.filter((experience) => experience.location.toLowerCase().includes(needle));
}

export function getFeaturedExperiences(): Experience[] {
  return experiences.filter((experience) => experience.featured);
}

export interface ExperienceFilters {
  query?: string;
  region?: ExperienceRegion;
  categories?: ExperienceType[];
  durations?: ExperienceDurationBand[];
  /** Budget band ids from config/experiences.config.ts's `budgetBands`. */
  budgets?: string[];
  bestFor?: ExperienceBestFor[];
  seasons?: ExperienceSeason[];
  difficulties?: ExperienceDifficulty[];
}

/** Single source of truth for narrowing the catalog — shared by the listing UI and, if needed, any future server-rendered fallback. */
export function filterExperiences(source: Experience[], filters: ExperienceFilters): Experience[] {
  const needle = filters.query?.trim().toLowerCase();
  const activeBudgetBands = filters.budgets?.length ? budgetBands.filter((band) => filters.budgets!.includes(band.id)) : null;

  return source.filter((experience) => {
    if (needle) {
      const haystack = `${experience.title} ${experience.location} ${experience.category} ${experience.subCategory}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.region && experience.region !== filters.region) return false;
    if (filters.categories?.length && !filters.categories.includes(experience.category)) return false;
    if (filters.durations?.length && !filters.durations.includes(experience.durationBand)) return false;
    if (activeBudgetBands && !activeBudgetBands.some((band) => experience.price >= band.min && experience.price <= band.max)) return false;
    if (filters.bestFor?.length && !filters.bestFor.some((value) => experience.bestFor.includes(value))) return false;
    if (filters.seasons?.length && !filters.seasons.some((value) => experience.seasons.includes(value))) return false;
    if (filters.difficulties?.length && (!experience.difficulty || !filters.difficulties.includes(experience.difficulty))) return false;
    return true;
  });
}

export type ExperienceSortOption = 'recommended' | 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'newest';

const BADGE_WEIGHT: Record<string, number> = { 'Best Seller': 3, Popular: 2, New: 1 };

/** "Recommended" = featured first, then badge strength, then rating — a simple, deterministic editorial ordering rather than a fabricated relevance score. "Newest" walks `id` in reverse since the catalog has no real creation timestamp. */
export function sortExperiences(source: Experience[], sort: ExperienceSortOption): Experience[] {
  const list = [...source];
  switch (sort) {
    case 'popular':
      return list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case 'rating':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'newest':
      return list.sort((a, b) => b.id.localeCompare(a.id));
    case 'recommended':
    default:
      return list.sort((a, b) => {
        const featuredDelta = Number(b.featured ?? false) - Number(a.featured ?? false);
        if (featuredDelta !== 0) return featuredDelta;
        const badgeDelta = (BADGE_WEIGHT[b.badge ?? ''] ?? 0) - (BADGE_WEIGHT[a.badge ?? ''] ?? 0);
        if (badgeDelta !== 0) return badgeDelta;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
  }
}
