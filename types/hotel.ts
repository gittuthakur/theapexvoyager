import type { Stay } from './stay';

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
  // Apex Verified trust badge (Apex Stays) — only ever set true once a property
  // actually satisfies the configured verification criteria; never inferred.
  verified?: boolean;
  cancellationPolicy?: string;
  mealPlan?: string;
  /** ObjectId (as a string) of the MongoDB Region document this hotel belongs to — see models/Region.ts. */
  regionId?: string;
  // Live Google Places rating/photos, matched by name+location and attached on
  // read — never persisted on the Hotel document itself. Absent when the Places
  // API key is unset, the lookup fails, or no confident name match was found.
  places?: Stay;
}
