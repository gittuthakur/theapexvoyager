import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { fieldMatch, listForms, rankBySlugScore, regionForms, stableByScore } from '@/lib/search/matching';
import { everyTokenIsWordPrefix, expandQueryTerms, hasPhrase, normalizeSearchText, searchForms, type AliasMap } from '@/lib/search/normalize';
import type { Experience } from '@/types/experience';

/**
 * Experience keyword search. Every searchable field is EXTRACTED FROM THE RECORD at query time -
 * nothing here lists experience titles, slugs or ids, so a new or edited experience is found
 * automatically.
 *
 * Destination relationships are NEVER invented or stored: an experience relates to a published
 * destination only when that destination's title (the same rule lib/experiences.ts
 * filterExperiencesByDestinationTitle already uses for destination pages) appears as a whole
 * phrase in the experience's own `location` text. Callers pass a minimal destination list; with
 * none, only the experience's own fields are searched.
 *
 * Fields, strongest to weakest:
 *   title + slug  >  location  >  related destination  >  category/sub-category  >  region
 *   >  mood  >  all-terms  >  highlights + descriptions
 *   (fallback only: a highlight like "quieter than Gulmarg or Pahalgam" names a place in passing,
 *   so it must not add noise next to real matches)
 */

export type ExperienceMatchReason =
  | 'title-exact'
  | 'title-prefix'
  | 'title-word'
  | 'title-partial'
  | 'location'
  | 'destination'
  | 'category'
  | 'region'
  | 'mood'
  | 'all-terms'
  | 'description';

export interface ExperienceSearchHit {
  experience: Experience;
  score: number;
  reason: ExperienceMatchReason;
}

/** The only destination fields search reads - keeps the payload sent to the browser small. */
export interface RelatedDestinationRef {
  slug: string;
  title: string;
  state?: string;
}

interface ExperienceSearchDoc {
  title: string[];
  locations: string[];
  destinations: string[];
  category: string[];
  regions: string[];
  mood: string[];
  structured: string;
  low: string;
}

const TITLE_PARTIAL_MIN = 2;

export function buildExperienceSearchDoc(experience: Experience, destinations: readonly RelatedDestinationRef[] = []): ExperienceSearchDoc {
  const locationText = normalizeSearchText(experience.location);
  const related = destinations.filter((destination) => searchForms(destination.title).some((form) => form.length >= 3 && hasPhrase(locationText, form)));

  const doc: ExperienceSearchDoc = {
    title: [...searchForms(experience.title), normalizeSearchText(experience.slug)],
    locations: listForms(experience.location),
    destinations: related.flatMap((destination) => [...searchForms(destination.title), normalizeSearchText(destination.slug)]),
    category: [experience.category, experience.subCategory].flatMap((value) => searchForms(value)),
    regions: regionForms(experience.region),
    mood: searchForms(experience.mood),
    structured: '',
    low: normalizeSearchText([experience.shortDescription, ...(experience.highlights ?? []), experience.description].join(' '))
  };
  doc.structured = [doc.title, doc.locations, doc.destinations, doc.category, doc.regions, doc.mood].flat().join(' ');
  return doc;
}

function scoreStructured(doc: ExperienceSearchDoc, terms: string[]): { score: number; reason: ExperienceMatchReason } | null {
  let best: { score: number; reason: ExperienceMatchReason } | null = null;
  const consider = (score: number, reason: ExperienceMatchReason) => {
    if (!best || score > best.score) best = { score, reason };
  };

  for (const term of terms) {
    const compact = term.replace(/ /g, '');

    const title = fieldMatch(doc.title, term, compact, TITLE_PARTIAL_MIN);
    if (title === 'exact') consider(100, 'title-exact');
    else if (title === 'prefix') consider(90, 'title-prefix');
    else if (title === 'phrase') consider(80, 'title-word');
    else if (title === 'partial') consider(70, 'title-partial');

    const location = fieldMatch(doc.locations, term, compact, TITLE_PARTIAL_MIN);
    if (location) consider(location === 'exact' ? 66 : location === 'prefix' ? 64 : 62, 'location');

    if (fieldMatch(doc.destinations, term, compact, null)) consider(58, 'destination');

    const category = fieldMatch(doc.category, term, compact, null);
    if (category === 'exact' || category === 'prefix') consider(52, 'category');

    const region = fieldMatch(doc.regions, term, compact, null);
    if (region === 'exact' || region === 'prefix') consider(46, 'region');

    const mood = fieldMatch(doc.mood, term, compact, null);
    if (mood === 'exact' || mood === 'prefix') consider(42, 'mood');


    if (term.includes(' ') && everyTokenIsWordPrefix(doc.structured, term)) consider(35, 'all-terms');
  }
  return best;
}

/**
 * Experiences matching a keyword query, strongest match first (ties keep the caller's order).
 * Returns [] for an empty query. Descriptions and highlights are a FALLBACK, consulted only when no experience
 * matches on any structured field.
 */
export function searchExperiences(
  experiences: Experience[],
  query: string | undefined,
  destinations: readonly RelatedDestinationRef[] = [],
  aliases: AliasMap = LOCATION_ALIASES
): ExperienceSearchHit[] {
  const normalized = normalizeSearchText(query ?? '');
  if (!normalized) return [];
  const terms = expandQueryTerms(normalized, aliases);

  const eligible = experiences.filter((experience) => (experience as { status?: string }).status !== 'draft');
  const docs = eligible.map((experience) => ({ experience, doc: buildExperienceSearchDoc(experience, destinations) }));

  const structured: ExperienceSearchHit[] = [];
  for (const { experience, doc } of docs) {
    const result = scoreStructured(doc, terms);
    if (result) structured.push({ experience, score: result.score, reason: result.reason });
  }
  if (structured.length > 0) return stableByScore(structured);

  return docs
    .filter(({ doc }) => terms.some((term) => hasPhrase(doc.low, term)))
    .map(({ experience }) => ({ experience, score: 10, reason: 'description' as const }));
}

export function experienceRelevanceScores(
  experiences: Experience[],
  query: string | undefined,
  destinations: readonly RelatedDestinationRef[] = [],
  aliases: AliasMap = LOCATION_ALIASES
): Map<string, number> {
  return new Map(searchExperiences(experiences, query, destinations, aliases).map((hit) => [hit.experience.slug, hit.score]));
}

export function rankExperiencesByRelevance(experiences: Experience[], scores: Map<string, number>): Experience[] {
  return rankBySlugScore(experiences, scores);
}


