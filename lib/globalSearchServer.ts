import { connectDB } from '@/lib/mongodb';
import { getCuratedDestinations, getPublishedDestinationRefs } from '@/lib/destinations';
import { getAllExperiences } from '@/lib/experiences';
import { getAllExperts } from '@/lib/experts';
import { getAllPackages } from '@/lib/packages';
import { getPublishedRegionRefs } from '@/lib/publishedRegions';
import { getActiveTransportRouteRefs } from '@/lib/publishedTransportRoutes';
import { searchStaySuggestions, type StaySuggestionsOutcome } from '@/lib/staysSearch';
import type { StaySearchDestination } from '@/lib/search/staySearch';
import type { GlobalSearchTimings, TimedOutcome } from '@/lib/globalSearchTiming';
import {
  GLOBAL_SEARCH_LIMITS,
  GLOBAL_SEARCH_SECTION_ORDER,
  destinationSection,
  experienceSection,
  expertSection,
  journeySection,
  regionSection,
  staySection,
  transportSection,
  type GlobalSearchItem,
  type GlobalSearchSectionKey,
  type ParsedGlobalQuery,
  type RegionRef
} from '@/lib/search/globalSearch';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';
import type { TravelExpert } from '@/types/expert';
import type { TransportRoute } from '@/types/transport';

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
 * and is the only section that may make the response wait past SECTION_DEADLINE_MS.
 *
 * Stage 4 adds the Transport section: one projected read of the active routes (lib/publishedTransportRoutes.ts), matched
 * by the pure layer with the /transport page's own route rules. It is the seventh authorized catalog read, runs
 * concurrently with the others under the same deadline, and needs neither destinations nor regions.
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
  /** The heavy read for the Destinations search section ONLY. */
  destinations(options: { maxTimeMS: number }): Promise<Destination[]>;
  /**
   * Fresh, published-only (slug, title, state) references: the verification journeys, experiences, experts and Stays depend
   * on, read concurrently with `destinations` and never derived from it when provided. If it fails those sections are
   * withheld (never answered from unverified destinations). A loader set without it falls back to deriving the same fields
   * from `destinations` (the behaviour before this read existed).
   */
  destinationRefs?(options: { maxTimeMS: number }): Promise<StaySearchDestination[]>;
  regions(options: { maxTimeMS: number }): Promise<RegionRef[]>;
  journeys(options: { maxTimeMS: number }): Promise<TravelPackage[]>;
  experiences(options: { maxTimeMS: number }): Promise<Experience[]>;
  experts(options: { maxTimeMS: number }): Promise<TravelExpert[]>;
  /** Active Transport routes only. Optional so a loader set without it simply has no Transport data (an empty, complete section). */
  transport?(options: { maxTimeMS: number }): Promise<TransportRoute[]>;
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

/**
 * The most reads of the older catalogs that may be unsettled at once in one server instance: one per authorized catalog
 * (SECTION_READ_CATALOGS). Every flight counts, whatever its database limit, so the ceiling holds even if two limits are
 * ever used for one catalog; a read beyond it is refused rather than let a key silently multiply database work.
 * The independent Stays read (lib/staysSearch.ts) keeps its own cap of four and is not counted here; the two never share a slot.
 */
export const MAX_UNSETTLED_SECTION_READS = 7;
/**
 * The ONLY catalogs a shared read may be registered for. `destinations` is the heavy Destinations-search read;
 * `destinationRefs` is the light, fresh, published-only (slug, title, state) read the dependent sections and Stays are
 * verified against; `transport` is the active-routes read. Any other key is refused, so the registry can never grow by accident.
 */
export const SECTION_READ_CATALOGS = ['destinations', 'destinationRefs', 'regions', 'journeys', 'experiences', 'experts', 'transport'] as const;
export type SectionReadCatalog = (typeof SECTION_READ_CATALOGS)[number];
/** `catalog#limit`, exactly: the limit is a canonical integer (no leading zeros), so one logical read has one spelling. */
const SECTION_READ_KEY = new RegExp(`^(${SECTION_READ_CATALOGS.join('|')})#(0|[1-9][0-9]{0,5})$`);

