import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { resolveDestinationByLocationText } from '@/lib/search/destinationResolver';
import { locationQueryVariants, matchFormsToTerm } from '@/lib/search/locationMatching';
import { hasPhrase, normalizeSearchText, searchForms, tokenizeSearchText, type AliasMap } from '@/lib/search/normalize';
import { classifyVerifiedStayType, hasTreehouseNameEvidence } from '@/lib/stayClassification';
import type { StayType } from '@/types/stay';

/**
 * Search over the PUBLICLY ELIGIBLE cached stays. Pure: the caller supplies candidates that already
 * passed eligibility and exclusion (lib/staysSearch.ts); nothing here reads a database or a provider.
 * Nothing is hard-coded per property: a stay is found through whatever its own record says.
 */

/** One real place, with every eligible (destination, locality) it is cached under. */
export interface StayCandidate {
  placeId: string;
  name: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  tags: Array<{ destinationSlug: string; searchLocation: string }>;
}

export interface StaySearchDestination {
  slug: string;
  title: string;
  state?: string;
}

export interface StaySearchQuery {
  /** Free text: property name, locality or destination words. */
  q?: string;
  /** Destination / stay-base locality text from the destination field. */
  destination?: string;
  stayType?: StayType;
}

export interface StaySearchHit {
  candidate: StayCandidate;
  score: number;
}

export type StaySearchResult =
  | { status: 'ok'; hits: StaySearchHit[] }
  /** The destination text names places in more than one region; nothing is chosen for the visitor. */
  | { status: 'ambiguous'; destinations: StaySearchDestination[] };

const SCORE = { nameExact: 100, namePhrase: 90, namePrefix: 80, localityExact: 70, localityPhrase: 65, destination: 60, allWords: 50, address: 40 } as const;

/** Verified type (Google `types`); "treehouse" has no structured type, so only explicit name evidence counts. */
export function matchesStayType(candidate: Pick<StayCandidate, 'name' | 'types'>, stayType: StayType | undefined): boolean {
  if (!stayType) return true;
  if (stayType === 'treehouse') return hasTreehouseNameEvidence(candidate.name);
  return classifyVerifiedStayType(candidate.types) === stayType;
}

interface Fields {
  nameForms: string[];
  localityForms: string[][];
  destinationForms: string[][];
  address: string;
}

function fieldsOf(candidate: StayCandidate, titleBySlug: Map<string, string>): Fields {
  return {
    nameForms: searchForms(candidate.name),
    localityForms: candidate.tags.map((tag) => searchForms(tag.searchLocation)),
    destinationForms: candidate.tags.map((tag) => searchForms(titleBySlug.get(tag.destinationSlug) ?? '')),
    address: normalizeSearchText(candidate.formattedAddress)
  };
}

function scoreTerm(fields: Fields, term: string): number {
  let best = 0;
  const name = matchFormsToTerm(fields.nameForms, term);
  if (name === 'exact') best = SCORE.nameExact;
  else if (name === 'phrase') best = SCORE.namePhrase;
  else if (name === 'prefix') best = SCORE.namePrefix;
  for (const forms of fields.localityForms) {
    const locality = matchFormsToTerm(forms, term);
    if (locality === 'exact') best = Math.max(best, SCORE.localityExact);
    else if (locality === 'phrase') best = Math.max(best, SCORE.localityPhrase);
  }
  for (const forms of fields.destinationForms) {
    const destination = matchFormsToTerm(forms, term);
    if (destination === 'exact' || destination === 'phrase') best = Math.max(best, SCORE.destination);
  }
  if (best === 0 && hasPhrase(fields.address, term)) best = SCORE.address;
  return best;
}

/** Relevance of one candidate for the free text, 0 = no match. A multi-word query that is not one phrase must hit with EVERY word. */
export function scoreStayText(candidate: StayCandidate, query: string, titleBySlug: Map<string, string>, aliases: AliasMap = LOCATION_ALIASES): number {
  // No text at all = no text filter; text that normalizes to nothing ("[", "<>") matches nothing, never everything.
  if (!query.trim()) return 1;
  const normalized = normalizeSearchText(query);
  if (!normalized) return 0;
  const fields = fieldsOf(candidate, titleBySlug);
  let best = 0;
  for (const term of locationQueryVariants(normalized, aliases)) best = Math.max(best, scoreTerm(fields, term));
  if (best > 0) return best;
  const words = tokenizeSearchText(normalized);
  if (words.length > 1 && words.every((word) => locationQueryVariants(word, aliases).some((variant) => scoreTerm(fields, variant) > 0))) return SCORE.allWords;
  return 0;
}

