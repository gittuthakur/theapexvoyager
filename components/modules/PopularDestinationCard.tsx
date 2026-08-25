'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import type { Destination } from '@/types';

export interface PopularDestinationCardProps {
  destination: Destination;
  /** e.g. "Journeys from ₹24,999" — computed server-side from lib/packages.ts. */
  priceLabel?: string;
  /** Set for the first few above-the-fold cards so their image gets priority + eager loading. */
  priority?: boolean;
}

export default function PopularDestinationCard({ destination, priceLabel, priority = false }: PopularDestinationCardProps) {
  const locationLabel = [destination.region, destination.state].filter(Boolean).join(', ');

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeInUp}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
    >
      <Link
        href={`/destinations/${destination.slug}`}
        className="group relative block h-96 w-full overflow-hidden rounded-2xl bg-slate-950/70 shadow-glow transition-shadow duration-300 hover:shadow-apex-500/20"
      >
        {destination.badge ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-apex-500 px-3 py-1.5 text-xs font-semibold text-white">
            {destination.badge}
          </span>
        ) : null}
        {destination.rating ? (
          <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-[#0a0a0a]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {destination.rating.toFixed(1)}
          </span>
        ) : null}
        <SafeImage
          src={destination.image}
          alt={`${destination.title} luxury expedition tours${destination.state ? `, ${destination.state}` : ''}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          {destination.personality ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apex-300">{destination.personality}</p>
          ) : null}
          <h3 className="mt-1 text-xl font-bold text-white">{destination.title}</h3>
          {locationLabel ? <p className="mt-1 truncate text-xs text-slate-300">{locationLabel}</p> : null}
          {priceLabel ? <p className="mt-2 text-3xl font-bold text-white">{priceLabel}<span className="text-sm font-medium text-slate-300">/person</span></p> : null}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-apex-400">
              Explore Destination <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