/** A shared read was requested for something that is not an authorized catalog (or a malformed key). It never starts a read. */
export class UnknownSectionReadError extends Error {
  constructor() {
    super('Not an authorized global search catalog read');
    this.name = 'UnknownSectionReadError';
  }
}
/**
 * How long a section read may stay unsettled before it is CANCELLED through its AbortSignal. Far above what a healthy
 * read needs (the database limit is 1.5 s, the response deadline 1.75 s) and below the driver's 30 s connection-selection
 * default, so only a genuinely stuck read - for example one waiting on a connection that never arrives - ever reaches it.
 */
export const SECTION_READ_ABORT_AFTER_MS = 10_000;

/** The reason a stuck read is cancelled with: it ran past its maximum lifetime, so it counts as a timeout (never as data). */
export class SectionReadAbortedError extends Error {
  constructor() {
    super('A global search read exceeded its maximum lifetime and was cancelled');
    this.name = 'SectionReadAbortedError';
  }
}

/** A section read was refused because the unsettled-read cap is reached: the section answers "timeout", never data. */
export class SectionReadBusyError extends Error {
  constructor() {
    super('Too many global search reads are already running');
    this.name = 'SectionReadBusyError';
  }
}

const inFlight = new Map<string, Promise<unknown>>();

/** For tests only: forgets every registered read. It never cancels or settles them. */
export function resetSectionReadsForTests(): void {
  inFlight.clear();
}

/**
 * Single-flight: requests that arrive while a read of the same catalog is ALREADY running share it instead of
 * each opening their own, which is what turns a burst of keystrokes from many visitors into one read. Nothing is
 * kept once the read finishes (no TTL, no stored copy), so the next request always reads fresh.
 *
 * Lifetime: a read stays registered until the underlying operation actually SETTLES - never because a timer ran out.
 * A caller that gave up (the section deadline in runGlobalSearch bounds every caller's wait independently) leaves the
 * read running and registered, so a later request joins it instead of starting a duplicate. A read still unsettled after
 * SECTION_READ_ABORT_AFTER_MS is cancelled through the AbortSignal handed to `read`; cancelling does not unregister it
 * either - it is forgotten only when the (now aborted) operation rejects. A read that ignores its signal therefore stays
 * registered, and its catalog answers "timeout" until it ends: honest, and never a second concurrent read. Cleanup is
 * identity-checked (an older settled read can never remove a newer one) and failures are never kept.
 */
export function singleFlight<T>(key: string, read: (signal: AbortSignal) => Promise<T>): Promise<T> {
  if (!SECTION_READ_KEY.test(key)) return Promise.reject(new UnknownSectionReadError());
  const running = inFlight.get(key);
  if (running) return running as Promise<T>;
  if (inFlight.size >= MAX_UNSETTLED_SECTION_READS) return Promise.reject(new SectionReadBusyError());
  const controller = new AbortController();
  let started: Promise<T>;
  try {
    started = Promise.resolve(read(controller.signal));
  } catch (error) {
    started = Promise.reject(error);
  }
  inFlight.set(key, started);
  const cancelTimer = setTimeout(() => controller.abort(new SectionReadAbortedError()), SECTION_READ_ABORT_AFTER_MS);
  cancelTimer.unref?.();
  const settle = () => {
    clearTimeout(cancelTimer);
    if (inFlight.get(key) === started) inFlight.delete(key);
  };
  started.then(settle, settle);
  return started;
}

