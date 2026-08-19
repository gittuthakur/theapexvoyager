'use client';

import { motion } from 'framer-motion';
import { ButtonLink } from '@/components/ui/Button';
import DestinationCard from '@/components/modules/DestinationCard';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import type { Destination } from '@/types';
import { ArrowRight } from 'lucide-react';

export interface DestinationGridProps {
  title?: string;
  eyebrow?: string;
  /** Overrides the default "Popular {title}" heading entirely when set. */
  heading?: string;
  subtitle?: string;
  destinations: Destination[];
  viewAllHref?: string;
  viewAllLabel?: string;
  maxItems?: number;
}

export default function DestinationGrid({
  title = 'Discover Himachal & Beyond',
  eyebrow = 'EXPLORE TOP DESTINATIONS',
  heading,
  subtitle = 'Explore the diverse landscapes, timeless cultures, and unforgettable escapes that define the Himalayas.',
  destinations,
  viewAllHref = '/destinations',
  viewAllLabel = 'Explore All Destinations',
  maxItems = 5
}: DestinationGridProps) {
  const featured = destinations.slice(0, maxItems);

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="flex flex-col gap-4 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">{eyebrow}</p>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            {heading ?? (
              <>
                Popular <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{title}</span>
              </>
            )}
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">{subtitle}</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((destination, index) => (
            <DestinationCard key={destination.slug} destination={destination} priority={index < 4} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <ButtonLink href={viewAllHref} variant="primary" size="lg">
            {viewAllLabel}
            <ArrowRight size={24} />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
