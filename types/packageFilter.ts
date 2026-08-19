import type { RegionId } from './region';
import type { DestinationStyleId } from './travelStyle';
import type { SeasonId } from './season';

export type PackageSortOption = 'popular' | 'price-asc' | 'price-desc';

export interface PackageFilter {
  query?: string;
  /** Exact match against TravelPackage.category — the quick pill row above the grid, distinct from the `styles` facet in the sidebar. */
  category?: string;
  region?: RegionId;
  styles?: DestinationStyleId[];
  seasons?: SeasonId[];
  priceMin?: number;
  priceMax?: number;
  /** Bucket id from DURATION_BUCKETS in lib/packageFilters.ts. */
  duration?: string;
  /** PackageStayOption.id (e.g. "deluxe") — see AccommodationTier.id in lib/packageFilters.ts. */
  accommodation?: string;
  sort?: PackageSortOption;
  page?: number;
}
