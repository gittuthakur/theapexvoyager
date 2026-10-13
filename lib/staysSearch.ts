import { connectDB } from '@/lib/mongodb';
import { PlaceCache } from '@/models/PlaceCache';
import { getPublishedDestinationRefs } from '@/lib/destinations';
import { getCachedStaysCatalog, toStay } from '@/lib/stays';
import { identityKey } from '@/lib/stayMerge';
import { normalizeSearchText } from '@/lib/search/normalize';
import { classifyVerifiedStayType } from '@/lib/stayClassification';
import { eligibleLocationsMatch, eligibleStayLocations, type EligibleStayLocation } from '@/lib/staysEligibility';
import {
  eligiblePairsForDestination,
  scoreStayText,
  searchStayCandidates,
  type StayCandidate,
  type StaySearchDestination,
  type StaySearchQuery
} from '@/lib/search/staySearch';
import { ExclusionLookupError, getActiveExclusionSet } from '@/services/properties/propertyExclusion.service';
import type { Stay } from '@/types/stay';

/**
 * Public search over the cached Google stays. READ-ONLY and cache-only: this module calls no Google Places
 * function, makes no provider call and never writes. A stay is returned only if
 *   1. one of its cached rows is eligible (published destination + that destination's current stay
 *      location - lib/staysEligibility.ts), so orphan, test-slug and stale-location rows stay hidden, and
 *   2. its placeId is not actively excluded. The exclusion list is read on EVERY request and the lookup
 *      fails closed: if it cannot be read, nothing from Google is returned (status 'unavailable').
 * Eligibility, exclusion and curated-duplicate removal are applied BEFORE ranking, counting and pagination,
 * so totals and pages are exact.
 *
 * Cost of a request (benchmarked against the live cache, see the P4 report): a plain browse is answered by
 * the database-side aggregation (one page of documents), a destination search reads only that
 * destination's rows, and a name search scans the eligible rows, which are held in a short in-process
 * memo. The memo holds only row data; exclusions and eligibility are checked fresh on every request, so
 * an exclusion or an unpublished destination takes effect immediately and only a newly cached or renamed
 * stay can take up to the memo window to appear.
 */

export const STAYS_PAGE_SIZE = 24;

/** How long the eligible-row scan is reused by name searches. 0 disables it. Overridable for tests/operations. */
const DEFAULT_ROW_MEMO_MS = 60_000;

export interface CacheAge {
  /** Oldest and newest `updatedAt` among the matched cached rows (ISO). Cached provider data, never live availability or price. */
  oldest: string;
  newest: string;
}

export type EligibleStaysOutcome =
  | { status: 'ok'; stays: Stay[]; totalCount: number; cacheAge?: CacheAge }
  | { status: 'ambiguous'; destinations: StaySearchDestination[] }
  | { status: 'unavailable'; reason: 'exclusions' | 'catalog' };

export interface EligibleStaysRequest extends StaySearchQuery {
  /** Zero-based index of the first result of the requested page slice (over curated + cached, in that order). */
  offset?: number;
  limit?: number;
  /**
   * Publicly listed curated stays already matched to this search, in display order. They lead the combined list.
   * Cached stays that are exact duplicates of one (same name and address) are removed BEFORE counting and
   * paging, so totals, pages and ordering stay exact and no property appears twice.
   */
  curated?: Stay[];
  /** 'auto' (default) may answer a plain browse with the database-side aggregation; 'scan' always scans the eligible rows. Equivalent results. */
  strategy?: 'auto' | 'scan';
}

interface LightRow {
  placeId: string;
  name: string;
  destinationSlug: string;
  searchLocation: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  /** Present only on rows read with SUGGESTION_PROJECTION: whether `types` is non-empty (all the representative rule needs of it). */
  hasTypes?: boolean;
  updatedAt?: Date | string;
}

/**
 * What the suggestion search reads: the listing's fields MINUS the ones only the listing uses. `updatedAt` feeds the
 * listing's cache-age line; `types` feeds the listing's stay-type filter and its representative-row rule. Suggestions
 * have no stay-type filter and no cache-age line, and the representative rule only asks whether `types` is non-empty,
 * so the database computes that one boolean instead of sending the array (verified identical for every eligible row).
 * `_id` is never used. The listing keeps LIGHT_PROJECTION unchanged.
 */
