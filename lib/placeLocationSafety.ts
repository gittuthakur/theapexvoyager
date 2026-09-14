import type { StayMode } from '@/config/stayLocations.config';

export type PlaceLocationClassification = 'exact' | 'nearby' | 'access-base' | 'wrong-location';

/**
 * Classifies a Google-returned place's address against the exact location string the
 * search was actually run for — see AGENTS.md's 3-state Google Places inventory
 * expansion mission, section 6. The caller (destination page / /stays route) already
 * resolved `location` to the correct canonical search town via Phase B's
 * getStayLocationContext (e.g. "Sangla" for Kinnaur, "Guptkashi" for Kedarnath), so the
 * accept/reject test here is simply: does the address actually mention that town at
 * all? `stayMode` only decides the reported label for an address that DOES match — it
 * never loosens the match itself. Deliberately conservative: Google's Text Search can
 * return a same-named place in an unrelated state, or a loosely-related regional
 * result, and an address that never mentions the searched-for town must never be shown
 * regardless of how plausible the property name looks.
 */
export function classifyPlaceLocation(
  formattedAddress: string | undefined,
  location: string,
  stayMode: StayMode = 'destination'
): PlaceLocationClassification {
  if (!formattedAddress) return 'wrong-location';
  const matches = formattedAddress.trim().toLowerCase().includes(location.trim().toLowerCase());
  if (!matches) return 'wrong-location';

  if (stayMode === 'access-base') return 'access-base';
  if (stayMode === 'nearby') return 'nearby';
  return 'exact';
}
