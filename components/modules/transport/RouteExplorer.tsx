import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TransportRoute } from '@/types/transport';

export interface RouteExplorerProps {
  routes: TransportRoute[];
}

export default function RouteExplorer({ routes }: RouteExplorerProps) {
  if (routes.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Popular routes</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Himalayan routes we cover</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <div key={`${route.origin}-${route.destination}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-glow">
            <h3 className="text-lg font-semibold text-slate-900">
              {route.origin} → {route.destination}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {route.estimatedDuration ? <span className="rounded-full bg-slate-100 px-3 py-1">{route.estimatedDuration}</span> : null}
              {route.seasonalStatus ? <span className="rounded-full bg-slate-100 px-3 py-1">{route.seasonalStatus}</span> : null}
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {route.startingFare ? `Starting from ₹${route.startingFare.toLocaleString('en-IN')}` : 'Get a Custom Quote'}
            </p>
            <Link
              href={`/transport?pickup=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}#transport-results`}
              className="cursor-hover mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
            >
              Plan This Route <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
