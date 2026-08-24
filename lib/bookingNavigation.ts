import { useRouter } from 'next/navigation';
import type { BookingSource } from '@/types/bookingContext';

export interface BookingNavigationInput {
  source: BookingSource;
  slug: string;
}

/**
 * The one place every booking/planning CTA builds its `/plan-my-journey` URL —
 * identifiers only (source + slug), never the full item, per the booking-context
 * contract (see lib/bookingContext.ts). Call sites should stop hand-building this
 * querystring themselves.
 */
export function buildBookingHref({ source, slug }: BookingNavigationInput): string {
  return `/plan-my-journey?source=${source}&slug=${encodeURIComponent(slug)}`;
}

/** For onClick-driven CTAs (modals/buttons) that aren't a plain `<Link>`. */
export function useBookingNavigation() {
  const router = useRouter();
  return {
    navigateToBooking(input: BookingNavigationInput) {
      router.push(buildBookingHref(input));
    }
  };
}
