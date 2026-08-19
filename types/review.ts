export interface Review {
  id: string;
  /** Links a review to a curated destination — omitted for general/site-wide reviews. */
  destinationSlug?: string;
  author: string;
  location?: string;
  rating: number;
  quote: string;
  tripTitle?: string;
  tripDate?: string;
  verified?: boolean;
  source?: {
    label: string;
    url: string;
  };
}
