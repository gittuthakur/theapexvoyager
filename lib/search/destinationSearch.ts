import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { fieldMatch, rankBySlugScore, regionForms, stableByScore } from '@/lib/search/matching';
import { everyTokenIsWordPrefix, expandQueryTerms, hasPhrase, normalizeSearchText, searchForms, type AliasMap } from '@/lib/search/normalize';
import type { Destination } from '@/types';

/**
 * Destination keyword search. Every searchable field is EXTRACTED FROM THE RECORD at query time —
 * no destination title, slug or id is listed anywhere in search code or configuration, so a newly
 * published or edited destination is found automatically. A record explicitly marked 'draft' is
 * refused here as defence in depth (lib/destinations.ts already loads published records only).
 *
 * Fields, strongest to weakest:
 *   title + slug  >  sub-place (places[])  >  stay-base / road-head location  >  state/region
 *   >  travel style  >  category  >  all-terms  >  description (fallback only)
 */

export type DestinationMatchReason =
  | 'title-exact'
  | 'title-prefix'
  | 'title-word'
  | 'title-partial'
  | 'place'
  | 'location'
  | 'region'
  | 'style'
  | 'category'
  | 'all-terms'
  | 'description';

export interface DestinationSearchHit {
  destination: Destination;
  score: number;
  reason: DestinationMatchReason;
}

interface DestinationSearchDoc {
  title: string[];
  places: string[];
  locations: string[];
  regions: string[];
  styles: string[];
  category: string[];
  structured: string;
  low: string;
}

/** Title substring matching is long-standing behaviour, so it stays available from two characters. */
const TITLE_PARTIAL_MIN = 2;

export function buildDestinationSearchDoc(destination: Destination): DestinationSearchDoc {
  const doc: DestinationSearchDoc = {
    title: [...searchForms(destination.title), normalizeSearchText(destination.slug)],
    places: (destination.places ?? []).flatMap((place) => searchForms(place?.title)),
    locations: [...(destination.stayBaseLocations ?? []), destination.roadHead].flatMap((value) => searchForms(value)),
    regions: [destination.state, destination.region].flatMap((value) => regionForms(value)),
    styles: (destination.travelStyles ?? []).flatMap((style) => searchForms(style)),
    category: searchForms(destination.category),
    structured: '',
    low: normalizeSearchText([destination.description, destination.editorialDescription].join(' '))
  };
  doc.structured = [doc.title, doc.places, doc.locations, doc.regions, doc.styles, doc.category].flat().join(' ');
  return doc;
}

function scoreStructured(doc: DestinationSearchDoc, terms: string[]): { score: number; reason: DestinationMatchReason } | null {
  let best: { score: number; reason: DestinationMatchReason } | null = null;
  const consider = (score: number, reason: DestinationMatchReason) => {
    if (!best || score > best.score) best = { score, reason };
  };

  for (const term of terms) {
    const compact = term.replace(/ /g, '');

    const title = fieldMatch(doc.title, term, compact, TITLE_PARTIAL_MIN);
    if (title === 'exact') consider(100, 'title-exact');
    else if (title === 'prefix') consider(90, 'title-prefix');
    else if (title === 'phrase') consider(80, 'title-word');
    else if (title === 'partial') consider(70, 'title-partial');

    const place = fieldMatch(doc.places, term, compact, null);
    if (place) consider(place === 'exact' ? 66 : place === 'prefix' ? 64 : 62, 'place');

    if (fieldMatch(doc.locations, term, compact, null)) consider(55, 'location');

    const region = fieldMatch(doc.regions, term, compact, null);
    if (region === 'exact' || region === 'prefix') consider(50, 'region');

    const style = fieldMatch(doc.styles, term, compact, null);
    if (style === 'exact' || style === 'prefix') consider(45, 'style');

    const category = fieldMatch(doc.category, term, compact, null);
    if (category === 'exact' || category === 'prefix') consider(40, 'category');

    if (term.includes(' ') && everyTokenIsWordPrefix(doc.structured, term)) consider(35, 'all-terms');
  }
  return best;
}

/**
 * Destinations matching a keyword query, strongest match first (ties keep the caller's order).
 * Returns [] for an empty query — callers treat that as "no keyword filter".
 *
 * Free-text descriptions are a FALLBACK: consulted only when no destination matches on any
 * structured field, so a marketing word in an unrelated description ("Himachal", "valley") can
 * never add noise next to genuine title/sub-place/region matches.
 */
export function searchDestinations(destinations: Destination[], query: string | undefined, aliases: AliasMap = LOCATION_ALIASES): DestinationSearchHit[] {
  const normalized = normalizeSearchText(query ?? '');
  if (!normalized) return [];
  const terms = expandQueryTerms(normalized, aliases);

  const eligible = destinations.filter((destination) => destination.status !== 'draft');
  const docs = eligible.map((destination) => ({ destination, doc: buildDestinationSearchDoc(destination) }));

  const structured: DestinationSearchHit[] = [];
  for (const { destination, doc } of docs) {
    const result = scoreStructured(doc, terms);
    if (result) structured.push({ destination, score: result.score, reason: result.reason });
  }
  if (structured.length > 0) return stableByScore(structured);

  return docs
    .filter(({ doc }) => terms.some((term) => hasPhrase(doc.low, term)))
    .map(({ destination }) => ({ destination, score: 10, reason: 'description' as const }));
}

/** slug -> relevance score for a query, computed over the FULL eligible list (see fallback note above). */
export function destinationRelevanceScores(destinations: Destination[], query: string | undefined, aliases: AliasMap = LOCATION_ALIASES): Map<string, number> {
  return new Map(searchDestinations(destinations, query, aliases).map((hit) => [hit.destination.slug, hit.score]));
}

export function rankDestinationsByRelevance(destinations: Destination[], scores: Map<string, number>): Destination[] {
  return rankBySlugScore(destinations, scores);
}
