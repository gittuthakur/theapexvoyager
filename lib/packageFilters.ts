import { getRegionForState } from '@/lib/regions';
import { matchesStyle, matchesStyleKeywords } from '@/lib/travelStyles';
import { getSeasonById } from '@/config/seasons.config';
import type { Destination, DestinationStyleId, PackageFilter, PackageSortOption, RegionId, TravelPackage } from '@/types';

export interface DurationBucket {
  id: string;
  label: string;
  minDays?: number;
  maxDays?: number;
}

// TravelPackage has no structured day count — `duration` is free text like
// "5 Days / 4 Nights" — so a duration filter has to be coarse buckets parsed from
// that string, rather than a continuous slider like price.
export const DURATION_BUCKETS: DurationBucket[] = [
  { id: 'short', label: '1–3 Days', maxDays: 3 },
  { id: 'medium', label: '4–6 Days', minDays: 4, maxDays: 6 },
  { id: 'long', label: '7–10 Days', minDays: 7, maxDays: 10 },
  { id: 'extended', label: '10+ Days', minDays: 11 }
];

/** Best-effort day count parsed from a free-text duration like "5 Days / 4 Nights" — undefined if unparsable. */
export function parsePackageDurationDays(duration: string): number | undefined {
  const match = duration.match(/(\d+)\s*day/i);
  return match ? Number(match[1]) : undefined;
}

/** "5 Days / 4 Nights" → "4N / 5D"; falls back to the original string if either count can't be parsed. */
export function formatDurationShort(duration: string): string {
  const days = duration.match(/(\d+)\s*day/i)?.[1];
  const nights = duration.match(/(\d+)\s*night/i)?.[1];
  return days && nights ? `${nights}N / ${days}D` : duration;
}

const INCLUSION_TAG_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: 'Stays', keywords: ['hotel', 'homestay', 'accommodation', 'resort', 'camp'] },
  { tag: 'Private Transport', keywords: ['pickup', 'drop', 'cab', 'suv', 'transport', 'transfer'] },
  { tag: 'Meals', keywords: ['breakfast', 'lunch', 'dinner', 'meal'] },
  { tag: 'Guide', keywords: ['guide', 'coordinator', 'escort'] }
];

/** Presentational chips for the journey card, derived from the package's real `inclusions` copy — never invented. */
export function getPackageInclusionTags(pkg: TravelPackage): string[] {
  const haystack = pkg.inclusions.map((line) => line.toLowerCase());
  return INCLUSION_TAG_KEYWORDS.filter(({ keywords }) => keywords.some((keyword) => haystack.some((line) => line.includes(keyword)))).map(
    ({ tag }) => tag
  );
}

/** Unique category values actually present in the catalog — drives the quick pill row, never a hardcoded list. */
export function getPackageCategories(packages: TravelPackage[]): string[] {
  return Array.from(new Set(packages.map((pkg) => pkg.category))).sort();
}

export interface PackageCategoryCount {
  category: string;
  count: number;
}

/** Same real categories as getPackageCategories(), paired with how many journeys actually carry each one — for the quick-discovery tile grid. */
export function getPackageCategoriesWithCounts(packages: TravelPackage[]): PackageCategoryCount[] {
  return getPackageCategories(packages).map((category) => ({
    category,
    count: packages.filter((pkg) => pkg.category === category).length
  }));
}

export interface AccommodationTier {
  /** The stable PackageStayOption.id (e.g. "deluxe") — what's actually matched on and put in the URL. */
  id: string;
  /** Display copy, e.g. "Deluxe" — derived from the first stay option's label seen for this id, minus
   * any "— Included"-style suffix. Purely cosmetic; never used for matching (see why below). */
  label: string;
}

/**
 * Every curated package's stayOptions already share the same 4 ids (standard/deluxe/premium/luxury —
 * see config/packages.config.ts), so today a tier parsed off the display label and one keyed by the
 * real `id` happen to agree. They stop agreeing the moment a future integration (dynamic accommodation
 * pricing/inventory) introduces stay options with differently-worded labels or non-English copy — the
 * `id` is the one part of a PackageStayOption actually meant to be a stable key, so filtering joins on
 * that instead of re-parsing display text.
 */
function tierLabelFromOptionLabel(label: string): string {
  return label.split('—')[0].trim();
}

