import { travelStyles } from '@/config/travelStyles.config';
import type { Destination, DestinationStyleId, DestinationTravelStyle } from '@/types';

export function getAllTravelStyles(): DestinationTravelStyle[] {
  return travelStyles;
}

export function getTravelStyleById(id: string): DestinationTravelStyle | undefined {
  return travelStyles.find((style) => style.id === id);
}

/**
 * Resolves a human-readable label (from a `?style=` deep link, e.g. "Adventure" or
 * even an older free-text value like "Honeymoon") back to a canonical style — tries
 * an exact label match first, then falls back to a keyword match, so existing
 * `/destinations?style=...` links elsewhere in the app keep working even though they
 * predate this canonical 6-style vocabulary.
 */
export function resolveTravelStyleFromLabel(label: string): DestinationTravelStyle | undefined {
  const needle = label.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    travelStyles.find((style) => style.label.toLowerCase() === needle) ??
    travelStyles.find((style) => style.matchKeywords.some((keyword) => keyword.toLowerCase() === needle))
  );
}

/**
 * Core keyword match, shared by anything that needs to test free-text values against
 * a canonical style's `matchKeywords` (case-insensitive substring) — `matchesStyle`
 * below is the Destination-specific wrapper; lib/packageFilters.ts uses this directly
 * against a TravelPackage's `category` since packages have no Destination shape.
 */
export function matchesStyleKeywords(values: Array<string | undefined>, styleId: DestinationStyleId): boolean {
  const style = getTravelStyleById(styleId);
  if (!style) return false;

  const haystack = values.filter(Boolean).map((value) => value!.toLowerCase());

  return style.matchKeywords.some((keyword) => haystack.some((value) => value.includes(keyword.toLowerCase())));
}

/**
 * The curated catalog was never authored against a fixed style enum, so this matches
 * a canonical style's `matchKeywords` against the destination's free-text
 * `travelStyles` array and `category` field (case-insensitive substring match).
 */
export function matchesStyle(destination: Destination, styleId: DestinationStyleId): boolean {
  return matchesStyleKeywords([...(destination.travelStyles ?? []), destination.category], styleId);
}
