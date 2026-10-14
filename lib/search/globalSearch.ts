import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { searchDestinations } from '@/lib/search/destinationSearch';
import { searchExperiences, type RelatedDestinationRef } from '@/lib/search/experienceSearch';
import { searchExperts } from '@/lib/search/expertSearch';
import { searchPackages } from '@/lib/search/journeySearch';
import { locationQueryVariants, matchFormsToTerm } from '@/lib/search/locationMatching';
import { regionForms } from '@/lib/search/matching';
import { hasPhrase, normalizeSearchText, searchForms, type AliasMap } from '@/lib/search/normalize';
import type { Destination, TravelPackage } from '@/types';
import type { Experience } from '@/types/experience';
import type { TravelExpert } from '@/types/expert';

/**
 * Global Search, Stage 1: the pure ranking + grouping layer. No database, no provider, no network.
 *
 * Every section DELEGATES to the module-level search that already owns that catalog's rules
 * (destinations, journeys, experiences - P1/P2; experts and location aliases - P3). Nothing here
 * re-implements eligibility: callers pass records from the loaders that already return only public
 * records (published destinations/journeys/regions, active AND publiclyListed experts), and the module
 * searches additionally refuse a record marked draft. Nothing is listed by name, slug or id anywhere:
 * every field is read from the record, so a new, renamed or unpublished record needs no search change.
 */

export const GLOBAL_SEARCH_LIMITS = { minQueryLength: 2, maxQueryLength: 80, perSection: 5 } as const;

export type GlobalSearchSectionKey = 'destinations' | 'regions' | 'journeys' | 'experiences' | 'stays' | 'experts';
export const GLOBAL_SEARCH_SECTION_ORDER: readonly GlobalSearchSectionKey[] = ['destinations', 'regions', 'journeys', 'experiences', 'stays', 'experts'];

export interface GlobalSearchItem {
  /** Stable, type-prefixed id, e.g. "journey:kinnaur-spiti-circuit". */
  id: string;
  type: 'destination' | 'region' | 'journey' | 'experience' | 'stay' | 'expert';
  title: string;
  subtitle?: string;
  /** The record's own page - never a generic listing (a stay's is its public property page). */
  href: string;
  image?: string;
  /** Why it matched (the owning module's reason), strongest first: exact / prefix / word / location / ... / description. */
  reason: string;
}

// ---- query parsing ---------------------------------------------------------------------------------------

export type ParsedGlobalQuery =
  | { ok: true; query: string; normalized: string; meaningless: boolean }
  | { ok: false; status: 400; code: 'QUERY_REQUIRED' | 'QUERY_TOO_SHORT' | 'QUERY_TOO_LONG' | 'QUERY_INVALID' };

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

/**
 * Validates and normalizes the raw `q` value. Whitespace is collapsed; control characters are rejected;
 * length is counted in characters (2..80). Text that is valid but normalizes to nothing useful ("[[", "()")
 * is `meaningless`: it is answered with empty sections without touching any data source.
 */
export function parseGlobalSearchQuery(raw: unknown): ParsedGlobalQuery {
  if (typeof raw !== 'string') return { ok: false, status: 400, code: 'QUERY_REQUIRED' };
  // A hard ceiling before any processing, so a huge value never reaches the normalizer.
  if (raw.length > GLOBAL_SEARCH_LIMITS.maxQueryLength * 4) return { ok: false, status: 400, code: 'QUERY_TOO_LONG' };
  if (CONTROL_CHARACTERS.test(raw)) return { ok: false, status: 400, code: 'QUERY_INVALID' };
  const query = raw.replace(/\s+/g, ' ').trim();
  const length = Array.from(query).length;
  if (length === 0) return { ok: false, status: 400, code: 'QUERY_REQUIRED' };
  if (length < GLOBAL_SEARCH_LIMITS.minQueryLength) return { ok: false, status: 400, code: 'QUERY_TOO_SHORT' };
  if (length > GLOBAL_SEARCH_LIMITS.maxQueryLength) return { ok: false, status: 400, code: 'QUERY_TOO_LONG' };
  const normalized = normalizeSearchText(query);
  return { ok: true, query, normalized, meaningless: normalized.length < GLOBAL_SEARCH_LIMITS.minQueryLength };
}

// ---- sections --------------------------------------------------------------------------------------------

const cap = <T>(items: T[]): T[] => items.slice(0, GLOBAL_SEARCH_LIMITS.perSection);
const clip = (text: string | undefined, max = 120): string | undefined => {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat || undefined;
};

export function destinationSection(destinations: Destination[], query: string, aliases: AliasMap = LOCATION_ALIASES): GlobalSearchItem[] {
  return cap(searchDestinations(destinations, query, aliases)).map(({ destination, reason }) => ({
    id: `destination:${destination.slug}`,
    type: 'destination' as const,
    title: destination.title,
    subtitle: [destination.region, destination.state].filter(Boolean).join(', ') || undefined,
    href: `/destinations/${destination.slug}`,
    image: destination.image,
    reason
  }));
}

export function journeySection(packages: TravelPackage[], destinations: readonly Pick<Destination, 'slug' | 'title' | 'state'>[], query: string, aliases: AliasMap = LOCATION_ALIASES): GlobalSearchItem[] {
  const bySlug = new Map(destinations.map((destination) => [destination.slug, destination]));
  return cap(searchPackages(packages, query, bySlug, aliases)).map(({ pkg, reason }) => ({
    id: `journey:${pkg.slug}`,
    type: 'journey' as const,
    title: pkg.name,
    subtitle: [pkg.destination, pkg.duration].filter(Boolean).join(' · ') || undefined,
    href: `/journeys/${pkg.slug}`,
    image: pkg.image,
    reason
  }));
}

