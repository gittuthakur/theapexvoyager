'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage } from '@/lib/whatsapp';
import TransportCard from './TransportCard';
import TransportDetail from './TransportDetail';
import NoInventoryActions from './NoInventoryActions';
import MotorcycleTypeCategories from './MotorcycleTypeCategories';
import MotorcycleCategoryPopup from './MotorcycleCategoryPopup';
import { useTransportSearch } from './TransportSearchContext';
import { MOTORCYCLE_TYPE_UI } from '@/config/transportServiceTypes.config';
import type { VehicleOption } from '@/types/transport';

export interface BikeRentalsProps {
  vehicles: VehicleOption[];
  /** Only passed when Bike / Motorcycle is the just-submitted search's active service —
   *  carries pickup/date/returnDate/quantity into the enquiry and WhatsApp message. */
  pickup?: string;
  date?: string;
  returnDate?: string;
  quantity?: number;
  /** Attribution when reached via a specific Journey/Package's "Plan Transport" link —
   *  preserved into the enquiry and the WhatsApp lead rather than silently dropped. */
  journeyContext?: { from?: string; journeySlug?: string };
  /** Only passed when Bike / Motorcycle is the just-submitted search's active service —
   *  shown instead of hiding the section entirely when that narrowed search is empty. */
  activeSearchEmptyMessage?: string;
  /** e.g. "Bike Rental in Manali · 27 Aug" — only when this search is active. */
  searchSummary?: string;
  /** True once Bike / Motorcycle is the page's active service (e.g. via "View All
   *  Bikes" or picking Bike Rental in the Hero) — shows the full matching inventory
   *  instead of the main page's capped featured teaser, and hides the now-redundant
   *  "View All Bikes" link. */
  isActiveService?: boolean;
}

export default function BikeRentals({
  vehicles,
  pickup,
  date,
  returnDate,
  quantity,
  journeyContext,
  activeSearchEmptyMessage,
  searchSummary,
  isActiveService = false
}: BikeRentalsProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [openTypeValue, setOpenTypeValue] = useState<string | null>(null);
  const { openBookingRequest } = useBookingRequest();
  const { fields } = useTransportSearch();

  if (isActiveService && vehicles.length === 0 && !activeSearchEmptyMessage) return null;

  const openTypeEntry = MOTORCYCLE_TYPE_UI.find((entry) => entry.value === openTypeValue) ?? null;

  // In active-service mode (the full-results grid), pickup/date/returnDate/quantity
  // are the just-submitted search's server-validated props, exactly as before. In the
  // main-page teaser (where the category popup lives), there's no submitted search to
  // read props from — the popup instead inherits whatever's currently in the Hero
  // (submitted or not) straight from the shared TransportSearchContext, per the
  // discovery-popup brief's "don't ask them to re-enter it" requirement.
  const effectivePickup = isActiveService ? pickup : fields.pickup || undefined;
  const effectiveDate = isActiveService ? date : fields.date || undefined;
  const effectiveReturnDate = isActiveService ? returnDate : fields.returnDate || undefined;
  const effectiveQuantity = isActiveService ? quantity : fields.quantity;

  function handleCheckAvailability(vehicle: VehicleOption) {
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: effectivePickup,
      dates: effectiveDate,
      details: {
        serviceType: 'Bike / Motorcycle',
        vehicleSlug: vehicle.slug ?? vehicle.id,
        pickup: effectivePickup,
        date: effectiveDate,
        returnDate: effectiveReturnDate,
        quantity: effectiveQuantity,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: isActiveService ? 'transport-bike' : 'transport-bike-category-popup'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({
          referenceId,
          pickup: effectivePickup,
          date: effectiveDate,
          returnDate: effectiveReturnDate,
          quantity: effectiveQuantity,
          vehicleName: vehicle.name
        })
    });
  }

  function handleCustomQuote() {
    openBookingRequest({
      type: 'transport',
      itemName: 'Custom bike rental quote',
      details: { serviceType: 'Bike / Motorcycle', source: 'transport-bike-empty-state' }
    });
  }

  // Each of these closes the category popup before handing off to the exact existing
  // flow — mirrors TransportDetail's own handleRequest (onRequestVehicle + onClose
  // together), so the popup never stacks with TransportDetail/BookingRequestModal.
  function handleViewDetailsFromPopup(vehicle: VehicleOption) {
    setOpenTypeValue(null);
    setSelectedVehicle(vehicle);
  }

  function handleRequestVehicleFromPopup(vehicle: VehicleOption) {
    setOpenTypeValue(null);
    handleCheckAvailability(vehicle);
  }

  function handleRequestCategoryFromPopup(typeLabel: string) {
    setOpenTypeValue(null);
    openBookingRequest({
      type: 'transport',
      itemName: `Custom ${typeLabel} quote`,
      destination: effectivePickup,
      dates: effectiveDate,
      details: {
        serviceType: 'Bike / Motorcycle',
        motorcycleType: typeLabel,
        pickup: effectivePickup,
        date: effectiveDate,
        returnDate: effectiveReturnDate,
        quantity: effectiveQuantity,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-bike-category-popup'
      }
    });
  }

  return (
    <section id={isActiveService ? 'transport-results' : undefined} className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Bike &amp; bullet rentals</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Two Wheels. Endless Roads.</h2>
      {searchSummary ? <p className="mt-2 text-sm text-slate-500">{searchSummary}</p> : null}

      {!isActiveService ? (
        <MotorcycleTypeCategories allBikeVehicles={vehicles} onSelectType={setOpenTypeValue} />
      ) : vehicles.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <TransportCard
              key={vehicle.slug ?? vehicle.id}
              vehicle={vehicle}
              pickup={pickup}
              date={date}
              returnDate={returnDate}
              quantity={quantity}
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
          <NoInventoryActions onRequestCustomVehicle={handleCustomQuote} />
        </div>
      )}

      {!isActiveService && vehicles.length > 0 ? (
        <Link
          href="/transport?service=bike"
          className="cursor-hover mt-6 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
        >
          View All Bikes <ArrowRight size={16} />
        </Link>
      ) : null}

      {openTypeEntry ? (
        <MotorcycleCategoryPopup
          typeEntry={openTypeEntry}
          allBikeVehicles={vehicles}
          pickup={effectivePickup}
          date={effectiveDate}
          returnDate={effectiveReturnDate}
          quantity={effectiveQuantity}
          journeyContext={journeyContext}
          onClose={() => setOpenTypeValue(null)}
          onViewDetails={handleViewDetailsFromPopup}
          onRequestVehicle={handleRequestVehicleFromPopup}
          onRequestCategory={handleRequestCategoryFromPopup}
        />
      ) : null}

      {selectedVehicle ? (
        <TransportDetail
          vehicle={selectedVehicle}
          pickup={effectivePickup}
          date={effectiveDate}
          returnDate={effectiveReturnDate}
          quantity={effectiveQuantity}
          journeyContext={journeyContext}
          ctaLabel="Check Availability"
          onRequestVehicle={handleCheckAvailability}
          onClose={() => setSelectedVehicle(null)}
        />
      ) : null}
    </section>
  );
}
