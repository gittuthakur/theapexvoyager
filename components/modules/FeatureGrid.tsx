'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  MapPin,
  Star,
  UserCheck,
  UtensilsCrossed,
  type LucideIcon
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './FeatureGrid.css';
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

function TourCard({ tour, size }: { tour: TourPackage; size: 'lg' | 'sm' }) {
  const isLarge = size === 'lg';

  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeInUp}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 shadow-glow transition hover:-translate-y-1'
      )}
    >
      <div className={cn('relative overflow-hidden', isLarge ? 'h-72 lg:h-96' : 'h-40')}>
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
          sizes={isLarge ? '(min-width: 1024px) 40vw, 100vw' : '(min-width: 1024px) 25vw, 90vw'}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/40 via-transparent to-transparent" />
      </div>

      <div className={cn('flex flex-1 flex-col gap-4', isLarge ? 'p-6 lg:p-7' : 'p-5')}>
        <div>
          <h3 className={cn('font-bold text-white', isLarge ? 'text-2xl' : 'text-lg')}>{tour.title}</h3>
          {isLarge && tour.description ? <p className="mt-2 text-sm text-slate-300">{tour.description}</p> : null}
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

        {isLarge && tour.highlights?.length ? (
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
            <span className={cn('font-extrabold text-white', isLarge ? 'text-2xl' : 'text-lg')}>{tour.price}</span>
            <span className="text-xs text-slate-400"> {tour.priceUnit ?? '/ Person'}</span>
          </p>
          <ButtonLink href={`/booking?tour=${tour.slug}`} size={isLarge ? 'md' : 'sm'} className="transition hover:scale-105">
            Book Now
            <ArrowRight size={16} />
          </ButtonLink>
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
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [featured, second, third, ...overflow] = tours;
  const bentoTours = [second, third].filter((tour): tour is TourPackage => Boolean(tour));

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

      {featured ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <TourCard tour={featured} size="lg" />
          <div className="flex flex-col gap-6">
            {bentoTours.map((tour) => (
              <TourCard key={tour.slug} tour={tour} size="sm" />
            ))}
          </div>
        </div>
      ) : null}

      {/* Every tour beyond the top 3 (the ones already shown in the bento above) flows into
          this carousel instead of an ever-taller stack — stays clean and compact whether
          there are 2 more tours or 200. watchOverflow auto-hides nav/pagination when the
          remaining tours already fit in one view, so it degrades gracefully at small counts. */}
      {overflow.length > 0 ? (
        <div className="relative mt-6">
          <Swiper
            modules={[Navigation, Pagination]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setIsLocked(swiper.isLocked);
            }}
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            watchOverflow
            grabCursor
            slidesPerView={1.1}
            spaceBetween={20}
            breakpoints={{
              640: { slidesPerView: 2.1, spaceBetween: 20 },
              1024: { slidesPerView: 3.2, spaceBetween: 24 }
            }}
            pagination={{ clickable: true }}
            navigation={{ prevEl: '.feature-grid-prev', nextEl: '.feature-grid-next' }}
            className="feature-grid-swiper"
          >
            {overflow.map((tour) => (
              <SwiperSlide key={tour.slug} className="h-auto pb-10">
                <TourCard tour={tour} size="sm" />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* isLocked mirrors Swiper's own lock/unlock events (fired when watchOverflow
              detects the remaining tours already fit in one view) — no point showing
              working nav arrows for a carousel that can't actually scroll anywhere. */}
          {!isLocked ? (
            <>
              <button
                type="button"
                aria-label="Previous tours"
                onClick={() => swiperRef.current?.slidePrev()}
                className="feature-grid-prev cursor-hover absolute -left-4 top-1/3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next tours"
                onClick={() => swiperRef.current?.slideNext()}
                className="feature-grid-next cursor-hover absolute -right-4 top-1/3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
