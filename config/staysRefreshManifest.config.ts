import { STAY_TYPES, type StayType } from '@/types/stay';

// PHASE 1 CORRECTIONS (2026-09): the first cut of the daily Stays refresh queried every
// StayType for every configured destination, every single day (70 destinations x 6
// types = 426 combos, ceiling 1,260 Google requests/cycle). A first correction narrowed
// the per-destination StayType set and deduped shared search locations (~164 unique
// searches, ~492 ceiling, ~170-260 expected/day). This FINAL correction is the primary
// business requirement — minimize Google Places credit usage as much as practically
// possible — and changes the model from "refresh everything, every day" to "rotate
// through everything over time, spending a small, hard-capped daily budget."
//
// CORE_STAY_TYPES is refreshed for every configured destination (see
// config/stayLocations.config.ts's STAY_LOCATION_RULES): 'hotel' and 'homestay' are the
// two categories every one of those 70 rules' own `reason` text describes as present.
export const CORE_STAY_TYPES: StayType[] = ['hotel', 'homestay'];

// FULL_STAY_TYPES (all 6) is refreshed only for a destination whose own, already-published
// `isPopular` flag (config/destinations.config.ts) is true — a pre-existing editorial
// signal already used by the homepage's own "Popular Destinations" section. As of this
// phase that's 8 destinations: manali, kinnaur, spiti-valley, shimla, gulmarg, rishikesh,
// kasol, haridwar.
export const FULL_STAY_TYPES: StayType[] = STAY_TYPES;

// Escape hatch for a specific destination known — from real, observed PlaceCache
// inventory, never a guess — to need a category outside its tier's default. Empty today.
export const STAY_TYPE_OVERRIDES: Record<string, StayType[]> = {};

/** The refresh job's per-destination StayType list. */
export function getRefreshStayTypes(destinationSlug: string, isPopular: boolean | undefined): StayType[] {
  return STAY_TYPE_OVERRIDES[destinationSlug] ?? (isPopular ? FULL_STAY_TYPES : CORE_STAY_TYPES);
}

// Hard safety ceiling on actual outbound Google Places requests (including pagination)
// per refresh run — see lib/staysRefresh.ts. 20 is the explicit business requirement for
// this final correction (previously 500). Override via
// GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET only with a deliberate, reviewed reason.
export const DEFAULT_DAILY_REFRESH_REQUEST_BUDGET = 20;

// Scheduled refresh reads at most this many pages per search — deliberately shallower
// than the general-purpose MAX_PAGES(3) in lib/googlePlaces.ts (used by other, non-
// refresh callers, unchanged). Credit-saving matters more than retrieving every possible
// result for a routine background refresh; MongoDB already holds whatever a prior, deeper
// fetch found, and this never deletes it. Override via GOOGLE_PLACES_REFRESH_MAX_PAGES.
export const DEFAULT_REFRESH_MAX_PAGES = 1;

// Of each day's request budget, at most this fraction is reserved for "popular"-tier
// groups (see FULL_STAY_TYPES above) — popular destinations get refreshed more often,
// but can never consume the WHOLE daily budget even if many are simultaneously due,
// which would starve every normal destination's rotation indefinitely. Whatever popular
// doesn't use (fewer due than its share allows) rolls over to normal-tier groups instead
// of going to waste.
export const POPULAR_BUDGET_SHARE = 0.4;

// How long a successfully-refreshed group (with at least one real result) is considered
// fresh before it becomes eligible again — the brief's own suggested ranges: "popular
// destinations: approximately 7 days, normal destinations: approximately 14-30 days" (21
// chosen as the simple midpoint of that range).
export const FRESHNESS_WINDOW_DAYS = { popular: 7, core: 21 } as const;

// A group whose last real Google response contained ZERO places (a genuine empty
// result, not one merely filtered down to zero by location-safety/exclusion checks) is
// backed off for longer than the ordinary freshness window before being retried — no
// point spending scarce daily budget re-asking a question that returned nothing last
// time, but never permanently: it's still retried eventually, just less often.
export const EMPTY_RESULT_BACKOFF_DAYS = { popular: 21, core: 45 } as const;

// Bounded backoff after a provider failure (network error, non-2xx response, ...) —
// grows with consecutive failures so a persistently broken combination doesn't burn
// budget every single day, but is capped so it's never effectively abandoned forever.
export const FAILURE_BACKOFF_BASE_DAYS = 2;
export const FAILURE_BACKOFF_MAX_DAYS = 14;
