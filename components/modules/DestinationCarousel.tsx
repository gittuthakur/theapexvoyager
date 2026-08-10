'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// @ts-ignore: CSS side-effect import without type declarations
import './DestinationCarousel.css';
import { SafeImage } from '@/components/ui/SafeImage';
import type { Destination } from '@/types';

export interface DestinationCarouselProps {
  title?: string;
  eyebrow?: string;
  destinations: Destination[];
  viewAllHref?: string;
}

export default function DestinationCarousel({
  title = 'Destinations',
  eyebrow = 'Where we go',
  destinations,
  viewAllHref = '/destinations'
}: DestinationCarouselProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);

  // Swiper's loop implementation needs slides.length >= slidesPerView + loopedSlides,
  // and loopedSlides itself scales with slidesPerView — in practice that means
  // roughly 2x the desktop slidesPerView in unique slides before it'll loop without
  // logging "not enough slides for loop mode" and disabling itself. Clamping
  // slidesPerView to destinations.length keeps every breakpoint warning-free
  // regardless of how much content exists; loop only turns on once there's enough.
  const desktopSlidesPerView = Math.min(5, destinations.length);
  const tabletSlidesPerView = Math.min(3, destinations.length);
  const mobileSlidesPerView = Math.min(1.2, destinations.length);
  const canLoop = destinations.length >= desktopSlidesPerView * 2;

  return (
    <section className="py-16 overflow-hidden lg:py-24 border-y border-white/5 bg-[#080E1E]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 sm:flex-row sm:items-end sm:justify-between sm:px-10 lg:px-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-apex-300">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Our <span className="text-apex-300">{title}</span>
          </h2>
        </div>
        <Link
          href={viewAllHref}
          className="cursor-hover inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          View all destinations <ArrowRight size={16} />
        </Link>
      </div>

      {/* max-w-[1440px] + mx-auto is the boundary the carousel (and its nav buttons,
          which are positioned relative to this box, not the viewport) must respect. */}
      <div className="relative mx-auto mt-10 w-full max-w-[1440px] px-4 sm:px-8">
        <Swiper
          modules={[Autoplay, EffectCoverflow, Navigation, Pagination]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          effect="coverflow"
          grabCursor
          centeredSlides
          loop={canLoop}
          initialSlide={Math.min(2, destinations.length - 1)}
          slidesPerView={mobileSlidesPerView}
          spaceBetween={16}
          breakpoints={{
            640: { slidesPerView: tabletSlidesPerView, spaceBetween: 20 },
            1024: { slidesPerView: desktopSlidesPerView, spaceBetween: 24 }
          }}
          coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 1, slideShadows: false }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={{ prevEl: '.destination-prev', nextEl: '.destination-next' }}
          className="destination-swiper"
        >
          {destinations.map((destination) => (
            <SwiperSlide key={destination.slug}>
              <DestinationCard destination={destination} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          aria-label="Previous destination"
          onClick={() => swiperRef.current?.slidePrev()}
          className="destination-prev cursor-hover absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Next destination"
          onClick={() => swiperRef.current?.slideNext()}
          className="destination-next cursor-hover absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  const href = destination.link ?? `/destinations/${destination.slug}`;

  return (
    <Link
      href={href}
      className="group relative block h-64 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-glow sm:h-72 lg:h-80"
    >
      <span className="absolute left-4 top-4 z-10 rounded-full bg-[#0a0a0a]/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
        {destination.category}
      </span>
      <SafeImage
        src={destination.image}
        alt={`${destination.title} luxury expedition tours, Himachal Pradesh`}
        fill
        sizes="(min-width: 1024px) 260px, (min-width: 640px) 30vw, 60vw"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="text-2xl font-bold text-white">{destination.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-300">{destination.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-apex-300">{destination.toursCount} tours available</span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-apex-500">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
