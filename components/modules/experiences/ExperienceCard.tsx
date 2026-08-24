'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Clock, Heart, MapPin, Star, Users } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatINR } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import type { Experience } from '@/types/experience';

export interface ExperienceCardProps {
  experience: Experience;
  /** Larger, more editorial layout for the "Experiences Worth Travelling For" section. */
  variant?: 'grid' | 'featured';
  priority?: boolean;
}

// Client-only, non-persisted favorites — mirrors PropertyCard's wishlist pattern
// (components/modules/PropertyCard.tsx) with its own storage key so the two
// verticals' saved lists never collide.
const FAVORITES_STORAGE_KEY = 'apex-experiences-favorites';

function readFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const badgeStyles: Record<NonNullable<Experience['badge']>, string> = {
  'Best Seller': 'bg-apex-500 text-white',
  Popular: 'bg-slate-900 text-white',
  New: 'bg-emerald-600 text-white'
};

export default function ExperienceCard({ experience, variant = 'grid', priority = false }: ExperienceCardProps) {
  const [favorited, setFavorited] = useState(false);
  const isFeatured = variant === 'featured';

  useEffect(() => {
    setFavorited(readFavorites().has(experience.slug));
  }, [experience.slug]);

  function toggleFavorite(event: MouseEvent) {
    event.preventDefault();
    const current = readFavorites();
    if (current.has(experience.slug)) {
      current.delete(experience.slug);
    } else {
      current.add(experience.slug);
    }
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(current)));
    setFavorited(current.has(experience.slug));
  }

  return (
    <Link
      href={`/experiences/${experience.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
    >
      <div className={cn('relative overflow-hidden bg-slate-100', isFeatured ? 'h-52' : 'h-56')}>
        <SafeImage
          src={experience.image}
          alt={experience.title}
          fill
          priority={priority}
          sizes={isFeatured ? '(min-width: 1024px) 32vw, 100vw' : '(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw'}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          {experience.badge ? (
            <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]', badgeStyles[experience.badge])}>
              {experience.badge}
            </span>
          ) : null}
          {experience.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-emerald-700 backdrop-blur-sm">
              <BadgeCheck size={12} className="text-emerald-600" />
              Verified
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorited}
          className="cursor-hover absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 backdrop-blur-sm transition-colors duration-300 ease-in-out hover:text-rose-500"
        >
          <Heart size={16} className={cn(favorited && 'fill-rose-500 text-rose-500')} />
        </button>
      </div>

      <div className={cn('flex flex-1 flex-col gap-2.5 p-5', isFeatured && 'p-6')}>
        {experience.rating ? (
          <span className="inline-flex w-fit items-center gap-1 text-sm font-medium text-amber-500">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {experience.rating.toFixed(1)}
            {experience.reviewCount ? <span className="text-slate-500"> ({experience.reviewCount})</span> : null}
          </span>
        ) : null}

        <h3 className={cn('font-bold leading-snug text-slate-900', isFeatured ? 'text-xl' : 'text-lg')}>{experience.title}</h3>

        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={14} className="shrink-0 text-apex-600" />
          {experience.location}
        </span>

        {isFeatured ? <p className="text-sm leading-6 text-slate-600">{experience.shortDescription}</p> : null}

        {isFeatured ? (
          <p className="text-sm text-slate-500">
            {experience.duration} · {experience.subCategory} · {experience.groupSize}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-apex-600" />
              {experience.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-apex-600" />
              {experience.groupSize}
            </span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">From</p>
            <p className={cn('font-extrabold text-slate-900', isFeatured ? 'text-3xl' : 'text-3xl')}>
              {formatINR(experience.price)} <span className="text-sm font-normal text-slate-500">/ person</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-apex-600 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5">
            View Experience <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
