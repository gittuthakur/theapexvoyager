'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Gem, Map, MapPinned, TentTree } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import type { Destination } from '@/types';

export interface BeyondTouristTrailSectionProps {
  destinations: Destination[];
}

const APEX_PICK_ORDER = ['stay', 'experience', 'taste', 'view', 'moment'] as const;

export default function BeyondTouristTrailSection({ destinations }: BeyondTouristTrailSectionProps) {
  const featured = destinations
    .filter((destination) => destination.apexPicks || destination.hiddenGems?.length)
    .slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="bg-slate-100 py-12 lg:py-16">
      <div className="mx-auto max-w-[1440px] px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="flex flex-col gap-3 text-center"
        >
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Off the main road</p>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Beyond the{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">
              Tourist Trail
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            The picks our local experts return to again and again — and the villages most itineraries skip entirely.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {featured.map((destination) => {
            const pickEntry = APEX_PICK_ORDER.map((key) => destination.apexPicks?.[key]).find(Boolean);
            const gem = destination.hiddenGems?.[0];

            return (
              <motion.div
                key={destination.slug}
                variants={fadeInUp}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
              >
                <p className="font-semibold uppercase tracking-[0.16em] text-apex-600">{destination.title}</p>

                {pickEntry ? (
                  <div className="mt-4 flex items-start gap-3">
                    <span className="mt-0.5 flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
                      <TentTree size={24} />
                    </span>
                    <div className="flex flex-1 flex-col">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Apex Pick</p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{pickEntry.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{pickEntry.description}</p>
                    </div>
                  </div>
                ) : null}

                {gem ? (
                  <div className="mt-5 flex items-start gap-3">
                    <span className="mt-0.5 flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
                      <MapPinned size={24} />
                    </span>
                    <div className="flex flex-1 flex-col">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hidden Gem</p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{gem.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{gem.description}</p>
                    </div>
                  </div>
                ) : null}

                <Link
                  href={`/destinations/${destination.slug}`}
                  className="cursor-hover mt-6 inline-flex items-center gap-2 text-md font-medium text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
                >
                  Discover {destination.title} <ArrowRight size={20} />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
