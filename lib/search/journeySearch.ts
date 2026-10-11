import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { getRegionForState } from '@/lib/regions';
import {
  compactSearchText,
  everyTokenIsWordPrefix,
  expandQueryTerms,
  hasPhrase,
  normalizeSearchText,
  searchForms,
  startsWithPhrase,
  type AliasMap
} from '@/lib/search/normalize';
import type { Destination, TravelPackage } from '@/types';

/**
 * Journey keyword search.
 *
 * Every searchable field is EXTRACTED FROM THE RECORD at query time — nothing here lists
 * individual journey titles, slugs, ids or destinations. A newly published journey, an edited
 * title, a newly linked destination, a new itinerary stop or a changed category is therefore
 * found with no change to search code or configuration. Eligibility is whatever the caller's
 * loader returned (lib/packages.ts returns published journeys only); a record explicitly marked
 * 'draft' is also refused here as defence in depth.
 *
 * Fields, strongest to weakest:
 *   title/name + slug  >  destination text  >  linked destination (title/slug)
 *   >  itinerary stop  >  start/end city  >  category  >  region  >  all-terms  >  description
 *
 * An "itinerary stop" is a PUBLISHED catalog destination whose name appears as a whole phrase in
 * one of the journey's structured itinerary day titles. Relationships are never invented: a stop
 * exists only when the stored itinerary text actually names a catalog destination.
 */

export type JourneyMatchReason =
  | 'title-exact'
  | 'title-prefix'
  | 'title-word'
  | 'title-partial'
  | 'destination-text'
  | 'linked-destination'
  | 'itinerary-stop'
  | 'city'
  | 'category'
  | 'region'
  | 'all-terms'
  | 'description';

export interface JourneySearchHit {
  pkg: TravelPackage;
  score: number;
  reason: JourneyMatchReason;
}

interface JourneySearchDoc {
  title: string[];
  destinationText: string[];
  linked: string[];
  stops: string[];
  cities: string[];
  category: string[];
  regions: string[];
  /** Everything structured, joined — used only for multi-word "all terms present" matching. */
  structured: string;
  /** Free text (descriptions, highlights, itinerary prose) — lowest confidence, fallback only. */
  low: string;
}

/** Region-name words that identify nothing on their own ("pradesh"), so they are not search forms. */
const GENERIC_REGION_WORDS = new Set(['pradesh', 'and']);

function regionForms(name: string): string[] {
  const full = normalizeSearchText(name);
  const parts = full.split(' ').filter((word) => word.length >= 4 && !GENERIC_REGION_WORDS.has(word));
  return [full, ...parts];
}

/**
 * Built fresh on every search on purpose (no cache): the catalog is small, and a cache keyed on a
 * record could serve stale text after an edit, which would defeat "updates are reflected automatically".
 */
export function buildJourneySearchDoc(pkg: TravelPackage, destinationsBySlug: Map<string, Destination>): JourneySearchDoc {
  const linkedDestinations = (pkg.destinationSlugs ?? [])
    .map((slug) => destinationsBySlug.get(slug))
    .filter((destination): destination is Destination => Boolean(destination));

  const linked = linkedDestinations.flatMap((destination) => [...searchForms(destination.title), normalizeSearchText(destination.slug)]);

  const dayTitles = (pkg.itinerary ?? []).map((day) => normalizeSearchText(day.title));
  const stops: string[] = [];
  for (const destination of destinationsBySlug.values()) {
    const forms = searchForms(destination.title).filter((form) => form.length >= 3);
    if (forms.some((form) => dayTitles.some((title) => hasPhrase(title, form)))) {
      stops.push(...searchForms(destination.title), normalizeSearchText(destination.slug));
    }
  }

  const regions = [...new Set(linkedDestinations.map((destination) => getRegionForState(destination.state)?.name).filter((name): name is string => Boolean(name)))].flatMap(regionForms);

  const doc: JourneySearchDoc = {
    title: [...searchForms(pkg.name), normalizeSearchText(pkg.slug)],
    destinationText: searchForms(pkg.destination),
    linked,
    stops,
    cities: [...searchForms(pkg.startingCity), ...searchForms(pkg.endingCity)],
    category: searchForms(pkg.category),
    regions,
    structured: '',
    low: normalizeSearchText([pkg.shortDescription, ...(pkg.highlights ?? []), ...(pkg.itinerary ?? []).map((day) => day.description)].join(' '))
  };
  doc.structured = [doc.title, doc.destinationText, doc.linked, doc.stops, doc.cities, doc.category, doc.regions].flat().join(' ');
  return doc;
}

type FieldMatch = 'exact' | 'prefix' | 'phrase' | 'partial' | null;

