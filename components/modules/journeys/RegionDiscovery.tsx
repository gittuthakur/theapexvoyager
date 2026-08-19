'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { getPackageRegionIds } from '@/lib/packageFilters';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import type { Destination, RegionId, Region, TravelPackage } from '@/types';

export interface RegionDiscoveryProps {
  packages: TravelPackage[];
  regions: Region[];
  destinationsBySlug: Map<string, Destination>;
  onSelect: (regionId: RegionId) => void;
}

export default function RegionDiscovery({ packages, regions, destinationsBySlug, onSelect }: RegionDiscoveryProps) {
  return (
    <section className="py-12 lg:py-16">
      <section className="mx-auto max-w-[1440px]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Explore by Region</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Explore Journeys by Region</h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-8 grid gap-6 sm:grid-cols-3"
        >
          {regions.map((region) => {
            const count = packages.filter((pkg) => getPackageRegionIds(pkg, destinationsBySlug).includes(region.id)).length;
            return (
              <motion.button
                type="button"
                key={region.id}
                variants={fadeInUp}
                onClick={() => onSelect(region.id)}
                className="cursor-hover group relative flex h-96 flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 text-left shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-slate-900">
                  <SafeImage
                    src={region.image}
                    alt={region.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition duration-700 ease-in-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/75 to-transparent" />
                </div>
                <div className="relative p-6 text-white">
                  <h3 className="text-xl font-bold">{region.name}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-200">{region.description}</p>
                  <span className="flex gap-3 mt-5 justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-apex-300">
                      Explore {region.shortName} Journeys
                      <ArrowRight size={15} className="transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
                    </span>
                    <span className="text-xs font-normal text-slate-300">
                      ({count} journey{count === 1 ? '' : 's'})
                    </span>
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </section>
    </section>
  );
}
