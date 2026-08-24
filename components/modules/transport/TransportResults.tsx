'use client';

import { useState } from 'react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage } from '@/lib/whatsapp';
import TransportCard from './TransportCard';
import TransportDetail from './TransportDetail';
import NoInventoryActions from './NoInventoryActions';
import type { VehicleOption } from '@/types/transport';

export interface TransportResultsProps {
  vehicles: VehicleOption[];
  pickup?: string;
  destination?: string;
  date?: string;
  travellers?: string;
  hasActiveFilter: boolean;
  journeyContext?: { from?: string; journeySlug?: string };
  /** e.g. "Cab with Driver · Manali → Chandigarh · 27 Aug" — only when this search is active. */
  searchSummary?: string;
  service?: string;
  vehicleCategory?: string;
  tripType?: string;
  isActiveService?: boolean;
}

export default function TransportResults({
  vehicles,
  pickup,
  destination,
  date,
  travellers,
  hasActiveFilter,
  journeyContext,
  searchSummary,
  service,
  vehicleCategory,
  tripType,
  isActiveService = false
}: TransportResultsProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const { openBookingRequest } = useBookingRequest();

  // Same direct BookingRequestModal lead-capture flow every other transport service
  // uses (Self-Drive/4x4/Bike/Local Mobility) — carries the pickup/drop/date/travellers
  // this section's own search actually captured straight into the enquiry and the
  // WhatsApp message, instead of detouring through the generic Plan-My-Journey wizard
  // (which only recognised 2 of 13 vehicle categories and dropped the rest of this
  // context on the floor).
  function handleRequestVehicle(vehicle: VehicleOption) {
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: pickup && destination ? `${pickup} → ${destination}` : destination,
      dates: date,
      travelers: travellers,
      details: {
        serviceType: vehicle.serviceType ?? 'Cab with Driver',
        vehicleSlug: vehicle.slug ?? vehicle.id,
        pickup,
        destination,
        date,
        travellers,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({ referenceId, pickup, destination, date, travelers: travellers, vehicleName: vehicle.name })
    });
  }

  function handleCustomQuote() {
    openBookingRequest({
      type: 'transport',
      itemName: 'Custom transport quote',
      destination: pickup && destination ? `${pickup} → ${destination}` : undefined,
      dates: date,
      travelers: travellers,
      details: { serviceType: service, vehicleCategory, pickup, destination, date, travellers, tripType, source: 'transport-empty-state' }
    });
  }

  return (
    <section id={isActiveService ? 'transport-results' : undefined} className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Chauffeur-driven transport</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Chauffeur-Driven Transport</h2>
      {searchSummary ? <p className="mt-2 text-sm text-slate-500">{searchSummary}</p> : null}

      {vehicles.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <TransportCard
              key={vehicle.slug ?? vehicle.id}
              vehicle={vehicle}
              pickup={pickup}
              destination={destination}
              date={date}
              travellers={travellers}
              journeyContext={journeyContext}
              onViewDetails={setSelectedVehicle}
              onRequestVehicle={handleRequestVehicle}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-glow">
          <p className="text-lg font-semibold text-slate-900">
            {hasActiveFilter ? 'No matching verified vehicle is currently listed for this trip.' : 'Our fleet is being updated.'}
          </p>
          <p className="mt-3 text-slate-600">
            Tell us what you need and our travel experts will arrange it for you.
          </p>
          <NoInventoryActions onRequestCustomVehicle={handleCustomQuote} modifyHref="#vehicle-recommendation" modifyLabel="Modify Recommendation" />
        </div>
      )}

      {selectedVehicle ? (
        <TransportDetail
          vehicle={selectedVehicle}
          pickup={pickup}
          destination={destination}
          date={date}
          travellers={travellers}
          journeyContext={journeyContext}
          onRequestVehicle={handleRequestVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      ) : null}
    </section>
  );
}
