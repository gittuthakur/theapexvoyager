/**
 * Escapes regex metacharacters in a string that's about to become the *source* of a
 * `new RegExp(...)` used for a free-text/partial MongoDB match (e.g. `query.location =
 * new RegExp(userInput, 'i')`). Without this, a value like "Manali (Old Town)" or a
 * deliberately crafted `?destination=` value is interpreted as a regex pattern rather
 * than literal text — at best causing wrong/overly-broad matches, at worst a
 * catastrophic-backtracking pattern from an untrusted query param.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
