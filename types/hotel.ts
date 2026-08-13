export type HotelCategory =
  | 'Hotel'
  | 'Homestay'
  | 'Resort'
  | 'Villa'
  | 'Camp'
  | 'Treehouse'
  | 'Farmstay'
  | 'Hostel'
  | 'Heritage'
  | 'GuestHouse';

export interface HotelPackage {
  id?: string;
  slug: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating?: number;
  reviewCount?: number;
  category: HotelCategory;
  description: string;
  images: string[];
  amenities?: string[];
  featured?: boolean;
}
