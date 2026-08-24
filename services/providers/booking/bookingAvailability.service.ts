import { isBookingApiEnabled } from './bookingAccommodation.service';
import type { BookingAvailabilityQuery, BookingAvailabilityResult } from './booking.types';

/**
 * Same disabled-skeleton shape as bookingAccommodation.service.ts's
 * getRegionAccommodations — not called anywhere yet, exists so the typed
 * check-in/check-out availability contract is in place ahead of real credentials.
 */
export async function checkAvailability(_query: BookingAvailabilityQuery): Promise<BookingAvailabilityResult> {
  return { enabled: isBookingApiEnabled(), accommodations: [] };
}
