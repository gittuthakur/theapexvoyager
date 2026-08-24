'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage, buildFourByFourRequestMessage } from '@/lib/whatsapp';
import { fourByFourTypeEntry, type FourByFourVariant } from '@/config/transportServiceTypes.config';
import TransportCard from './TransportCard';
import TransportDetail from './TransportDetail';
import NoInventoryActions from './NoInventoryActions';
import FourByFourTypeCards from './FourByFourTypeCards';
import FourByFourJourneyPopup, { type FourByFourTripContext } from './FourByFourJourneyPopup';
import type { VehicleOption } from '@/types/transport';

export interface FourByFourVehiclesProps {
  vehicles: VehicleOption[];
  /** Only passed when 4x4 / Mountain Vehicle is the just-submitted search's active
   *  service — carries pickup/destination/date/returnDate/travellers/driveMode into
   *  the enquiry and WhatsApp message. */
  pickup?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  travellers?: string;
  driveMode?: string;
  /** Attribution when reached via a specific Journey/Package's "Plan Transport" link —
   *  preserved into the enquiry and the WhatsApp lead rather than silently dropped. */
  journeyContext?: { from?: string; journeySlug?: string };
  /** Only passed when 4x4 / Mountain Vehicle is the just-submitted search's active
   *  service — shown instead of hiding the section entirely when that narrowed search
   *  (e.g. Drive Mode = Self Drive, which no seeded 4x4 vehicle supports yet) is empty. */
  activeSearchEmptyMessage?: string;
  /** e.g. "4x4 to Spiti Valley · 27 Aug" — only when this search is active. */
  searchSummary?: string;
  isActiveService?: boolean;
}

interface SelectedVehicleState {
  vehicle: VehicleOption;
  /** Present only when reached via one of the 3 guided journey popups — carries the
   *  popup's collected trip/requirements context. Absent for the active-service flat
   *  grid, which instead uses this component's own pickup/destination/date/etc props,
   *  exactly as before this rework. */
  trip?: FourByFourTripContext;
}

function detailsFromTrip(trip: FourByFourTripContext, vehicle?: VehicleOption): Record<string, unknown> {
  return {
    source: 'transport-4x4',
    fourByFourType: fourByFourTypeEntry(trip.variant)?.label,
    pickup: trip.pickup,
    destination: trip.destination,
    startDate: trip.startDate,
    returnDate: trip.returnDate || undefined,
    tripType: trip.tripType || undefined,
    travellers: trip.travellers,
    adults: trip.adults,
    children: trip.children,
    vehicleId: vehicle ? vehicle.slug ?? vehicle.id : undefined,
    vehicleCategory: vehicle?.category,
    transmission: trip.transmission || undefined,
    luggage: trip.luggage || undefined,
    pickupTime: trip.pickupTime || undefined,
    stops: trip.stops || undefined,
    specialRequirements: trip.specialRequirements || undefined,
    expeditionPreferences: trip.expeditionPreferences || undefined
  };
}

