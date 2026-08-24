/** Typed to the eventual Booking.com Demand API shape — no live integration exists yet
 *  (see bookingAccommodation.service.ts). Nothing populates these until real credentials
 *  are configured via BOOKING_API_ENABLED. */
export interface BookingAccommodation {
  id: string;
  name: string;
  photoUrl?: string;
  priceFrom?: number;
  currency?: string;
  providerUrl: string;
  rating?: number;
}

export interface BookingAvailabilityQuery {
  checkIn: string;
  checkOut: string;
  occupancy: { adults: number; children?: number };
}

export interface BookingAvailabilityResult {
  enabled: boolean;
  accommodations: BookingAccommodation[];
}