/** Distinct accommodation tiers actually offered across the catalog — drives the Accommodation filter. */
export function getAccommodationTiers(packages: TravelPackage[]): AccommodationTier[] {
  const labelById = new Map<string, string>();
  for (const pkg of packages) {
    for (const option of pkg.stayOptions) {
      if (!labelById.has(option.id)) labelById.set(option.id, tierLabelFromOptionLabel(option.label));
    }
  }
  return Array.from(labelById.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Whether a package offers a given accommodation tier (matched by PackageStayOption.id) as one of its stay options. */
export function packageHasAccommodationTier(pkg: TravelPackage, tierId: string): boolean {
  return pkg.stayOptions.some((option) => option.id === tierId);
}

function linkedDestinations(pkg: TravelPackage, destinationsBySlug: Map<string, Destination>): Destination[] {
  return (pkg.destinationSlugs ?? [])
    .map((slug) => destinationsBySlug.get(slug))
    .filter((destination): destination is Destination => Boolean(destination));
}

/** A package can span multiple destinationSlugs — this is every region any of them belongs to. */
export function getPackageRegionIds(pkg: TravelPackage, destinationsBySlug: Map<string, Destination>): RegionId[] {
  const ids = linkedDestinations(pkg, destinationsBySlug)
    .map((destination) => getRegionForState(destination.state)?.id)
    .filter((id): id is RegionId => Boolean(id));
  return Array.from(new Set(ids));
}

/** Matches on the package's own `category` first (always available), then falls back to its linked destinations' travel styles. */
export function packageMatchesStyle(pkg: TravelPackage, destinationsBySlug: Map<string, Destination>, styleId: DestinationStyleId): boolean {
  if (matchesStyleKeywords([pkg.category], styleId)) return true;
  return linkedDestinations(pkg, destinationsBySlug).some((destination) => matchesStyle(destination, styleId));
}

export function getPackageSeasonLabels(pkg: TravelPackage, destinationsBySlug: Map<string, Destination>): string[] {
  const labels = linkedDestinations(pkg, destinationsBySlug).flatMap((destination) => destination.seasons ?? []);
  return Array.from(new Set(labels));
}

/**
 * Averages the real per-destination review ratings (see lib/reviews.ts's
 * getDestinationRatingsMap) across every destination this package links to.
 * Returns undefined — never a made-up number — when none of them have a real rating yet.
 */
export function getPackageRating(
  pkg: TravelPackage,
  destinationsBySlug: Map<string, Destination>,
  destinationRatings: Map<string, { rating: number; count: number }>
): { rating: number; count: number } | undefined {
  const ratings = (pkg.destinationSlugs ?? []).map((slug) => destinationRatings.get(slug)).filter((entry): entry is { rating: number; count: number } => Boolean(entry));
  if (!ratings.length) return undefined;
  const totalCount = ratings.reduce((sum, entry) => sum + entry.count, 0);
  const weightedRating = ratings.reduce((sum, entry) => sum + entry.rating * entry.count, 0) / totalCount;
  return { rating: Math.round(weightedRating * 10) / 10, count: totalCount };
}

/**
 * Pure filter/sort logic, kept out of any component — mirrors lib/destinationFilters.ts's
 * approach for the destinations page. Region/Travel style/Season aren't fields on
 * TravelPackage itself, so they're derived by joining `destinationSlugs` against the
 * curated Destination catalog (`destinationsBySlug`); packages with no destinationSlugs
 * simply won't match a region/season filter (there's nothing real to join against).
 */
export function filterPackages(packages: TravelPackage[], filter: PackageFilter, destinationsBySlug: Map<string, Destination>): TravelPackage[] {
  const query = filter.query?.trim().toLowerCase() ?? '';
  const seasonLabels = filter.seasons?.map((id) => getSeasonById(id)?.label).filter((label): label is string => Boolean(label)) ?? [];
  const bucket = filter.duration ? DURATION_BUCKETS.find((candidate) => candidate.id === filter.duration) : undefined;
  const hasPriceFilter = filter.priceMin !== undefined && filter.priceMax !== undefined;

  return packages.filter((pkg) => {
    if (query && !pkg.name.toLowerCase().includes(query) && !pkg.destination.toLowerCase().includes(query)) return false;
    if (filter.category && pkg.category !== filter.category) return false;
    if (filter.region && !getPackageRegionIds(pkg, destinationsBySlug).includes(filter.region)) return false;
    if (filter.styles?.length && !filter.styles.some((styleId) => packageMatchesStyle(pkg, destinationsBySlug, styleId))) return false;

    // Gated on the caller's raw request (filter.seasons), not on how many of those ids
    // actually resolved to a real label — a season id that fails to resolve (a stale or
    // hand-edited `?season=` value) must still narrow results to zero, not silently
    // behave as if no season filter were applied at all.
    if (filter.seasons?.length) {
      const packageSeasons = getPackageSeasonLabels(pkg, destinationsBySlug);
      if (!seasonLabels.some((label) => packageSeasons.includes(label))) return false;
    }

    if (hasPriceFilter && (pkg.price < filter.priceMin! || pkg.price > filter.priceMax!)) return false;

    if (filter.accommodation && !packageHasAccommodationTier(pkg, filter.accommodation)) return false;

    // Gated on the caller's raw request (filter.duration), not on whether it resolved to
    // a real bucket — a duration id that fails to resolve (a stale or hand-edited
    // `?duration=` value) must still narrow results to zero, not silently behave as if no
    // duration filter were applied at all. Same fix shape as the season handling above.
    if (filter.duration) {
      if (!bucket) return false;
      const days = parsePackageDurationDays(pkg.duration);
      if (days === undefined) return false;
      if (bucket.minDays !== undefined && days < bucket.minDays) return false;
      if (bucket.maxDays !== undefined && days > bucket.maxDays) return false;
    }

    return true;
  });
}

export function sortPackages(packages: TravelPackage[], sort: PackageSortOption | undefined): TravelPackage[] {
  const list = [...packages];
  if (sort === 'price-asc') return list.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return list.sort((a, b) => b.price - a.price);
  // 'popular' (default): featured packages first, static order otherwise.
  return list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}
