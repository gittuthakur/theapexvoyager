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
// MongoDB (models/PlaceCache.ts) with a 30-day TTL, OR a publiclyListed curated Hotel
// record adapted to this same shape for display alongside Google results (see
// components/modules/StaysGrid.tsx's hotelToStay). Distinct from HotelPackage
// (types/hotel.ts), which is the curated record's own native shape.
export interface Stay {
  placeId: string;
  name: string;
  slug: string;
  stayType: StayType;
  formattedAddress?: string;
  /** Real coordinates from Google's Text Search `places.location` field — absent for a
   *  curated/adapted Stay (no coordinate source exists for those today). */
  latitude?: number;
  longitude?: number;
  rating?: number;
  userRatingCount?: number;
  photos: string[];
  customPrice?: number;
  destinationSlug: string;
  updatedAt?: string;
  /** Which provider this record's identity and fields actually came from — required so
   *  the UI can label provenance honestly (e.g. "Google rating") instead of implying
   *  The Apex Voyager verified externally-sourced data itself. No 'booking' value exists
   *  yet: no live Booking.com integration exists (services/providers/booking/ is an
   *  unpopulated, credential-gated skeleton — see its own doc comments). */
  source: 'google' | 'curated';
}