const SUGGESTION_PROJECTION = {
  _id: 0,
  placeId: 1,
  name: 1,
  destinationSlug: 1,
  searchLocation: 1,
  formattedAddress: 1,
  rating: 1,
  userRatingCount: 1,
  hasTypes: { $gt: [{ $size: { $ifNull: ['$types', []] } }, 0] }
};
const LIGHT_PROJECTION = { placeId: 1, name: 1, destinationSlug: 1, searchLocation: 1, formattedAddress: 1, rating: 1, userRatingCount: 1, types: 1, updatedAt: 1 };

/**
 * The row that represents a real place when it is cached more than once: the same rule the database-side
 * aggregation uses (typed row first, then rating, review count, placeId), so every search surface orders
 * and describes a duplicated place identically.
 */
function betterRepresentative(candidate: LightRow, current: LightRow): boolean {
  const typed = (row: LightRow) => ((row.hasTypes ?? (row.types?.length ?? 0) > 0) ? 1 : 0);
  return (
    typed(candidate) - typed(current) ||
    (candidate.rating ?? 0) - (current.rating ?? 0) ||
    (candidate.userRatingCount ?? 0) - (current.userRatingCount ?? 0)
  ) > 0;
}

/** Groups cached rows into one candidate per real placeId, keeping every eligible tag it is cached under. */
export function groupRowsIntoCandidates(rows: readonly LightRow[]): StayCandidate[] {
  const byPlace = new Map<string, { rep: LightRow; tags: StayCandidate['tags'] }>();
  for (const row of rows) {
    const entry = byPlace.get(row.placeId);
    if (!entry) {
      byPlace.set(row.placeId, { rep: row, tags: [{ destinationSlug: row.destinationSlug, searchLocation: row.searchLocation }] });
      continue;
    }
    if (!entry.tags.some((tag) => tag.destinationSlug === row.destinationSlug && tag.searchLocation === row.searchLocation)) {
      entry.tags.push({ destinationSlug: row.destinationSlug, searchLocation: row.searchLocation });
    }
    if (betterRepresentative(row, entry.rep)) entry.rep = row;
  }
  return [...byPlace.values()].map(({ rep, tags }) => ({
    placeId: rep.placeId,
    name: rep.name,
    formattedAddress: rep.formattedAddress,
    rating: rep.rating,
    userRatingCount: rep.userRatingCount,
    types: rep.types,
    tags
  }));
}

// ---- eligible-row memo (rows only; never exclusions, never eligibility) --------------------------------
/**
 * Fresh row sets, one per (row shape, exact eligible-pair set). The two shapes (the listing's full light rows and the
 * suggestions' leaner rows) are different data, so they never serve each other. The table is tiny and bounded: expired
 * entries are dropped on every write and at most MAX_MEMO_ENTRIES are kept (oldest first out).
 */
const rowMemo = new Map<string, { at: number; rows: LightRow[] }>();
const MAX_MEMO_ENTRIES = 4;
/** Bumped by resetStaysSearchMemo: a read that started before a reset never writes the memo afterwards. */
let memoGeneration = 0;

/**
 * Row-read lifecycle. A flight is ONE real database read of the eligible rows. It stays registered until that read
 * actually settles (resolves or rejects) - never because a timer expired - so a slow or hung read can never be
 * duplicated: while it is unsettled, no other full read of the same rows is started. The only things that end a
 * flight are the read itself finishing, failing, or being cancelled through its AbortSignal.
 */
interface RowFlight {
  promise: Promise<LightRow[]>;
  startedAt: number;
}
const inFlightRows = new Map<string, RowFlight>();

/**
 * How long ANY caller may wait for a shared read (counted from when the read started). A caller that gives up is
 * told so with a typed error; that does NOT cancel or forget the read. A read still unsettled after this long is
 * cancelled through its AbortSignal (see below); the observed cold read of the whole eligible set is 1.5-9.7 s.
 */
export const ROW_READ_MAX_WAIT_MS = 20_000;
/**
 * The most full-row reads that may be unsettled at once in one server instance, across every location set and time
 * limit. Normally at most two exist (the listing's unlimited read and the suggestions read); the rest is headroom for
 * a publication change while a read is running. A request that would exceed it is refused instead of starting more work.
 */
export const MAX_UNSETTLED_ROW_READS = 4;

/** Why the shared eligible-row read cannot serve this request (not a data answer: the caller must report "unavailable"). */
export class RowReadUnavailableError extends Error {
  constructor(public readonly kind: 'stale' | 'busy') {
    super(kind === 'stale' ? 'The eligible-row read did not finish in time' : 'Too many eligible-row reads are already running');
    this.name = 'RowReadUnavailableError';
  }
}