/** How well one query term matches the best of a field's forms. */
function fieldMatch(forms: string[], term: string, compactTerm: string, allowPartial: boolean): FieldMatch {
  let best: FieldMatch = null;
  const rank: Record<Exclude<FieldMatch, null>, number> = { exact: 4, prefix: 3, phrase: 2, partial: 1 };
  for (const form of forms) {
    let current: FieldMatch = null;
    if (form === term || (compactTerm.length >= 4 && compactSearchText(form) === compactTerm)) current = 'exact';
    else if (startsWithPhrase(form, term)) current = 'prefix';
    else if (hasPhrase(form, term)) current = 'phrase';
    else if (allowPartial && term.length >= 3 && form.includes(term)) current = 'partial';
    if (current && (!best || rank[current] > rank[best])) best = current;
  }
  return best;
}

function scoreStructured(doc: JourneySearchDoc, terms: string[]): { score: number; reason: JourneyMatchReason } | null {
  let best: { score: number; reason: JourneyMatchReason } | null = null;
  const consider = (score: number, reason: JourneyMatchReason) => {
    if (!best || score > best.score) best = { score, reason };
  };

  for (const term of terms) {
    const compact = term.replace(/ /g, '');

    const title = fieldMatch(doc.title, term, compact, true);
    if (title === 'exact') consider(100, 'title-exact');
    else if (title === 'prefix') consider(90, 'title-prefix');
    else if (title === 'phrase') consider(80, 'title-word');
    else if (title === 'partial') consider(70, 'title-partial');

    if (fieldMatch(doc.destinationText, term, compact, true)) consider(65, 'destination-text');

    const linked = fieldMatch(doc.linked, term, compact, false);
    if (linked) consider(linked === 'exact' ? 62 : linked === 'prefix' ? 60 : 58, 'linked-destination');

    const stop = fieldMatch(doc.stops, term, compact, false);
    if (stop) consider(stop === 'exact' ? 57 : stop === 'prefix' ? 55 : 53, 'itinerary-stop');

    if (fieldMatch(doc.cities, term, compact, false)) consider(50, 'city');

    const category = fieldMatch(doc.category, term, compact, false);
    if (category === 'exact' || category === 'prefix') consider(45, 'category');

    const region = fieldMatch(doc.regions, term, compact, false);
    if (region === 'exact' || region === 'prefix') consider(40, 'region');

    if (term.includes(' ') && everyTokenIsWordPrefix(doc.structured, term)) consider(35, 'all-terms');
  }
  return best;
}

/**
 * Journeys matching a keyword query, strongest match first (ties keep the caller's order).
 * Returns [] for an empty query — callers treat that as "no keyword filter".
 *
 * Free-text descriptions are a FALLBACK: they are consulted only when no journey matches on any
 * structured field, so a generic marketing word ("adventure", "himalayan") can never add
 * unrelated journeys next to genuine title/destination/category matches.
 */
export function searchPackages(
  packages: TravelPackage[],
  query: string | undefined,
  destinationsBySlug: Map<string, Destination>,
  aliases: AliasMap = LOCATION_ALIASES
): JourneySearchHit[] {
  const normalized = normalizeSearchText(query ?? '');
  if (!normalized) return [];
  const terms = expandQueryTerms(normalized, aliases);

  const eligible = packages.filter((pkg) => pkg.status !== 'draft');
  const structured: JourneySearchHit[] = [];
  eligible.forEach((pkg) => {
    const result = scoreStructured(buildJourneySearchDoc(pkg, destinationsBySlug), terms);
    if (result) structured.push({ pkg, score: result.score, reason: result.reason });
  });
  if (structured.length > 0) return stableByScore(structured);

  const fallback: JourneySearchHit[] = [];
  eligible.forEach((pkg) => {
    const doc = buildJourneySearchDoc(pkg, destinationsBySlug);
    if (terms.some((term) => hasPhrase(doc.low, term))) fallback.push({ pkg, score: 10, reason: 'description' });
  });
  return fallback;
}

function stableByScore(hits: JourneySearchHit[]): JourneySearchHit[] {
  return hits.map((hit, index) => ({ hit, index })).sort((a, b) => b.hit.score - a.hit.score || a.index - b.index).map(({ hit }) => hit);
}

/** slug -> relevance score for a query, computed over the FULL eligible list (see fallback note above). */
export function relevanceScores(
  packages: TravelPackage[],
  query: string | undefined,
  destinationsBySlug: Map<string, Destination>,
  aliases: AliasMap = LOCATION_ALIASES
): Map<string, number> {
  return new Map(searchPackages(packages, query, destinationsBySlug, aliases).map((hit) => [hit.pkg.slug, hit.score]));
}

/** Stable sort by relevance (highest first); items without a score keep their relative order last. */
export function rankByRelevance(packages: TravelPackage[], scores: Map<string, number>): TravelPackage[] {
  return packages
    .map((pkg, index) => ({ pkg, index, score: scores.get(pkg.slug) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ pkg }) => pkg);
}
