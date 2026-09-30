// REFRESH-ONLY MODULE — the one place in the codebase allowed to call Google Places for
// Stays. Imported exclusively by app/api/cron/refresh-stays/route.ts (a Vercel Cron
// endpoint, never a page or a client-fetchable route a visitor/crawler can reach on a
// normal page load). lib/stays.ts — the module every public read path actually uses —
// deliberately does not import anything from this file, so there is no code path from a
// visitor/bot request into a live Google call: it isn't gated by a runtime check, it
// simply doesn't exist in that file.
//
// FINAL credit-minimization correction (2026-09): this is no longer "refresh every
// configured destination every day." It's a ROTATING refresh, hard-capped at a small
// daily request budget (default 20) — see config/staysRefreshManifest.config.ts. Which
// groups run today is entirely driven by persistent state in MongoDB
// (models/StaysRefreshComboState.ts): a group becomes "due" once its own
// `nextEligibleAt` has passed, and eligible groups are taken oldest-due-first — that
// ordering IS the rotation; there is no separate cursor/pointer to drift out of sync,
// and nothing is hardcoded to a calendar date.
import { connectDB } from '@/lib/mongodb';
import { PlaceCache } from '@/models/PlaceCache';
import { StaysRefreshComboState, type StaysRefreshComboStateDocument } from '@/models/StaysRefreshComboState';
import { searchStays, placeName, placePhotoUrls, placeCoordinates, type RawGooglePlace } from '@/lib/googlePlaces';
import { classifyPlaceLocation } from '@/lib/placeLocationSafety';
import { filterOutExcludedPlaces } from '@/services/properties/propertyExclusion.service';
import { getCuratedDestinations } from '@/lib/destinations';
import { slugify } from '@/lib/stays';
import { type StayType } from '@/types/stay';
import { STAY_LOCATION_RULES, type StayMode } from '@/config/stayLocations.config';
import {
  getRefreshStayTypes,
  DEFAULT_DAILY_REFRESH_REQUEST_BUDGET,
  DEFAULT_REFRESH_MAX_PAGES,
  POPULAR_BUDGET_SHARE,
  FRESHNESS_WINDOW_DAYS,
  EMPTY_RESULT_BACKOFF_DAYS,
  FAILURE_BACKOFF_BASE_DAYS,
  FAILURE_BACKOFF_MAX_DAYS
} from '@/config/staysRefreshManifest.config';

export interface StaysRefreshErrorEntry {
  destinationSlug: string;
  stayType: string;
  message: string;
}

export interface StaysRefreshSummary {
  /** Total (destinationSlug x StayType) tags the current manifest defines. */
  manifestTagCount: number;
  /** Total unique (location, state, StayType) search groups the current manifest defines
   *  — NOT how many ran today; most days most groups are still fresh and skipped. */
  searchGroupCount: number;
  /** Groups whose `nextEligibleAt` has passed — eligible to run today, before the daily
   *  budget narrows that down further. */
  dueGroupCount: number;
  searchGroupsAttempted: number;
  /** Due, but not attempted because the daily budget ran out first. Picked up on a
   *  future run — its `nextEligibleAt` is already in the past, so it sorts first again. */
  searchGroupsSkippedForBudget: number;
  destinationsProcessed: number;
  /** Actual outbound Google Places HTTP requests, INCLUDING every pagination page. */
  googleRequestCount: number;
  recordsUpserted: number;
  /** True the moment budget ran out while due groups still remained. */
  budgetLimited: boolean;
  errors: StaysRefreshErrorEntry[];
}

const RULES_BY_SLUG = new Map(STAY_LOCATION_RULES.map((rule) => [rule.slug, rule]));
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getRequestBudget(): number {
  const raw = process.env.GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_DAILY_REFRESH_REQUEST_BUDGET;
}

function getRefreshMaxPages(): number {
  const raw = process.env.GOOGLE_PLACES_REFRESH_MAX_PAGES;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_REFRESH_MAX_PAGES;
}

interface SearchGroup {
  key: string;
  location: string;
  state?: string;
  stayType: StayType;
  stayMode?: StayMode;
  tier: 'popular' | 'core';
  destinationSlugs: string[];
}

// Groups the manifest's (destinationSlug x StayType) tags by their real, shared search
// target — several destinations legitimately share a primaryStayLocation (e.g. Kinnaur,
// Sangla Valley and Chitkul all resolve to "Sangla"), so Google is asked once per unique
// group, not once per destination.
function buildSearchGroups(destinations: Array<{ slug: string; state?: string; isPopular?: boolean }>): SearchGroup[] {
  const groups = new Map<string, SearchGroup>();
  for (const destination of destinations) {
    const rule = RULES_BY_SLUG.get(destination.slug);
    if (!rule) continue; // no authored stay-location rule — never guess a search location

    for (const stayType of getRefreshStayTypes(destination.slug, destination.isPopular)) {
      const key = `${rule.primaryStayLocation}|${destination.state ?? ''}|${stayType}`;
      const existing = groups.get(key);
      if (existing) {
        existing.destinationSlugs.push(destination.slug);
        // A group is "popular" if ANY destination sharing it is — refreshing it benefits
        // that destination's own page regardless of who else shares the same location.
        if (destination.isPopular) existing.tier = 'popular';
      } else {
        groups.set(key, {
          key,
          location: rule.primaryStayLocation,
          state: destination.state,
          stayType,
          stayMode: rule.stayMode,
          tier: destination.isPopular ? 'popular' : 'core',
          destinationSlugs: [destination.slug]
        });
      }
    }
  }
  return Array.from(groups.values());
}

