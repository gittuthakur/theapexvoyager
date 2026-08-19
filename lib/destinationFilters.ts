import { getRegionById } from '@/lib/regions';
import { matchesStyle } from '@/lib/travelStyles';
import { getSeasonById } from '@/config/seasons.config';
import type { Destination, DestinationFilter, DestinationSortOption, DestinationStats } from '@/types';

/** Real starting prices only (never fabricated) — the input a price-range slider/histogram should be built from. */
export function getRealStartingPrices(destinations: Destination[], statsMap: Map<string, DestinationStats>): number[] {
  return destinations
    .map((destination) => statsMap.get(destination.slug)?.startingPrice)
    .filter((price): price is number => price !== undefined);
}

/**
 * Pure filter/sort/paginate logic, kept out of any component per the brief's
 * "don't hardcode business logic in the UI" requirement — DestinationsExplorer
 * (client) and any future server-rendered listing can both call these the same way.
 */
export function filterDestinations(
  destinations: Destination[],
  filter: DestinationFilter,
  statsMap: Map<string, DestinationStats>
): Destination[] {
  const query = filter.query?.trim().toLowerCase() ?? '';
  const region = filter.region ? getRegionById(filter.region) : undefined;
  const seasonLabels = filter.seasons?.map((id) => getSeasonById(id)?.label).filter((label): label is string => Boolean(label)) ?? [];
  const hasPriceFilter = filter.priceMin !== undefined && filter.priceMax !== undefined;

  return destinations.filter((destination) => {
    if (query && !destination.title.toLowerCase().includes(query) && !destination.description.toLowerCase().includes(query)) {
      return false;
    }
    if (region && destination.state !== region.name) return false;
    if (filter.styles?.length && !filter.styles.some((styleId) => matchesStyle(destination, styleId))) return false;
    if (seasonLabels.length && !seasonLabels.some((label) => destination.seasons?.includes(label))) return false;
    if (filter.bestFor?.length && !filter.bestFor.some((value) => destination.bestFor?.includes(value))) return false;

    if (hasPriceFilter) {
      const price = statsMap.get(destination.slug)?.startingPrice;
      if (price === undefined) return false;
      if (price < filter.priceMin! || price > filter.priceMax!) return false;
    }

    return true;
  });
}

export function sortDestinations(
  destinations: Destination[],
  sort: DestinationSortOption | undefined,
  statsMap: Map<string, DestinationStats>
): Destination[] {
  const list = [...destinations];

  if (sort === 'rating') {
    return list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  }
  if (sort === 'price-asc') {
    return list.sort((a, b) => priceOrInfinity(statsMap.get(a.slug)?.startingPrice) - priceOrInfinity(statsMap.get(b.slug)?.startingPrice));
  }
  if (sort === 'price-desc') {
    return list.sort(
      (a, b) => priceOrNegInfinity(statsMap.get(b.slug)?.startingPrice) - priceOrNegInfinity(statsMap.get(a.slug)?.startingPrice)
    );
  }
  // 'popular' (default): existing homepage curation order — priority ascending, then popularityScore descending.
  return list.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
}

function priceOrInfinity(price?: number): number {
  return price ?? Number.POSITIVE_INFINITY;
}

function priceOrNegInfinity(price?: number): number {
  return price ?? Number.NEGATIVE_INFINITY;
}

export interface PaginationResult<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function paginate<T>(list: T[], page: number, pageSize: number): PaginationResult<T> {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: list.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    totalPages
  };
}
