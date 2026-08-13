'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Home,
  MapPin,
  Star,
  UserCheck,
  UtensilsCrossed,
  type LucideIcon
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { TourPackage } from '@/types';

export interface FeatureGridProps {
  title?: string;
  eyebrow?: string;
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

interface TourCardProps {
  tour: TourPackage;
  size: 'lg' | 'sm';
  isActive?: boolean;
  onSelect?: () => void;
}

function TourCard({ tour, size, isActive, onSelect }: TourCardProps) {
  const isLarge = size === 'lg';
  const isSelectable = Boolean(onSelect);

  if (isLarge) {
    // Vertical layout for large featured card
    return (
      <motion.article
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        role={isSelectable ? 'button' : undefined}
        tabIndex={isSelectable ? 0 : undefined}
        aria-pressed={isSelectable ? isActive : undefined}
        onClick={onSelect}
        onKeyDown={
          isSelectable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect?.();
                }
              }
            : undefined
        }
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-slate-950/70 shadow-glow transition hover:-translate-y-1',
          isSelectable && 'cursor-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-300',
          isActive ? 'border-apex-400 ring-2 ring-apex-400/30' : 'border-white/10'
        )}
      >
        <div className="relative h-72 overflow-hidden lg:h-96">
          {tour.badge ? (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold text-white">
              {tour.badge}
            </span>
          ) : null}
          {tour.rating ? (
            <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-[#0a0a0a]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {tour.rating.toFixed(1)}
              {tour.reviewCount ? <span className="text-slate-300">({tour.reviewCount} reviews)</span> : null}
            </span>
          ) : null}
          <SafeImage
            src={tour.image}
            alt={`${tour.title} luxury expedition tour, ${tour.location}`}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/40 via-transparent to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6 lg:p-7">
          <div>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">{tour.title}</h3>
            {tour.description ? <p className="mt-2 text-sm text-slate-300">{tour.description}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-apex-300" />
              {tour.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-apex-300" />
              {tour.duration}
            </span>
          </div>

          {tour.highlights?.length ? (
            <div className="flex flex-wrap gap-2">
              {tour.highlights.map((highlight) => {
                const Icon = highlightIcon(highlight);
                return (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                  >
                    <Icon size={13} className="text-apex-300" />
                    {highlight}
                  </span>
                );
              })}
            </div>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <p>
              <span className="block text-[11px] uppercase tracking-wider text-slate-500">Starting from</span>
              <span className="text-2xl font-extrabold text-white sm:text-3xl">{tour.price}</span>
              <span className="text-xs text-slate-400"> {tour.priceUnit ?? '/ Person'}</span>
            </p>
            <ButtonLink
              href={`/booking?tour=${tour.slug}`}
              size="md"
              className="transition hover:scale-105"
              onClick={isSelectable ? (event) => event.stopPropagation() : undefined}
            >
              Book Now
              <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>
      </motion.article>
    );
  }

  // Horizontal layout for compact cards in vertical Swiper
  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeInUp}
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      aria-pressed={isSelectable ? isActive : undefined}
      onClick={onSelect}
      onKeyDown={
        isSelectable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      className={cn(
        'group flex flex-row overflow-hidden rounded-[1.25rem] border bg-slate-950/70 shadow-glow transition hover:-translate-y-0.5',
        isSelectable && 'cursor-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-300',
        isActive ? 'border-apex-400 ring-2 ring-apex-400/30' : 'border-white/10'
      )}
    >
      {/* Left: Image Thumbnail — Fixed width w-32, stretches to match the content column's height */}
      <div className="relative w-32 flex-shrink-0 self-stretch overflow-hidden bg-slate-900">
        <SafeImage
          src={tour.image}
          alt={`${tour.title} tour thumbnail`}
          fill
          sizes="128px"
          className="object-cover transition duration-300 group-hover:scale-110"
        />
      </div>

      {/* Right: Content Stack — flex-1 with flex-col justify-between */}
      <div className="flex flex-1 flex-col justify-between p-3">
        {/* Badge and Rating Row */}
        <div className="flex items-center justify-between gap-2">
          {tour.badge ? (
            <span className="rounded-full bg-apex-500/20 px-2 py-0.5 text-[10px] font-medium text-apex-300">
              {tour.badge}
            </span>
          ) : (
            <span />
          )}
          {tour.rating ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-400">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {tour.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="truncate text-xl font-bold text-white">{tour.title}</h3>

        {/* Location and Duration Badges */}
        <div className="space-y-0.5">
          <p className="truncate text-xs text-slate-400 space-x-4">
            <span>              
              <MapPin size={11} className="mb-0.5 inline text-apex-300" />
              {' '}
              <span className="text-xs">{tour.location}</span>
            </span>
            <span className="truncate text-xs text-slate-400">
              <Clock size={11} className="mb-0.5 inline text-apex-300" />
              {' '}
              <span className="text-xs">{tour.duration}</span>
            </span>
          </p>
        </div>
        {tour.highlights?.length ? (
          <div className="flex flex-wrap gap-1">
            {tour.highlights.slice(0, 3).map((highlight) => {
              const Icon = highlightIcon(highlight);
              return (
                <span
                  key={highlight}
                  className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                >
                  <Icon size={10} className="text-apex-300" />
                  {highlight}
                </span>
              );
            })}
          </div>
        ) : null}
        {/* Price and Action Button/State */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wider text-slate-500">Starting from</span>
            <p className="truncate text-xs font-bold text-white">{tour.price}</p>
          </div>
          {isSelectable ? (
            <span
              className={cn(
                'flex-shrink-0 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition',
                isActive
                  ? 'bg-apex-500 text-white'
                  : 'bg-white/5 text-slate-300 group-hover:bg-white/10'
              )}
            >
              {isActive ? '✓ Active' : 'View'}
            </span>
          ) : (
            <ButtonLink
              href={`/booking?tour=${tour.slug}`}
              size="sm"
              className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
              onClick={(event) => event.stopPropagation()}
            >
              Book
            </ButtonLink>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function FeatureGrid({
  title = 'Featured Tours',
  eyebrow = 'Handpicked for you',
  tours,
  viewAllHref = '/tours'
}: FeatureGridProps) {
  const bentoSwiperRef = useRef<SwiperInstance | null>(null);
  const [featured, ...bentoTours] = tours;

  // The left preview used to be permanently pinned to tours[0] ("featured"). Now it's
  // driven by whichever bento card was last clicked, falling back to tours[0] until
  // then (and if the clicked slug ever stops matching anything in `tours`).
  const [activeSlug, setActiveSlug] = useState<string | undefined>(featured?.slug);
  const activeTour = tours.find((tour) => tour.slug === activeSlug) ?? featured;

  // 3 slides visible at once, paging a full group of 3 per click — needs roughly 2x
  // that (6) unique tours before Swiper's loop can wrap around cleanly.
  const bentoSlidesPerView = 3;
  const canLoopBento = bentoTours.length >= bentoSlidesPerView * 2;

  return (
    <section className="mx-auto mt-20 max-w-7xl px-6 sm:px-10 lg:px-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-apex-300">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Featured <span className="text-apex-300">Tours</span>
          </h2>
        </div>
        <Link
          href={viewAllHref}
          className="cursor-hover inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          Browse all tours <ArrowRight size={16} />
        </Link>
      </div>

      {activeTour ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          {/* lg:items-start on the grid (not the default stretch) is what keeps this card
              at its own natural height instead of being forced to match the much taller
              3-card-tall Swiper next to it. */}
          <TourCard tour={activeTour} size="lg" />

          {/* Vertical Swiper with horizontal compact cards, 3 cards visible + paged at a time.
              Each horizontal card is ~124px tall (h-28 image + p-3 padding), so 3 cards + 2 gaps
              of 20px = ~412px total. Set container to 460px for comfortable spacing. */}
          <div className="relative h-[460px] overflow-hidden">
            <Swiper
              modules={[Navigation]}
              direction="vertical"
              onSwiper={(swiper) => {
                bentoSwiperRef.current = swiper;
              }}
              loop={canLoopBento}
              slidesPerView={bentoSlidesPerView}
              slidesPerGroup={bentoSlidesPerView}
              spaceBetween={20}
              navigation={{ prevEl: '.bento-prev', nextEl: '.bento-next' }}
              className="bento-swiper h-full"
            >
              {bentoTours.map((tour) => (
                <SwiperSlide key={tour.slug}>
                  <TourCard
                    tour={tour}
                    size="sm"
                    isActive={activeTour.slug === tour.slug}
                    onSelect={() => setActiveSlug(tour.slug)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {bentoTours.length > bentoSlidesPerView ? (
              <>
                <button
                  type="button"
                  aria-label="Previous tours"
                  onClick={() => bentoSwiperRef.current?.slidePrev()}
                  className="bento-prev cursor-hover absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 p-2 text-white shadow-lg backdrop-blur-sm transition hover:bg-apex-500"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next tours"
                  onClick={() => bentoSwiperRef.current?.slideNext()}
                  className="bento-next cursor-hover absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 p-2 text-white shadow-lg backdrop-blur-sm transition hover:bg-apex-500"
                >
                  <ChevronDown size={18} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
