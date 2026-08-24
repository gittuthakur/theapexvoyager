'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage } from '@/lib/whatsapp';
import { selfDriveCarTypeEntry } from '@/config/transportServiceTypes.config';
import TransportCard from './TransportCard';
import TransportDetail from './TransportDetail';
import NoInventoryActions from './NoInventoryActions';
import SelfDriveFilterBar from './SelfDriveFilterBar';
import SelfDriveCarTypeCategories from './SelfDriveCarTypeCategories';
import SelfDriveCategoryPopup from './SelfDriveCategoryPopup';
import { useTransportSearch } from './TransportSearchContext';
import type { VehicleOption } from '@/types/transport';

/** Main-page teaser cap — a real, honest "limited featured set," not a `featured`
 *  flag filter (neither seeded self-drive vehicle has one set, so that would show
 *  zero). A no-op today with only 2 real vehicles; ready for when more exist. */
const SELF_DRIVE_TEASER_LIMIT = 3;

export interface SelfDriveRentalsProps {
  vehicles: VehicleOption[];
  /** Only passed when Self-Drive Car is the just-submitted search's active service —
   *  carries pickup/date/returnDate into the enquiry and WhatsApp message. */
  pickup?: string;
  date?: string;
  returnDate?: string;
  /** Attribution when reached via a specific Journey/Package's "Plan Transport" link —
   *  preserved into the enquiry and the WhatsApp lead rather than silently dropped. */
  journeyContext?: { from?: string; journeySlug?: string };
  /** Only passed when Self-Drive Car is the just-submitted search's active service —
   *  shown instead of hiding the section entirely when that narrowed search is empty. */
  activeSearchEmptyMessage?: string;
  /** e.g. "Self Drive in Manali · 27 Aug – 30 Aug" — only when this search is active. */
  searchSummary?: string;
  /** True when Self-Drive Car is the active ?service= — switches from a capped
   *  main-page teaser to the full, filterable results view (brief's "View All
   *  Self-Drive Cars" destination). */
  isActiveService?: boolean;
  transmission?: string;
  minSeats?: number;
  maxPrice?: number;
  /** Real values derived from the full (unfiltered) self-drive fleet — feeds the
   *  filter bar's options so it never offers a choice with zero real inventory. */
  availableTransmissions?: string[];
  availableSeatCounts?: number[];
  /** The active `?vehicle=` category, only when this search is active — used to name
   *  the empty state and the custom-quote CTA after the actual car type ("No Sedan
   *  rentals..." / "Request a Sedan") instead of a generic message. */
  vehicleCategory?: string;
}

