// Enrichment shared by Destination and Hotel — populated from the Google Places API
// (New) Text Search response, cached in MongoDB for up to 30 days. `photos` are URLs
// into our own /api/places/photo proxy, never the raw Google media URL (that would
// leak the API key to the browser).
export interface GooglePlaceEnrichment {
  placeId: string;
  formattedAddress?: string;
  photos?: string[];
  rating?: number;
  userRatingCount?: number;
  lastSyncedAt?: string;
  source: 'google-places' | 'cache' | 'mock';
}

export interface DestinationPick {
  title: string;
  description: string;
}

export interface DestinationApexPicks {
  view?: DestinationPick;
  stay?: DestinationPick;
  experience?: DestinationPick;
  taste?: DestinationPick;
  moment?: DestinationPick;
}

/** Editorial 0-100 scores used by the transparent (non-ML) preference-matching heuristic in /api/destinations/match. */
export interface DestinationMatchScores {
  adventure: number;
  nature: number;
  luxury: number;
  crowds: number;
  slowTravel: number;
}

/** How a destination's final point is actually reached — lets the detail page distinguish
 *  a place a car can drive straight to from one that requires a trek/helicopter leg beyond
 *  the last road head, so "Getting Around" never implies road access that doesn't exist. */
export type DestinationAccessType = 'road' | 'trek-gated' | 'trek-and-helicopter';

/** Points at the one authoritative registration channel for a destination (e.g. a Char Dham
 *  yatra registration portal) — never a form The Apex Voyager itself collects submissions
 *  through. `required` and `note` are editorial, not live status. */
export interface DestinationRegistrationInfo {
  required: boolean;
  url: string;
  note?: string;
}

/** One stage in a destination's staged access sequence — same shape as
 *  components/modules/detail/AccessJourney's `AccessJourneyStage` prop, so this is a direct
 *  data source for that component, not a parallel schema needing its own translation. */
export interface DestinationAccessJourneyStage {
  title: string;
  description?: string;
  note?: string;
}

/** Present only when a destination's access is genuinely staged (e.g. a road head short of
 *  a trek-gated shrine) — generic across any future staged-access destination (Hemkund Sahib
 *  included), never named after one place. Absent for the ordinary drive-straight-there
 *  majority of the catalogue. */
export interface DestinationAccessJourney {
  heading?: string;
  stages: DestinationAccessJourneyStage[];
}

export interface Destination extends Partial<GooglePlaceEnrichment> {
  id?: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  toursCount: number;
  image: string;
  link?: string;
  region?: string;
  state?: string;
  /** ObjectId (as a string) of the MongoDB Region document this destination belongs to — see models/Region.ts. */
  regionId?: string;
  editorialDescription?: string;
  bestTime?: string;
  idealDuration?: string;
  altitude?: string;
  travelStyles?: string[];
  seasons?: string[];
  highlights?: Array<{ title: string; description: string }>;
  places?: Array<{ title: string; description: string }>;
  experiences?: string[];
  relatedSlugs?: string[];
  seo?: { title: string; description: string };
  /** Homepage "Popular Destinations" curation — selection and ordering driven by these
   *  flags instead of a hardcoded slug list. */
  isPopular?: boolean;
  priority?: number;
  /** Short editorial tag, e.g. "RAW • REMOTE • ADVENTUROUS". */
  personality?: string;
  /** Overlay badge on the popular-destination card, e.g. "MOST LOVED". */
  badge?: string;
  /** Demand/social-proof signal (distinct from the Google-Places `rating` on GooglePlaceEnrichment). */
  popularityScore?: number;
  /** Editorial curation quality score, assigned by our team. */
  apexScore?: number;
  apexPicks?: DestinationApexPicks;
  hiddenGems?: Array<{ title: string; description: string }>;
  travelTips?: string[];
  matchScores?: DestinationMatchScores;
  /** Editorial one-liner per entry in `seasons`, for the "When Does It Feel Right?" toggle. */
  seasonalNotes?: Record<string, string>;
  /** Who this destination suits best, e.g. "Couples", "Families" — powers the explorer's Best For filter. */
  bestFor?: string[];
  /** Map-ready; optional since most curated entries don't have it authored yet. */
  coordinates?: { lat: number; lng: number };
  /** How the final point is reached — see DestinationAccessType. Absent for the ordinary
   *  leisure-destination majority of the catalogue; only meaningful once a destination's
   *  access genuinely isn't a straightforward drive. */
  accessType?: DestinationAccessType;
  /** Present only when a destination has one real, official registration requirement to
   *  surface (e.g. a yatra registration portal) — never populated with a guess. */
  registrationInfo?: DestinationRegistrationInfo;
  /** A single outbound link to the relevant official advisory authority (road/weather/permit
   *  status). Presence of this URL is never itself a status claim — see components/modules/detail/OfficialLinkCallout. */
  officialAdvisoryUrl?: string;
  /** Staged access sequence for a trek-gated (or otherwise multi-leg) destination — see
   *  DestinationAccessJourney. Absent for the ordinary single-hop majority of the catalogue. */
  accessJourney?: DestinationAccessJourney;
}
