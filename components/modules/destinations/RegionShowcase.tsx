'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { regions } from '@/config/regions.config';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import type { Destination } from '@/types';

export interface RegionShowcaseProps {
  destinations: Destination[];
}

export default function RegionShowcase({ destinations }: RegionShowcaseProps) {
  return (
    <section className='py-12 lg:py-16'>
      <section className="mx-auto max-w-[1440px] px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Three Himalayan States</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            One Trip. <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Three Worlds.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {regions.map((region) => {
            const count = destinations.filter((destination) => destination.state === region.name).length;
            return (
              <motion.div key={region.id} variants={fadeInUp}>
                <Link
                  href={`/destinations?region=${region.id}`}
                  className="group relative block h-80 overflow-hidden rounded-[24px] border border-slate-200 shadow-glow transition-shadow duration-300 hover:shadow-apex-500/20"
                >
                  <SafeImage
                    src={region.image}
                    alt={`${region.name} destinations`}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/75 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    {count > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                        {count} destination{count === 1 ? '' : 's'}
                      </span>
                    ) : null}
                    <h3 className="mt-3 text-2xl font-bold text-white">{region.name}</h3>
                    <p className="mt-1.5 text-sm text-slate-200">{region.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-200">
                      Discover Region <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </section>
  );
}
