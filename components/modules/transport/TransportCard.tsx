'use client';

import { Briefcase, Snowflake, Users } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { formatINR } from '@/lib/pricing';
import type { VehicleOption } from '@/types/transport';

export interface TransportCardProps {
  vehicle: VehicleOption;
  pickup?: string;
  destination?: string;
  onViewDetails: (vehicle: VehicleOption) => void;
  onRequestVehicle: (vehicle: VehicleOption) => void;
}

export default function TransportCard({ vehicle, pickup, destination, onViewDetails, onRequestVehicle }: TransportCardProps) {
  const routeLabel = pickup && destination ? `${pickup} → ${destination}` : undefined;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-glow transition hover:-translate-y-1">
      <div className="relative overflow-hidden bg-slate-100">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {vehicle.category ? (
          <span className="absolute left-4 top-4 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">
            {vehicle.category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{vehicle.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{vehicle.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Users size={16} className="text-apex-600" />
            {vehicle.seats} seats
          </span>
          {vehicle.luggageCapacity ? (
            <span className="inline-flex items-center gap-2">
              <Briefcase size={16} className="text-apex-600" />
              {vehicle.luggageCapacity}
            </span>
          ) : null}
          {vehicle.acType ? (
            <span className="inline-flex items-center gap-2">
              <Snowflake size={16} className="text-apex-600" />
              {vehicle.acType}
            </span>
          ) : null}
        </div>

        {vehicle.inclusions?.length ? (
          <div className="flex flex-wrap gap-2">
            {vehicle.inclusions.slice(0, 4).map((inclusion) => (
              <span key={inclusion} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {inclusion}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-slate-500">Availability on request</p>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {vehicle.estimatedFromPrice ? 'Estimated from' : ''}
            </p>
            <p className="text-xl font-bold text-slate-900">
              {vehicle.estimatedFromPrice ? formatINR(vehicle.estimatedFromPrice) : 'Price on request'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onViewDetails(vehicle)}
              className="cursor-hover text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
            >
              View Details
            </button>
            <button
              type="button"
              onClick={() => onRequestVehicle(vehicle)}
              className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              Request This Vehicle
            </button>
          </div>
        </div>

        <a
          href={buildWhatsAppLink({ destination: routeLabel ?? vehicle.name, tripTitle: vehicle.name })}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]"
        >
          <WhatsAppIcon size={16} />
          Customise on WhatsApp
        </a>
      </div>
    </article>
  );
}
