'use client';

import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { getPackageSeasonLabels } from '@/lib/packageFilters';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Destination, Season, TravelPackage } from '@/types';

export interface SeasonalDiscoveryProps {
  packages: TravelPackage[];
  seasons: Season[];
  destinationsBySlug: Map<string, Destination>;
  activeSeasons: string[];
  onSelect: (seasonLabel: string) => void;
}

export default function SeasonalDiscovery({ packages, seasons, destinationsBySlug, activeSeasons, onSelect }: SeasonalDiscoveryProps) {
  return (
    <section className="">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Best Time to Travel</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">When Do You Want to Go?</h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {seasons.map((season) => {
            const matching = packages.filter((pkg) => getPackageSeasonLabels(pkg, destinationsBySlug).includes(season.label));
            const active = activeSeasons.includes(season.label);
            if (!matching.length) return null;
            return (
              <motion.button
                type="button"
                key={season.id}
                variants={fadeInUp}
                onClick={() => onSelect(season.label)}
                className={cn(
                  'cursor-hover flex h-full flex-col items-start gap-2 rounded-2xl border p-5 text-left shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1',
                  active ? 'border-apex-500 bg-apex-50' : 'border-slate-200 bg-white hover:border-apex-400/50'
                )}
              >
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', active ? 'bg-apex-500 text-white' : 'bg-apex-50 text-apex-600')}>
                  <CalendarDays size={18} strokeWidth={1.5} />
                </span>
                <h3 className="text-base font-semibold text-slate-900">{season.label}</h3>
                <p className="text-xs text-slate-500">{season.months}</p>
                <p className="mt-auto text-xs font-semibold text-apex-600">
                  {matching.length} journey{matching.length === 1 ? '' : 's'}
                </p>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
