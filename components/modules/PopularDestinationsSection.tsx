'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import PopularDestinationCard from '@/components/modules/PopularDestinationCard';
import DestinationMatchModal from '@/components/modules/DestinationMatchModal';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Destination } from '@/types';

export interface PopularDestinationsSectionProps {
  /** Already filtered to isPopular, sorted by priority, and capped to 8 by the caller (app/page.tsx). */
  destinations: Array<Destination & { priceLabel?: string }>;
}

const REGION_TABS = ['Himachal', 'Kashmir', 'Uttarakhand'] as const;
type RegionTab = (typeof REGION_TABS)[number];

function matchesRegion(state: string | undefined, tab: RegionTab) {
  if (!state) return false;
  if (tab === 'Himachal') return state.includes('Himachal');
  if (tab === 'Kashmir') return state.includes('Kashmir');
  return state === 'Uttarakhand';
}

export default function PopularDestinationsSection({ destinations }: PopularDestinationsSectionProps) {
  const [activeRegion, setActiveRegion] = useState<RegionTab>('Himachal');
  const [matchModalOpen, setMatchModalOpen] = useState(false);

  const filtered = useMemo(
    () => destinations.filter((destination) => matchesRegion(destination.state, activeRegion)),
    [destinations, activeRegion]
  );

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="flex flex-col gap-3 text-center"
        >
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">EXPLORE THE HIMALAYAS</p>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            Popular <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Destinations</span>
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            The valleys, meadows and riverfronts travelers keep coming back to — curated by our team and ranked by what actually
            makes each one worth the journey.
          </p>
        </motion.div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {REGION_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveRegion(tab)}
              aria-pressed={activeRegion === tab}
              className={cn(
                'cursor-hover rounded-full px-5 py-3 font-medium text-md transition',
                activeRegion === tab
                  ? ' font-semibold bg-apex-500 text-white shadow-lg shadow-apex-500/30'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((destination, index) => (
            <PopularDestinationCard
              key={destination.slug}
              destination={destination}
              priceLabel={destination.priceLabel}
              priority={index < 4}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-slate-500">No popular destinations in this region yet — check back soon.</p>
        ) : null}

        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-xl sm:flex-row sm:justify-between sm:p-7">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-apex-100 text-apex-700">
            <Sparkles size={24} />
          </span>
          <div className='flex min-w-0 flex-1 flex-col gap-2 text-center sm:text-start'>
            <h3 className="text-xl font-bold text-slate-900">Not sure where to go?</h3>
            <p className="text-sm text-slate-600">
              Tell us what you love — adventure, nature, luxury, quiet or slow travel — and we'll match you to your ideal
              Himalayan destination.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMatchModalOpen(true)}
            className="cursor-hover inline-flex shrink-0 items-center gap-2 rounded-lg bg-apex-500 px-7 py-4 font-mediu text-white shadow-lg shadow-apex-500/20 transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Discover Your Match <ArrowRight size={24} />
          </button>
        </div>

        <div className="mt-10 flex justify-center">
          <ButtonLink href="/destinations" variant="primary" size="lg">
            Explore All Destinations
            <ArrowRight size={20} />
          </ButtonLink>
        </div>
      </div>

      <DestinationMatchModal open={matchModalOpen} onClose={() => setMatchModalOpen(false)} />
    </section>
  );
}
