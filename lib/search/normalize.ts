/**
 * Shared search-text normalization. Pure functions only: no catalog data, no I/O.
 *
 * Every search surface should compare NORMALIZED text so that case, repeated whitespace,
 * slug vs. human-readable spellings ("spiti-valley" / "Spiti Valley"), punctuation, "&" vs
 * "and", and diacritics never decide whether an eligible record is found.
 */

/** Strips combining diacritical marks ("Café" -> "Cafe"). */
export function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Canonical comparison form: diacritics removed, lowercase, "&" read as "and", apostrophes
 * dropped, every other run of non-alphanumerics (spaces, hyphens, slashes, parentheses,
 * commas, dots...) collapsed to ONE space, trimmed.
 *
 *   "  Jammu  &  Kashmir "        -> "jammu and kashmir"
 *   "spiti-valley"                -> "spiti valley"
 *   "Joshimath (Jyotirmath)"      -> "joshimath jyotirmath"
 */
export function normalizeSearchText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return stripDiacritics(String(value))
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Normalized text with the spaces removed — matches "spitivalley" / "mcleodganj" style typing. */
export function compactSearchText(value: unknown): string {
  return normalizeSearchText(value).replace(/ /g, '');
}

/** Hyphenated slug-style form of the same text ("Spiti Valley" -> "spiti-valley"). */
export function slugSearchForm(value: unknown): string {
  return normalizeSearchText(value).replace(/ /g, '-');
}

export function tokenizeSearchText(normalized: string): string[] {
  return normalized ? normalized.split(' ') : [];
}

/** Whole-word/phrase containment on already-normalized text ("spiti" is in "spiti valley", not in "yespitia"). */
export function hasPhrase(normalizedHaystack: string, normalizedNeedle: string): boolean {
  if (!normalizedNeedle) return false;
  return ` ${normalizedHaystack} `.includes(` ${normalizedNeedle} `);
}

/** True when the haystack equals the needle or begins with it as whole words. */
export function startsWithPhrase(normalizedHaystack: string, normalizedNeedle: string): boolean {
  if (!normalizedNeedle) return false;
  return normalizedHaystack === normalizedNeedle || normalizedHaystack.startsWith(`${normalizedNeedle} `);
}

/**
 * Every needle word is the START of some haystack word ("kash" -> "kashmir"; "spiti val" ->
 * "spiti valley"). This is the only "partial word" rule: no edit-distance or fuzzy matching.
 */
export function everyTokenIsWordPrefix(normalizedHaystack: string, normalizedNeedle: string): boolean {
  const needle = tokenizeSearchText(normalizedNeedle);
  if (needle.length === 0) return false;
  const hay = tokenizeSearchText(normalizedHaystack);
  return needle.every((word) => hay.some((candidate) => candidate.startsWith(word)));
}

/**
 * The set of normalized forms a single stored name can be searched by. Derived ONLY from the
 * stored text itself (never invented): the full form, the form with any parenthetical removed
 * and each parenthetical on its own, plus the no-space form.
 *
 *   "Joshimath (Jyotirmath)" -> ["joshimath jyotirmath", "joshimath", "jyotirmath"]
 */
export function searchForms(raw: unknown): string[] {
  const text = raw === null || raw === undefined ? '' : String(raw);
  const forms = new Set<string>();
  const full = normalizeSearchText(text);
  if (full) forms.add(full);
  const withoutParens = normalizeSearchText(text.replace(/\([^)]*\)/g, ' '));
  if (withoutParens) forms.add(withoutParens);
  for (const match of text.matchAll(/\(([^)]*)\)/g)) {
    const inner = normalizeSearchText(match[1]);
    if (inner) forms.add(inner);
  }
  return [...forms];
}

/** Explicit, owner-maintained aliases: normalized alias -> normalized canonical term(s). */
export type AliasMap = Readonly<Record<string, readonly string[]>>;

/**
 * Expands a normalized query with explicit aliases ONLY (an exact normalized-key lookup — no
 * fuzzy matching). The original query is always first.
 */
export function expandQueryTerms(normalizedQuery: string, aliases: AliasMap = {}): string[] {
  const terms = [normalizedQuery];
  for (const canonical of aliases[normalizedQuery] ?? []) {
    const normalized = normalizeSearchText(canonical);
    if (normalized && !terms.includes(normalized)) terms.push(normalized);
  }
  return terms;
}