// "Check Availability" reuses the existing, proven BookingRequestModal lead-capture
// flow (same one TransportResults's empty-state "Request a Custom Quote" already
// uses) rather than the multi-day Plan My Journey wizard "Request This Vehicle" hands
// off to elsewhere on this page — a lighter-weight ask fits "is this car free for two
// days" better than a full itinerary wizard.
export default function SelfDriveRentals({
  vehicles,
  pickup,
  date,
  returnDate,
  journeyContext,
  activeSearchEmptyMessage,
  searchSummary,
  isActiveService = false,
  transmission,
  minSeats,
  maxPrice,
  availableTransmissions = [],
  availableSeatCounts = [],
  vehicleCategory
}: SelfDriveRentalsProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [popupCategory, setPopupCategory] = useState<string | null>(null);
  const { openBookingRequest } = useBookingRequest();
  // The discovery popup opens straight from the main-page teaser, before any Hero
  // Search is submitted — so its request/WhatsApp context is read live from the
  // canonical TransportSearchContext instead of this component's own
  // pickup/date/returnDate props (which stay `undefined` until a Search actually
  // narrows this section to `isActiveService`).
  const { fields } = useTransportSearch();

  if (isActiveService && vehicles.length === 0 && !activeSearchEmptyMessage) return null;

  const visibleVehicles = isActiveService ? vehicles : vehicles.slice(0, SELF_DRIVE_TEASER_LIMIT);
  const popupVehicles = popupCategory ? vehicles.filter((v) => v.category === popupCategory) : [];
  const popupEntry = popupCategory ? selfDriveCarTypeEntry(popupCategory) : undefined;

  function handleCheckAvailability(vehicle: VehicleOption) {
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: pickup,
      dates: date,
      details: {
        serviceType: 'Self-Drive Car',
        vehicleSlug: vehicle.slug ?? vehicle.id,
        pickup,
        date,
        returnDate,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-self-drive'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({ referenceId, pickup, date, returnDate, vehicleName: vehicle.name })
    });
  }

  function handleCustomQuote() {
    openBookingRequest({
      type: 'transport',
      itemName: vehicleCategory ? `Custom ${vehicleCategory} quote` : 'Custom self-drive quote',
      details: { serviceType: 'Self-Drive Car', vehicleCategory, source: 'transport-self-drive-empty-state' }
    });
  }

  // Popup-origin equivalents of the two handlers above — same BookingRequestModal
  // flow, sourced from live Hero field state rather than this component's props.
  function handlePopupRequestVehicle(vehicle: VehicleOption) {
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: fields.pickup || undefined,
      dates: fields.date || undefined,
      details: {
        serviceType: 'Self-Drive Car',
        vehicleSlug: vehicle.slug ?? vehicle.id,
        pickup: fields.pickup || undefined,
        date: fields.date || undefined,
        returnDate: fields.returnDate || undefined,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-self-drive-popup'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({
          referenceId,
          pickup: fields.pickup || undefined,
          date: fields.date || undefined,
          returnDate: fields.returnDate || undefined,
          vehicleName: vehicle.name
        })
    });
  }

  function handlePopupCustomQuote(category: string) {
    openBookingRequest({
      type: 'transport',
      itemName: `Custom ${category} quote`,
      details: { serviceType: 'Self-Drive Car', vehicleCategory: category, source: 'transport-self-drive-popup-empty-state' }
    });
  }

  function handlePopupViewDetails(vehicle: VehicleOption) {
    // Close the popup before opening TransportDetail — no modal-on-modal.
    setPopupCategory(null);
    setSelectedVehicle(vehicle);
  }

  function handlePopupRequestFromCard(vehicle: VehicleOption) {
    setPopupCategory(null);
    handlePopupRequestVehicle(vehicle);
  }

  return (
    <section id={isActiveService ? 'transport-results' : undefined} className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Self-drive rentals</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Drive the Himalayas Your Way</h2>
      {searchSummary ? <p className="mt-2 text-sm text-slate-500">{searchSummary}</p> : null}

      {isActiveService ? (
        <SelfDriveFilterBar
          availableTransmissions={availableTransmissions}
          availableSeatCounts={availableSeatCounts}
          transmission={transmission}
          minSeats={minSeats}
          maxPrice={maxPrice}
        />
      ) : null}

      {!isActiveService ? (
        <SelfDriveCarTypeCategories allSelfDriveVehicles={vehicles} onSelectCategory={setPopupCategory} />
      ) : visibleVehicles.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleVehicles.map((vehicle) => (
            <TransportCard
              key={vehicle.slug ?? vehicle.id}
              vehicle={vehicle}
              pickup={pickup}
              date={date}
              returnDate={returnDate}
              journeyContext={journeyContext}
              ctaLabel="Check Availability"
              onViewDetails={setSelectedVehicle}
              onRequestVehicle={handleCheckAvailability}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-glow">
          <p className="text-lg font-semibold text-slate-900">{activeSearchEmptyMessage}</p>
          <p className="mt-3 text-slate-600">Tell us what you need and our travel experts will arrange it for you.</p>
          <NoInventoryActions
            onRequestCustomVehicle={handleCustomQuote}
            requestLabel={vehicleCategory ? `Request a ${vehicleCategory}` : undefined}
          />
        </div>
      )}

      {!isActiveService && vehicles.length > 0 ? (
        <Link
          href="/transport?service=self-drive"
          className="cursor-hover mt-6 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
        >
          View All Self-Drive Cars <ArrowRight size={16} />
        </Link>
      ) : null}

      {popupCategory && popupEntry ? (
        <SelfDriveCategoryPopup
          category={popupCategory}
          popupTitle={popupEntry.popupTitle}
          vehicles={popupVehicles}
          journeyContext={journeyContext}
          onClose={() => setPopupCategory(null)}
          onViewDetails={handlePopupViewDetails}
          onRequestVehicle={handlePopupRequestFromCard}
          onRequestCustomVehicle={() => {
            setPopupCategory(null);
            handlePopupCustomQuote(popupCategory);
          }}
        />
      ) : null}

      {selectedVehicle ? (
        <TransportDetail
          vehicle={selectedVehicle}
          pickup={isActiveService ? pickup : fields.pickup || undefined}
          date={isActiveService ? date : fields.date || undefined}
          returnDate={isActiveService ? returnDate : fields.returnDate || undefined}
          journeyContext={journeyContext}
          ctaLabel="Check Availability"
          onRequestVehicle={isActiveService ? handleCheckAvailability : handlePopupRequestVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      ) : null}
    </section>
  );
}
