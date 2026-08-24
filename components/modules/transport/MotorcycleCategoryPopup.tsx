'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import type { MotorcycleTypeUiEntry } from '@/config/transportServiceTypes.config';
import TransportCard from './TransportCard';
import NoInventoryActions from './NoInventoryActions';
import type { VehicleOption } from '@/types/transport';

export interface MotorcycleCategoryPopupProps {
  typeEntry: MotorcycleTypeUiEntry;
  /** The real, unfiltered Bike/Motorcycle fleet — filtered client-side by category,
   *  never a separate fetch. */
  allBikeVehicles: VehicleOption[];
  /** Sourced by the caller from the shared TransportSearchContext (read-only) — this
   *  popup never writes to it, so there's no second copy of search state. */
  pickup?: string;
  date?: string;
  returnDate?: string;
  quantity?: number;
  journeyContext?: { from?: string; journeySlug?: string };
  onClose: () => void;
  onViewDetails: (vehicle: VehicleOption) => void;
  onRequestVehicle: (vehicle: VehicleOption) => void;
  onRequestCategory: (typeLabel: string) => void;
}

/**
 * In-page discovery popup for a single motorcycle type — opened from
 * MotorcycleTypeCategories without any navigation or Hero/URL change. Vehicle cards
 * reuse TransportCard exactly as the full results view does; View Details/Check
 * Availability close this popup first (the caller wires that) so it never stacks with
 * TransportDetail/BookingRequestModal.
 */
export default function MotorcycleCategoryPopup({
  typeEntry,
  allBikeVehicles,
  pickup,
  date,
  returnDate,
  quantity,
  journeyContext,
  onClose,
  onViewDetails,
  onRequestVehicle,
  onRequestCategory
}: MotorcycleCategoryPopupProps) {
  const [maxPrice, setMaxPrice] = useState('');

  const matchingVehicles = allBikeVehicles
    .filter((v) => v.category && typeEntry.categories.includes(v.category))
    .filter((v) => {
      const max = Number(maxPrice);
      return !maxPrice || !max || v.estimatedFromPrice <= max;
    });

  const contextParts = [pickup, date && returnDate ? `${date} – ${returnDate}` : date].filter((part): part is string => Boolean(part));

  return (
    <FloatingOverlay
      open
      onClose={onClose}
      labelledBy="motorcycle-category-popup-title"
      panelClassName="max-w-2xl rounded-3xl pointer-events-auto p-6 sm:p-8 bg-white shadow-glow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Bike rental</p>
          <h2 id="motorcycle-category-popup-title" className="mt-1 text-2xl font-bold text-slate-900">
            {typeEntry.label}
          </h2>
          {contextParts.length > 0 ? <p className="mt-1 text-sm text-slate-500">{contextParts.join(' · ')}</p> : null}
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

      {matchingVehicles.length > 0 ? (
        <label className="mt-5 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max price / day</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="w-28 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors duration-300 ease-in-out hover:border-apex-400/50 focus:border-apex-400"
          />
        </label>
      ) : null}

      {matchingVehicles.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {matchingVehicles.map((vehicle) => (
            <TransportCard
              key={vehicle.slug ?? vehicle.id}
              vehicle={vehicle}
              pickup={pickup}
              date={date}
              returnDate={returnDate}
              quantity={quantity}
              journeyContext={journeyContext}
              ctaLabel="Check Availability"
              onViewDetails={onViewDetails}
              onRequestVehicle={onRequestVehicle}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">No {typeEntry.label.toLowerCase()} are currently listed for this trip.</p>
          <p className="mt-3 text-slate-600">Tell us what you need and our travel experts will arrange it for you.</p>
          <NoInventoryActions onRequestCustomVehicle={() => onRequestCategory(typeEntry.label)} requestLabel={`Request a ${typeEntry.label}`} />
        </div>
      )}
    </FloatingOverlay>
  );
}
