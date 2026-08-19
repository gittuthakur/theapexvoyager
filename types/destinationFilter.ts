import type { RegionId } from './region';
import type { DestinationStyleId } from './travelStyle';
import type { SeasonId } from './season';

export type DestinationSortOption = 'popular' | 'rating' | 'price-asc' | 'price-desc';

export type DestinationViewMode = 'cards' | 'map';

export interface DestinationFilter {
  query?: string;
  region?: RegionId;
  styles?: DestinationStyleId[];
  seasons?: SeasonId[];
  /** Only applied when it actually narrows the full real price range — see filterDestinations. */
  priceMin?: number;
  priceMax?: number;
  bestFor?: string[];
  sort?: DestinationSortOption;
  page?: number;
  view?: DestinationViewMode;
}