function isDue(state: StaysRefreshComboStateDocument | undefined, now: Date): boolean {
  return !state?.nextEligibleAt || state.nextEligibleAt <= now;
}

// Oldest-due-first — a group never attempted (`nextEligibleAt` unset) sorts before one
// whose freshness window merely expired, which sorts before one not due at all (already
// excluded by isDue before this runs). This ordering is the entire rotation mechanism.
function byStalenessAsc(statesByKey: Map<string, StaysRefreshComboStateDocument>) {
  return (a: SearchGroup, b: SearchGroup) => {
    const aTime = statesByKey.get(a.key)?.nextEligibleAt?.getTime() ?? 0;
    const bTime = statesByKey.get(b.key)?.nextEligibleAt?.getTime() ?? 0;
    return aTime - bTime;
  };
}

// Selects which due groups actually run today, within the daily budget:
//  1. Popular-tier due groups first, capped at POPULAR_BUDGET_SHARE of the budget — so
//     popular destinations get priority without ever starving normal ones even if many
//     popular groups are simultaneously due.
//  2. Core-tier due groups with whatever budget remains.
//  3. A top-up pass (either tier, whichever still has unselected due groups) so leftover
//     budget from a short queue is never wasted.
function selectGroupsWithinBudget(dueGroups: SearchGroup[], statesByKey: Map<string, StaysRefreshComboStateDocument>, budget: number, maxPages: number): SearchGroup[] {
  const popularDue = dueGroups.filter((g) => g.tier === 'popular').sort(byStalenessAsc(statesByKey));
  const coreDue = dueGroups.filter((g) => g.tier === 'core').sort(byStalenessAsc(statesByKey));
  const popularCap = Math.max(0, Math.floor(budget * POPULAR_BUDGET_SHARE));

  const selected: SearchGroup[] = [];
  const selectedKeys = new Set<string>();
  let reserved = 0;
  let popularReserved = 0;

  for (const group of popularDue) {
    if (popularReserved + maxPages > popularCap || reserved + maxPages > budget) break;
    popularReserved += maxPages;
    reserved += maxPages;
    selected.push(group);
    selectedKeys.add(group.key);
  }
  for (const group of coreDue) {
    if (reserved + maxPages > budget) break;
    reserved += maxPages;
    selected.push(group);
    selectedKeys.add(group.key);
  }
  // Top-up: spend any budget the two capped passes above left on the table, from
  // whichever due groups (either tier) weren't already selected.
  for (const group of [...popularDue, ...coreDue]) {
    if (selectedKeys.has(group.key)) continue;
    if (reserved + maxPages > budget) break;
    reserved += maxPages;
    selected.push(group);
    selectedKeys.add(group.key);
  }

  return selected;
}

async function refreshSearchGroup(
  group: SearchGroup,
  apiKey: string,
  maxPages: number
): Promise<{ pagesFetched: number; recordsUpserted: number; rawCount: number }> {
  const { places: rawPlaces, pagesFetched } = await searchStays(group.location, group.stayType, apiKey, group.state, maxPages);

  const seenPlaceIds = new Set<string>();
  const uniquePlaces: RawGooglePlace[] = [];
  for (const place of rawPlaces) {
    if (seenPlaceIds.has(place.id)) continue;
    seenPlaceIds.add(place.id);
    uniquePlaces.push(place);
  }

  const classified = uniquePlaces
    .map((place) => ({ place, classification: classifyPlaceLocation(place.formattedAddress, group.location, group.stayMode) }))
    .filter(({ classification }) => classification !== 'wrong-location');

  const survivingPlaceIds = new Set(
    (await filterOutExcludedPlaces('google', classified.map(({ place }) => ({ placeId: place.id })))).map((doc) => doc.placeId)
  );
  const survivors = classified.filter(({ place }) => survivingPlaceIds.has(place.id));

  await connectDB();
  let recordsUpserted = 0;
  for (const destinationSlug of group.destinationSlugs) {
    const docs = survivors.map(({ place, classification }) => {
      const { latitude, longitude } = placeCoordinates(place);
      return {
        placeId: place.id,
        name: placeName(place),
        slug: `${destinationSlug}-${slugify(placeName(place))}`,
        stayType: group.stayType,
        formattedAddress: place.formattedAddress,
        latitude,
        longitude,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        photos: placePhotoUrls(place),
        destinationSlug,
        searchLocation: group.location,
        types: place.types,
        googleMapsUri: place.googleMapsUri,
        websiteUri: place.websiteUri,
        locationClassification: classification as 'exact' | 'nearby' | 'access-base'
      };
    });
    await Promise.all(
      docs.map((doc) =>
        PlaceCache.findOneAndUpdate({ placeId: doc.placeId, destinationSlug: doc.destinationSlug, stayType: doc.stayType }, doc, { upsert: true })
      )
    );
    recordsUpserted += docs.length;
  }

  return { pagesFetched, recordsUpserted, rawCount: rawPlaces.length };
}

