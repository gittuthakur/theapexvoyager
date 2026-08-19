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
}
