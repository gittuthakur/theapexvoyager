'use client';

import { MapPin, MapPinned } from 'lucide-react';
import type { Destination } from '@/types';

export interface MapViewPlaceholderProps {
  destinations: Destination[];
}

// Map-ready, not map-functional: once a Google Maps API key is wired up, a real
// map component can read `destination.coordinates` (already on the Destination type)
// and drop in here without any other change to DestinationsExplorer, which only
// ever renders <MapViewPlaceholder destinations={...} /> when view === 'map'.
export default function MapViewPlaceholder({ destinations }: MapViewPlaceholderProps) {
  const withCoordinates = destinations.filter((destination) => destination.coordinates);

  return (
    <div className="relative mt-6 flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-apex-50 p-10 text-center shadow-glow">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {destinations.slice(0, 8).map((destination, index) => (
          <MapPin
            key={destination.slug}
            size={22}
            className="absolute -translate-x-1/2 -translate-y-full text-apex-400"
            style={{ left: `${12 + ((index * 11) % 76)}%`, top: `${18 + ((index * 17) % 55)}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-apex-600 shadow-lg">
        <MapPinned size={28} aria-hidden="true" />
      </span>
      <p className="mt-5 text-lg font-semibold text-slate-900">Map view is coming soon</p>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        We&apos;re wiring up an interactive map of every destination. For now, switch back to Cards to browse and filter the full list.
      </p>
      <p className="mt-4 text-xs font-medium text-slate-400">
        {withCoordinates.length} of {destinations.length} destinations have mapped coordinates so far.
      </p>
    </div>
  );
}
