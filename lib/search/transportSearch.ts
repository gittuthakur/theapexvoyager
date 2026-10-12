import { LOCATION_ALIASES } from '@/config/searchAliases.config';
import { matchLocation, type LocationMatch } from '@/lib/search/locationMatching';
import type { AliasMap } from '@/lib/search/normalize';
import type { TransportRoute } from '@/types/transport';

export interface RouteSearchFilter {
  origin?: string;
  destination?: string;
}

type Endpoint = 'origin' | 'destination';

/**
 * Routes whose `endpoint` matches `text`. If ANY active route names exactly that place
 * (spelling variants and verified aliases count as exact), only those routes are kept; looser
 * matches (a longer stored name containing the words, or a word-start) are used only when no
 * route names the place exactly. So "Srinagar" is the city and never also pulls in
 * "Srinagar Airport" while city routes exist, and "Chandigarh Airport" is never read as "Chandigarh".
 */
function routesAtEndpoint(routes: readonly TransportRoute[], endpoint: Endpoint, text: string | undefined, aliases: AliasMap): readonly TransportRoute[] {
  const wanted = text?.trim();
  if (!wanted) return routes;
  const ranked = routes.map((route) => ({ route, match: matchLocation(route[endpoint], wanted, aliases) as LocationMatch }));
  const hits = ranked.filter((entry) => entry.match !== null);
  const exact = hits.filter((entry) => entry.match === 'exact');
  return (exact.length > 0 ? exact : hits).map((entry) => entry.route);
}

/**
 * Narrows the live route catalog by pickup (origin) and drop (destination).
 *
 * - Direction is strict: `origin` is compared with `route.origin` ONLY and `destination` with
 *   `route.destination` ONLY. "Delhi -> Manali" never implies "Manali -> Delhi".
 * - Only routes that are explicitly active are ever considered, whatever the caller passed in.
 * - A route is never invented, reversed or re-targeted; fares, vehicle categories, route type and
 *   seasonal status are returned exactly as stored, and the catalog's own order is preserved.
 * - Matching is by place name (see lib/search/locationMatching.ts): spelling variants and verified
 *   aliases match, but a different place never does.
 */
export function filterTransportRoutes(
  routes: readonly TransportRoute[],
  filter: RouteSearchFilter = {},
  aliases: AliasMap = LOCATION_ALIASES
): TransportRoute[] {
  const active = routes.filter((route) => route.active === true);
  const byOrigin = new Set(routesAtEndpoint(active, 'origin', filter.origin, aliases));
  const byDestination = new Set(routesAtEndpoint(active, 'destination', filter.destination, aliases));
  return active.filter((route) => byOrigin.has(route) && byDestination.has(route));
}