export const defaultLoaders: GlobalSearchLoaders = {
  connect: () => connectDB(),
  // The flight key includes the database limit, so reads with different limits never share one.
  destinations: (options) => singleFlight(`destinations#${options.maxTimeMS}`, (signal) => getCuratedDestinations({ ...options, projection: { ...DESTINATION_SEARCH_PROJECTION }, signal })),
  destinationRefs: (options) => singleFlight(`destinationRefs#${options.maxTimeMS}`, (signal) => getPublishedDestinationRefs({ ...options, signal })),
  regions: (options) => singleFlight(`regions#${options.maxTimeMS}`, (signal) => getPublishedRegionRefs({ ...options, signal })),
  journeys: (options) => singleFlight(`journeys#${options.maxTimeMS}`, (signal) => getAllPackages({ ...options, projection: { ...JOURNEY_SEARCH_PROJECTION }, signal })),
  experiences: (options) => singleFlight(`experiences#${options.maxTimeMS}`, (signal) => getAllExperiences(options.maxTimeMS, { ...EXPERIENCE_SEARCH_PROJECTION }, signal)),
  experts: (options) => singleFlight(`experts#${options.maxTimeMS}`, (signal) => getAllExperts({ ...options, signal })),
  transport: (options) => singleFlight(`transport#${options.maxTimeMS}`, (signal) => getActiveTransportRouteRefs({ ...options, signal })),
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
  if (error instanceof DeadlineError || error instanceof SectionReadBusyError || error instanceof SectionReadAbortedError) return true;
  const candidate = error as { code?: number; codeName?: string; name?: string } | null;
  return candidate?.code === 50 || candidate?.codeName === 'MaxTimeMSExpired' || /MaxTimeMSExpired/.test(String(candidate?.name ?? ''));
}

const emptySection = (status: SectionStatus = 'ok'): GlobalSearchSection => ({ status, items: [] });

export function emptyGlobalSearchResponse(query: string): GlobalSearchResponse {
  return {
    query,
    sections: { destinations: emptySection(), regions: emptySection(), journeys: emptySection(), experiences: emptySection(), stays: emptySection(), experts: emptySection(), transport: emptySection() },
    total: 0,
    partial: false
  };
}

/**
 * `timings` is an optional out-parameter (see lib/globalSearchTiming.ts): it records how long the connection took and how each
 * section ended. It is never read back, adds no database call and cannot change the response.
 */