function rowMemoMs(): number {
  const configured = Number(process.env.STAYS_SEARCH_ROW_MEMO_MS);
  return process.env.STAYS_SEARCH_ROW_MEMO_MS !== undefined && Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_ROW_MEMO_MS;
}

export interface EligibleRowReadOptions {
  /** Server-side database time limit for the read (MongoDB abandons the query itself). Omitted = no limit, exactly as before. */
  maxTimeMS?: number;
  /** 'listing' (default, exactly as before) or 'suggestions' (the leaner SUGGESTION_PROJECTION rows). */
  shape?: 'listing' | 'suggestions';
}

async function loadEligibleRows(pairs: readonly EligibleStayLocation[], options: EligibleRowReadOptions, signal?: AbortSignal): Promise<LightRow[]> {
  await connectDB();
  // The driver cancels the operation (and its transfer) when the signal aborts.
  const projection = options.shape === 'suggestions' ? SUGGESTION_PROJECTION : LIGHT_PROJECTION;
  const query = signal ? PlaceCache.find(eligibleLocationsMatch(pairs), projection, { signal } as never) : PlaceCache.find(eligibleLocationsMatch(pairs), projection);
  return (await (options.maxTimeMS ? query.maxTimeMS(options.maxTimeMS) : query).lean()) as unknown as LightRow[];
}

/** Waits for a flight, but only up to its allowed age; giving up neither cancels nor forgets the read. */
function awaitFlight(flight: RowFlight): Promise<LightRow[]> {
  const remaining = ROW_READ_MAX_WAIT_MS - (Date.now() - flight.startedAt);
  if (remaining <= 0) return Promise.reject(new RowReadUnavailableError('stale'));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const gaveUp = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RowReadUnavailableError('stale')), remaining);
  });
  return Promise.race([flight.promise, gaveUp]).finally(() => clearTimeout(timer));
}

/**
 * The eligible rows for a pair set. A memoizable read is (1) served from the bounded memo while fresh, else
 * (2) joined onto the read of the SAME pair set and time limit that is already running, else (3) started - unless
 * MAX_UNSETTLED_ROW_READS reads are already unsettled, in which case the request is refused. The flight is removed
 * only when its read settles, and only if it is still the registered one (a settled older flight can never remove a
 * newer one); a failed read is never memoized, so the next request after it settles starts a fresh read. Reads with a
 * different database time limit never share a flight, so a request that did not ask for a limit is never failed by
 * another request's limit. Only ROW data is shared: exclusions and the published-destination eligibility are decided
 * by the caller on every request and are part of neither the memo nor the flight key (the key is the exact pair set,
 * so unpublishing a destination is a miss at once).
 */
async function readEligibleRows(pairs: readonly EligibleStayLocation[], memoizable: boolean, options: EligibleRowReadOptions = {}): Promise<LightRow[]> {
  const ttl = rowMemoMs();
  // The key is the exact eligible-pair set, so unpublishing a destination (or an edited stay rule) is a memo miss at once.
  const key = memoizable && ttl > 0 ? pairs.map((pair) => `${pair.destinationSlug}|${pair.searchLocation}`).sort().join('~') : '';
  if (!key) return loadEligibleRows(pairs, options);
  const memoKey = `${options.shape ?? 'listing'}|${key}`;
  const memoized = rowMemo.get(memoKey);
  if (memoized && Date.now() - memoized.at < ttl) return memoized.rows;

  const flightKey = `${memoKey}#${options.maxTimeMS ?? 0}`;
  const running = inFlightRows.get(flightKey);
  if (running) return awaitFlight(running);
  if (inFlightRows.size >= MAX_UNSETTLED_ROW_READS) throw new RowReadUnavailableError('busy');

  const generation = memoGeneration;
  const controller = new AbortController();
  const flight: RowFlight = {
    startedAt: Date.now(),
    promise: loadEligibleRows(pairs, options, controller.signal).then((rows) => {
      if (generation === memoGeneration) {
        const now = Date.now();
        for (const [entryKey, entry] of rowMemo) if (now - entry.at >= ttl) rowMemo.delete(entryKey);
        rowMemo.set(memoKey, { at: now, rows });
        while (rowMemo.size > MAX_MEMO_ENTRIES) rowMemo.delete(rowMemo.keys().next().value as string);
      }
      return rows;
    })
  };
  inFlightRows.set(flightKey, flight);
  // A read still unsettled after the maximum wait is CANCELLED, not replaced: the flight stays registered until the
  // aborted operation rejects, so cancellation can never open the door to a second concurrent read.
  const cancelTimer = setTimeout(() => controller.abort(new RowReadUnavailableError('stale')), ROW_READ_MAX_WAIT_MS);
  cancelTimer.unref?.();
  const settle = () => {
    clearTimeout(cancelTimer);
    if (inFlightRows.get(flightKey) === flight) inFlightRows.delete(flightKey);
  };
  flight.promise.then(settle, settle);
  return awaitFlight(flight);
}

