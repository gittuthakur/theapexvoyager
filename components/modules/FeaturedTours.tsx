'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  MapPin,
  Star,
  type LucideIcon,
  Bus,
  Home,
  UtensilsCrossed,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { TourPackage } from '@/types';

export interface FeaturedToursProps {
  tours: TourPackage[];
  viewAllHref?: string;
}

const highlightIcons: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /transport/i, icon: Bus },
  { match: /stay/i, icon: Home },
  { match: /meal/i, icon: UtensilsCrossed },
  { match: /guide/i, icon: UserCheck }
];

function highlightIcon(label: string): LucideIcon {
  return highlightIcons.find((entry) => entry.match.test(label))?.icon ?? CheckCircle2;
}

export default function FeaturedTours({ tours, viewAllHref = '/tours' }: FeaturedToursProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (!tours || tours.length === 0) return null;

  const activeTour = tours[selectedIndex] ?? tours[0];

  function handleSelectTour(index: number) {
    setSelectedIndex(index);
    itemRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Handpicked for you</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Featured Tours</h2>
          </div>
          <Link
            href={viewAllHref}
            className="cursor-hover inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors duration-300 ease-in-out hover:text-slate-900"
          >
            Browse all tours <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: sticky preview of the active tour */}
          <div className="lg:sticky lg:top-24 lg:col-span-7 lg:self-start">
            <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-glow">
              <div>
                <div className="flex items-center justify-between gap-3">
                  {activeTour.badge ? (
                    <span className="rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold text-white">{activeTour.badge}</span>
                  ) : <span />}
                  {activeTour.rating ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-500">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      {activeTour.rating.toFixed(1)}
                      {activeTour.reviewCount ? <span className="text-xs text-slate-500"> ({activeTour.reviewCount} reviews)</span> : null}
                    </span>
                  ) : null}
                </div>

                <div className="relative mt-6 h-64 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-80">
                  {/* key={activeTour.slug} forces a remount on tour change — SafeImage tracks
                      "did this image fail" in its own state, which would otherwise carry over
                      from whichever tour was active before and wrongly show the fallback icon
                      for a perfectly valid next image. */}
                  <SafeImage
                    key={activeTour.slug}
                    src={activeTour.image}
                    alt={activeTour.title}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">{activeTour.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm text-slate-600 sm:text-base">{activeTour.description}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={15} className="text-apex-600" /> {activeTour.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={15} className="text-apex-600" /> {activeTour.duration}
                  </span>
                </div>

                {activeTour.highlights?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeTour.highlights.map((highlight) => {
                      const Icon = highlightIcon(highlight);
                      return (
                        <span key={highlight} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                          <Icon size={13} className="text-apex-600" /> {highlight}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Starting from</p>
                  <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {activeTour.price} <span className="text-xs font-normal text-slate-500">/ Person</span>
                  </p>
                </div>
                <ButtonLink
                  href={`/booking?tour=${activeTour.slug}${activeTour.destinationSlug ? `&destination=${activeTour.destinationSlug}` : ''}`}
                  size="md"
                >
                  Book Now <ArrowRight size={16} />
                </ButtonLink>
              </div>
            </article>
          </div>

          {/* Right: scrollable list — click a card to update the preview on the left */}
          <div className="h-[650px] space-y-3 overflow-y-auto pr-2 lg:col-span-5">
            {tours.map((tour, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={tour.slug}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectTour(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectTour(index);
                    }
                  }}
                  className={cn(
                    'cursor-hover group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all duration-300 ease-in-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-300',
                    isSelected ? 'border-apex-400 ring-2 ring-apex-400/30 shadow-glow' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {/* pointer-events-none on every child below: the row's own onClick/onKeyDown
                      above is the single source of truth for selection, so nothing nested in
                      here (image, pills, text) should be able to intercept or swallow the click. */}
                  <div className="pointer-events-none relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                    <SafeImage
                      src={tour.image}
                      alt={tour.title}
                      fill
                      sizes="120px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="pointer-events-none min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      {tour.badge ? (
                        <span className="rounded-full bg-apex-50 px-2 py-0.5 text-[10px] font-medium text-apex-600">{tour.badge}</span>
                      ) : <span />}
                      {tour.rating ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                          <Star size={12} className="fill-amber-400 text-amber-400" /> {tour.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="truncate text-sm font-bold text-slate-900 sm:text-base">{tour.title}</h4>
                    <p className="truncate text-xs text-slate-500">{tour.location}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{tour.price}</span>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition',
                          isSelected ? 'bg-apex-500 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        )}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
