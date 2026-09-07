import Link from 'next/link';
import { ArrowRight, Bike, Car, Mountain, Truck, Users, type LucideIcon } from 'lucide-react';
import { SERVICE_TYPE_UI, urlSlugFromServiceType, type ServiceType } from '@/config/transportServiceTypes.config';

// Editorial category cards, not live vehicle inventory — same honest pattern as
// ExploreStays' property-type cards. Reuses the real, already-established service
// types (config/transportServiceTypes.config.ts) rather than inventing new labels;
// 'Local Mobility' is intentionally excluded since it ships with zero seeded vehicles
// today (see that file's own comment) and would otherwise link to an empty category.
const SERVICE_ICON: Record<ServiceType, LucideIcon> = {
  'Cab with Driver': Car,
  'Local Taxi': Car,
  'Group Transport': Users,
  '4x4 / Mountain Vehicle': Mountain,
  'Self-Drive Car': Truck,
  'Bike / Motorcycle': Bike,
  'Local Mobility': Car
};

const HOME_SERVICE_TYPES = SERVICE_TYPE_UI.filter((entry) => entry.value !== 'Local Mobility');

export default function HomeTransportPreview() {
  return (
    <section className="bg-slate-100 py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Travel between the stops</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Mountain Transport, <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Planned Around Your Route</span>
            </h2>
            <p className="mt-3 text-slate-600">
              Private cabs, group vehicles, self-drive options and 4x4 support for Himalayan routes — arranged through transport
              partners and confirmed as part of your travel plan.
            </p>
          </div>
          <Link
            href="/transport"
            className="cursor-hover inline-flex shrink-0 items-center gap-1 text-sm font-medium text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-900"
          >
            Explore Transport <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {HOME_SERVICE_TYPES.map((entry) => {
            const Icon = SERVICE_ICON[entry.value];
            return (
              <Link
                key={entry.value}
                href={`/transport?service=${urlSlugFromServiceType(entry.value)}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-apex-300 hover:shadow-md"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-apex-50 text-apex-600 transition-colors duration-300 ease-in-out group-hover:bg-apex-500 group-hover:text-white">
                  <Icon size={24} />
                </span>
                <span className="text-sm font-semibold text-slate-900">{entry.label}</span>
                <span className="text-xs leading-snug text-slate-500">{entry.description}</span>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">Subject to partner availability and route quotation.</p>
      </div>
    </section>
  );
}
