'use client';

import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage } from '@/lib/whatsapp';
import type { ServiceType } from '@/config/transportServiceTypes.config';

export interface CustomRouteRequestProps {
  pickup: string;
  destination: string;
  date?: string;
  travellers?: string;
  service?: ServiceType;
  journeyContext?: { from?: string; journeySlug?: string };
}

/**
 * Shown when a searched origin/destination has no match in the curated route
 * catalogue — the catalogue is a curated-content layer, not a whitelist of allowed
 * travel, so an unmatched route still captures a real lead (MongoDB BookingRequest +
 * WhatsApp handoff, same as every other transport CTA) instead of dead-ending on
 * "route not found".
 */
export default function CustomRouteRequest({ pickup, destination, date, travellers, service, journeyContext }: CustomRouteRequestProps) {
  const { openBookingRequest } = useBookingRequest();

  function handleRequest() {
    openBookingRequest({
      type: 'transport',
      itemName: `Custom route: ${pickup} → ${destination}`,
      destination: `${pickup} → ${destination}`,
      dates: date,
      travelers: travellers,
      details: {
        pickup,
        destination,
        date,
        travellers,
        serviceType: service,
        customRoute: true,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-route-explorer'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({
          referenceId,
          pickup,
          destination,
          date,
          travelers: travellers,
          vehicleName: service ? `${service} (to be arranged)` : 'To be arranged'
        })
    });
  }

  return (
    <div className="mt-6 rounded-[1.5rem] border border-dashed border-apex-200 bg-apex-50/40 p-6 sm:max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-apex-600">Custom route request</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">
        {pickup} → {destination} isn&apos;t in our curated route list yet
      </p>
      <p className="mt-2 text-sm text-slate-600">
        We still arrange transport across our full partner network — request this route and our travel experts will
        source a suitable vehicle and get back to you with a quote.
      </p>
      <button
        type="button"
        onClick={handleRequest}
        className="cursor-hover mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
      >
        Request Transport for This Route
      </button>
    </div>
  );
}
