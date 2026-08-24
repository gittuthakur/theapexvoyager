import type { BookingAvailabilityResult } from './booking.types';

/**
 * No Booking.com Demand API credentials exist in this project yet (no token, no
 * affiliate ID, no approved API access — see the project plan). This flag is the one
 * place that fact is centralized: false/unset until real credentials are configured,
 * at which point this function is where the live `accommodations:search` call gets
 * wired in. Until then it NEVER attempts a live call and NEVER returns mock inventory —
 * the Region Hub's stays section always falls back to curated MongoDB stays.
 */
export function isBookingApiEnabled(): boolean {
  return process.env.BOOKING_API_ENABLED === 'true';
}

export async function getRegionAccommodations(_regionSlug: string): Promise<BookingAvailabilityResult> {
  return { enabled: isBookingApiEnabled(), accommodations: [] };
}
