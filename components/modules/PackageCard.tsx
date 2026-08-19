'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Heart, MapPin, Star } from 'lucide-react';
import { formatINR } from '@/lib/pricing';
import { formatDurationShort, getPackageInclusionTags } from '@/lib/packageFilters';
import { cn } from '@/lib/utils';
import type { TravelPackage } from '@/types/package';

export interface PackageCardProps {
  pkg: TravelPackage;
  /** Real average across the package's linked destinations' reviews (see lib/reviews.ts) — omitted, never faked, when none exist yet. */
  rating?: { rating: number; count: number };
  /** Short region name (e.g. "Himachal"), derived from the package's linked destinations — omitted when it can't be resolved. */
  regionLabel?: string;
  isComparing?: boolean;
  /** True once 3 other journeys are already selected — disables adding a 4th. */
  compareDisabled?: boolean;
  onToggleCompare?: (slug: string) => void;
}

// Client-only, non-persisted wishlist — same pattern as components/modules/PropertyCard.tsx
// and components/modules/experiences/ExperienceCard.tsx. A real `favorites` collection is a
// future backend addition; this keeps the UI functional today without inventing server state.
const WISHLIST_STORAGE_KEY = 'apex-journeys-wishlist';

function readWishlist(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export default function PackageCard({ pkg, rating, regionLabel, isComparing = false, compareDisabled = false, onToggleCompare }: PackageCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const inclusionTags = getPackageInclusionTags(pkg);

  useEffect(() => {
    setWishlisted(readWishlist().has(pkg.slug));
  }, [pkg.slug]);

  function toggleWishlist() {
    const current = readWishlist();
    if (current.has(pkg.slug)) {
      current.delete(pkg.slug);
    } else {
      current.add(pkg.slug);
    }
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(Array.from(current)));
    setWishlisted(current.has(pkg.slug));
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out motion-safe:hover:-translate-y-1.5 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="h-full w-full object-cover transition duration-700 ease-in-out motion-safe:group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          {regionLabel ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-apex-700 backdrop-blur-sm">
              {regionLabel}
            </span>
          ) : null}
          {rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {rating.rating.toFixed(1)}
              <span className="text-slate-300">({rating.count})</span>
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          className="cursor-hover absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 backdrop-blur-sm transition-colors duration-300 ease-in-out hover:text-rose-500"
        >
          <Heart size={16} className={cn(wishlisted && 'fill-rose-500 text-rose-500')} />
        </button>

        {onToggleCompare ? (
          <label
            className={cn(
              'cursor-hover absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-opacity duration-300 ease-in-out',
              compareDisabled && !isComparing ? 'pointer-events-none opacity-50' : 'opacity-100'
            )}
          >
            <input
              type="checkbox"
              checked={isComparing}
              disabled={compareDisabled && !isComparing}
              onChange={() => onToggleCompare(pkg.slug)}
              className="h-5 w-5 accent-apex-500 rounded-full"
            />
            Compare
          </label>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-6">
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold leading-snug text-slate-900">{pkg.name}</h3>
          <p className="inline-flex items-start gap-1.5 text-sm text-slate-500">
            <MapPin size={14} className="mt-0.5 shrink-0 text-apex-600" />
            <span>{pkg.destination}</span>
          </p>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{pkg.shortDescription}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
            <Clock size={12} className="text-apex-600" />
            {formatDurationShort(pkg.duration)}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">{pkg.category}</span>
        </div>

        {inclusionTags.length ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
            {inclusionTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1">
                <Check size={12} className="text-emerald-500" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex-1" />

        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-500">From</p>
          <p className="text-2xl font-extrabold text-slate-900 lg:text-3xl">
            {formatINR(pkg.price)}
            <span className="ml-1 text-xs font-normal text-slate-500">/ person</span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/journeys/${pkg.slug}`}
            className="cursor-hover inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-600 underline-offset-4 transition-colors duration-300 ease-in-out hover:text-apex-600 hover:underline"
          >
            View Journey
          </Link>
          <Link
            href={`/journeys/${pkg.slug}?book=1`}
            className="cursor-hover inline-flex shrink-0 items-center gap-2 rounded-xl bg-apex-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:bg-apex-600 hover:shadow-md"
          >
            Plan This Journey
            <ArrowRight size={16} className="transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