// Standing catalog, separate from the generic chauffeur fleet — previously 4x4
// vehicles surfaced inside the generic "Our Fleet" grid, contributing to the "feels
// mixed" complaint this restructuring addresses. Same shape as SelfDriveRentals/
// BikeRentals (reuses TransportCard/TransportDetail, the existing BookingRequestModal
// lead-capture flow for "Check Availability"). The main-page teaser now shows exactly
// 3 guided-journey discovery cards (With Driver / Self-Drive / Expeditions) instead of
// a flat vehicle grid — each opens FourByFourJourneyPopup in place; the full-results
// view (isActiveService, e.g. via "Explore 4x4 Vehicles") is unchanged.
export default function FourByFourVehicles({
  vehicles,
  pickup,
  destination,
  date,
  returnDate,
  travellers,
  driveMode,
  journeyContext,
  activeSearchEmptyMessage,
  searchSummary,
  isActiveService = false
}: FourByFourVehiclesProps) {
  const [selected, setSelected] = useState<SelectedVehicleState | null>(null);
  const [openVariant, setOpenVariant] = useState<FourByFourVariant | null>(null);
  const { openBookingRequest } = useBookingRequest();

  if (isActiveService && vehicles.length === 0 && !activeSearchEmptyMessage) return null;

  function handleCheckAvailability(vehicle: VehicleOption) {
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: pickup && destination ? `${pickup} → ${destination}` : destination,
      dates: date,
      travelers: travellers,
      details: {
        serviceType: '4x4 / Mountain Vehicle',
        vehicleSlug: vehicle.slug ?? vehicle.id,
        pickup,
        destination,
        date,
        returnDate,
        travellers,
        driveMode,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-4x4'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({ referenceId, pickup, destination, date, returnDate, travelers: travellers, driveMode, vehicleName: vehicle.name })
    });
  }

  function handleCustomQuote() {
    openBookingRequest({
      type: 'transport',
      itemName: 'Custom 4x4 quote',
      destination: pickup && destination ? `${pickup} → ${destination}` : destination,
      dates: date,
      travelers: travellers,
      details: { serviceType: '4x4 / Mountain Vehicle', vehicleCategory: '4x4', pickup, destination, date, returnDate, travellers, driveMode, source: 'transport-4x4-empty-state' }
    });
  }

  // Each of these closes the journey popup before handing off to the exact existing
  // flow — mirrors TransportDetail's own handleRequest (onRequestVehicle + onClose
  // together), so the popup never stacks with TransportDetail/BookingRequestModal.
  function handleViewDetailsFromPopup(vehicle: VehicleOption, trip: FourByFourTripContext) {
    setOpenVariant(null);
    setSelected({ vehicle, trip });
  }

  function handleRequestVehicleFromPopup(vehicle: VehicleOption, trip: FourByFourTripContext) {
    setOpenVariant(null);
    setSelected(null);
    const typeLabel = fourByFourTypeEntry(trip.variant)?.label ?? '4x4';
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: trip.pickup && trip.destination ? `${trip.pickup} → ${trip.destination}` : trip.destination || trip.pickup,
      dates: trip.returnDate ? `${trip.startDate} – ${trip.returnDate}` : trip.startDate,
      travelers: trip.travellers,
      details: { ...detailsFromTrip(trip, vehicle), from: journeyContext?.from, journeySlug: journeyContext?.journeySlug },
      buildWhatsAppMessage: (referenceId) =>
        buildFourByFourRequestMessage({
          referenceId,
          fourByFourType: typeLabel,
          pickup: trip.pickup,
          destination: trip.destination,
          startDate: trip.startDate,
          returnDate: trip.returnDate || undefined,
          travellers: trip.travellers,
          vehicleName: vehicle.name,
          luggage: trip.luggage || undefined,
          pickupTime: trip.pickupTime || undefined,
          stops: trip.stops || undefined,
          specialRequirements: trip.specialRequirements || undefined,
          expeditionPreferences: trip.expeditionPreferences || undefined
        })
    });
  }

  function handleRequestCustomFromPopup(trip: FourByFourTripContext) {
    setOpenVariant(null);
    const typeLabel = fourByFourTypeEntry(trip.variant)?.label ?? '4x4';
    openBookingRequest({
      type: 'transport',
      itemName: `Custom ${typeLabel} request`,
      destination: trip.pickup && trip.destination ? `${trip.pickup} → ${trip.destination}` : trip.destination || trip.pickup,
      dates: trip.returnDate ? `${trip.startDate} – ${trip.returnDate}` : trip.startDate,
      travelers: trip.travellers,
      details: { ...detailsFromTrip(trip), from: journeyContext?.from, journeySlug: journeyContext?.journeySlug },
      buildWhatsAppMessage: (referenceId) =>
        buildFourByFourRequestMessage({
          referenceId,
          fourByFourType: typeLabel,
          pickup: trip.pickup,
          destination: trip.destination,
          startDate: trip.startDate,
          returnDate: trip.returnDate || undefined,
          travellers: trip.travellers,
          luggage: trip.luggage || undefined,
          pickupTime: trip.pickupTime || undefined,
          stops: trip.stops || undefined,
          specialRequirements: trip.specialRequirements || undefined,
          expeditionPreferences: trip.expeditionPreferences || undefined
        })
    });
  }

  function handleRequestVehicleFromDetail(vehicle: VehicleOption) {
    if (selected?.trip) {
      handleRequestVehicleFromPopup(vehicle, selected.trip);
    } else {
      handleCheckAvailability(vehicle);
    }
  }

  return (
    <section id={isActiveService ? 'transport-results' : undefined} className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">4x4 mountain travel</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">4x4 Himalayan Vehicles</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">Built for Roads Beyond the Usual</p>
      {searchSummary ? <p className="mt-2 text-sm text-slate-500">{searchSummary}</p> : null}

      {!isActiveService ? (
        <FourByFourTypeCards onSelectVariant={setOpenVariant} />
      ) : vehicles.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <TransportCard
              key={vehicle.slug ?? vehicle.id}
              vehicle={vehicle}
              pickup={pickup}
              destination={destination}
              date={date}
              travellers={travellers}
              returnDate={returnDate}
              driveMode={driveMode}
              journeyContext={journeyContext}
              ctaLabel="Check Availability"
              onViewDetails={(selectedVehicle) => setSelected({ vehicle: selectedVehicle })}
              onRequestVehicle={handleCheckAvailability}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-glow">
          <p className="text-lg font-semibold text-slate-900">{activeSearchEmptyMessage}</p>
          <p className="mt-3 text-slate-600">Tell us what you need and our travel experts will arrange it for you.</p>
          <NoInventoryActions onRequestCustomVehicle={handleCustomQuote} modifyHref="#vehicle-recommendation" modifyLabel="Modify Recommendation" />
        </div>
      )}

      {!isActiveService ? (
        <Link
          href="/transport?service=4x4"
          className="cursor-hover mt-6 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
        >
          Explore 4x4 Vehicles <ArrowRight size={16} />
        </Link>
      ) : null}

      {openVariant ? (
        <FourByFourJourneyPopup
          variant={openVariant}
          allFourByFourVehicles={vehicles}
          journeyContext={journeyContext}
          onClose={() => setOpenVariant(null)}
          onViewDetails={handleViewDetailsFromPopup}
          onRequestVehicle={handleRequestVehicleFromPopup}
          onRequestCustom={handleRequestCustomFromPopup}
        />
      ) : null}

      {selected ? (
        <TransportDetail
          vehicle={selected.vehicle}
          pickup={selected.trip ? selected.trip.pickup : pickup}
          destination={selected.trip ? selected.trip.destination : destination}
          date={selected.trip ? selected.trip.startDate : date}
          travellers={selected.trip ? selected.trip.travellers : travellers}
          returnDate={selected.trip ? selected.trip.returnDate || undefined : returnDate}
          driveMode={
            selected.trip
              ? selected.trip.variant === 'with-driver'
                ? 'With Driver'
                : selected.trip.variant === 'self-drive'
                  ? 'Self Drive'
                  : undefined
              : driveMode
          }
          journeyContext={journeyContext}
          ctaLabel={selected.trip ? 'Select Vehicle' : 'Check Availability'}
          onRequestVehicle={handleRequestVehicleFromDetail}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  );
}
