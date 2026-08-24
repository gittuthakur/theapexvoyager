'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Compass, MapPin } from 'lucide-react';
import DetailHero from '@/components/modules/detail/DetailHero';
import { DetailMetaItem } from '@/components/modules/detail/DetailMeta';
import { useBookingNavigation } from '@/lib/bookingNavigation';
import type { RegionProfile } from '@/types/regionHub';

export interface RegionHeroProps {
  region: RegionProfile;
}

// Thin adapter over the shared DetailHero — same external { region } prop contract as
// before, so app/regions/[slug]/page.tsx needed no prop-level changes for this refactor.
export default function RegionHero({ region }: RegionHeroProps) {
  const { navigateToBooking } = useBookingNavigation();
  const { hero, overview } = region;

  return (
    <DetailHero
      image={hero.image}
      imageAlt={hero.title}
      eyebrow={hero.eyebrow}
      title={
        <>
          {hero.title}
          {hero.highlightedText ? <span className="ml-2 text-apex-300">{hero.highlightedText}</span> : null}
        </>
      }
      subtitle={hero.subtitle}
      breadcrumb={
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/70">
          <Link href="/" className="transition-colors duration-300 ease-in-out hover:text-white">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white">{region.name}</span>
        </nav>
      }
      meta={
        <>
          <DetailMetaItem icon={Calendar}>{overview.bestSeason}</DetailMetaItem>
          <DetailMetaItem icon={Compass}>{overview.idealDuration}</DetailMetaItem>
          <DetailMetaItem icon={MapPin}>{overview.startingPoint}</DetailMetaItem>
        </>
      }
      actions={
        <>
          <a
            href="#journeys"
            className="cursor-hover inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 ease-in-out hover:bg-slate-100"
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
        </>
      }
    />
  );
}
