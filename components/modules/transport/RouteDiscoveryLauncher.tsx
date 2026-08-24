'use client';

import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import TransportHeroSearch from './TransportHeroSearch';

export interface FeaturedRouteLink {
  origin: string;
  destination: string;
}

export interface RouteDiscoveryLauncherProps {
  featuredRoutes: FeaturedRouteLink[];
  /** Opens the same Route Booking Popup the featured-route cards use — one
   *  route-booking journey for every entry point, this dialog included. */
  onSelectRoute: (origin: string, destination: string) => void;
}

/**
 * "View All Routes" — opens the same FROM/TO/DATE/PASSENGERS/RIDE STYLE search as the
 * page's own hero (TransportHeroSearch, reused as-is) in a focused dialog, so a visitor
 * isn't limited to the featured route cards and doesn't lose their scroll position.
 * The route catalogue is a curated-content layer, not a whitelist — this dialog accepts
 * any origin/destination pair, not just the featured ones listed below the search.
 */
export default function RouteDiscoveryLauncher({ featuredRoutes, onSelectRoute }: RouteDiscoveryLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-hover inline-flex items-center gap-2 rounded-xl bg-apex-500 px-8 py-4 text-lg font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-apex-400"
      >
        Choose your Routes <ArrowRight size={24} />
      </button>

      {open ? (
        <FloatingOverlay
          open={open}
          onClose={() => setOpen(false)}
          labelledBy="route-discovery-title"
          panelClassName="max-w-5xl rounded-3xl pointer-events-auto p-6 sm:p-8 bg-white shadow-glow"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Route discovery</p>
              <h2 id="route-discovery-title" className="mt-1 text-2xl font-bold text-slate-900">
                Search any route
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="cursor-hover rounded-full p-1 text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Not just the routes below — tell us where you&apos;re starting and where you&apos;re headed, and we&apos;ll
            find or arrange transport for it.
          </p>

          <div className="mt-6">
            <TransportHeroSearch formId="route-discovery-search" onSubmitted={() => setOpen(false)} />
          </div>

          {featuredRoutes.length > 0 ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Or start from a featured route</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {featuredRoutes.map((route) => (
                  <button
                    key={`${route.origin}-${route.destination}`}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSelectRoute(route.origin, route.destination);
                    }}
                    className="cursor-hover inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-300 ease-in-out hover:border-apex-300 hover:text-apex-700"
                  >
                    {route.origin} → {route.destination}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </FloatingOverlay>
      ) : null}
    </>
  );
}
