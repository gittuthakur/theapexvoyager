'use client';

import { Briefcase, Snowflake, Users, X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildWhatsAppLink, buildTransportRequestMessage } from '@/lib/whatsapp';
import { formatINR } from '@/lib/pricing';
import type { VehicleOption } from '@/types/transport';

export interface TransportDetailProps {
  vehicle: VehicleOption;
  pickup?: string;
  destination?: string;
  date?: string;
  travellers?: string;
  journeyContext?: { from?: string; journeySlug?: string };
  onClose: () => void;
}

export default function TransportDetail({ vehicle, pickup, destination, date, travellers, journeyContext, onClose }: TransportDetailProps) {
  const { openBookingRequest } = useBookingRequest();

  const routeLabel = pickup && destination ? `${pickup} → ${destination}` : undefined;

  function handleRequest() {
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

        {routeLabel ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">Route</p>
            <p className="mt-1 text-sm text-slate-600">{routeLabel}</p>
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

        <div className="mt-6 flex gap-5 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              {vehicle.estimatedFromPrice ? 'Estimated from' : ''}
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {vehicle.estimatedFromPrice ? formatINR(vehicle.estimatedFromPrice) : 'Price on request'}
            </p>
            {vehicle.priceNote ? <p className="mt-1 text-sm text-slate-500">{vehicle.priceNote}</p> : null}
          </div>
          <p className="text-md font-medium text-slate-600">Availability on request</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRequest}
            className="cursor-hover flex flex-1 items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Request This Vehicle
          </button>
          <a
            href={buildWhatsAppLink({ destination: routeLabel ?? vehicle.name, tripTitle: vehicle.name })}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-hover flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]"
          >
            <WhatsAppIcon size={16} />
            Customise on WhatsApp
          </a>
        </div>
      </div>
    </FloatingOverlay>
  );
}