/** For tests and operations: drop the memo. */
// Reads already running stay registered until they settle (so a reset can never cause overlapping reads); the generation bump only stops them from refilling the memo.
export function resetStaysSearchMemo(): void {
  rowMemo.clear();
  memoGeneration += 1;
}

function ageOf(stays: readonly Stay[]): CacheAge | undefined {
  const stamps = stays.map((stay) => (stay.updatedAt ? new Date(stay.updatedAt).getTime() : NaN)).filter(Number.isFinite);
  return stamps.length > 0 ? { oldest: new Date(Math.min(...stamps)).toISOString(), newest: new Date(Math.max(...stamps)).toISOString() } : undefined;
}

export async function searchEligibleStays(request: EligibleStaysRequest = {}): Promise<EligibleStaysOutcome> {
  const { offset = 0, limit = STAYS_PAGE_SIZE, curated = [], strategy = 'auto', ...query } = request;
  const hasText = Boolean(query.q?.trim());
  const hasDestination = Boolean(query.destination?.trim());

  // Plain browse (no text, no destination, no curated list to dedupe against) on a page boundary: the
  // database-side aggregation already applies eligibility, exclusions (fail closed), dedupe, ordering and
  // pagination, and moves one page of documents instead of the whole eligible set.
  if (strategy === 'auto' && !hasText && !hasDestination && curated.length === 0 && limit > 0 && Math.max(0, offset) % limit === 0) {
    const page = await getCachedStaysCatalog({ stayType: query.stayType, page: Math.max(0, offset) / limit + 1, pageSize: limit });
    if (page.unavailable) return { status: 'unavailable', reason: page.unavailableReason ?? 'exclusions' };
    return { status: 'ok', stays: page.stays, totalCount: page.totalCount, cacheAge: ageOf(page.stays) };
  }

  let destinations: StaySearchDestination[];
  try {
    destinations = await getPublishedDestinationRefs();
  } catch (error) {
    console.error('[staysSearch] published destinations could not be loaded', error);
    return { status: 'unavailable', reason: 'catalog' };
  }

  let excluded: Set<string>;
  try {
    excluded = await getActiveExclusionSet('google');
  } catch (error) {
    if (error instanceof ExclusionLookupError) return { status: 'unavailable', reason: 'exclusions' };
    throw error;
  }

  const eligible = eligibleStayLocations(destinations.map((destination) => destination.slug));
  // A destination search without text only needs that destination's rows (the filter is re-applied below, so
  // the result is identical to scanning everything). Text searches score against every tag, so they scan all.
  const pushDown = hasDestination && !hasText;
  const pairs = pushDown ? eligiblePairsForDestination(eligible, query.destination as string, destinations) : eligible;

  let rows: LightRow[];
  try {
    rows = pairs.length > 0 ? await readEligibleRows(pairs, !pushDown) : [];
  } catch (error) {
    console.error('[staysSearch] cached stays could not be read', error);
    return { status: 'unavailable', reason: 'catalog' };
  }

  // Exclusions are applied to every request's rows (also to memoized ones), never cached.
  const candidates = groupRowsIntoCandidates(rows.filter((row) => !excluded.has(row.placeId)));
  const result = searchStayCandidates(candidates, query, destinations);
  if (result.status === 'ambiguous') return result;

  // Dedupe against curated FIRST, then count and page the combined list.
  const curatedKeys = new Set(curated.map((stay) => identityKey(stay.name, stay.formattedAddress)));
  const hits = result.hits.filter((hit) => !curatedKeys.has(identityKey(hit.candidate.name, hit.candidate.formattedAddress)));
  const start = Math.max(0, offset);
  const end = start + Math.max(0, limit);
  const curatedSlice = curated.slice(start, end);
  const googleStart = Math.max(0, start - curated.length);
  const googleEnd = Math.max(googleStart, end - curated.length);
  const slice = hits.slice(googleStart, googleEnd);
  const ids = slice.map((hit) => hit.candidate.placeId);

  let stays: Stay[] = [];
  if (ids.length > 0) {
    let full: Array<Parameters<typeof toStay>[0] & { placeId: string; rating?: number; userRatingCount?: number }>;
    try {
      await connectDB();
      full = (await PlaceCache.find({ ...eligibleLocationsMatch(pairs), placeId: { $in: ids } }).lean()) as unknown as typeof full;
    } catch (error) {
      console.error('[staysSearch] cached stay details could not be read', error);
      return { status: 'unavailable', reason: 'catalog' };
    }
    const best = new Map<string, (typeof full)[number]>();
    for (const doc of full) {
      const current = best.get(doc.placeId);
      const better =
        !current ||
        ((current.types?.length ?? 0) === 0 && (doc.types?.length ?? 0) > 0) ||
        (((current.types?.length ?? 0) > 0) === ((doc.types?.length ?? 0) > 0) && (doc.rating ?? 0) > (current.rating ?? 0));
      if (better) best.set(doc.placeId, doc);
    }
    stays = ids.flatMap((id) => {
      const doc = best.get(id);
      if (!doc) return [];
      const stayType = query.stayType === 'treehouse' ? 'treehouse' : classifyVerifiedStayType(doc.types);
      return [toStay({ ...doc, stayType })];
    });
  }

  const hitIds = new Set(hits.map((hit) => hit.candidate.placeId));
  const stamps = rows
    .filter((row) => hitIds.has(row.placeId) && row.updatedAt)
    .map((row) => new Date(row.updatedAt as Date | string).getTime())
    .filter(Number.isFinite);
  const cacheAge = stamps.length > 0 ? { oldest: new Date(Math.min(...stamps)).toISOString(), newest: new Date(Math.max(...stamps)).toISOString() } : undefined;

  return { status: 'ok', stays: [...curatedSlice, ...stays], totalCount: curated.length + hits.length, cacheAge };
}

