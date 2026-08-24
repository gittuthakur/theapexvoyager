'use client';

import Link from 'next/link';
import { ArrowRight, Car } from 'lucide-react';
import { useBookingNavigation } from '@/lib/bookingNavigation';
import { formatINR } from '@/lib/pricing';
import type { TransportRoute, VehicleOption } from '@/types/transport';

export interface RegionTransportProps {
  transportServices: TransportRoute[];
  transportVehicles: VehicleOption[];
  regionName: string;
}

export default function RegionTransport({ transportServices, transportVehicles, regionName }: RegionTransportProps) {
  const { navigateToBooking } = useBookingNavigation();
  const hasContent = transportServices.length > 0 || transportVehicles.length > 0;

  return (
    <section id="getting-around" className="py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">Plan the route</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">Getting Around {regionName}</h2>

      {hasContent ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {transportServices.map((route) => (
            <div key={`${route.origin}-${route.destination}`} className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <Car className="text-apex-400" size={24} />
              <h3 className="mt-3 font-semibold text-slate-900">
                {route.origin} → {route.destination}
              </h3>
              {route.estimatedDuration ? (
                <p className="mt-1 text-sm text-slate-500">
                  {route.estimatedDuration}
                  {route.distanceKm ? ` • ${route.distanceKm} km` : ''}
                </p>
              ) : null}
              {route.startingFare ? <p className="mt-3 text-lg font-semibold text-apex-600">From {formatINR(route.startingFare)}</p> : null}
            </div>
          ))}
          {transportVehicles.map((vehicle) => (
            <div key={vehicle.slug ?? vehicle.id} className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <Car className="text-apex-400" size={24} />
              <h3 className="mt-3 font-semibold text-slate-900">{vehicle.name}</h3>
              <p className="mt-3 text-lg font-semibold text-apex-600">From {formatINR(vehicle.estimatedFromPrice)}</p>
              <button
                type="button"
                onClick={() => navigateToBooking({ source: 'transport', slug: vehicle.slug ?? vehicle.id })}
                className="cursor-hover mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-apex-600 hover:text-apex-700"
              >
                Plan Transport <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No fixed routes to {regionName} listed yet — our team can still arrange private transport.
        </p>
      )}

      <Link href={`/transport?destination=${encodeURIComponent(regionName)}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 hover:text-apex-700">
        Plan Transport to {regionName} <ArrowRight size={16} />
      </Link>
    </section>
  );
}
