'use client';

import { Bike, Car, KeyRound, MountainSnow, Navigation, Users2, type LucideIcon } from 'lucide-react';
import { SERVICE_TYPE_UI, type ServiceType } from '@/config/transportServiceTypes.config';
import { useTransportSearch } from './TransportSearchContext';
import { cn } from '@/lib/utils';

const SERVICE_TYPE_ICONS: Record<ServiceType, LucideIcon> = {
  'Cab with Driver': Car,
  'Local Taxi': Car,
  'Group Transport': Users2,
  '4x4 / Mountain Vehicle': MountainSnow,
  'Self-Drive Car': KeyRound,
  'Bike / Motorcycle': Bike,
  'Local Mobility': Navigation
};

/**
 * "Choose Your Ride Style" (brief §8) — placed right after the hero, before "What We
 * Arrange". Clicking a card writes straight into TransportSearchContext (shared with
 * the Hero and the other two discovery sections) so the Hero's fields update
 * immediately, in the same render — no navigation round-trip required for the visual
 * change. The context action itself still syncs the URL and clears any incompatible
 * field, so refresh/back-forward stay consistent.
 */
export default function ChooseRideStyle() {
  const { fields, selectRideStyle } = useTransportSearch();

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">How would you like to travel</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Choose Your Ride Style</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_TYPE_UI.map(({ value, label, description }) => {
          const Icon = SERVICE_TYPE_ICONS[value];
          const selected = fields.service === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => selectRideStyle(value)}
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
