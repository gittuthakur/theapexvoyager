import type { BookingAccommodation } from './booking.types';

export interface RegionBookingStayCardProps {
  id: string;
  name: string;
  photoUrl?: string;
  priceFrom?: number;
  currency?: string;
  /** Kept on the interface for a future real Booking.com integration (see this file's
   *  own top comment) — RegionBookingStayCard.tsx no longer renders it as a "Check
   *  Availability"/"View on Booking.com" CTA today, since no active affiliate
   *  integration exists (2026-09: Stays vertical made commercial-CTA-free sitewide). */
  providerUrl: string;
  rating?: number;
  /** Real Google Place data, only ever set once a future mapping step actually attaches
   *  one — never fabricated. When present, the card shows the same "View on Google Maps"
   *  informational action every other Stay surface uses; when absent (the case for every
   *  card today), no Maps action is rendered at all. */
  googleMapsUri?: string;
  placeId?: string;
}

/** The one place a future real Booking.com accommodation gets reshaped for
 *  components/modules/regions/RegionBookingStayCard.tsx. Unused today — nothing
 *  populates BookingAccommodation until real credentials exist — but keeps the
 *  mapping boundary in place from day one. */
export function mapBookingAccommodationToCard(input: BookingAccommodation): RegionBookingStayCardProps {
  return {
    id: input.id,
    name: input.name,
    photoUrl: input.photoUrl,
    priceFrom: input.priceFrom,
    currency: input.currency,
    providerUrl: input.providerUrl,
    rating: input.rating
  };
}
