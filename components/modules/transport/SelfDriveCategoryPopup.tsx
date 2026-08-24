'use client';

import { X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import TransportCard from './TransportCard';
import NoInventoryActions from './NoInventoryActions';
import { useTransportSearch } from './TransportSearchContext';
import type { VehicleOption } from '@/types/transport';

export interface SelfDriveCategoryPopupProps {
  category: string;
  popupTitle: string;
  /** Already filtered to `category` by the caller (client-side, from the same
   *  unfiltered fleet the main-page teaser already has — no extra fetch). */
  vehicles: VehicleOption[];
  journeyContext?: { from?: string; journeySlug?: string };
  onClose: () => void;
  /** Closes this popup itself before/while opening TransportDetail — see
   *  SelfDriveRentals.tsx, which owns that transition to avoid modal-on-modal. */
  onViewDetails: (vehicle: VehicleOption) => void;
  onRequestVehicle: (vehicle: VehicleOption) => void;
  onRequestCustomVehicle: () => void;
}

/**
 * "Drive the Himalayas Your Way" discovery popup — opened by a car-type card click,
 * showing that type's real inventory in place rather than navigating to the full
 * #transport-results view. Pickup/date/returnDate are read straight from the
 * canonical TransportSearchContext (never a second copy) so the popup reflects
 * whatever's already in the Hero without requiring a Search submission first.
 */
export default function SelfDriveCategoryPopup({
  category,
  popupTitle,
  vehicles,
  journeyContext,
  onClose,
  onViewDetails,
  onRequestVehicle,
  onRequestCustomVehicle
}: SelfDriveCategoryPopupProps) {
  const { fields } = useTransportSearch();
  const tripLine = [fields.pickup, [fields.date, fields.returnDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');

  return (
    <FloatingOverlay
      open
      onClose={onClose}
      labelledBy="self-drive-category-popup-title"
      panelClassName="max-w-4xl rounded-3xl pointer-events-auto p-6 sm:p-8 bg-white shadow-glow max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Self-drive rentals</p>
          <h2 id="self-drive-category-popup-title" className="mt-1 text-2xl font-bold text-slate-900">
            {popupTitle}
          </h2>
          {tripLine ? <p className="mt-1 text-sm text-slate-500">{tripLine}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-hover rounded-full p-1 text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          <X size={20} />
        </button>
      </div>

      {vehicles.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <TransportCard
              key={vehicle.slug ?? vehicle.id}
              vehicle={vehicle}
              pickup={fields.pickup || undefined}
              date={fields.date || undefined}
              returnDate={fields.returnDate || undefined}
              journeyContext={journeyContext}
              ctaLabel="Check Availability"
              onViewDetails={onViewDetails}
              onRequestVehicle={onRequestVehicle}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">No {category} rentals are currently listed for this trip.</p>
          <p className="mt-3 text-slate-600">Tell us what you need and our travel experts will arrange it for you.</p>
          <NoInventoryActions onRequestCustomVehicle={onRequestCustomVehicle} requestLabel={`Request a ${category}`} />
        </div>
      )}
    </FloatingOverlay>
  );
}
