import { STAY_LOCATION_RULES, type StayMode, type StayLocationRule } from '@/config/stayLocations.config';
import { primaryDestinationName } from '@/lib/experiences';

export type { StayMode };

export interface StayLocationContext {
  destinationSlug: string;
  /** Normalized title — e.g. "Joshimath" for the config's "Joshimath (Jyotirmath)". */
  destinationName: string;
  state?: string;
  /** 'unavailable' only occurs for a destination with no authored rule below —
   *  every one of the 38 public destinations has an explicit rule today. */
  stayMode: StayMode | 'unavailable';
  /** The real town/village to search/display as the accommodation location. */
  primaryStayLocation: string;
  nearbyStayLocations: string[];
  /** Deduped candidate location strings — primary + destination name + nearby — for
   *  matching against Hotel.location and for the Google Places search target. */
  searchLocations: string[];
  headingLabel: string;
  emptyStateMessage: string;
  /** Disclosure copy shown under the heading for 'nearby'/'access-base' modes only. */
  helperText?: string;
}

const RULES_BY_SLUG = new Map<string, StayLocationRule>(STAY_LOCATION_RULES.map((rule) => [rule.slug, rule]));

interface DestinationLike {
  slug: string;
  title: string;
  state?: string;
}

/**
 * The single source both the Destination detail page's embedded Stays section and
 * /stays/[...segments] read for "what location does this destination's accommodation
 * actually belong to, and how should the UI describe that." See
 * config/stayLocations.config.ts for the authored per-destination rule and
 * AGENTS.md's Phase B mission brief for the architecture this implements.
 */
export function getStayLocationContext(destination: DestinationLike): StayLocationContext {
  const destinationName = primaryDestinationName(destination.title);
  const rule = RULES_BY_SLUG.get(destination.slug);

  if (!rule) {
    // No authored rule exists yet for this destination — an honest "not yet mapped"
    // state rather than guessing at a location from the raw title.
    return {
      destinationSlug: destination.slug,
      destinationName,
      state: destination.state,
      stayMode: 'unavailable',
      primaryStayLocation: destinationName,
      nearbyStayLocations: [],
      searchLocations: [destinationName],
      headingLabel: `Stays for ${destinationName}`,
      emptyStateMessage: 'Stay planning for this destination is being added.'
    };
  }

  const nearby = rule.nearbyStayLocations ?? [];
  const searchLocations = Array.from(new Set([rule.primaryStayLocation, destinationName, ...nearby].filter(Boolean)));

  const headingLabel =
    rule.stayMode === 'destination'
      ? `Stays in ${destinationName}`
      : rule.stayMode === 'nearby'
        ? `Stays near ${destinationName}`
        : `Stay bases for ${destinationName}`;

  const emptyStateMessage =
    rule.stayMode === 'destination'
      ? `No stays are listed in ${destinationName} yet.`
      : rule.stayMode === 'nearby'
        ? `We're still adding stay options near ${destinationName}.`
        : `Stay options around ${rule.primaryStayLocation} are being added.`;

  const helperText =
    rule.stayMode === 'nearby'
      ? `Showing stays in ${rule.primaryStayLocation}, the usual base near ${destinationName}.`
      : rule.stayMode === 'access-base'
        ? `Showing stays in ${rule.primaryStayLocation} — the usual overnight base, since ${destinationName} itself has limited or seasonal accommodation.`
        : undefined;

  return {
    destinationSlug: destination.slug,
    destinationName,
    state: destination.state,
    stayMode: rule.stayMode,
    primaryStayLocation: rule.primaryStayLocation,
    nearbyStayLocations: nearby,
    searchLocations,
    headingLabel,
    emptyStateMessage,
    helperText
  };
}
