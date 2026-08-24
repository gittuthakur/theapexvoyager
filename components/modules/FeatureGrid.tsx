'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Eye,
  Home,
  MapPin,
  Star,
  UserCheck,
  UtensilsCrossed,
  type LucideIcon
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import { buildBookingHref } from '@/lib/bookingNavigation';
import type { TourPackage } from '@/types';

export interface FeatureGridProps {
  title?: string;
  highlight?: string;
  eyebrow?: string;
  subtitle?: string;
  tours: TourPackage[];
  viewAllHref?: string;
}

const highlightIcons: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /transport|bus|cab|car|drive|flight|transfer/i, icon: Bus },
  { match: /stay|hotel|resort|home|homestay|camp|staycation/i, icon: Home },
  { match: /meal|food|dinner|breakfast|lunch|utensil|snack/i, icon: UtensilsCrossed },
  { match: /guide|instructor|leader|user|driver|support/i, icon: UserCheck }
];

function highlightIcon(label: string): LucideIcon {
  if (!label) return CheckCircle2;
  const matched = highlightIcons.find((entry) => entry.match.test(label));
  return matched ? matched.icon : CheckCircle2;
}

// Helper to reliably get a unique identifier for any tour
function getTourKey(tour: TourPackage, fallbackIndex: number = 0): string {
  return tour.slug || (tour as any).id || `tour-${fallbackIndex}`;
}

interface TourCardProps {
  tour: TourPackage;
  size: 'lg' | 'sm';
  isActive?: boolean;
  onSelect?: () => void;
}

