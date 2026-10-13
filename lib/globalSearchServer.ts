import { connectDB } from '@/lib/mongodb';
import { getCuratedDestinations } from '@/lib/destinations';
import { getAllExperiences } from '@/lib/experiences';
import { getAllExperts } from '@/lib/experts';
import { getAllPackages } from '@/lib/packages';
import { getPublishedRegionRefs } from '@/lib/publishedRegions';
import { searchStaySuggestions, type StaySuggestionsOutcome } from '@/lib/staysSearch';
import type { StaySearchDestination } from '@/lib/search/staySearch';
import {
  GLOBAL_SEARCH_LIMITS,
  GLOBAL_SEARCH_SECTION_ORDER,
  destinationSection,
  experienceSection,
  expertSection,
  journeySection,
  regionSection,
  staySection,
  type GlobalSearchItem,
  type GlobalSearchSectionKey,
  type ParsedGlobalQuery,
  type RegionRef
} from '@/lib/search/globalSearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';
import type { TravelExpert } from '@/types/expert';

/**
 * Global Search, Stage 1: reads each catalog through the loader that already enforces its public
 * eligibility (published destinations/journeys/regions, active AND publiclyListed experts), in parallel,
 * ranks with the pure layer in lib/search/globalSearch.ts, and isolates failures per section.
 *
 * Bounded work: every read is given `maxTimeMS` so MongoDB itself abandons a slow query (the work is
 * really stopped, not just ignored), and each section additionally races a deadline slightly later than
 * that, which also covers a hung connection. A section that fails or times out is reported as such with no
 * items; the others are unaffected. Nothing is cached here: publication changes apply on the next request.
 * One projection-free read per catalog (no per-keystroke scan of large collections).
 *
 * Stage 3B adds the Stays section from searchStaySuggestions (lib/staysSearch.ts), which owns its eligibility,
 * fail-closed exclusion check, row memo and single-flight read. It has its OWN, longer response deadline (below)
 * and is the only section that may make the response wait past SECTION_DEADLINE_MS. Transport is not part of this.
 */

/** Server-side database time limit for each read. */
export const SECTION_DB_TIME_LIMIT_MS = 1500;
/** The response-side deadline: a little after the database limit so the database error normally wins. */
export const SECTION_DEADLINE_MS = SECTION_DB_TIME_LIMIT_MS + 250;
/**
 * Opening the database connection (only the first request of a cold server instance pays for it: TLS + auth) has
 * its own, longer budget, so connection setup is never mistaken for a slow query. After it, every read is held to
 * SECTION_DB_TIME_LIMIT_MS. If the connection cannot be opened in time every section reports a timeout.
 */
export const CONNECT_DEADLINE_MS = 6000;
/**
 * The Stays section's response deadline, counted from the same moment as SECTION_DEADLINE_MS (after the connection is
 * open). Evidence: a warm request is 0.15-0.3 s, but the first request on a cold instance reads about 4.5k eligible
 * rows (1.9 MB), measured 1.5-3.5 s (outliers to 9.7 s). A deadline equal to the other sections' would make almost
 * every cold Stays answer a timeout; waiting for the read to finish would make the whole response wait for it.
 * 2.5 s covers most cold reads while bounding the extra wait for everyone else to 0.75 s, and only when Stays is the
 * straggler. A read that misses it is NOT cancelled by the deadline (its own lifecycle in lib/staysSearch.ts bounds
 * it: one shared read, 20 s wait, abort, at most four unsettled), so it still fills the 60 s row memo and the next
 * request is warm. Stays then reports status "timeout" and the response is partial - never an empty "ok".
 */
export const STAYS_SECTION_DEADLINE_MS = 2500;

export interface GlobalSearchLoaders {
  /** Opens (or reuses) the shared database connection before any read. Defaults to a no-op when omitted. */
  connect?(): Promise<unknown>;
  destinations(options: { maxTimeMS: number }): Promise<Destination[]>;
  regions(options: { maxTimeMS: number }): Promise<RegionRef[]>;
  journeys(options: { maxTimeMS: number }): Promise<TravelPackage[]>;
  experiences(options: { maxTimeMS: number }): Promise<Experience[]>;
  experts(options: { maxTimeMS: number }): Promise<TravelExpert[]>;
  /**
   * Public stay suggestions for the text. Optional so a loader set without it simply has no Stays section data.
   * `shared.destinations()` is the Destinations section's own published-only read, so Stays does not read it twice; if
   * that read fails, so does Stays (it is never answered from unverified destinations).
   */
  stays?(query: string, shared: { destinations(): Promise<StaySearchDestination[]> }): Promise<StaySuggestionsOutcome>;
}

/**
 * The only fields each search module reads (plus what a result row shows). A projected read keeps the response
 * small and the per-request transfer low - the full documents are hundreds of KB - while the results stay
 * identical to a full read (asserted by test). Itinerary day text is kept: the journey description fallback uses it.
 */
