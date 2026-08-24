export interface Review {
  id: string;
  /** Links a review to a curated destination — omitted for journey-specific or general reviews. */
  destinationSlug?: string;
  /** Links a review to a specific journey/package — omitted for destination-level or general reviews. */
  journeyId?: string;
  customerName: string;
  location?: string;
  rating: number;
  reviewText: string;
  tripTitle?: string;
  tripDate?: string;
  verified: boolean;
  approved: boolean;
  source?: {
    label: string;
    url: string;
  };
  createdAt?: string;
}
