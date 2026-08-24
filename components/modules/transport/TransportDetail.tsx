'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Briefcase, Snowflake, Users, X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { openTransportWhatsAppLead } from '@/lib/whatsapp';
import { formatINR, splitTransportPriceNote } from '@/lib/pricing';
import type { VehicleOption } from '@/types/transport';

/** Parses a 'YYYY-MM-DD' string as a local-time Date, avoiding the UTC-midnight
 *  off-by-one day that `new Date('YYYY-MM-DD')` can produce in negative-UTC timezones. */
function parseISODateLocal(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatTripDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return format(parseISODateLocal(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
}

export interface TransportDetailProps {
  vehicle: VehicleOption;
  pickup?: string;
  destination?: string;
  date?: string;
  travellers?: string;
  /** Optional — Self-Drive/Bike return date, only used to enrich the WhatsApp message. */
  returnDate?: string;
  /** Optional — 4x4 "With Driver"/"Self Drive", only used to enrich the WhatsApp message. */
  driveMode?: string;
  /** Optional — Bike rental quantity, only used to enrich the WhatsApp message. */
  quantity?: number;
  journeyContext?: { from?: string; journeySlug?: string };
  /** Defaults to 'Request This Vehicle' — set to e.g. 'Check Availability' for rental-style sections. */
  ctaLabel?: string;
  /** Every caller supplies its own request handler (BookingRequestModal lead-capture,
   *  with full search context in `details`) so "View Details" offers the same action
   *  as the card's own CTA. */
  onRequestVehicle: (vehicle: VehicleOption) => void;
  onClose: () => void;
}

export default function TransportDetail({
  vehicle,
  pickup,
  destination,
  date,
  travellers,
  returnDate,
  driveMode,
  quantity,
  journeyContext,
  ctaLabel,
  onRequestVehicle,
  onClose
}: TransportDetailProps) {
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const priceSplit = vehicle.estimatedFromPrice ? splitTransportPriceNote(vehicle.priceNote) : null;
  const priceDetail = priceSplit ? priceSplit.detail : vehicle.priceNote;

  const tripRouteLine = pickup && destination ? `${pickup} → ${destination}` : pickup || destination;
  // Gated on real trip facts (or journey attribution) only — `vehicle.serviceType` is
  // added to the detail line below once this is already true, but never triggers the
  // box on its own, since every vehicle has one regardless of whether anything was
  // actually searched.
  const hasTripSummary = Boolean(
    tripRouteLine || date || returnDate || travellers || driveMode || (quantity && quantity > 1) || journeyContext?.from
  );
  const tripDetailParts = hasTripSummary
    ? [
        formatTripDate(date),
        returnDate ? `Return ${formatTripDate(returnDate)}` : undefined,
        travellers ? `${travellers} Traveller${travellers === '1' ? '' : 's'}` : undefined,
        driveMode,
        quantity && quantity > 1 ? `${quantity} vehicles` : undefined,
        vehicle.serviceType
      ].filter((part): part is string => Boolean(part))
    : [];

  function handleCustomiseOnWhatsApp() {
    if (sendingWhatsApp) return;
    setSendingWhatsApp(true);
    openTransportWhatsAppLead({
      vehicle,
      pickup,
      destination,
      date,
      returnDate,
      travelers: travellers,
      driveMode,
      quantity,
      journeyContext
    }).finally(() => setSendingWhatsApp(false));
  }

  // Only the fields this specific vehicle actually has configured — a chauffeur
  // vehicle never has fuelPolicy/securityDeposit set, so it never shows rental
  // language, and a self-drive/bike vehicle never has driver-allowance inclusions.
  const policyDetails: Array<{ label: string; value: string }> = [
    vehicle.pickupLocation ? { label: 'Pickup Location', value: vehicle.pickupLocation } : null,
    vehicle.fuelPolicy ? { label: 'Fuel Policy', value: vehicle.fuelPolicy } : null,
    vehicle.securityDeposit ? { label: 'Security Deposit', value: formatINR(vehicle.securityDeposit) } : null,
    vehicle.includedKilometres ? { label: 'Included Kilometres', value: `${vehicle.includedKilometres} km/day` } : null,
    vehicle.extraKmCharge ? { label: 'Extra Km Charge', value: formatINR(vehicle.extraKmCharge) } : null,
    vehicle.minimumAge ? { label: 'Minimum Age', value: `${vehicle.minimumAge} years` } : null,
    vehicle.drivingLicenceRequired ? { label: 'Driving Licence', value: vehicle.drivingLicenceRequired } : null,
    vehicle.licenceRequired ? { label: 'Licence Required', value: vehicle.licenceRequired } : null,
    vehicle.dropOffPolicy ? { label: 'Drop-off Policy', value: vehicle.dropOffPolicy } : null,
    vehicle.engineCategory ? { label: 'Engine', value: vehicle.engineCategory } : null,
    vehicle.helmetAvailable !== undefined ? { label: 'Helmet', value: vehicle.helmetAvailable ? 'Provided' : 'Not provided' } : null,
    vehicle.rentalTerms ? { label: 'Rental Terms', value: vehicle.rentalTerms } : null
  ].filter((entry): entry is { label: string; value: string } => entry !== null);

  function handleRequest() {
    onRequestVehicle(vehicle);
    onClose();
  }

  return (
    <FloatingOverlay open onClose={onClose} labelledBy="transport-detail-title" panelClassName="max-w-2xl rounded-3xl pointer-events-auto p-6 sm:p-8 bg-white shadow-glow">
      <div className="">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">{vehicle.category ?? 'Vehicle'}</p>
            <h2 id="transport-detail-title" className="mt-1 text-2xl font-bold text-slate-900">
              {vehicle.name}
            </h2>
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

        <div className="mt-5 overflow-hidden rounded-2xl bg-slate-100">
          <img src={vehicle.image} alt={vehicle.name} className="h-64 w-full object-cover" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-center">
            <Users size={18} className="mx-auto text-apex-600" />
            <p className="mt-2 text-sm font-semibold text-slate-900">{vehicle.seats} seats</p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-center">
            <Briefcase size={18} className="mx-auto text-apex-600" />
            <p className="mt-2 text-sm font-semibold text-slate-900">{vehicle.luggageCapacity ?? 'Luggage — on request'}</p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-center">
            <Snowflake size={18} className="mx-auto text-apex-600" />
            <p className="mt-2 text-sm font-semibold text-slate-900">{vehicle.acType ?? 'AC — on request'}</p>
          </div>
        </div>

        {hasTripSummary ? (
          <div className="mt-6 rounded-2xl border border-apex-100 bg-apex-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Your Trip</p>
            {tripRouteLine ? <p className="mt-1 text-base font-semibold text-slate-900">{tripRouteLine}</p> : null}
            {tripDetailParts.length > 0 ? <p className="mt-1 text-sm text-slate-600">{tripDetailParts.join(' · ')}</p> : null}
            {journeyContext?.from === 'journey' ? (
              <p className="mt-2 text-xs font-medium text-apex-600">Linked to your saved journey</p>
            ) : null}
          </div>
        ) : null}

        {vehicle.inclusions?.length ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">Included</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {vehicle.inclusions.map((item) => (
                <span key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {vehicle.exclusions?.length ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-900">Excluded</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {vehicle.exclusions.map((item) => (
                <span key={item} className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {policyDetails.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">Rental &amp; Policy Details</p>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              {policyDetails.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="mt-6 flex gap-5 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              {vehicle.estimatedFromPrice ? 'Estimated from' : ''}
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {vehicle.estimatedFromPrice ? (
                <>
                  {formatINR(vehicle.estimatedFromPrice)}
                  {priceSplit ? <span className="text-lg font-semibold text-slate-500"> / {priceSplit.unit}</span> : null}
                </>
              ) : (
                'Price on request'
              )}
            </p>
            {vehicle.estimatedFromPrice && priceDetail ? <p className="mt-1 text-sm text-slate-500">{priceDetail}</p> : null}
          </div>
          <p className="text-md font-medium text-slate-600">Availability on request</p>
        </div>

        <p className="mt-3 text-xs text-slate-500">Cancellation terms are shared at the time of quote confirmation.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRequest}
            className="cursor-hover flex flex-1 items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            {ctaLabel ?? 'Request This Vehicle'}
          </button>
          <button
            type="button"
            onClick={handleCustomiseOnWhatsApp}
            disabled={sendingWhatsApp}
            aria-busy={sendingWhatsApp}
            className="cursor-hover flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <WhatsAppIcon size={16} />
            {sendingWhatsApp ? 'Opening…' : 'Customise on WhatsApp'}
          </button>
        </div>
      </div>
    </FloatingOverlay>
  );
}
