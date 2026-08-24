export type TravelStyle = 'Family' | 'Couple' | 'Adventure' | 'Luxury' | 'Group' | 'Slow Travel' | 'Weekend' | 'Road Trip';

export interface TravelExpert {
  slug: string;
  name: string;
  role: string;
  profileImage: string;
  bio: string;
  /** References config/destinations.config.ts slugs — real destinations only. */
  destinationSlugs: string[];
  /** Typed against TravelStyle at authoring time (config/experts.config.ts); stored/queried as plain strings since it's matched against free-text filter params. */
  travelStyles: string[];
  expertise: string[];
  /** Omitted entirely unless verified — never invented. */
  languages?: string[];
  /** References Journey.slug (config/packages.config.ts / models/Journey.ts) — no duplicated itinerary content. */
  journeySlugs?: string[];
  featured?: boolean;
  active: boolean;
  /** ObjectId(s) (as strings) of the MongoDB Region documents this expert covers — an expert may support multiple regions. See models/Region.ts. */
  regionIds?: string[];
}

export interface ExpertFacets {
  destinations: string[];
  travelStyles: string[];
  expertise: string[];
}
