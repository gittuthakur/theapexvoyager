'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import type { Destination, DestinationStats } from '@/types';

export interface DestinationCardProps {
  destination: Destination;
  /** Computed once per page load (see lib/destinationStats.ts) — never fabricated, omitted entirely when a figure isn't real. */
  stats?: DestinationStats;
  className?: string;
  /** Set for the first few above-the-fold cards so their image gets priority + eager loading. */
  priority?: boolean;
}

export default function DestinationCard({ destination, stats, className, priority = false }: DestinationCardProps) {
  const href = destination.link ?? `/destinations/${destination.slug}`;
  const locationLabel = destination.formattedAddress ?? [destination.region, destination.state].filter(Boolean).join(', ');
  const topBadge = destination.badge ?? destination.category;
  const styleChips = destination.travelStyles?.slice(0, 2) ?? [];
  const hasStatsRow = Boolean(stats?.startingPrice) || Boolean(stats?.journeyCount) || Boolean(stats?.stayCount);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeInUp}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
      className={className}
    >
      <Link
        href={href}
        className="group relative block h-96 w-full overflow-hidden rounded-2xl bg-slate-950/70 shadow-xl transition-shadow duration-300 hover:shadow-apex-500/20"
      >
        {topBadge ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-[#0a0a0a]/70 px-3 py-1.5 text-xs font-semibold text-white">
            {topBadge}
          </span>
        ) : null}
        {destination.rating ? (
          <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-[#0a0a0a]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {destination.rating.toFixed(1)}
            {destination.userRatingCount ? <span className="text-slate-300">({destination.userRatingCount})</span> : null}
          </span>
        ) : null}
        <SafeImage
          src={destination.image}
          alt={`${destination.title} luxury expedition tours, Himachal Pradesh`}
          fill
          sizes="w-100 h-100"
          className="object-cover transition duration-500 group-hover:scale-105"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
        />
        {/* to-b (top→bottom), not to-t: the title/description sit at the bottom via
            `inset-x-0 bottom-0` below, so the darkest/most opaque stop has to land there
            for the text to actually be readable — from-black/30 at the top keeps the
            image itself visible up there. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-xl font-bold text-white">{destination.title}</h3>
          {locationLabel ? (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-200">
              <MapPin size={13} className="shrink-0 text-apex-300" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null}
          <p className="mt-2 line-clamp-2 text-sm text-slate-300">{destination.description}</p>

          {styleChips.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {styleChips.map((style) => (
                <span key={style} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200">
                  {style}
                </span>
              ))}
            </div>
          ) : null}

          {hasStatsRow ? (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-300">
              {stats?.startingPrice ? (
                <span className="text-3xl font-extrabold text-white">
                  ₹{stats.startingPrice.toLocaleString('en-IN')}
                  <span className="text-sm font-normal text-slate-400">/person</span>
                </span>
              ) : null}
              <span className="flex gap-2">
                {stats?.journeyCount ? <span>{stats.journeyCount} journey{stats.journeyCount === 1 ? '' : 's'}</span> : null}
                {stats?.stayCount ? <span>{stats.stayCount} stay{stats.stayCount === 1 ? '' : 's'}</span> : null}
              </span>
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-apex-100">
              Explore Destination <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
