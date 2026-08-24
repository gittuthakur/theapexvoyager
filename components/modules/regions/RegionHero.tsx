'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Compass, MapPin } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { useBookingNavigation } from '@/lib/bookingNavigation';
import type { RegionProfile } from '@/types/regionHub';

export interface RegionHeroProps {
  region: RegionProfile;
}

// Grid columns are always given an explicit base class (`grid-cols-1`) before the
// `lg:` override — Tailwind's grid-cols utilities compile to `repeat(N, minmax(0,1fr))`,
// which is exactly the fix applied to the Home Hero's implicit, columnless grid (see
// components/modules/home/HomeHeroMobileFix.module.css) — so no bespoke CSS module is
// needed here to avoid the same mobile grid-blowout bug.
export default function RegionHero({ region }: RegionHeroProps) {
  const { navigateToBooking } = useBookingNavigation();
  const { hero, overview } = region;

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900">
      <div className="absolute inset-0">
        <SafeImage
          src={hero.image}
          alt={hero.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/20" />
      </div>

      <div className="relative grid grid-cols-1 gap-6 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-2 lg:items-end lg:py-16">
        <div className="min-w-0 space-y-4 text-white">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="transition-colors duration-300 ease-in-out hover:text-white">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white">{region.name}</span>
          </nav>

          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-300">{hero.eyebrow}</p>

          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            {hero.title}
            {hero.highlightedText ? <span className="ml-2 text-apex-300">{hero.highlightedText}</span> : null}
          </h1>

          <p className="max-w-xl text-base leading-7 text-white/85 sm:text-lg">{hero.subtitle}</p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-2">
              <Calendar size={16} className="text-apex-300" /> {overview.bestSeason}
            </span>
            <span className="inline-flex items-center gap-2">
              <Compass size={16} className="text-apex-300" /> {overview.idealDuration}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-apex-300" /> {overview.startingPoint}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-end lg:self-end">
          <a
            href="#journeys"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 ease-in-out hover:bg-slate-100"
          >
            Explore Journeys
            <ArrowRight size={18} />
          </a>
          <button
            type="button"
            onClick={() => navigateToBooking({ source: 'region', slug: region.slug })}
            className="cursor-hover inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-apex-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Plan My Journey
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
