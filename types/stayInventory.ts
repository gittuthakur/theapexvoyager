// Forward-looking room-inventory schema — NOT backed by any data source today. No
// Mongoose model exists for this on purpose: creating an empty collection with no
// writer would be premature scaffolding. This is pure type/interface groundwork so a
// real provider integration (Booking.com Demand API once real credentials exist, a
// direct hotel/partner feed, or manually verified Apex inventory) can be wired in
// later without redesigning the shape customer-facing code already expects.
//
// A Google Places property photo is NEVER a room photo — Google's gallery mixes
// exterior/lobby/restaurant/pool/view shots with no metadata saying which is which,
// so nothing here may be populated from PlaceCache. Every field below stays empty/
// absent until a genuine room-inventory provider is connected (see
// services/providers/booking/, currently an unpopulated, credential-gated skeleton —
// BOOKING_API_ENABLED gates it and must never be bypassed).

export type RoomInventorySource = 'booking-api' | 'partner' | 'apex-verified';

/** A normalization bucket for display/filtering — NOT a value to assign blindly.
 *  `providerRoomName` (the room's real, original name from whichever source supplied
 *  it) is always kept alongside this; a name is only mapped to a bucket here when
 *  that mapping is actually defensible (see lib/stayInventory.ts once a real provider
 *  exists), never guessed. */
export type RoomCategory = 'Standard' | 'Deluxe' | 'Super Deluxe' | 'Premium' | 'Executive' | 'Family' | 'Suite';

export interface BedConfiguration {
  /** e.g. "1 King Bed", "2 Twin Beds" — verbatim from the provider, never invented. */
  description: string;
  maxOccupancyNote?: string;
}

export interface RoomRate {
  price: number;
  currency: string;
  /** Taxes/fees NOT already included in `price` — 0 or absent means the provider
   *  quoted an all-inclusive price, not that no taxes apply. */
  taxes?: number;
  mealPlan?: string;
  refundable?: boolean;
  cancellationPolicy?: string;
}

export interface StayRoom {
  roomId: string;
  /** The provider's own identifier for this room, so a rate/availability refresh can
   *  be matched back to it without re-deriving identity. */
  providerRoomId: string;
  /** The real Google Place this room belongs to. */
  propertyPlaceId: string;
  /** The room's real, original name exactly as the provider supplied it — e.g.
   *  "Deluxe King Room with Mountain View". Never overwritten by `category`. */
  name: string;
  category?: RoomCategory;
  description?: string;
  /** Verified room-specific photos only — never a property-level Google photo. */
  photos: string[];
  maxAdults?: number;
  maxChildren?: number;
  bedConfiguration?: BedConfiguration;
  /** Square meters/feet, verbatim from the provider (units as supplied). */
  roomSize?: string;
  amenities?: string[];
  rates: RoomRate[];
  available?: boolean;
  source: RoomInventorySource;
  lastUpdated: string;
}

export interface RoomAvailabilityQuery {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
}

/** The seam a real room-inventory integration plugs into later — Google Places stays
 *  responsible only for property identity, location, property photos and guest
 *  ratings (see types/stay.ts's Stay); it is never asked to answer room-level
 *  questions it has no data for. No implementation of this interface exists yet. */
export interface StayInventoryProvider {
  getProperty(placeId: string): Promise<{ placeId: string; rooms: StayRoom[] } | null>;
  getRooms(placeId: string): Promise<StayRoom[]>;
  getAvailability(placeId: string, query: RoomAvailabilityQuery): Promise<StayRoom[]>;
  getRates(placeId: string, query: RoomAvailabilityQuery): Promise<RoomRate[]>;
}
