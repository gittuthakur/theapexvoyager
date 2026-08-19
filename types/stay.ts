export type StayType = 'hotel' | 'homestay' | 'cottage' | 'resort' | 'camp' | 'treehouse';

export const STAY_TYPES: StayType[] = ['hotel', 'homestay', 'cottage', 'resort', 'camp', 'treehouse'];

export const STAY_TYPE_LABELS: Record<StayType, string> = {
  hotel: 'Hotel',
  homestay: 'Homestay',
  cottage: 'Cottage',
  resort: 'Resort',
  camp: 'Camp',
  treehouse: 'Treehouse'
};

// Our own HotelCategory taxonomy (types/hotel.ts) doesn't map 1:1 onto StayType —
// this picks the closest Places search category for HotelPackage-to-Stay matching.
export const CATEGORY_TO_STAY_TYPE: Record<
  'Hotel' | 'Homestay' | 'Resort' | 'Villa' | 'Camp' | 'Treehouse' | 'Farmstay' | 'Hostel' | 'Heritage' | 'GuestHouse',
  StayType
> = {
  Hotel: 'hotel',
  Homestay: 'homestay',
  Resort: 'resort',
  Villa: 'cottage',
  Camp: 'camp',
  Treehouse: 'treehouse',
  Farmstay: 'homestay',
  Hostel: 'hotel',
  Heritage: 'hotel',
  GuestHouse: 'homestay'
};

// A single accommodation discovered via Google Places (New) Text Search, cached in
// MongoDB (models/PlaceCache.ts) with a 30-day TTL. Distinct from HotelPackage
// (types/hotel.ts), which is our own bookable catalog listing.
export interface Stay {
  placeId: string;
  name: string;
  slug: string;
  stayType: StayType;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photos: string[];
  customPrice?: number;
  destinationSlug: string;
  updatedAt?: string;
}
