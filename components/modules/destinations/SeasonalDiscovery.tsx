'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SafeImage } from '@/components/ui/SafeImage';
import { seasons } from '@/config/seasons.config';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Destination } from '@/types';

export interface SeasonalDiscoveryProps {
  destinations: Destination[];
}

const DISPLAY_COUNT = 6;

// Supplementary discovery widget, not the primary filter — the Destination Explorer's
// sidebar Season filter (see DestinationsExplorer.tsx) already owns URL syncing, so
// this stays local client state rather than duplicating that.
export default function SeasonalDiscovery({ destinations }: SeasonalDiscoveryProps) {
  const [activeSeasonId, setActiveSeasonId] = useState(seasons[1].id);
  const activeSeason = seasons.find((season) => season.id === activeSeasonId);
  const matches = activeSeason ? destinations.filter((destination) => destination.seasons?.includes(activeSeason.label)) : [];
  const shown = matches.slice(0, DISPLAY_COUNT);

  return (
    <section className="bg-slate-100 py-12 lg:py-16">
      <section className="mx-auto max-w-[1440px] px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Plan around the seasons</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Best Time to Visit the{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Himalayas</span>
          </h2>
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {seasons.map((season) => (
            <button
              key={season.id}
              type="button"
              onClick={() => setActiveSeasonId(season.id)}
              className={cn(
                'cursor-hover inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out',
                activeSeasonId === season.id ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              )}
            >
              {season.label}
              <span className={cn('text-xs font-normal', activeSeasonId === season.id ? 'text-apex-100' : 'text-slate-400')}>{season.months}</span>
            </button>
          ))}
        </div>

        {shown.length ? (
          <motion.div
            key={activeSeasonId}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {shown.map((destination) => (
              <SeasonalDestinationCard key={destination.slug} destination={destination} />
            ))}
          </motion.div>
        ) : (
          <p className="mt-8 text-center text-slate-500">
            No destinations tagged for {activeSeason?.label} yet — check back as we expand the catalog.
          </p>
        )}
      </section>
    </section>
  );
}

function SeasonalDestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="cursor-hover group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md"
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <SafeImage src={destination.image} alt={destination.title} fill sizes="64px" className="object-cover" loading="lazy" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{destination.title}</p>
        <p className="truncate text-xs text-slate-500">{[destination.region, destination.state].filter(Boolean).join(', ')}</p>
      </div>
    </Link>
  );
}
