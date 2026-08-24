'use client';

import { Car, Mountain, Users2, Users, type LucideIcon } from 'lucide-react';
import type { ServiceType } from '@/config/transportServiceTypes.config';
import { useTransportSearch } from './TransportSearchContext';
import { cn } from '@/lib/utils';

interface FitGuide {
  icon: LucideIcon;
  journey: string;
  suitable: string;
  description: string;
  service: ServiceType;
  /** Only set when the guide points at one specific, real vehicle type (verified
   *  against config/transport.config.ts's seeded catalog) rather than "either of
   *  these" — leaving it unset means the card only selects the Ride Style. */
  vehicleLabel?: string;
}

// Journey-fit guidance, not a vehicle inventory grid — "Choose Your Vehicle" further
// down the page is the actual real-inventory discovery layer. This section only helps
// a visitor understand which Ride Style generally suits their trip; it never shows a
// specific vehicle photo/seat count, since that would misleadingly imply "this exact
// model is what you'll get."
const FIT_GUIDES: FitGuide[] = [
  {
    icon: Users,
    journey: 'Couple / Small Group',
    suitable: 'Sedan or a comfortable SUV',
    description: 'Comfortable, economical rides for two to four travellers.',
    service: 'Cab with Driver'
  },
  {
    icon: Car,
    journey: 'Family / Mountain Journey',
    suitable: 'SUV',
    description: 'Sure-footed on mountain roads, with room for luggage.',
    service: 'Cab with Driver',
    vehicleLabel: 'SUV'
  },
  {
    icon: Users2,
    journey: 'Large Group',
    suitable: 'Tempo Traveller or a suitable group vehicle',
    description: 'Built for friends, families and tours travelling together.',
    service: 'Group Transport',
    vehicleLabel: 'Tempo Traveller'
  },
  {
    icon: Mountain,
    journey: 'Remote Himalayan Journey',
    suitable: 'SUV or 4x4, depending on route and availability',
    description: 'For Spiti, Kinnaur, Lahaul and other remote, high-altitude routes.',
    service: '4x4 / Mountain Vehicle'
  }
];

export default function VehicleCategories() {
  const { fields, selectRideStyle, selectVehicleFit } = useTransportSearch();

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Journey guidance</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Pick the right fit for your journey</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FIT_GUIDES.map(({ icon: Icon, journey, suitable, description, service, vehicleLabel }) => {
          const selected = fields.service === service && (!vehicleLabel || fields.vehicle === vehicleLabel);
          return (
            <button
              key={journey}
              type="button"
              aria-pressed={selected}
              onClick={() => (vehicleLabel ? selectVehicleFit(service, vehicleLabel) : selectRideStyle(service))}
              className={cn(
                'cursor-hover block w-full rounded-2xl border bg-white p-5 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl',
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
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{journey}</h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-apex-600">{suitable}</p>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
