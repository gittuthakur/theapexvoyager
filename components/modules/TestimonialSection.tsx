'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, BadgeCheck, ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './TestimonialSection.css';
import { RatingStars } from '@/components/ui/RatingStars';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@/types';

// Renders real testimonials when the caller has any (see lib/reviews.ts's
// approved+verified query); otherwise falls back to FALLBACK_EXPERIENCE_PREVIEWS below.
// Its rating/review-count/recommend labels are never given hardcoded defaults — a
// caller must pass genuine, computed values or the stats row simply doesn't render.
export interface TestimonialSectionProps {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  ratingLabel?: string;
  reviewCountLabel?: string;
  recommendLabel?: string;
  testimonials: Testimonial[];
  viewAllHref?: string;
  viewAllLabel?: string;
  regions?: string[];
  travelStyles?: string[];
}

const DESKTOP_SLIDES_PER_VIEW = 3;
const TABLET_SLIDES_PER_VIEW = 2;
const AUTOPLAY_DELAY = 5000;

const DEFAULT_REGIONS = ['All', 'Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand'];
const DEFAULT_TRAVEL_STYLES = ['Adventure', 'Family', 'Honeymoon', 'Cultural', 'Wellness'];

// Honest, non-customer content shown only until real reviews exist — no invented
// names, ratings, review counts or "Verified" claims (rating/verified/source are all
// intentionally omitted so the card design's existing conditionals hide those elements).
// `region` is set because it's a plain fact already stated in each preview's own text
// (Manali/Himachal/Kinnaur-Spiti are all Himachal Pradesh) — without it, the region
// tabs above always emptied the list for every region except "All", since these
// preview objects otherwise carry no region metadata at all.
const FALLBACK_EXPERIENCE_PREVIEWS: Testimonial[] = [
  {
    id: 'preview-couple-escape-manali',
    author: 'Slow Mornings in Manali',
    location: 'Designed for Couples',
    quote:
      'Wake up to mountain views, explore at your own pace, drive through Atal Tunnel and spend time in Sissu without turning the journey into a rushed sightseeing checklist.',
    category: 'Couple Escape',
    region: 'Himachal Pradesh',
    verified: false,
    featured: true
  },
  {
    id: 'preview-family-journey-himachal',
    author: 'A Comfortable Himachal Holiday',
    location: 'Designed for Families',
    quote:
      'Comfortable stays, private transport and a balanced itinerary designed to give families enough time to explore, relax and enjoy the mountains together.',
    category: 'Family Journey',
    region: 'Himachal Pradesh',
    verified: false
  },
  {
    id: 'preview-adventure-journey-kinnaur-spiti',
    author: 'Beyond the Usual Himachal',
    location: 'Designed for Explorers',
    quote:
      'Travel deeper into Kinnaur and Spiti through mountain roads, remote valleys, local villages and landscapes beyond ordinary tourist routes.',
    category: 'Adventure Journey',
    region: 'Himachal Pradesh',
    verified: false
  }
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Avatar({ testimonial, size = 48 }: { testimonial: Testimonial; size?: number }) {
  if (testimonial.avatar) {
    return (
      <Image
        src={testimonial.avatar}
        alt={`${testimonial.author}, verified Apex Voyager traveler`}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ height: size, width: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-apex-500/10 text-sm font-semibold text-apex-600"
      style={{ height: size, width: size }}
    >
      {initials(testimonial.author)}
    </span>
  );
}

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium text-emerald-600', className)}>
      <BadgeCheck size={15} aria-hidden="true" />
      Verified Traveler
    </span>
  );
}

function TripChip({ testimonial }: { testimonial: Testimonial }) {
  const parts = [testimonial.tourTitle, testimonial.duration, testimonial.tripDate].filter(Boolean);
  if (!parts.length) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[#E3E8F0] bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
      {parts.join(' · ')}
    </span>
  );
}

function SourceLink({ source }: { source: NonNullable<Testimonial['source']> }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="cursor-hover inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-300 ease-in-out hover:text-apex-600"
    >
      {source.label}
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}

