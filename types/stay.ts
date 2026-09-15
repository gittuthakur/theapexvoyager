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

// An official/provider-verified hotel STAR CLASS — a fundamentally different concept
// from a Google guest rating (the average of customer reviews, e.g. 4.8). A 4.8 rating
// does not mean a 5-star property, and a 3-star property can easily have a higher
// guest rating than a 5-star one. Deliberately capped at 5 — see AGENTS.md's "no 7-star
// marketing claims" rule: only a real provider's own classification may ever populate
// this, never inferred from rating, price, review count, name, or photos.
//
// No trusted source for this exists anywhere in the app today (audited 2026-09):
// PlaceCache has no such field, the curated Hotel schema has no such field, and
// services/providers/booking/ (the only other provider integration) is an unpopulated,
// credential-gated skeleton (see its own doc comments) whose types carry no star class
// either. This field exists so the data model and UI can represent one honestly the
// moment a real source is connected — it is never populated today, and no filter or
// badge should render for it while that remains true.
export type HotelClass = '3-star' | '4-star' | '5-star' | 'luxury';

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
  /** Google's raw place `types` (e.g. "lodging", "hotel") — absent for curated Stays. */
  types?: string[];
  googleMapsUri?: string;
  websiteUri?: string;
  /** Google-sourced only — see lib/placeLocationSafety.ts. A 'wrong-location' result is
   *  never cached or returned in the first place, so this only ever holds the three
   *  "shown" values for a google-sourced Stay; absent for curated Stays. */
  locationClassification?: 'exact' | 'nearby' | 'access-base';
  /** See HotelClass's own doc comment — always unset today; never derived from
   *  `rating`. Kept separate from `rating` in the UI wherever both are shown. */
  hotelClass?: HotelClass;
}
