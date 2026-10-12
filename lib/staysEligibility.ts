import { STAY_LOCATION_RULES, type StayLocationRule } from '@/config/stayLocations.config';

/**
 * Which cached PlaceCache rows may be shown publicly. Pure: no I/O.
 *
 * A cached row is public-eligible only when BOTH hold:
 *  - its `destinationSlug` is a PUBLISHED destination that has an authored stay-location rule, and
 *  - its stored `searchLocation` equals that rule's CURRENT \`primaryStayLocation\` — the same key the
 *    destination pages already read by (lib/stays.ts getStaysForDestination).
 *
 * So rows under orphan slugs ("kaza", "bir"...), test slugs ("spiti-valley-verify2") or an
 * unsupported destination, and stale rows fetched under a location a rule no longer uses, are never
 * public. Nothing is deleted or relabelled; a place is simply public only through an eligible row.
 */
export interface EligibleStayLocation {
  destinationSlug: string;
  searchLocation: string;
}

export function eligibleStayLocations(
  publishedSlugs: Iterable<string>,
  rules: readonly StayLocationRule[] = STAY_LOCATION_RULES
): EligibleStayLocation[] {
  const published = new Set(publishedSlugs);
  return rules.filter((rule) => published.has(rule.slug)).map((rule) => ({ destinationSlug: rule.slug, searchLocation: rule.primaryStayLocation }));
}

export function isEligibleStayLocation(
  destinationSlug: string,
  searchLocation: string,
  eligible: readonly EligibleStayLocation[]
): boolean {
  return eligible.some((entry) => entry.destinationSlug === destinationSlug && entry.searchLocation === searchLocation);
}

/** Rule-only check (no database): the pair is at least an authored destination/location pairing. */
export function isAuthoredStayLocation(destinationSlug: string, searchLocation: string, rules: readonly StayLocationRule[] = STAY_LOCATION_RULES): boolean {
  return rules.some((rule) => rule.slug === destinationSlug && rule.primaryStayLocation === searchLocation);
}

/** MongoDB match for the eligible (destinationSlug, searchLocation) pairs. Matches nothing when there are none. */
export function eligibleLocationsMatch(eligible: readonly EligibleStayLocation[]): Record<string, unknown> {
  if (eligible.length === 0) return { _id: { $exists: false } };
  return { $or: eligible.map(({ destinationSlug, searchLocation }) => ({ destinationSlug, searchLocation })) };
}
