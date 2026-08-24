'use client';

import { Bus, Car, MapPinned, Mountain, Route, Users2, type LucideIcon } from 'lucide-react';
import { TRIP_PURPOSE_UI, type TripPurpose } from '@/config/transportServiceTypes.config';
import { useTransportSearch } from './TransportSearchContext';
import { cn } from '@/lib/utils';

interface ServiceCardMeta {
  icon: LucideIcon;
  description: string;
}

// Trip-use-case discovery, not vehicle inventory — the 6 core Ride Styles (Self-Drive,
// Bike, 4x4, Local Transport) already have their own tiles in "Choose Your Ride Style"
// plus a dedicated section further down, so listing them here too would just duplicate
// that job. Presentation (icon/description) lives here; the value/service/tripType
// mapping each card configures lives in TRIP_PURPOSE_UI (config/transportServiceTypes.config.ts)
// — the same source the Hero's "Purpose: ..." indicator and TransportSearchContext read from.
const SERVICE_CARD_META: Record<TripPurpose, ServiceCardMeta> = {
  'airport-transfer': { icon: Route, description: 'Comfortable pickup and drop services timed to your flight or train.' },
  'local-sightseeing': { icon: MapPinned, description: 'Flexible transport for a day of destination exploration.' },
  intercity: { icon: Car, description: 'Reliable travel between Himalayan destinations.' },
  'multi-day': { icon: Mountain, description: 'A dedicated vehicle and driver for the entire journey.' },
  'remote-himalayan': {
    icon: Bus,
    description: 'Transport for Spiti, Kinnaur, Lahaul and other remote routes, subject to route and seasonal availability.'
  },
  'group-travel': { icon: Users2, description: 'Tempo Travellers, minibuses and suitable vehicles for larger groups.' }
};

export default function TransportServices() {
  const { fields, selectTripPurpose } = useTransportSearch();

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">What we arrange</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">We don&apos;t just arrange a vehicle</h2>
      <p className="mt-3 max-w-2xl text-slate-600">We help you move through the journey.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TRIP_PURPOSE_UI.map(({ value, label }) => {
          const { icon: Icon, description } = SERVICE_CARD_META[value];
          const selected = fields.tripPurpose === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => selectTripPurpose(value)}
              className={cn(
                'cursor-hover block w-full rounded-[1.5rem] border bg-white p-6 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl',
                selected ? 'border-apex-500 ring-2 ring-apex-500/30' : 'border-slate-200'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-14 w-14 items-center justify-center rounded-full',
                  selected ? 'bg-apex-500 text-white' : 'bg-apex-100 text-apex-600'
                )}
              >
                <Icon size={24} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
