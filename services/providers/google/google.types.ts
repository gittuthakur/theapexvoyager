/** Region-Hub-facing shapes — decoupled from RawGooglePlace (lib/googlePlaces.ts) so a
 *  Places API response-shape change never ripples into components. */
export interface GoogleAttraction {
  id: string;
  name: string;
  photoUrl?: string;
  rating?: number;
  category?: string;
}

export interface GoogleAttractionsResult {
  attractions: GoogleAttraction[];
  attribution?: string;
}
