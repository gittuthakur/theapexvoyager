'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './TestimonialSection.css';
import { RatingStars } from '@/components/ui/RatingStars';
import { fadeInUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@/types';

export interface TestimonialSectionProps {
  title?: string;
  highlight?: string;
  eyebrow?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  viewAllHref?: string;
}

const DESKTOP_SLIDES_PER_VIEW = 3;
const TABLET_SLIDES_PER_VIEW = 2;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Avatar({ testimonial }: { testimonial: Testimonial }) {
  if (testimonial.avatar) {
    return (
      <Image
        src={testimonial.avatar}
        alt={`${testimonial.author}, verified Apex Voyager traveler`}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-apex-500/20 text-sm font-semibold text-apex-200">
      {initials(testimonial.author)}
    </span>
  );
}

export default function TestimonialSection({
  title = 'What Our',
  highlight = 'Guests Say',
  eyebrow = '500+ Verified Reviews',
  subtitle = 'Real stories from real adventurers who trusted us with their dreams.',
  testimonials,
  viewAllHref = '/reviews'
}: TestimonialSectionProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const featured = testimonials.find((testimonial) => testimonial.featured) ?? testimonials[0];
  const rest = testimonials.filter((testimonial) => testimonial !== featured);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(rest.map((testimonial) => testimonial.category).filter(Boolean) as string[]))],
    [rest]
  );
  const [activeCategory, setActiveCategory] = useState('All');
  const visible = activeCategory === 'All' ? rest : rest.filter((testimonial) => testimonial.category === activeCategory);
  // Same loop-sufficiency math as the destinations carousel: Swiper needs roughly
  // 2x the desktop slidesPerView in real slides before it can loop without warning.
  const canLoop = visible.length >= DESKTOP_SLIDES_PER_VIEW * 2;

  return (
    <section className="mx-auto mt-20 max-w-7xl px-6 sm:px-10 lg:mt-28 lg:px-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="flex flex-col items-center text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
          ★ {eyebrow}
        </span>
        <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
          {title} <span className="text-apex-300">{highlight}</span>
        </h2>
        <p className="mt-3 max-w-xl text-slate-300">{subtitle}</p>
      </motion.div>

      {featured ? (
        <motion.article
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mt-10 rounded-[2rem] border border-white/10 bg-gradient-to-br from-apex-900/40 to-slate-950/80 p-8 shadow-glow sm:p-12"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <Quote size={36} className="shrink-0 text-apex-400/60" aria-hidden="true" />
            <RatingStars rating={featured.rating} className="sm:order-2" />
          </div>
          <p className="mt-4 text-lg italic leading-8 text-white sm:text-xl">&ldquo;{featured.quote}&rdquo;</p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar testimonial={featured} />
              <div>
                <p className="text-sm font-semibold text-white">{featured.author}</p>
                {featured.location ? <p className="text-xs text-slate-400">{featured.location}</p> : null}
              </div>
            </div>
            {featured.tourTitle ? (
              <p className="text-xs text-slate-400">
                {featured.tourTitle}
                {featured.tripDate ? ` · ${featured.tripDate}` : ''}
              </p>
            ) : null}
          </div>
        </motion.article>
      ) : null}

      {/* Swiper (not a static grid) so this scales to dozens of reviews without the
          section growing unbounded — key={activeCategory} forces a clean remount
          (fresh slide index, no stale transform state) whenever the filter changes,
          instead of trying to reactively patch Swiper's internal slide list in place. */}
      {visible.length ? (
        <div className="relative mt-6">
          <Swiper
            key={activeCategory}
            modules={[Navigation, Pagination]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setIsLocked(swiper.isLocked);
            }}
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            watchOverflow
            grabCursor
            loop={canLoop}
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
            {visible.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <article className="h-full rounded-[1.5rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10">
                  <RatingStars rating={testimonial.rating} size={14} />
                  <p className="mt-3 text-sm text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <Avatar testimonial={testimonial} />
                    <div>
                      <p className="text-sm font-semibold text-white">{testimonial.author}</p>
                      {testimonial.location ? <p className="text-xs text-slate-400">{testimonial.location}</p> : null}
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          {!isLocked ? (
            <>
              <button
                type="button"
                aria-label="Previous reviews"
                onClick={() => swiperRef.current?.slidePrev()}
                className="testimonial-prev cursor-hover absolute -left-4 top-1/3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next reviews"
                onClick={() => swiperRef.current?.slideNext()}
                className="testimonial-next cursor-hover absolute -right-4 top-1/3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                'cursor-hover rounded-full px-4 py-2 text-xs font-semibold transition',
                activeCategory === category ? 'bg-apex-500 text-white' : 'bg-white/5 text-slate-300 hover:text-white'
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <Link
          href={viewAllHref}
          className="cursor-hover inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/20 transition hover:scale-105 hover:bg-apex-400"
        >
          Explore All 200+ Stories
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