// ---- Stay suggestions (Header Global Search) ------------------------------------------------------------

/** The most suggestions one search may return. */
export const STAY_SUGGESTION_LIMIT = 5;
/**
 * The database time limit a suggestion search puts on the eligible-row read. A cold read of the whole eligible set
 * (about 4.5k rows) measured 0.8-1.3 s from a developer machine and more from a serverless region, so the Global
 * API's 1.5 s read limit would turn many cold requests into "unavailable"; this bounds the work without doing that.
 */
export const STAY_SUGGESTION_ROW_TIME_LIMIT_MS = 5000;

export interface StaySuggestion {
  /** Stable, type-prefixed id, e.g. "stay:ChIJ...". */
  id: string;
  placeId: string;
  /** The property's public name exactly as cached. */
  name: string;
  /** The verified stay-base locality it is cached under (the destination's authored stay location), e.g. "Kaza". */
  locality: string;
  destinationSlug: string;
  destinationTitle: string;
  /** The existing public detail page. Never a listing, never a provider URL. */
  href: string;
}

export type StaySuggestionsOutcome =
  | { status: 'ok'; suggestions: StaySuggestion[]; totalCount: number }
  /** The WHOLE section is withheld: nothing is returned that could not be checked against current exclusions/publication. */
  | { status: 'unavailable'; reason: 'exclusions' | 'catalog' | 'timeout' };

export interface StaySuggestionsOptions {
  /** Database time limit for the row read. Defaults to STAY_SUGGESTION_ROW_TIME_LIMIT_MS. */
  maxTimeMS?: number;
  /**
   * The published destinations, when the caller already has them (the Global Search destinations section read the same
   * published-only set). Supplied as a function so nothing is awaited - and no rejection left unhandled - for a search that
   * reads nothing. If it fails, the whole Stays section is unavailable; it never falls back to unverified data. Omitted =
   * this function reads the published destinations itself, exactly as before.
   */
  destinations?: () => Promise<readonly StaySearchDestination[]>;
  /** Maximum suggestions, 1..STAY_SUGGESTION_LIMIT (default and ceiling 5). */
  limit?: number;
  /** Publicly listed curated stays already known to the caller; a cached stay that is an exact duplicate of one is dropped BEFORE the limit. */
  curated?: ReadonlyArray<Pick<Stay, 'name' | 'formattedAddress'>>;
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof RowReadUnavailableError) return true;
  const candidate = error as { code?: number; codeName?: string; name?: string } | null;
  // The Global Search section deadline (lib/globalSearchServer.ts) names its error DeadlineError.
  if (candidate?.name === 'DeadlineError') return true;
  return candidate?.code === 50 || candidate?.codeName === 'MaxTimeMSExpired' || /MaxTimeMSExpired/.test(String(candidate?.name ?? ''));
}

