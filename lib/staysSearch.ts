import { connectDB } from '@/lib/mongodb';
import { PlaceCache } from '@/models/PlaceCache';
import { getPublishedDestinationRefs } from '@/lib/destinations';
import { getCachedStaysCatalog, toStay } from '@/lib/stays';
import { identityKey } from '@/lib/stayMerge';
import { classifyVerifiedStayType } from '@/lib/stayClassification';
import { eligibleLocationsMatch, eligibleStayLocations, type EligibleStayLocation } from '@/lib/staysEligibility';
import {
  eligiblePairsForDestination,
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
  updatedAt?: Date | string;
}

const LIGHT_PROJECTION = { placeId: 1, name: 1, destinationSlug: 1, searchLocation: 1, formattedAddress: 1, rating: 1, userRatingCount: 1, types: 1, updatedAt: 1 };

/**
 * The row that represents a real place when it is cached more than once: the same rule the database-side
 * aggregation uses (typed row first, then rating, review count, placeId), so every search surface orders
 * and describes a duplicated place identically.
 */
function betterRepresentative(candidate: LightRow, current: LightRow): boolean {
  const typed = (row: LightRow) => ((row.types?.length ?? 0) > 0 ? 1 : 0);
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
let rowMemo: { key: string; at: number; rows: LightRow[] } | null = null;

function rowMemoMs(): number {
  const configured = Number(process.env.STAYS_SEARCH_ROW_MEMO_MS);
  return process.env.STAYS_SEARCH_ROW_MEMO_MS !== undefined && Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_ROW_MEMO_MS;
}

async function readEligibleRows(pairs: readonly EligibleStayLocation[], memoizable: boolean): Promise<LightRow[]> {
  const ttl = rowMemoMs();
  // The key is the exact eligible-pair set, so unpublishing a destination (or an edited stay rule) is a memo miss at once.
  const key = memoizable && ttl > 0 ? pairs.map((pair) => `${pair.destinationSlug}|${pair.searchLocation}`).sort().join('~') : '';
  if (key && rowMemo && rowMemo.key === key && Date.now() - rowMemo.at < ttl) return rowMemo.rows;
  await connectDB();
  const rows = (await PlaceCache.find(eligibleLocationsMatch(pairs), LIGHT_PROJECTION).lean()) as unknown as LightRow[];
  if (key) rowMemo = { key, at: Date.now(), rows };
  return rows;
}

/** For tests and operations: drop the memo. */
export function resetStaysSearchMemo(): void {
  rowMemo = null;
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
