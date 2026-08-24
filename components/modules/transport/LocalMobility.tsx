'use client';

import { useState } from 'react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage } from '@/lib/whatsapp';
import TransportCard from './TransportCard';
import TransportDetail from './TransportDetail';
import NoInventoryActions from './NoInventoryActions';
import type { VehicleOption } from '@/types/transport';

export interface LocalMobilityProps {
  vehicles: VehicleOption[];
  destinationTitle?: string;
  destinationSlug?: string;
  date?: string;
  travellers?: string;
  /** Attribution when reached via a specific Journey/Package's "Plan Transport" link —
   *  preserved into the enquiry and the WhatsApp lead rather than silently dropped. */
  journeyContext?: { from?: string; journeySlug?: string };
  /** True only when Local Transport is the just-submitted search's active service —
   *  gates the honest managed-enquiry fallback so it doesn't appear as noise under an
   *  unrelated Cab/Self-Drive search that happens to resolve the same destination. */
  isLocalServiceActive?: boolean;
}

// Genuinely destination-specific. Real linked vehicles (once a partner exists) show
// as cards regardless of active service — a useful cross-sell. With zero vehicles:
// if Local Transport was actually searched for a resolved destination, show an honest
// "we'll arrange it" enquiry block (never an empty ride-type dropdown, never fabricated
// inventory); otherwise render nothing — there's no destination-specific local-transport
// context worth showing for an unrelated search.
export default function LocalMobility({
  vehicles,
  destinationTitle,
  destinationSlug,
  date,
  travellers,
  journeyContext,
  isLocalServiceActive
}: LocalMobilityProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const { openBookingRequest } = useBookingRequest();

  if (!destinationTitle) return null;
  if (vehicles.length === 0 && !isLocalServiceActive) return null;

  function handleRequestQuote(vehicle: VehicleOption) {
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: destinationTitle,
      dates: date,
      travelers: travellers,
      details: {
        serviceType: 'Local Mobility',
        vehicleSlug: vehicle.slug ?? vehicle.id,
        destinationSlug,
        date,
        travellers,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-local-mobility'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({ referenceId, destination: destinationTitle, date, travelers: travellers, vehicleName: vehicle.name })
    });
  }

  function handleRequestLocalTransport() {
    openBookingRequest({
      type: 'transport',
      itemName: `Local transport in ${destinationTitle}`,
      destination: destinationTitle,
      dates: date,
      travelers: travellers,
      details: {
        serviceType: 'Local Mobility',
        destinationSlug,
        date,
        travellers,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-local-mobility-enquiry'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({ referenceId, destination: destinationTitle, date, travelers: travellers, vehicleName: `Local transport in ${destinationTitle}` })
    });
  }

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Local mobility</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Getting Around {destinationTitle}</h2>

      {vehicles.length > 0 ? (
        <>
          <p className="mt-2 text-sm text-slate-500">Local transport options available through our on-ground network in {destinationTitle}.</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <TransportCard
                key={vehicle.slug ?? vehicle.id}
                vehicle={vehicle}
                destination={destinationTitle}
                date={date}
                travellers={travellers}
                journeyContext={journeyContext}
                ctaLabel="Request Quote"
                onViewDetails={setSelectedVehicle}
                onRequestVehicle={handleRequestQuote}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-glow">
          <p className="text-lg font-semibold text-slate-900">No verified local rides are available here yet.</p>
          <p className="mt-3 text-slate-600">
            We don&apos;t yet have verified local transport partners listed for {destinationTitle} — tell us your plans and our
            travel experts will arrange it for you.
          </p>
          <NoInventoryActions onRequestCustomVehicle={handleRequestLocalTransport} requestLabel="Request Local Transport" />
        </div>
      )}

      {selectedVehicle ? (
        <TransportDetail
          vehicle={selectedVehicle}
          destination={destinationTitle}
          date={date}
          travellers={travellers}
          journeyContext={journeyContext}
          ctaLabel="Request Quote"
          onRequestVehicle={handleRequestQuote}
          onClose={() => setSelectedVehicle(null)}
        />
      ) : null}
    </section>
  );
}
