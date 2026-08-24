'use client';

import { ArrowRight } from 'lucide-react';
import { useBookingNavigation } from '@/lib/bookingNavigation';
import { cn } from '@/lib/utils';

export interface DestinationPlanJourneyButtonProps {
  destinationTitle: string;
  destinationSlug: string;
  className?: string;
}

// The detail page's primary conversion CTA — the top of the "discovery → conversion"
// funnel the Popular Destinations section exists to feed. Rendered from the server
// page as a small client subcomponent since useBookingNavigation() needs the Next
// router. Hands off to the universal Plan My Journey flow (source=destination&slug=...)
// instead of the generic BookingRequestModal lead form, so the wizard opens already
// prefilled with this exact destination.
export default function DestinationPlanJourneyButton({ destinationTitle, destinationSlug, className }: DestinationPlanJourneyButtonProps) {
  const { navigateToBooking } = useBookingNavigation();

  return (
    <button
      type="button"
      className={cn(
        'cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400',
        className
      )}
      onClick={() => navigateToBooking({ source: 'destination', slug: destinationSlug })}
    >
      Plan My {destinationTitle} Journey
      <ArrowRight size={16} />
    </button>
  );
}