export const DESTINATION_SEARCH_PROJECTION = { slug: 1, title: 1, state: 1, region: 1, category: 1, description: 1, editorialDescription: 1, 'places.title': 1, stayBaseLocations: 1, roadHead: 1, travelStyles: 1, image: 1, status: 1 } as const;
export const JOURNEY_SEARCH_PROJECTION = { slug: 1, name: 1, destination: 1, destinationSlugs: 1, image: 1, duration: 1, category: 1, shortDescription: 1, highlights: 1, 'itinerary.title': 1, 'itinerary.description': 1, startingCity: 1, endingCity: 1, status: 1 } as const;
export const EXPERIENCE_SEARCH_PROJECTION = { slug: 1, title: 1, location: 1, region: 1, category: 1, subCategory: 1, mood: 1, shortDescription: 1, description: 1, highlights: 1, image: 1 } as const;

const inFlight = new Map<string, Promise<unknown>>();

/**
 * Single-flight: requests that arrive while a read of the same catalog is ALREADY running share it instead of
 * each opening their own, which is what turns a burst of keystrokes from many visitors into one read. Nothing is
 * kept once the read finishes (no TTL, no stored copy), so the next request always reads fresh: the only
 * staleness possible is the duration of a read that was already in progress (bounded by the read limits).
 * A failed or hung read is never kept either: the entry is dropped when it settles or after the read deadline.
 */
export function singleFlight<T>(key: string, read: () => Promise<T>): Promise<T> {
  const running = inFlight.get(key);
  if (running) return running as Promise<T>;
  const started = read();
  inFlight.set(key, started);
  const release = () => {
    if (inFlight.get(key) === started) inFlight.delete(key);
  };
  started.then(release, release);
  setTimeout(release, SECTION_DEADLINE_MS).unref?.();
  return started;
}

export const defaultLoaders: GlobalSearchLoaders = {
  connect: () => connectDB(),
  destinations: (options) => singleFlight('destinations', () => getCuratedDestinations({ ...options, projection: { ...DESTINATION_SEARCH_PROJECTION } })),
  regions: (options) => singleFlight('regions', () => getPublishedRegionRefs(options)),
  journeys: (options) => singleFlight('journeys', () => getAllPackages({ ...options, projection: { ...JOURNEY_SEARCH_PROJECTION } })),
  experiences: (options) => singleFlight('experiences', () => getAllExperiences(options.maxTimeMS, { ...EXPERIENCE_SEARCH_PROJECTION })),
  experts: (options) => singleFlight('experts', () => getAllExperts(options)),
  // Not wrapped in singleFlight here: searchStaySuggestions has its own single-flight over the shared row read.
  stays: (query, shared) => searchStaySuggestions(query, { destinations: shared.destinations })
};

export type SectionStatus = 'ok' | 'timeout' | 'error';
export interface GlobalSearchSection {
  status: SectionStatus;
  items: GlobalSearchItem[];
}
export interface GlobalSearchResponse {
  query: string;
  sections: Record<GlobalSearchSectionKey, GlobalSearchSection>;
  total: number;
  /** True when any section did not complete - the results shown are correct but not exhaustive. */
  partial: boolean;
}

class DeadlineError extends Error {
  constructor() {
    super('section deadline exceeded');
    this.name = 'DeadlineError';
  }
}

export function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DeadlineError()), ms);
  });
  // The loser keeps running only as far as its own maxTimeMS allows; its rejection is swallowed here.
  promise.catch(() => undefined);
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

function isTimeout(error: unknown): boolean {
  if (error instanceof DeadlineError) return true;
  const candidate = error as { code?: number; codeName?: string; name?: string } | null;
  return candidate?.code === 50 || candidate?.codeName === 'MaxTimeMSExpired' || /MaxTimeMSExpired/.test(String(candidate?.name ?? ''));
}

const emptySection = (status: SectionStatus = 'ok'): GlobalSearchSection => ({ status, items: [] });

export function emptyGlobalSearchResponse(query: string): GlobalSearchResponse {
  return {
    query,
    sections: { destinations: emptySection(), regions: emptySection(), journeys: emptySection(), experiences: emptySection(), stays: emptySection(), experts: emptySection() },
    total: 0,
    partial: false
  };
}

