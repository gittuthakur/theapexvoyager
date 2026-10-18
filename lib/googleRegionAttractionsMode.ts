/**
 * C4-B1 — kill switch for the Google Text Search that the Region Hub makes for its "Nearby to Explore" attractions.
 *
 * That search runs once per render of /regions/[slug] (a force-dynamic page, so nothing is cached) and once per request to
 * /api/regions/[slug]/hub, with no rate limit. Both reach it through services/providers/google/googlePlaces.attractions.ts, which is
 * where this switch is applied. Pure: it only interprets an environment object that the caller passes in.
 *
 * Environment variable: GOOGLE_REGION_ATTRACTIONS_MODE
 *
 *   live     - DEFAULT. Exactly today's behaviour: one Google Text Search per request.
 *   disabled - no Google attraction search at all (no request, no mock data). The region page and the API still work and return the
 *              region's own curated content; only the Google "Nearby to Explore" block is absent.
 *
 * Only an explicit `disabled` (ignoring case and surrounding whitespace) turns the search off. Unset, empty and UNKNOWN values stay
 * `live` during this backward-compatible rollout, so a typo can never switch anything off by accident, and no other variable
 * affects this feature. Nothing sets this variable in any environment.
 */
export type GoogleRegionAttractionsMode = 'live' | 'disabled';

export const GOOGLE_REGION_ATTRACTIONS_MODE_ENV = 'GOOGLE_REGION_ATTRACTIONS_MODE';

export function googleRegionAttractionsMode(env: Record<string, string | undefined>): GoogleRegionAttractionsMode {
  const raw = env[GOOGLE_REGION_ATTRACTIONS_MODE_ENV];
  return typeof raw === 'string' && raw.trim().toLowerCase() === 'disabled' ? 'disabled' : 'live';
}

/** The region's own editorial travel-guide fields (see RegionTravelGuide). Any non-blank one counts as first-party content. */
const FIRST_PARTY_GUIDE_FIELDS = ['bestTime', 'howToReach', 'weather', 'localTransport', 'permits', 'responsibleTravel'] as const;

export function hasFirstPartyTravelGuide(guide: unknown): boolean {
  if (guide === null || typeof guide !== 'object') return false;
  const record = guide as Record<string, unknown>;
  return FIRST_PARTY_GUIDE_FIELDS.some((field) => typeof record[field] === 'string' && (record[field] as string).trim() !== '');
}

/**
 * Whether the Region Hub's "Travel Guide" section is shown. Today the section appears only when Google returned attractions, which
 * would also hide the region's own travel-guide text if the Google block were switched off. So: with attractions it is always
 * shown (unchanged); with none, it is shown ONLY in `disabled` mode and only when the region has first-party guide text. In `live`
 * mode (the default) the result is exactly `attractionCount > 0`, as before.
 */
export function travelGuideSectionHasData(input: { attractionCount: number; mode: GoogleRegionAttractionsMode; guide: unknown }): boolean {
  if (input.attractionCount > 0) return true;
  return input.mode === 'disabled' && hasFirstPartyTravelGuide(input.guide);
}