/**
 * The destination field: a published destination (deterministic resolver, aliases included) limits to that
 * destination's cached stays; otherwise the text must name a stay-base locality that is really stored on
 * eligible rows ("Bir", "Kaza", "Sangla", "Guptkashi"). Unknown text matches nothing - it never falls back
 * to "everything" and never picks the first of several candidates.
 */
function destinationFilter(
  candidates: readonly StayCandidate[],
  destination: string,
  destinations: readonly StaySearchDestination[],
  aliases: AliasMap
): StaySearchResult | StayCandidate[] {
  const resolution = resolveDestinationByLocationText(destinations, destination, aliases);
  if (resolution.status === 'resolved') {
    const slug = resolution.destination.slug;
    return candidates.filter((candidate) => candidate.tags.some((tag) => tag.destinationSlug === slug));
  }
  const terms = locationQueryVariants(destination, aliases);
  const localityMatches = (candidate: StayCandidate) =>
    candidate.tags.filter((tag) =>
      terms.some((term) => {
        const match = matchFormsToTerm(searchForms(tag.searchLocation), term);
        return match === 'exact' || match === 'phrase';
      })
    );
  const matched = candidates.filter((candidate) => localityMatches(candidate).length > 0);

  // Region isolation: one locality word that is stored for destinations in different states is ambiguous.
  const stateBySlug = new Map(destinations.map((d) => [d.slug, d.state ?? '']));
  const slugs = new Set(matched.flatMap((candidate) => localityMatches(candidate).map((tag) => tag.destinationSlug)));
  const states = new Set([...slugs].map((slug) => stateBySlug.get(slug) ?? ''));
  if (states.size > 1) return { status: 'ambiguous', destinations: destinations.filter((d) => slugs.has(d.slug)) };
  return matched;
}

/**
 * The eligible (destination, locality) pairs a destination text can possibly match - exactly the pairs
 * destinationFilter would keep rows from. Lets the data layer read ONLY those rows instead of the whole
 * catalog; the filter is applied again on what comes back, so results are identical.
 */
export function eligiblePairsForDestination<P extends { destinationSlug: string; searchLocation: string }>(
  pairs: readonly P[],
  destination: string,
  destinations: readonly StaySearchDestination[],
  aliases: AliasMap = LOCATION_ALIASES
): P[] {
  const resolution = resolveDestinationByLocationText(destinations, destination, aliases);
  if (resolution.status === 'resolved') return pairs.filter((pair) => pair.destinationSlug === resolution.destination.slug);
  const terms = locationQueryVariants(destination, aliases);
  return pairs.filter((pair) =>
    terms.some((term) => {
      const match = matchFormsToTerm(searchForms(pair.searchLocation), term);
      return match === 'exact' || match === 'phrase';
    })
  );
}

function byRelevance(a: StaySearchHit, b: StaySearchHit): number {
  return (
    b.score - a.score ||
    (b.candidate.rating ?? 0) - (a.candidate.rating ?? 0) ||
    (b.candidate.userRatingCount ?? 0) - (a.candidate.userRatingCount ?? 0) ||
    (a.candidate.placeId < b.candidate.placeId ? -1 : a.candidate.placeId > b.candidate.placeId ? 1 : 0)
  );
}

/** Filters (destination, verified type) then ranks by text relevance with a stable, deterministic order. */
export function searchStayCandidates(
  candidates: readonly StayCandidate[],
  query: StaySearchQuery,
  destinations: readonly StaySearchDestination[],
  aliases: AliasMap = LOCATION_ALIASES
): StaySearchResult {
  let pool: readonly StayCandidate[] = candidates;

  const destinationText = query.destination?.trim();
  if (destinationText) {
    const filtered = destinationFilter(pool, destinationText, destinations, aliases);
    if (!Array.isArray(filtered)) return filtered;
    pool = filtered;
  }
  if (query.stayType) pool = pool.filter((candidate) => matchesStayType(candidate, query.stayType));

  const titleBySlug = new Map(destinations.map((d) => [d.slug, d.title]));
  const hits = pool
    .map((candidate) => ({ candidate, score: query.q?.trim() ? scoreStayText(candidate, query.q, titleBySlug, aliases) : 1 }))
    .filter((hit) => hit.score > 0)
    .sort(byRelevance);
  return { status: 'ok', hits };
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  /** The requested page is beyond the last one (the result set itself is not empty). */
  outOfRange: boolean;
}

/** A page number from the URL: anything that is not a positive finite number is page 1; fractions round down. */
export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

export function paginate<T>(items: readonly T[], requestedPage: number | undefined, pageSize: number): Page<T> {
  const page = requestedPage && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const outOfRange = items.length > 0 && page > totalPages;
  return { items: outOfRange ? [] : items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount: items.length, totalPages, outOfRange };
}