export async function runGlobalSearch(parsed: Extract<ParsedGlobalQuery, { ok: true }>, loaders: GlobalSearchLoaders = defaultLoaders): Promise<GlobalSearchResponse> {
  const { query } = parsed;
  // Meaningless text ("[[", "()") reads nothing at all.
  if (parsed.meaningless) return emptyGlobalSearchResponse(query);

  // Connect first, with its own budget (see CONNECT_DEADLINE_MS); a failure here fails every section safely.
  if (loaders.connect) {
    try {
      await withDeadline(loaders.connect(), CONNECT_DEADLINE_MS);
    } catch (error) {
      const status: SectionStatus = isTimeout(error) ? 'timeout' : 'error';
      console.error('[globalSearch] database connection unavailable', status);
      const failed = emptyGlobalSearchResponse(query);
      for (const key of GLOBAL_SEARCH_SECTION_ORDER) failed.sections[key] = emptySection(status);
      return { ...failed, partial: true };
    }
  }

  const options = { maxTimeMS: SECTION_DB_TIME_LIMIT_MS };
  const load = <T,>(read: () => Promise<T>) => withDeadline(read(), SECTION_DEADLINE_MS);

  // Destinations and regions are read once and shared: journeys, experiences and experts use them to resolve
  // their own links (never to widen eligibility).
  const destinationsRead = load(() => loaders.destinations(options));
  const regionsRead = load(() => loaders.regions(options));
  const journeysRead = load(() => loaders.journeys(options));
  const experiencesRead = load(() => loaders.experiences(options));
  const expertsRead = load(() => loaders.experts(options));
  // Stays: its own deadline; the abandoned promise is always handled so a late rejection can never be unhandled.
  // It reuses the Destinations section's published-only read (never a second read); its own deadline still applies.
  const sharedDestinations = () => destinationsRead.then((list) => list.map((destination) => ({ slug: destination.slug, title: destination.title, state: destination.state })));
  const staysRead = loaders.stays ? withDeadline(Promise.resolve().then(() => loaders.stays!(query, { destinations: sharedDestinations })), STAYS_SECTION_DEADLINE_MS) : null;
  for (const read of [destinationsRead, regionsRead, journeysRead, experiencesRead, expertsRead, ...(staysRead ? [staysRead] : [])]) read.catch(() => undefined);

  async function section<T>(key: GlobalSearchSectionKey, primary: Promise<T>, build: (data: T, destinations: Destination[], regions: RegionRef[]) => GlobalSearchItem[], needs: { destinations?: boolean; regions?: boolean } = {}): Promise<[GlobalSearchSectionKey, GlobalSearchSection]> {
    try {
      const data = await primary;
      // A link source that failed only lowers recall for this section (empty links); it never widens results.
      const destinations = needs.destinations ? await destinationsRead.catch(() => [] as Destination[]) : [];
      const regions = needs.regions ? await regionsRead.catch(() => [] as RegionRef[]) : [];
      return [key, { status: 'ok', items: build(data, destinations, regions) }];
    } catch (error) {
      console.error(`[globalSearch] section "${key}" unavailable`, isTimeout(error) ? 'timeout' : error);
      return [key, emptySection(isTimeout(error) ? 'timeout' : 'error')];
    }
  }

  async function staysSection(): Promise<[GlobalSearchSectionKey, GlobalSearchSection]> {
    if (!staysRead) return ['stays', emptySection()];
    try {
      const outcome = await staysRead;
      if (outcome.status === 'ok') return ['stays', { status: 'ok', items: staySection(outcome.suggestions) }];
      // Exclusions/catalog could not be checked, or the cached read hit its limit: withheld entirely, never "no stays".
      console.error('[globalSearch] section "stays" unavailable', outcome.reason);
      return ['stays', emptySection(outcome.reason === 'timeout' ? 'timeout' : 'error')];
    } catch (error) {
      console.error('[globalSearch] section "stays" unavailable', isTimeout(error) ? 'timeout' : error);
      return ['stays', emptySection(isTimeout(error) ? 'timeout' : 'error')];
    }
  }

  const entries = await Promise.all([
    section('destinations', destinationsRead, (destinations) => destinationSection(destinations, query)),
    section('regions', regionsRead, (regions) => regionSection(regions, query)),
    section('journeys', journeysRead, (packages, destinations) => journeySection(packages, destinations, query), { destinations: true }),
    section('experiences', experiencesRead, (experiences, destinations) => experienceSection(experiences, destinations, query), { destinations: true }),
    staysSection(),
    section('experts', expertsRead, (experts, destinations, regions) => expertSection(experts, destinations, regions, query), { destinations: true, regions: true })
  ]);

  const sections = Object.fromEntries(entries) as Record<GlobalSearchSectionKey, GlobalSearchSection>;
  // A strict overall bound, independent of per-section limits.
  let remaining = GLOBAL_SEARCH_LIMITS.perSection * GLOBAL_SEARCH_SECTION_ORDER.length;
  for (const key of GLOBAL_SEARCH_SECTION_ORDER) {
    sections[key].items = sections[key].items.slice(0, remaining);
    remaining -= sections[key].items.length;
  }
  const total = GLOBAL_SEARCH_SECTION_ORDER.reduce((sum, key) => sum + sections[key].items.length, 0);
  return { query, sections, total, partial: GLOBAL_SEARCH_SECTION_ORDER.some((key) => sections[key].status !== 'ok') };
}
