'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import PackageCard from '@/components/modules/PackageCard';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import type { TravelPackage } from '@/types/package';

export interface PackageSectionProps {
  packages: TravelPackage[];
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
}

export default function PackageSection({
  packages,
  eyebrow = 'Curated Journeys',
  title = 'The ',
  highlight = 'Journey Edit',
  subtitle = 'Curated itineraries for unforgettable Himalayan escapes.',
  viewAllLabel = 'Explore All Journeys',
  viewAllHref = '/journeys'
}: PackageSectionProps) {
  if (packages.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-slate-100 py-14 lg:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-apex-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[15%] top-[20%] h-96 w-96 rounded-full bg-apex-100/60 blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="text-center"
        >
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            {title} <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{highlight}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">{subtitle}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {packages.map((pkg) => (
            <motion.div key={pkg.slug} variants={fadeInUp} className="h-full">
              <PackageCard pkg={pkg} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Link
            href={viewAllHref}
            className="cursor-hover inline-flex items-center gap-2 rounded-xl bg-apex-500 px-8 py-4 text-lg font-medium text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            {viewAllLabel}
            <ArrowRight size={24} />
          </Link>
        </div>
      </div>
    </section>
  );
}
