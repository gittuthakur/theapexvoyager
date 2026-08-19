'use client';

import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { cn } from '@/lib/utils';

export interface TalkToTravelTeamButtonProps {
  className?: string;
  destination?: string;
  label?: string;
}

// General fallback CTA for when no specific expert matches (spec §14/§26), and also
// the hero's "Talk to an Expert" CTA before any specific expert is chosen — always
// creates a real enquiry via the same booking-request pipeline as every other CTA
// on this page, never a dead end.
export default function TalkToTravelTeamButton({ className, destination, label = 'Talk to Our Travel Team' }: TalkToTravelTeamButtonProps) {
  const { openBookingRequest } = useBookingRequest();

  return (
    <button
      type="button"
      className={cn(
        'cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400',
        className
      )}
      onClick={() =>
        openBookingRequest({
          type: 'expert',
          itemName: 'Travel Team',
          destination
        })
      }
    >
      {label}
    </button>
  );
}
