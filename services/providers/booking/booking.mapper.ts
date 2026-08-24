import type { BookingAccommodation } from './booking.types';

export interface RegionBookingStayCardProps {
  id: string;
  name: string;
  photoUrl?: string;
  priceFrom?: number;
  currency?: string;
  providerUrl: string;
  rating?: number;
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
