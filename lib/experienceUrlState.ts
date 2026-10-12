import type { ExperienceSortOption } from '@/lib/experienceFilters';

const SORT_OPTIONS: readonly ExperienceSortOption[] = ['recommended', 'popular', 'rating', 'price-asc', 'price-desc', 'newest'];

function isSortOption(value?: string): value is ExperienceSortOption {
  return SORT_OPTIONS.includes(value as ExperienceSortOption);
}

/** Listing filter state as encoded in the /experiences query string. */
export interface ExperienceUrlState {
  query: string;
  region: string;
  categories: string[];
  durations: string[];
  budgets: string[];
  bestFor: string[];
  seasons: string[];
  difficulties: string[];
  sort: ExperienceSortOption;
}

function splitParam(value: string | null): string[] {
  return value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

/** Pure parse of the listing's query string. Unknown/missing params fall back to "no filter". */
export function parseExperienceUrlState(searchParamsString: string): ExperienceUrlState {
  const params = new URLSearchParams(searchParamsString);
  const sort = params.get('sort') ?? undefined;
  return {
    query: params.get('q') ?? '',
    region: params.get('region') ?? '',
    categories: splitParam(params.get('category')),
    durations: splitParam(params.get('duration')),
    budgets: splitParam(params.get('budget')),
    bestFor: splitParam(params.get('bestFor')),
    seasons: splitParam(params.get('season')),
    difficulties: splitParam(params.get('difficulty')),
    sort: isSortOption(sort) ? sort : 'recommended'
  };
}

/**
 * Whether a query-string change must be adopted into the listing's state. The listing's OWN
 * debounced address-bar write (`pushedParams`) must be ignored: re-seeding state from it would
 * be a no-op at best and, at worst, overwrite characters typed after the write was scheduled.
 * Anything else (hero/tile/homepage search, Back/Forward, an external link) is adopted.
 */
export function shouldAdoptUrlChange(pushedParams: string | null, searchParamsString: string): boolean {
  return pushedParams !== searchParamsString;
}
