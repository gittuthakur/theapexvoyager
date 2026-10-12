import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { locationQueryVariants, matchFormsToTerm } from '@/lib/search/locationMatching';
import { regionForms, stableByScore } from '@/lib/search/matching';
import {
  hasPhrase,
  normalizeSearchText,
  searchForms,
  tokenizeSearchText,
  type AliasMap
} from '@/lib/search/normalize';
import type { TravelExpert } from '@/types/expert';

/** A published destination, reduced to what search needs. */
export interface ExpertSearchDestination {
  slug: string;
  title: string;
}

/** A real Region record (name/slug) so an expert's `regionIds` can be read as place names. */
export interface ExpertSearchRegion {
  id: string;
  name: string;
  slug?: string;
}

export interface ExpertSearchContext {
  destinations?: readonly ExpertSearchDestination[];
  regions?: readonly ExpertSearchRegion[];
  aliases?: AliasMap;
}

/**
 * Public eligibility: active AND explicitly publiclyListed. A missing `publiclyListed` is NOT
 * consent, so an unlisted or deactivated expert is never returned, even from an unfiltered list.
 */
export function isPublicExpert(expert: Pick<TravelExpert, 'active' | 'publiclyListed'>): boolean {
  return expert.active === true && expert.publiclyListed === true;
}

/** Same rules as route/destination matching: whole words, compact spelling ("mcleodganj"), safe word-starts ("trek" -> "trekking"). */
function formsMatch(forms: readonly string[], needle: string): boolean {
  return matchFormsToTerm(forms, needle) !== null;
}

function toForms(values: readonly unknown[]): string[] {
  return values.flatMap((value) => searchForms(value));
}

/** Region-name words that identify no region on their own ("Himachal Pradesh" is not found by "pradesh"). */
const GENERIC_REGION_WORDS = new Set(['pradesh', 'and']);

interface FieldGroup {
  score: number;
  forms: string[];
  /** Region group: generic words never match it. */
  region?: boolean;
}

/** Searchable fields of one expert, strongest first. Everything is derived from the stored record. */
function fieldGroups(expert: TravelExpert, context: ExpertSearchContext): FieldGroup[] {
  const linked = (context.destinations ?? []).filter((destination) => expert.destinationSlugs.includes(destination.slug));
  const regionIds = new Set(expert.regionIds ?? []);
  const regions = (context.regions ?? []).filter((region) => regionIds.has(region.id));
  return [
    { score: 100, forms: toForms([expert.name, expert.slug.replace(/-/g, ' ')]) },
    { score: 80, forms: toForms([expert.role]) },
    { score: 70, forms: toForms(expert.expertise) },
    { score: 60, forms: toForms([...linked.map((destination) => destination.title), ...expert.destinationSlugs]) },
    { score: 55, forms: toForms(expert.travelStyles) },
    { score: 40, region: true, forms: regions.flatMap((region) => [...regionForms(region.name), ...(region.slug ? searchForms(region.slug) : [])]) }
  ];
}

/**
 * Relevance of one expert for a free-text query: 0 = not a match (or not public).
 *
 * Name > role > expertise > linked destination > travel style > region; the bio is a last,
 * low-confidence fallback and only counts as a whole phrase. A multi-word query that is not one
 * phrase still matches when EVERY word hits some structured field ("himachal trekking").
 * Destination and region names are matched through the expert's real links; a place that appears
 * only in the bio is the labelled low-confidence fallback and ranks below every linked match.
 */
export function expertQueryScore(expert: TravelExpert, query: string | undefined, context: ExpertSearchContext = {}): number {
  if (!isPublicExpert(expert)) return 0;
  const normalized = normalizeSearchText(query);
  if (!normalized) return 1;

  const terms = locationQueryVariants(normalized, context.aliases ?? LOCATION_ALIASES);
  const groups = fieldGroups(expert, context);

  let best = 0;
  for (const term of terms) {
    for (const group of groups) {
      if (group.region && GENERIC_REGION_WORDS.has(term)) continue;
      if (group.score > best && formsMatch(group.forms, term)) best = group.score;
    }
  }
  if (best > 0) return best;

  const words = tokenizeSearchText(normalized);
  if (words.length > 1) {
    const everyWordHits = words.every((word) =>
      locationQueryVariants(word, context.aliases ?? LOCATION_ALIASES).some((variant) => groups.some((group) => !(group.region && GENERIC_REGION_WORDS.has(variant)) && formsMatch(group.forms, variant)))
    );
    if (everyWordHits) return 30;
  }

  return hasPhrase(normalizeSearchText(expert.bio), normalized) ? 10 : 0;
}

export function matchesExpertQuery(expert: TravelExpert, query: string | undefined, context: ExpertSearchContext = {}): boolean {
  return expertQueryScore(expert, query, context) > 0;
}

/** Public experts matching `query`, most relevant first; catalog order is kept among equals. An empty query returns every public expert. */
export function searchExperts(experts: readonly TravelExpert[], query: string | undefined, context: ExpertSearchContext = {}): TravelExpert[] {
  return stableByScore(experts.map((expert) => ({ expert, score: expertQueryScore(expert, query, context) })).filter((hit) => hit.score > 0)).map(
    (hit) => hit.expert
  );
}