function TourCard({ tour, size, isActive, onSelect }: TourCardProps) {
  const isLarge = size === 'lg';
  const isSelectable = Boolean(onSelect);

  // Safe extraction with all possible backend keys (highlights, inclusions, tags, features, amenities)
  const rawHighlights =
    tour?.highlights ||
    (tour as any)?.inclusions ||
    (tour as any)?.tags ||
    (tour as any)?.features ||
    (tour as any)?.amenities ||
    [];

  // Explicit type added (: string[]) to fix TS implicit any error & guarantee an array shape
  const tourHighlights: string[] = Array.isArray(rawHighlights)
    ? rawHighlights
    : typeof rawHighlights === 'string'
    ? (rawHighlights as string).split(',').map((item: string) => item.trim())
    : [];

  const currentKey = getTourKey(tour);

  if (isLarge) {
    return (
      <motion.article
        key={currentKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="relative group flex min-h-[520px] h-full flex-col justify-end overflow-hidden rounded-[1.75rem] bg-slate-950/70 shadow-xl transition-shadow duration-300 hover:shadow-apex-500/20 motion-safe:hover:-translate-y-0.5"
      >
        {/* Background Image Container */}
        <div className={cn('absolute inset-0 z-0 h-full w-full overflow-hidden', !tour.image && 'bg-slate-700')}>
          {tour.badge ? (
            <span className="flex gap-1.5 absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-apex-600 backdrop-blur-sm shadow-md">
              {tour.badge}
            </span>
          ) : null}
          {tour.rating ? (
            <span className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-[#0a0a0a]/70 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              {tour.rating.toFixed(1)}
              {tour.reviewCount ? <span className="font-normal text-xs text-slate-300">({tour.reviewCount})</span> : null}
            </span>
          ) : null}

          {tour.image ? (
            <SafeImage
              src={tour.image}
              alt={`${tour.title} tour photo`}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full object-cover transition duration-500 ease-in-out motion-safe:group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/75 to-transparent" />
        </div>

        {/* Main Card Content */}
        <div className="relative z-10 flex flex-col justify-between gap-4 p-6 lg:p-7 pt-28">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white sm:text-2xl">{tour.title}</h3>
            {tour.description ? (
              <p className="line-clamp-2 text-sm sm:text-base text-slate-300 leading-relaxed">
                {tour.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            {tour.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-apex-300" />
                {tour.location}
              </span>
            ) : null}
            {tour.duration ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-apex-300" />
                {tour.duration}
              </span>
            ) : null}
          </div>

          {/* Highlights Tag Array Container with fallback & explicit TS types */}
          {tourHighlights.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {tourHighlights.map((highlight: string, index: number) => {
                const Icon = highlightIcon(highlight);
                return (
                  <span
                    key={`${currentKey}-lg-tag-${index}-${highlight}`}
                    className="flex items-center gap-1.5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/50 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm"
                  >
                    <Icon size={14} className="text-apex-200 shrink-0" />
                    {highlight}
                  </span>
                );
              })}
            </div>
          ) : (
            /* Fallback tags if no tags found in any property */
            <div className="flex flex-wrap gap-2 pt-1">
              {['Stay Included', 'Meals Included'].map((highlight: string, index: number) => {
                const Icon = highlightIcon(highlight);
                return (
                  <span
                    key={`${currentKey}-default-lg-tag-${index}`}
                    className="flex items-center gap-1.5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/50 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-sm"
                  >
                    <Icon size={14} className="text-apex-200 shrink-0" />
                    {highlight}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-4 pt-3">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-400">Starting from</span>
              <span className="text-2xl font-extrabold text-white sm:text-4xl">{tour.price}</span>
              <span className="text-sm text-slate-400"> {tour.priceUnit ?? '/ Person'}</span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Link
                href={tour.destinationSlug ? `/journeys?destination=${tour.destinationSlug}` : '/journeys'}
                className="cursor-hover text-md font-semibold text-white underline-offset-4 transition hover:underline"
              >
                View Details
              </Link>
              <ButtonLink
                href={tour.slug ? buildBookingHref({ source: 'journey', slug: tour.slug }) : '/plan-my-journey'}
                size="lg"
                className="cursor-hover rounded-xl shrink-0"
              >
                Book Now
                <ArrowRight size={22} />
              </ButtonLink>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  // Small List Card Item
  const displayHighlights: string[] =
    tourHighlights.length > 0 ? tourHighlights : ['Stay Included', 'Meals'];

  return (
    <div
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onClick={onSelect}
      className={cn(
        'group flex cursor-pointer flex-row overflow-hidden rounded-[1.25rem] border bg-white shadow-sm transition-all duration-300 ease-in-out hover:border-apex-400/50 motion-safe:hover:-translate-y-0.5 hover:shadow-lg shrink-0 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-300',
        isActive ? 'border-apex-400 bg-apex-50 shadow-lg' : 'border-slate-300 hover:shadow-lg'
      )}
    >
      <div className={cn('relative w-36 shrink-0 self-stretch sm:w-40', !tour.image && 'bg-slate-200')}>
        {tour.image ? (
          <SafeImage
            src={tour.image}
            alt={`${tour.title} thumbnail`}
            fill
            sizes="150px"
            className="h-full w-full object-cover transition duration-300 ease-in-out motion-safe:group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 min-w-0 gap-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-3">
              <h3 className="truncate text-base font-bold text-slate-900">{tour.title}</h3>
              {tour.badge ? (
                <span className="rounded-full bg-apex-100 px-2 py-1 text-xs font-medium text-apex-600">
                  {tour.badge}
                </span>
              ) : (
                <span />
              )}
            </div>
             {tour.rating ? (
              <span className="inline-flex items-center gap-1 rounded-full text-xs font-semibold text-slate-600">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {tour.rating.toFixed(1)}
                {tour.reviewCount ? <span className="font-normal text[10] text-slate-400">({tour.reviewCount})</span> : null}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin size={14} className="text-apex-600 shrink-0" />
              <span className="truncate">{tour.location}</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock size={14} className="text-apex-600 shrink-0" />
              <span>{tour.duration}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayHighlights.slice(0, 2).map((highlight: string, index: number) => {
            const Icon = highlightIcon(highlight);
            return (
              <span
                key={`${currentKey}-sm-tag-${index}-${highlight}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600"
              >
                <Icon size={12} className="text-apex-600 shrink-0" />
                <span className="truncate max-w-[70px]">{highlight}</span>
              </span>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <div>
            <span className="block text-xs uppercase tracking-wider text-slate-500">Starting from</span>
            <p className="text-2xl font-bold text-slate-900">{tour.price}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300 ease-in-out',
              isActive
                ? 'bg-apex-500 text-white'
                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
            )}
          >
            {isActive ? 'Active' : 'View'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FeatureGrid({
  title = 'Signature',
  highlight = 'Escapes',
  eyebrow = 'Handpicked for you',
  subtitle = 'Ready-to-go Himalayan trips, thoughtfully designed for effortless travel.',
  tours = [],
  viewAllHref = '/journeys'
}: FeatureGridProps) {
  // Use unique key instead of just slug in case slug is missing/undefined
  const defaultKey = tours.length > 0 ? getTourKey(tours[0], 0) : undefined;
  const [activeKey, setActiveKey] = useState<string | undefined>(defaultKey);

  if (!tours || tours.length === 0) return null;

  const activeTour =
    tours.find((tour, idx) => getTourKey(tour, idx) === activeKey) ?? tours[0];

  const activeTourKey = getTourKey(activeTour);

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              {title}{' '}
              {highlight ? (
                <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{highlight}</span>
              ) : null}
            </h2>
            {subtitle ? <p className="mt-3 text-slate-600">{subtitle}</p> : null}
          </div>
          <Link
            href={viewAllHref}
            className="cursor-hover inline-flex shrink-0 items-center gap-1 text-sm font-medium text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-900"
          >
            Browse all tours <ArrowRight size={16} />
          </Link>
        </motion.div>

        {activeTour ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-stretch">
            {/* Left Large Card wrapped properly with AnimatePresence */}
            <div className="h-full">
              <AnimatePresence mode="wait">
                <TourCard
                  key={activeTourKey}
                  tour={activeTour}
                  size="lg"
                />
              </AnimatePresence>
            </div>

            {/* Right Scrollable Cards List */}
            <div className="flex max-h-[588px] flex-col gap-5 overflow-y-auto pt-2 pr-2">
              {tours.map((tour, idx) => {
                const itemKey = getTourKey(tour, idx);
                return (
                  <TourCard
                    key={itemKey}
                    tour={tour}
                    size="sm"
                    isActive={activeTourKey === itemKey}
                    onSelect={() => setActiveKey(itemKey)}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
