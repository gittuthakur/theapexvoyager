'use client';

import { useState } from 'react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage } from '@/lib/whatsapp';
import TransportCard from './TransportCard';
import TransportDetail from './TransportDetail';
import type { VehicleOption } from '@/types/transport';

export interface TransportResultsProps {
  vehicles: VehicleOption[];
  pickup?: string;
  destination?: string;
  date?: string;
  travellers?: string;
  hasActiveFilter: boolean;
  journeyContext?: { from?: string; journeySlug?: string };
}

export default function TransportResults({
  vehicles,
  pickup,
  destination,
  date,
  travellers,
  hasActiveFilter,
  journeyContext
}: TransportResultsProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const { openBookingRequest } = useBookingRequest();

  function handleRequestVehicle(vehicle: VehicleOption) {
    const routeLabel = pickup && destination ? `${pickup} → ${destination}` : undefined;
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: routeLabel,
      dates: date,
      travelers: travellers,
      details: {
        vehicleSlug: vehicle.slug ?? vehicle.id,
        category: vehicle.category,
        pickup,
        destination,
        date,
        travellers,
        source: journeyContext?.from ?? 'transport-page',
        journeySlug: journeyContext?.journeySlug
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({
          referenceId,
          pickup: pickup || 'your pickup point',
          destination: destination || 'your destination',
          date,
          travelers: travellers,
          vehicleName: vehicle.name
        })
    });
  }

  function handleCustomQuote() {
    openBookingRequest({
      type: 'transport',
      itemName: 'Custom transport quote',
      destination: pickup && destination ? `${pickup} → ${destination}` : undefined,
      dates: date,
      travelers: travellers,
      details: { pickup, destination, date, travellers, source: 'transport-empty-state' }
    });
  }

  return (
    <section id="transport-results" className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Our fleet</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Choose your vehicle</h2>

      {vehicles.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <TransportCard
              key={vehicle.slug ?? vehicle.id}
              vehicle={vehicle}
              pickup={pickup}
              destination={destination}
              onViewDetails={setSelectedVehicle}
              onRequestVehicle={handleRequestVehicle}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-glow">
          <p className="text-lg font-semibold text-slate-900">
            {hasActiveFilter ? 'No transport options found for this route.' : 'Our fleet is being updated.'}
          </p>
          <p className="mt-3 text-slate-600">
            Tell us what you need and our travel experts will arrange it for you.
          </p>
          <button
            type="button"
            onClick={handleCustomQuote}
            className="cursor-hover mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Request a Custom Quote
          </button>
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
          onClose={() => setSelectedVehicle(null)}
        />
      ) : null}
    </section>
  );
}