export default function TestimonialSection({
  eyebrow = 'TRAVELER STORIES',
  title = 'Real Journeys.',
  highlight = 'Real Stories.',
  subtitle = 'From quiet Himalayan villages to unforgettable road trips, hear from travelers who experienced the journey with The Apex Voyager.',
  ratingLabel,
  reviewCountLabel,
  recommendLabel,
  testimonials,
  viewAllHref = '/journeys',
  viewAllLabel = 'Explore All Journeys',
  regions = DEFAULT_REGIONS,
  travelStyles = DEFAULT_TRAVEL_STYLES
}: TestimonialSectionProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [activeRegion, setActiveRegion] = useState('All');
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  const sourceTestimonials = testimonials.length > 0 ? testimonials : FALLBACK_EXPERIENCE_PREVIEWS;
  const items = sourceTestimonials.filter(
    (testimonial) =>
      (activeRegion === 'All' || testimonial.region === activeRegion) &&
      (!activeStyle || testimonial.category === activeStyle)
  );
  const defaultActive = items.find((testimonial) => testimonial.featured) ?? items[0];

  // The active review is tracked by id (not array index) so it stays correct
  // even as `items` is recomputed on every render from the region/style filters.
  const [activeId, setActiveId] = useState(defaultActive?.id);
  useEffect(() => {
    setActiveId(defaultActive?.id);
    // Re-picks the default active review only when the filters actually change,
    // not on every render (`defaultActive`/`items` are new array refs each time).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion, activeStyle]);

  const active = items.find((testimonial) => testimonial.id === activeId) ?? defaultActive;

  // Same loop-sufficiency math as the destinations carousel: Swiper needs roughly
  // 2x the desktop slidesPerView in real slides before it can loop without warning.
  const canLoop = items.length >= DESKTOP_SLIDES_PER_VIEW * 2;

  // Selecting a card only ever updates which review the hero card shows — it never
  // drives the carousel. The carousel's position (autoplay, prev/next, drag) is
  // fully independent so it can keep looping without being yanked around by clicks.
  function selectReview(id: string) {
    setActiveId(id);
  }

  return (
    <section className="py-14 lg:py-16 bg-slate-100">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="flex flex-col items-center text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E3E8F0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-apex-600 shadow-sm">
            {eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            {title} <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{highlight}</span>
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">{subtitle}</p>

          {ratingLabel || reviewCountLabel ? (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-700 sm:gap-x-4">
              {ratingLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star size={16} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                  {ratingLabel}
                </span>
              ) : null}
              {ratingLabel && reviewCountLabel ? (
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" aria-hidden="true" />
              ) : null}
              {reviewCountLabel ? <span>{reviewCountLabel}</span> : null}
              {recommendLabel ? (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" aria-hidden="true" />
                  <span>{recommendLabel}</span>
                </>
              ) : null}
            </div>
          ) : null}
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {regions.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => setActiveRegion(region)}
              className={cn(
                'cursor-hover rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out',
                activeRegion === region ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-200 text-slate-600 hover:text-slate-900'
              )}
            >
              {region}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {travelStyles.map((style) => {
            const isActive = activeStyle === style;
            return (
              <button
                key={style}
                type="button"
                onClick={() => setActiveStyle(isActive ? null : style)}
                className={cn(
                  'cursor-hover rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 ease-in-out',
                  isActive ? 'border-apex-500 bg-apex-50 text-apex-700' : 'border-[#E3E8F0] bg-white text-slate-500 hover:text-slate-900'
                )}
              >
                {style}
              </button>
            );
          })}
        </div>

        {active ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="mt-10 overflow-hidden rounded-[24px] border border-[#E3E8F0] bg-white shadow-md"
          >
            <AnimatePresence mode="wait">
              <motion.article
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.6fr_1fr]"
              >
                <div>
                  <div className="flex items-center justify-between gap-6">
                    <Quote size={36} className="shrink-0 text-apex-400/60" aria-hidden="true" />
                    {active.rating ? <RatingStars rating={active.rating} /> : null}
                  </div>
                  <p className="mt-4 text-lg italic leading-8 text-slate-900 sm:text-xl">&ldquo;{active.quote}&rdquo;</p>
                </div>
                <div className="flex flex-col justify-between gap-6 lg:border-l lg:border-[#E3E8F0] lg:pl-8">
                  <div className="flex items-center gap-3">
                    <Avatar testimonial={active} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{active.author}</p>
                      {active.location ? <p className="text-xs text-slate-500">{active.location}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3">
                    {active.verified !== false ? <VerifiedBadge /> : null}
                    <TripChip testimonial={active} />
                    {active.source ? <SourceLink source={active.source} /> : null}
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </motion.div>
        ) : (
          <p className="mt-10 rounded-[24px] border border-[#E3E8F0] bg-white p-10 text-center text-sm text-slate-500">
            No traveler stories match these filters yet.
          </p>
        )}

        {/* Swiper (not a static grid) so this scales to dozens of reviews without the
            section growing unbounded — key={activeRegion+activeStyle} forces a clean
            remount (fresh slide index, no stale transform state) whenever a filter
            changes, instead of trying to reactively patch Swiper's internal slide list.
            The carousel's own position (autoplay, prev/next, drag) is intentionally
            NOT wired to `activeId` — only clicking a card changes the hero above, so
            autoplay/loop can keep cycling without ever yanking the hero card around. */}
        {items.length ? (
          <div className="relative mt-6">
            <Swiper
              key={`${activeRegion}-${activeStyle ?? 'all'}`}
              modules={[Autoplay, Navigation, Pagination]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                setIsLocked(swiper.isLocked);
              }}
              onLock={() => setIsLocked(true)}
              onUnlock={() => setIsLocked(false)}
              watchOverflow
              grabCursor
              loop={canLoop}
              autoplay={{ delay: AUTOPLAY_DELAY, disableOnInteraction: false, pauseOnMouseEnter: true }}
              slidesPerView={1.05}
              spaceBetween={16}
              breakpoints={{
                640: { slidesPerView: TABLET_SLIDES_PER_VIEW, spaceBetween: 16 },
                1024: { slidesPerView: DESKTOP_SLIDES_PER_VIEW, spaceBetween: 16 }
              }}
              pagination={{ clickable: true }}
              navigation={{ prevEl: '.testimonial-prev', nextEl: '.testimonial-next' }}
              className="testimonial-swiper"
            >
              {items.map((testimonial) => {
                const isActive = testimonial.id === active?.id;
                return (
                  <SwiperSlide key={testimonial.id}>
                    <article
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      onClick={() => selectReview(testimonial.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          selectReview(testimonial.id);
                        }
                      }}
                      className={cn(
                        'cursor-hover flex h-full flex-col rounded-[20px] border bg-white p-6 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md',
                        isActive ? 'border-apex-500 ring-apex-500/30' : 'border-[#E3E8F0]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {testimonial.rating ? <RatingStars rating={testimonial.rating} size={14} /> : null}
                        {testimonial.verified !== false ? <VerifiedBadge /> : null}
                      </div>
                      <p className="mt-3 flex-1 text-sm text-slate-600">&ldquo;{testimonial.quote}&rdquo;</p>
                      <div className="mt-5 flex items-center gap-3">
                        <Avatar testimonial={testimonial} size={40} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{testimonial.author}</p>
                          {testimonial.location ? <p className="text-xs text-slate-500">{testimonial.location}</p> : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E3E8F0] pt-4">
                        <TripChip testimonial={testimonial} />
                        {testimonial.source ? <SourceLink source={testimonial.source} /> : null}
                      </div>
                    </article>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {!isLocked ? (
              <>
                <button
                  type="button"
                  aria-label="Previous reviews"
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="testimonial-prev cursor-hover absolute -left-5 top-[calc(50%-1.5rem)] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#E3E8F0] bg-white p-2 text-slate-700 shadow-md transition-all duration-300 ease-in-out hover:bg-apex-500 hover:text-white sm:flex"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Next reviews"
                  onClick={() => swiperRef.current?.slideNext()}
                  className="testimonial-next cursor-hover absolute -right-5 top-[calc(50%-1.5rem)] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#E3E8F0] bg-white p-2 text-slate-700 shadow-md transition-all duration-300 ease-in-out hover:bg-apex-500 hover:text-white sm:flex"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex justify-center">
          <Link
            href={viewAllHref}
            className="cursor-hover inline-flex items-center gap-2 rounded-lg bg-apex-500 px-6 py-3.5 text-md font-semibold text-white shadow-lg shadow-apex-500/20 transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            {viewAllLabel}
            <ArrowRight size={22} />
          </Link>
        </div>
      </div>
    </section>
  );
}