export function experienceSection(experiences: Experience[], destinations: readonly RelatedDestinationRef[], query: string, aliases: AliasMap = LOCATION_ALIASES): GlobalSearchItem[] {
  return cap(searchExperiences(experiences, query, destinations, aliases)).map(({ experience, reason }) => ({
    id: `experience:${experience.slug}`,
    type: 'experience' as const,
    title: experience.title,
    subtitle: [experience.location, experience.subCategory].filter(Boolean).join(' · ') || undefined,
    href: `/experiences/${experience.slug}`,
    image: experience.image,
    reason
  }));
}

export interface RegionRef {
  /** The Region document id (as a string) - what an expert's `regionIds` refer to. */
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  image?: string;
}

const REGION_SCORE = { exact: 100, phrase: 90, prefix: 80, description: 10 } as const;
/** Region-name words that identify no region on their own ("Himachal Pradesh" is not found by "pradesh"). */
const GENERIC_REGION_WORDS = new Set(['pradesh', 'and']);

/** Published regions, strongest first: exact name / short name / slug, whole phrase, word-start; the description only as a fallback. */
export function regionSection(regions: readonly RegionRef[], query: string, aliases: AliasMap = LOCATION_ALIASES): GlobalSearchItem[] {
  const terms = locationQueryVariants(query, aliases).filter((term) => !GENERIC_REGION_WORDS.has(term));
  if (terms.length === 0) return [];
  const structured: Array<{ region: RegionRef; score: number; reason: string; index: number }> = [];
  regions.forEach((region, index) => {
    const forms = [...searchForms(region.name), ...regionForms(region.name), ...searchForms(region.slug)];
    let best: { score: number; reason: string } | null = null;
    for (const term of terms) {
      const match = matchFormsToTerm(forms, term);
      if (!match) continue;
      const score = REGION_SCORE[match];
      if (!best || score > best.score) best = { score, reason: match === 'exact' ? 'title-exact' : match === 'phrase' ? 'title-word' : 'title-prefix' };
    }
    if (best) structured.push({ region, ...best, index });
  });
  let hits = structured;
  if (hits.length === 0) {
    const fallback: typeof structured = [];
    regions.forEach((region, index) => {
      const description = normalizeSearchText(region.shortDescription);
      if (terms.some((term) => hasPhrase(description, term))) fallback.push({ region, score: REGION_SCORE.description, reason: 'description', index });
    });
    hits = fallback;
  }
  return cap(hits.sort((a, b) => b.score - a.score || a.index - b.index)).map(({ region, reason }) => ({
    id: `region:${region.slug}`,
    type: 'region' as const,
    title: region.name,
    subtitle: clip(region.shortDescription),
    href: `/regions/${region.slug}`,
    image: region.image,
    reason
  }));
}

/**
 * Travel experts: only active AND publiclyListed experts can ever be returned (enforced again by the expert
 * search itself). Linked destinations and regions are resolved from the same published catalogs the other
 * sections use, so an expert is never associated with a place their record does not link to.
 */
export function expertSection(
  experts: TravelExpert[],
  destinations: readonly { slug: string; title: string }[],
  regions: readonly RegionRef[],
  query: string,
  aliases: AliasMap = LOCATION_ALIASES
): GlobalSearchItem[] {
  return cap(searchExperts(experts, query, { destinations, regions, aliases })).map((expert) => ({
    id: `expert:${expert.slug}`,
    type: 'expert' as const,
    title: expert.name,
    subtitle: clip(expert.role),
    href: `/experts/${expert.slug}`,
    image: expert.profileImage,
    reason: 'expert'
  }));
}

/**
 * What a stay suggestion must provide to become a row. Structural on purpose: this pure layer never imports the
 * server-only stays module, and a suggestion already carries ONLY public fields (name, verified locality,
 * destination title, public property URL) - never a rating, price, availability, photograph or provider URL.
 */
export interface StaySuggestionRow {
  placeId: string;
  name: string;
  locality: string;
  destinationTitle: string;
  href: string;
}

/**
 * Stays: the suggestions arrive already eligible (published destination + authored stay location, fresh exclusions),
 * ranked with the listing's own relevance rules and de-duplicated by place. Here they are only shaped into rows,
 * de-duplicated once more by identity and capped. No image is attached: a stay's photograph would come from the paid
 * photo proxy, so the row shows the neutral stay icon instead.
 */
export function staySection(suggestions: readonly StaySuggestionRow[]): GlobalSearchItem[] {
  const seen = new Set<string>();
  const unique = suggestions.filter((suggestion) => {
    if (seen.has(suggestion.placeId)) return false;
    seen.add(suggestion.placeId);
    return true;
  });
  return cap(unique).map((suggestion) => {
    const places: string[] = [];
    for (const place of [suggestion.locality, suggestion.destinationTitle]) {
      if (place && !places.some((existing) => existing.toLowerCase() === place.toLowerCase())) places.push(place);
    }
    return {
      id: `stay:${suggestion.placeId}`,
      type: 'stay' as const,
      title: suggestion.name,
      subtitle: places.join(', ') || undefined,
      href: suggestion.href,
      reason: 'stay'
    };
  });
}
