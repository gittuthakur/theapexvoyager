'use client';

import { ArrowRight } from 'lucide-react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { cn } from '@/lib/utils';

export interface DestinationPlanJourneyButtonProps {
  destinationTitle: string;
  className?: string;
}

// The detail page's primary conversion CTA — the top of the "discovery → conversion"
// funnel the Popular Destinations section exists to feed. Rendered from the server
// page as a small client subcomponent since useBookingRequest() needs the
// BookingRequestProvider client context (same shape as HotelBookingModal/ExpertTalkButton).
export default function DestinationPlanJourneyButton({ destinationTitle, className }: DestinationPlanJourneyButtonProps) {
  const { openBookingRequest } = useBookingRequest();

  return (
    <button
      type="button"
      className={cn(
        'cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400',
        className
      )}
      onClick={() =>
        openBookingRequest({
          type: 'journey',
          itemName: `${destinationTitle} Custom Journey`,
          destination: destinationTitle
        })
      }
    >
      Plan My {destinationTitle} Journey
      <ArrowRight size={16} />
    </button>
  );
}
