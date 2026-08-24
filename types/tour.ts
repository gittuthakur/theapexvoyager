export interface TourItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface TourFaq {
  question: string;
  answer: string;
}

export interface TourPackage {
  id: string;
  slug: string;
  title: string;
  category: string;
  badge?: string;
  location: string;
  price: string;
  priceUnit?: string;
  duration: string;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: TourItineraryDay[];
  faqs?: TourFaq[];
  description?: string;
  /** Undefined when the source path doesn't resolve to a real file — see lib/tours.ts / lib/contentImage.server.ts. Never a fake local path. */
  image?: string;
  destinationSlug?: string;
  featured?: boolean;
  maxGuests?: string;
  difficulty?: string;
  tags?: string[];
  features?: string[];
  /** ObjectId (as a string) of the MongoDB Region document this tour belongs to — see models/Region.ts. */
  regionId?: string;
}