async function runWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  async function next(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
}

const REFRESH_CONCURRENCY = 5;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

// The controlled, rotating Google refresh — the ONLY place Google Places is ever called
// for Stays. See the module doc comment above for the rotation model.
export async function refreshAllConfiguredStays(): Promise<StaysRefreshSummary> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      manifestTagCount: 0,
      searchGroupCount: 0,
      dueGroupCount: 0,
      searchGroupsAttempted: 0,
      searchGroupsSkippedForBudget: 0,
      destinationsProcessed: 0,
      googleRequestCount: 0,
      recordsUpserted: 0,
      budgetLimited: false,
      errors: [{ destinationSlug: '*', stayType: '*', message: 'GOOGLE_PLACES_API_KEY is not set — refresh skipped entirely' }]
    };
  }

  await connectDB();

  const destinations = await getCuratedDestinations();
  const groups = buildSearchGroups(destinations);
  const manifestTagCount = groups.reduce((sum, group) => sum + group.destinationSlugs.length, 0);

  const existingStates = await StaysRefreshComboState.find({ groupKey: { $in: groups.map((g) => g.key) } }).lean<StaysRefreshComboStateDocument[]>();
  const statesByKey = new Map(existingStates.map((state) => [state.groupKey, state]));

  const now = new Date();
  const dueGroups = groups.filter((group) => isDue(statesByKey.get(group.key), now));

  const budget = getRequestBudget();
  const maxPages = getRefreshMaxPages();
  const selected = selectGroupsWithinBudget(dueGroups, statesByKey, budget, maxPages);

  let googleRequestCount = 0;
  let recordsUpserted = 0;
  const errors: StaysRefreshErrorEntry[] = [];
  const processedDestinations = new Set<string>();

  await runWithConcurrency(selected, REFRESH_CONCURRENCY, async (group) => {
    const priorState = statesByKey.get(group.key);
    try {
      const { pagesFetched, recordsUpserted: upserted, rawCount } = await refreshSearchGroup(group, apiKey, maxPages);
      googleRequestCount += pagesFetched;
      recordsUpserted += upserted;
      for (const slug of group.destinationSlugs) processedDestinations.add(slug);

      const isEmpty = rawCount === 0;
      const nextEligibleAt = isEmpty ? addDays(now, EMPTY_RESULT_BACKOFF_DAYS[group.tier]) : addDays(now, FRESHNESS_WINDOW_DAYS[group.tier]);
      await StaysRefreshComboState.findOneAndUpdate(
        { groupKey: group.key },
        {
          groupKey: group.key,
          location: group.location,
          state: group.state,
          stayType: group.stayType,
          tier: group.tier,
          lastAttemptedAt: now,
          lastSuccessAt: now,
          lastRawResultCount: rawCount,
          consecutiveEmptyResults: isEmpty ? (priorState?.consecutiveEmptyResults ?? 0) + 1 : 0,
          consecutiveFailures: 0,
          nextEligibleAt
        },
        { upsert: true }
      );
    } catch (error) {
      // A thrown error only ever happens on a page-1 failure (lib/googlePlaces.ts
      // swallows a page-2+ failure and returns the partial result instead of throwing) —
      // exactly 1 real HTTP request was made for this group.
      googleRequestCount += 1;
      errors.push({
        destinationSlug: group.destinationSlugs.join(','),
        stayType: group.stayType,
        message: error instanceof Error ? error.message.slice(0, 300) : 'UNKNOWN_ERROR'
      });

      const consecutiveFailures = (priorState?.consecutiveFailures ?? 0) + 1;
      const backoffDays = Math.min(FAILURE_BACKOFF_BASE_DAYS * consecutiveFailures, FAILURE_BACKOFF_MAX_DAYS);
      await StaysRefreshComboState.findOneAndUpdate(
        { groupKey: group.key },
        {
          groupKey: group.key,
          location: group.location,
          state: group.state,
          stayType: group.stayType,
          tier: group.tier,
          lastAttemptedAt: now,
          consecutiveFailures,
          nextEligibleAt: addDays(now, backoffDays)
        },
        { upsert: true }
      );
    }
  });

  return {
    manifestTagCount,
    searchGroupCount: groups.length,
    dueGroupCount: dueGroups.length,
    searchGroupsAttempted: selected.length,
    searchGroupsSkippedForBudget: dueGroups.length - selected.length,
    destinationsProcessed: processedDestinations.size,
    googleRequestCount,
    recordsUpserted,
    budgetLimited: selected.length < dueGroups.length,
    errors
  };
}
