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
  image: string;
  destinationSlug?: string;
  featured?: boolean;
  maxGuests?: string;
  difficulty?: string;
  tags?: string[];
  features?: string[];
}
