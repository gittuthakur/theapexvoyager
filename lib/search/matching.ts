import { compactSearchText, hasPhrase, normalizeSearchText, searchForms, startsWithPhrase } from '@/lib/search/normalize';

/**
 * Field-matching primitives shared by the Destination and Experience search modules. Pure: no
 * catalog data, no I/O. (Journey search keeps its own copy of this logic, deliberately untouched.)
 */

export type FieldMatch = 'exact' | 'prefix' | 'phrase' | 'partial' | null;

const RANK: Record<Exclude<FieldMatch, null>, number> = { exact: 4, prefix: 3, phrase: 2, partial: 1 };

/** How well one normalized query term matches the best of a field's normalized forms. */
export function fieldMatch(forms: readonly string[], term: string, compactTerm: string, minPartialLength: number | null): FieldMatch {
  let best: FieldMatch = null;
  for (const form of forms) {
    let current: FieldMatch = null;
    if (form === term || (compactTerm.length >= 4 && compactSearchText(form) === compactTerm)) current = 'exact';
    else if (startsWithPhrase(form, term)) current = 'prefix';
    else if (hasPhrase(form, term)) current = 'phrase';
    else if (minPartialLength !== null && term.length >= minPartialLength && form.includes(term)) current = 'partial';
    if (current && (!best || RANK[current] > RANK[best])) best = current;
  }
  return best;
}

/** Region-name words that identify nothing on their own ("pradesh"), so they are not search forms. */
const GENERIC_REGION_WORDS = new Set(['pradesh', 'and']);

/** "Jammu & Kashmir" -> ["jammu and kashmir", "jammu", "kashmir"] — derived from the stored name only. */
export function regionForms(name: unknown): string[] {
  const full = normalizeSearchText(name);
  if (!full) return [];
  return [full, ...full.split(' ').filter((word) => word.length >= 4 && !GENERIC_REGION_WORDS.has(word))];
}

/** Forms of a "Town, Area" style location: the whole text and each comma-separated part. */
export function listForms(raw: unknown): string[] {
  const text = raw === null || raw === undefined ? '' : String(raw);
  const forms = new Set<string>(searchForms(text));
  for (const part of text.split(',')) for (const form of searchForms(part)) forms.add(form);
  return [...forms];
}

export function stableByScore<T extends { score: number }>(hits: T[]): T[] {
  return hits
    .map((hit, index) => ({ hit, index }))
    .sort((a, b) => b.hit.score - a.hit.score || a.index - b.index)
    .map(({ hit }) => hit);
}

/** Stable sort by relevance (highest first); items without a score keep their relative order last. */
export function rankBySlugScore<T extends { slug: string }>(items: T[], scores: Map<string, number>): T[] {
  return items
    .map((item, index) => ({ item, index, score: scores.get(item.slug) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}
