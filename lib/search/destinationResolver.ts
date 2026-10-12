import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { locationQueryVariants } from '@/lib/search/locationMatching';
import { compactSearchText, hasPhrase, normalizeSearchText, searchForms, type AliasMap } from '@/lib/search/normalize';

export interface ResolvableDestination {
  slug: string;
  title: string;
}

export type DestinationResolution<T extends ResolvableDestination> =
  | { status: 'resolved'; destination: T }
  | { status: 'ambiguous'; candidates: T[] }
  | { status: 'none' };

/**
 * Words that only describe a spot INSIDE the same place, never a different place. "Airport" and
 * "station" are deliberately absent: an airport or station has its own route records and is not
 * the city.
 */
const GENERIC_LOCALITY_SUFFIXES = new Set(['bus stand', 'bus stop', 'bus station', 'taxi stand', 'market', 'town', 'city', 'district']);

/** True when `text` is exactly `form` plus one generic locality suffix (either order is not accepted). */
function isFormWithGenericSuffix(text: string, form: string): boolean {
  if (!text.startsWith(`${form} `)) return false;
  return GENERIC_LOCALITY_SUFFIXES.has(text.slice(form.length + 1));
}

function destinationForms(destination: ResolvableDestination): string[] {
  return [...searchForms(destination.title), normalizeSearchText(destination.slug)].filter(Boolean);
}

/**
 * Maps free text ("Dharamsala", "Manali Bus Stand") to ONE published destination, deterministically.
 *
 * Tiers, strongest first; the first tier with any candidate decides:
 *   1. the text IS a destination's title/slug (or a verified alias spelling of it);
 *   2. the text is a whole-word part of exactly one title ("Spiti" -> "Spiti Valley");
 *   3. a destination's whole title followed ONLY by a generic locality word ("Manali Bus Stand" ->
 *      "Manali"). Any other extra words ("Kaza Manali", "Chandigarh Airport") name something else, so
 *      nothing is chosen and the caller keeps its safe custom-route / unfiltered fallback.
 * If that tier holds more than one destination the text is ambiguous and NOTHING is chosen, so the
 * caller never silently gets the first of several. There is no fuzzy or nearest-place matching.
 */
export function resolveDestinationByLocationText<T extends ResolvableDestination>(
  destinations: readonly T[],
  text: string | undefined,
  aliases: AliasMap = LOCATION_ALIASES
): DestinationResolution<T> {
  const variants = locationQueryVariants(text, aliases);
  if (variants.length === 0) return { status: 'none' };
  const compact = variants.map((variant) => compactSearchText(variant));

  const tiers: Array<(forms: string[]) => boolean> = [
    (forms) => forms.some((form) => variants.includes(form) || compact.some((term) => term.length >= 4 && compactSearchText(form) === term)),
    (forms) => forms.some((form) => variants.some((variant) => hasPhrase(form, variant))),
    (forms) => forms.some((form) => variants.some((variant) => isFormWithGenericSuffix(variant, form)))
  ];

  for (const matches of tiers) {
    const candidates = destinations.filter((destination) => matches(destinationForms(destination)));
    if (candidates.length === 1) return { status: 'resolved', destination: candidates[0] };
    if (candidates.length > 1) return { status: 'ambiguous', candidates };
  }
  return { status: 'none' };
}

/** The resolved destination, or undefined when the text matches none or is ambiguous. */
export function findDestinationByText<T extends ResolvableDestination>(destinations: readonly T[], text: string | undefined, aliases?: AliasMap): T | undefined {
  const resolution = resolveDestinationByLocationText(destinations, text, aliases);
  return resolution.status === 'resolved' ? resolution.destination : undefined;
}