export async function runGlobalSearch(parsed: Extract<ParsedGlobalQuery, { ok: true }>, loaders: GlobalSearchLoaders = defaultLoaders, timings?: GlobalSearchTimings): Promise<GlobalSearchResponse> {
  const { query } = parsed;
  const skipAll = () => {
    if (timings) for (const key of GLOBAL_SEARCH_SECTION_ORDER) timings.sections[key] = { ms: 0, outcome: 'skipped' };
  };
  // Meaningless text ("[[", "()") reads nothing at all.
  if (parsed.meaningless) {
    skipAll();
    return emptyGlobalSearchResponse(query);
  }

  // Connect first, with its own budget (see CONNECT_DEADLINE_MS); a failure here fails every section safely.
  if (loaders.connect) {
    const connectStartedAt = Date.now();
    try {
      await withDeadline(loaders.connect(), CONNECT_DEADLINE_MS);
      if (timings) timings.connect = { ms: Date.now() - connectStartedAt, outcome: 'ok' };
    } catch (error) {
      const status: SectionStatus = isTimeout(error) ? 'timeout' : 'error';
      if (timings) timings.connect = { ms: Date.now() - connectStartedAt, outcome: status };
      skipAll();
      console.error('[globalSearch] database connection unavailable', status);
      const failed = emptyGlobalSearchResponse(query);
      for (const key of GLOBAL_SEARCH_SECTION_ORDER) failed.sections[key] = emptySection(status);
      return { ...failed, partial: true };
    }
  }

  const options = { maxTimeMS: SECTION_DB_TIME_LIMIT_MS };
  const readsStartedAt = Date.now();
  const note = (key: GlobalSearchSectionKey, outcome: TimedOutcome) => {
    if (timings) timings.sections[key] = { ms: Date.now() - readsStartedAt, outcome };
  };
  const load = <T,>(read: () => Promise<T>) => withDeadline(read(), SECTION_DEADLINE_MS);

  // Two destination reads start together: the heavy one serves ONLY the Destinations section; the light, fresh,
  // published-only refs verify every destination-dependent section. Neither waits for the other.
  const destinationsRead = load(() => loaders.destinations(options));
  const refsRead: Promise<StaySearchDestination[]> = loaders.destinationRefs ? load(() => loaders.destinationRefs!(options)) : destinationsRead.then((list) => list.map((destination) => ({ slug: destination.slug, title: destination.title, state: destination.state })));
  // Regions are read once and shared with experts (never to widen eligibility).
  const regionsRead = load(() => loaders.regions(options));
  const journeysRead = load(() => loaders.journeys(options));
  const experiencesRead = load(() => loaders.experiences(options));
  const expertsRead = load(() => loaders.experts(options));
  // Transport: concurrent with the rest, same deadline, independent of destinations and regions.
  const transportRead = load(() => (loaders.transport ? loaders.transport(options) : Promise.resolve([] as TransportRoute[])));
  // Stays: its own deadline; the abandoned promise is always handled so a late rejection can never be unhandled.
  // It is verified against the light published refs (never the heavy Destinations read); its own deadline still applies.
  const sharedDestinations = () => refsRead;
  const staysRead = loaders.stays ? withDeadline(Promise.resolve().then(() => loaders.stays!(query, { destinations: sharedDestinations })), STAYS_SECTION_DEADLINE_MS) : null;
  for (const read of [destinationsRead, refsRead, regionsRead, journeysRead, experiencesRead, expertsRead, transportRead, ...(staysRead ? [staysRead] : [])]) read.catch(() => undefined);

  async function section<T>(key: GlobalSearchSectionKey, primary: Promise<T>, build: (data: T, destinations: StaySearchDestination[], regions: RegionRef[]) => GlobalSearchItem[], needs: { destinations?: boolean; regions?: boolean } = {}): Promise<[GlobalSearchSectionKey, GlobalSearchSection]> {
    try {
      const data = await primary;
      // Destination verification is REQUIRED: if the fresh published refs failed, this section is withheld (its catch below
      // reports timeout/error) - never answered from unverified destinations. Regions only lower recall when they fail.
      const destinations = needs.destinations ? await refsRead : [];
      const regions = needs.regions ? await regionsRead.catch(() => [] as RegionRef[]) : [];
      const built = build(data, destinations, regions);
      note(key, 'ok');
      return [key, { status: 'ok', items: built }];
    } catch (error) {
      console.error(`[globalSearch] section "${key}" unavailable`, isTimeout(error) ? 'timeout' : error);
      note(key, isTimeout(error) ? 'timeout' : 'error');
      return [key, emptySection(isTimeout(error) ? 'timeout' : 'error')];
    }
  }

  async function staysSection(): Promise<[GlobalSearchSectionKey, GlobalSearchSection]> {
    if (!staysRead) {
      note('stays', 'skipped');
      return ['stays', emptySection()];
    }
    try {
      const outcome = await staysRead;
      if (outcome.status === 'ok') {
        const items = staySection(outcome.suggestions);
        note('stays', 'ok');
        return ['stays', { status: 'ok', items }];
      }
      // Exclusions/catalog could not be checked, or the cached read hit its limit: withheld entirely, never "no stays".
      console.error('[globalSearch] section "stays" unavailable', outcome.reason);
      note('stays', outcome.reason === 'timeout' ? 'timeout' : 'error');
      return ['stays', emptySection(outcome.reason === 'timeout' ? 'timeout' : 'error')];
    } catch (error) {
      console.error('[globalSearch] section "stays" unavailable', isTimeout(error) ? 'timeout' : error);
      note('stays', isTimeout(error) ? 'timeout' : 'error');
      return ['stays', emptySection(isTimeout(error) ? 'timeout' : 'error')];
    }
  }

  const entries = await Promise.all([
    section('destinations', destinationsRead, (destinations) => destinationSection(destinations, query)),
    section('regions', regionsRead, (regions) => regionSection(regions, query)),
    section('journeys', journeysRead, (packages, destinations) => journeySection(packages, destinations, query), { destinations: true }),
    section('experiences', experiencesRead, (experiences, destinations) => experienceSection(experiences, destinations, query), { destinations: true }),
    staysSection(),
    section('experts', expertsRead, (experts, destinations, regions) => expertSection(experts, destinations, regions, query), { destinations: true, regions: true }),
    section('transport', transportRead, (routes) => transportSection(routes, query))
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