/**
 * Up to five public property suggestions for free text. Cache-only and read-only: no provider call, no photograph,
 * no write. It composes the exact primitives the /stays listing uses - published destinations, the authored
 * stay-location eligibility, the fresh exclusion list (fail closed), one candidate per real place, and the same
 * relevance scoring with its deterministic tie-breaks - so, for the same text, the suggestions are the first
 * results of searchEligibleStays. The limit is applied only after eligibility, exclusion and duplicate removal.
 */
export async function searchStaySuggestions(query: string, options: StaySuggestionsOptions = {}): Promise<StaySuggestionsOutcome> {
  const text = typeof query === 'string' ? query.trim() : '';
  // Empty or meaningless text is "no text filter" to the listing search; for suggestions it means nothing and reads nothing.
  if (!normalizeSearchText(text)) return { status: 'ok', suggestions: [], totalCount: 0 };
  const limit = Math.min(STAY_SUGGESTION_LIMIT, Math.max(1, Math.floor(options.limit ?? STAY_SUGGESTION_LIMIT)));

  // The exclusion list is requested at once (independent of everything else); if it cannot be read the whole
  // section is unavailable, whatever the other reads returned.
  const exclusionsRead = getActiveExclusionSet('google').then(
    (set) => ({ ok: true as const, set }),
    (error: unknown) => ({ ok: false as const, error })
  );

  let destinations: StaySearchDestination[];
  try {
    destinations = options.destinations ? [...(await options.destinations())] : await getPublishedDestinationRefs();
  } catch (error) {
    console.error('[staysSearch] published destinations could not be loaded', error);
    await exclusionsRead;
    return { status: 'unavailable', reason: isTimeoutError(error) ? 'timeout' : 'catalog' };
  }

  const eligible = eligibleStayLocations(destinations.map((destination) => destination.slug));
  let rows: LightRow[] = [];
  let rowsError: unknown = null;
  try {
    rows = eligible.length > 0 ? await readEligibleRows(eligible, true, { maxTimeMS: options.maxTimeMS ?? STAY_SUGGESTION_ROW_TIME_LIMIT_MS, shape: 'suggestions' }) : [];
  } catch (error) {
    rowsError = error;
  }

  const exclusions = await exclusionsRead;
  if (!exclusions.ok) {
    if (!(exclusions.error instanceof ExclusionLookupError)) throw exclusions.error;
    return { status: 'unavailable', reason: 'exclusions' };
  }
  if (rowsError) {
    console.error('[staysSearch] cached stays could not be read', rowsError);
    return { status: 'unavailable', reason: isTimeoutError(rowsError) ? 'timeout' : 'catalog' };
  }

  // Exclusions are applied to every request's rows (also memoized ones), never cached.
  const candidates = groupRowsIntoCandidates(rows.filter((row) => !exclusions.set.has(row.placeId)));
  const result = searchStayCandidates(candidates, { q: text }, destinations);
  if (result.status !== 'ok') return { status: 'ok', suggestions: [], totalCount: 0 };

  const curatedKeys = new Set((options.curated ?? []).map((stay) => identityKey(stay.name, stay.formattedAddress)));
  const hits = result.hits.filter((hit) => !curatedKeys.has(identityKey(hit.candidate.name, hit.candidate.formattedAddress)));

  const titleBySlug = new Map(destinations.map((destination) => [destination.slug, destination.title]));
  const suggestions = hits.slice(0, limit).map(({ candidate }): StaySuggestion => {
    // The eligible (destination, locality) pair the text matches best; ties break by slug so it is deterministic.
    const tag = candidate.tags
      .map((entry) => ({ entry, score: scoreStayText({ ...candidate, tags: [entry] }, text, titleBySlug) }))
      .sort((a, b) => b.score - a.score || (a.entry.destinationSlug < b.entry.destinationSlug ? -1 : a.entry.destinationSlug > b.entry.destinationSlug ? 1 : 0))[0].entry;
    return {
      id: `stay:${candidate.placeId}`,
      placeId: candidate.placeId,
      name: candidate.name,
      locality: tag.searchLocation,
      destinationSlug: tag.destinationSlug,
      destinationTitle: titleBySlug.get(tag.destinationSlug) ?? '',
      href: `/stays/property/${encodeURIComponent(candidate.placeId)}`
    };
  });
  return { status: 'ok', suggestions, totalCount: hits.length };
}
