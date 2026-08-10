export interface TourPackage {
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
  description: string;
  image: string;
  destinationSlug?: string;
  featured?: boolean;
}
