'use client';

import { useState } from 'react';
import { Briefcase, Cog, Snowflake, Users } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { SafeImage } from '@/components/ui/SafeImage';
import { openTransportWhatsAppLead } from '@/lib/whatsapp';
import { formatINR } from '@/lib/pricing';
import type { VehicleOption } from '@/types/transport';

export interface TransportCardProps {
  vehicle: VehicleOption;
  pickup?: string;
  destination?: string;
  /** Optional — only used to enrich the "Customise on WhatsApp" message. */
  date?: string;
  travellers?: string;
  /** Optional — Self-Drive/Bike return date, only used to enrich the WhatsApp message. */
  returnDate?: string;
  /** Optional — 4x4 "With Driver"/"Self Drive", only used to enrich the WhatsApp message. */
  driveMode?: string;
  /** Optional — Bike rental quantity, only used to enrich the WhatsApp message. */
  quantity?: number;
  /** Attribution when this vehicle was reached via a specific Journey/Package's
   *  "Plan Transport" link — carried into the WhatsApp lead so it isn't lost. */
  journeyContext?: { from?: string; journeySlug?: string };
  /** Defaults to 'Request This Vehicle' — set to e.g. 'Check Availability' for rental-style sections. */
  ctaLabel?: string;
  onViewDetails: (vehicle: VehicleOption) => void;
  onRequestVehicle: (vehicle: VehicleOption) => void;
}

export default function TransportCard({
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
  onViewDetails,
  onRequestVehicle
}: TransportCardProps) {
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

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
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <SafeImage
          src={vehicle.image}
          alt={vehicle.name}
          fill
          sizes="(min-width: 1024px) 33vw, 90vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {vehicle.category ? (
          <span className="absolute left-4 top-4 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white shadow-lg">
            {vehicle.category}
            {vehicle.withDriver !== undefined ? (vehicle.withDriver ? ' · With Driver' : ' · Self-Drive') : ''}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-6">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">{vehicle.name}</h3>
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
          {vehicle.transmission ? (
            <span className="inline-flex items-center gap-2">
              <Cog size={16} className="text-apex-600" />
              {vehicle.transmission}
            </span>
          ) : null}
        </div>

        {vehicle.inclusions?.length ? (
          <div className="flex flex-wrap gap-2">
            {vehicle.inclusions.slice(0, 4).map((inclusion) => (
              <span key={inclusion} className="rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-600">
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
            <p className="text-3xl font-bold text-slate-900">
              {vehicle.estimatedFromPrice ? formatINR(vehicle.estimatedFromPrice) : 'Price on request'}
            </p>
            {vehicle.estimatedFromPrice && vehicle.priceNote ? <p className="mt-1 text-xs text-slate-500">{vehicle.priceNote}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onRequestVehicle(vehicle)}
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-lg bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            {ctaLabel ?? 'Request This Vehicle'}
          </button>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onViewDetails(vehicle)}
              className="cursor-hover text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
            >
              View Details
            </button>
            <button
              type="button"
              onClick={handleCustomiseOnWhatsApp}
              disabled={sendingWhatsApp}
              aria-busy={sendingWhatsApp}
              className="cursor-hover inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <WhatsAppIcon size={16} />
              {sendingWhatsApp ? 'Opening…' : 'Customise on WhatsApp'}
            </button>
          </div>
        </div>

      </div>
    </article>
  );
}
