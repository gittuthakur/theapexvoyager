'use client';

import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { destinations } from '@/config/destinations.config';
import { cn } from '@/lib/utils';
import type { TravelExpert } from '@/types/expert';

// Reads directly from the plain config catalog rather than lib/destinations.ts —
// that module also pulls in the Mongoose/MongoDB connection code (for its Google
// Places-backed lookups), which can't be bundled into this Client Component.
function findDestinationTitle(slug: string): string | undefined {
  return destinations.find((destination) => destination.slug === slug)?.title;
}

export interface ExpertTalkButtonProps {
  expert: TravelExpert;
  className?: string;
}

// Server pages (the /experts list and /experts/[slug] profile) render this
// small client subcomponent for the CTA since useBookingRequest() needs the
// client-side BookingRequestProvider context — same shape as HotelBookingModal
// being rendered from the server-rendered homestay detail page.
export default function ExpertTalkButton({ expert, className }: ExpertTalkButtonProps) {
  const { openBookingRequest } = useBookingRequest();

  const destination = expert.destinationSlugs
    .map((slug) => findDestinationTitle(slug))
    .filter((title): title is string => Boolean(title))
    .join(', ');

  return (
    <button
      type="button"
      className={cn(
        'cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400',
        className
      )}
      onClick={() =>
        openBookingRequest({
          type: 'expert',
          itemName: expert.name,
          destination: destination || undefined,
          details: { travelStyles: expert.travelStyles, expertise: expert.expertise }
        })
      }
    >
      Talk to {expert.name.split(' ')[0]}
    </button>
  );
}
