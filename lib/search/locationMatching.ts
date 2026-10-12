import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { listForms } from '@/lib/search/matching';
import {
  compactSearchText,
  everyTokenIsWordPrefix,
  hasPhrase,
  normalizeSearchText,
  tokenizeSearchText,
  type AliasMap
} from '@/lib/search/normalize';

/**
 * Place-name matching shared by Transport routes, destination resolution and Travel Expert
 * search. Pure: no catalog data, no I/O.
 *
 * It decides whether TEXT a visitor typed refers to the SAME place as text stored on a record. It
 * never relates two different places: a nearby town, a containing region or an airport that has
 * no record of its own is not a match. Aliases (config/searchAliases.config.ts) are alternative
 * SPELLINGS of one place and are applied in both directions.
 */

export type LocationMatch = 'exact' | 'phrase' | 'prefix' | null;

const RANK: Record<Exclude<LocationMatch, null>, number> = { exact: 3, phrase: 2, prefix: 1 };

/** Shortest query accepted for the word-prefix rule ("kin" -> "kinnaur"); shorter input matches whole words only. */
const MIN_PREFIX_LENGTH = 3;

/** The normalized query plus every explicit alias spelling of it (alias -> canonical AND canonical -> alias). */
export function locationQueryVariants(query: unknown, aliases: AliasMap = LOCATION_ALIASES): string[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [];
  const variants = new Set<string>([needle]);
  for (const target of aliases[needle] ?? []) {
    const normalized = normalizeSearchText(target);
    if (normalized) variants.add(normalized);
  }
  for (const [alias, targets] of Object.entries(aliases)) {
    if (targets.some((target) => normalizeSearchText(target) === needle)) variants.add(alias);
  }
  return [...variants];
}

/** "mcleodganj" is "mcleod"+"ganj": the compact term equals a run of whole consecutive words. */
function compactRunMatches(form: string, compactTerm: string): boolean {
  if (compactTerm.length < 4) return false;
  const words = tokenizeSearchText(form);
  for (let start = 0; start < words.length; start++) {
    let joined = '';
    for (let end = start; end < words.length && joined.length < compactTerm.length; end++) {
      joined += words[end];
      if (joined === compactTerm) return true;
    }
  }
  return false;
}

/**
 * How well ONE normalized term identifies a place, given the normalized forms of the stored text.
 * Shared by every search surface so spelling rules (compact "mcleodganj", word-starts) never diverge.
 */
export function matchFormsToTerm(forms: readonly string[], term: string): LocationMatch {
  const compactTerm = compactSearchText(term);
  let best: LocationMatch = null;
  for (const form of forms) {
    let current: LocationMatch = null;
    if (form === term || (compactTerm.length >= 4 && compactSearchText(form) === compactTerm)) current = 'exact';
    else if (hasPhrase(form, term) || compactRunMatches(form, compactTerm)) current = 'phrase';
    else if (term.length >= MIN_PREFIX_LENGTH && everyTokenIsWordPrefix(form, term)) current = 'prefix';
    if (current && (!best || RANK[current] > RANK[best])) best = current;
  }
  return best;
}

/** How well `query` identifies the place named by `stored` ("Kaza, Spiti Valley" is searchable by either part). */
export function matchLocation(stored: unknown, query: unknown, aliases: AliasMap = LOCATION_ALIASES): LocationMatch {
  const terms = locationQueryVariants(query, aliases);
  if (terms.length === 0) return null;
  const forms = listForms(stored);
  let best: LocationMatch = null;
  for (const term of terms) {
    const current = matchFormsToTerm(forms, term);
    if (current && (!best || RANK[current] > RANK[best])) best = current;
  }
  return best;
}

export function matchesLocation(stored: unknown, query: unknown, aliases: AliasMap = LOCATION_ALIASES): boolean {
  return matchLocation(stored, query, aliases) !== null;
}
