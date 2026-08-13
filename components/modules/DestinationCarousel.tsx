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

  // slidesPerView="auto" + loop + coverflow turned out to be a fragile combination —
  // Swiper's loop math for 'auto' mode doesn't account correctly for coverflow's own
  // per-slide transform, and it collapsed to showing only the active slide. Numeric
  // slidesPerView is what reliably guarantees "exactly 5 laid out, evenly divided" for
  // Swiper's own centering/pagination math — the actual on-screen card size comes from
  // the fixed !important width/height on .swiper-slide in DestinationCarousel.css, not
  // from dividing the container by this number (see that file for why).
  //
  // Swiper's loop implementation needs slides.length >= ~2x the desktop slidesPerView
  // before it'll loop cleanly without logging "not enough slides for loop mode" — it's
  // why `destinations` has 10 entries.
  const desktopSlidesPerView = Math.min(5, destinations.length);
  const tabletSlidesPerView = Math.min(3, destinations.length);
  const mobileSlidesPerView = Math.min(1.3, destinations.length);
  const canLoop = destinations.length >= desktopSlidesPerView * 2;

  // Native coverflow only offers rotate/depth, not an explicit numeric scale — so the
  // "1.2 center (dominant focal point), 0.95 one slide away, 0.7 two slides away" sizing
  // (matching the 5 visible slides here: center, ±1, ±2) is applied by hand on an inner
  // wrapper, not the .swiper-slide Swiper itself transforms for rotate/depth, to avoid
  // the two transforms fighting each other. Opacity fades progressively alongside it so
  // outer cards visibly recede rather than just being flatly dimmed.
  function applyCoverflowScale(swiper: SwiperInstance) {
    swiper.slides.forEach((slideEl) => {
      const progress = (slideEl as unknown as { progress?: number }).progress ?? 0;
      const distance = Math.min(Math.abs(progress), 2);
      const scale = 1.2 - distance * 0.25;
      const opacity = 1 - distance * 0.35;
      const inner = slideEl.querySelector<HTMLElement>('.coverflow-card-inner');
      if (inner) {
        inner.style.transform = `scale(${scale})`;
        inner.style.opacity = `${opacity}`;
      }
    });
  }

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

      {/* max-w-[1920px] + mx-auto is the boundary the carousel (and its nav buttons,
          which are positioned relative to this box, not the viewport) must respect —
          wider than the max-w-7xl heading above on purpose, so dividing it by 5 slides
          gives each card noticeably more room than a max-w-[1440px] container would. */}
      <div className="relative mx-auto mt-10 w-full max-w-[1920px] px-6 sm:px-16">
        <Swiper
          modules={[Autoplay, EffectCoverflow, Navigation, Pagination]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            applyCoverflowScale(swiper);
          }}
          onProgress={(swiper) => applyCoverflowScale(swiper)}
          onSetTransition={(swiper, duration) => {
            swiper.slides.forEach((slideEl) => {
              const inner = slideEl.querySelector<HTMLElement>('.coverflow-card-inner');
              if (inner) inner.style.transitionDuration = `${duration}ms`;
            });
          }}
          effect="coverflow"
          grabCursor
          centeredSlides
          loop={canLoop}
          speed={600}
          slidesPerGroup={1}
          initialSlide={Math.min(2, destinations.length - 1)}
          slidesPerView={mobileSlidesPerView}
          spaceBetween={16}
          breakpoints={{
            640: { slidesPerView: tabletSlidesPerView, spaceBetween: 20 },
            1024: { slidesPerView: desktopSlidesPerView, spaceBetween: 24 }
          }}
          coverflowEffect={{ rotate: 35, stretch: 0, depth: 400, modifier: 1.5, slideShadows: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={{ prevEl: '.destination-prev', nextEl: '.destination-next' }}
          className="destination-swiper"
        >
          {destinations.map((destination) => (
            <SwiperSlide key={destination.slug}>
              <div className="coverflow-card-inner h-full w-full ease-out">
                <DestinationCard destination={destination} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          aria-label="Previous destination"
          onClick={() => swiperRef.current?.slidePrev()}
          className="destination-prev cursor-hover absolute -left-6 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 p-3 text-white shadow-lg backdrop-blur-sm transition hover:scale-110 hover:bg-apex-500 sm:flex"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          aria-label="Next destination"
          onClick={() => swiperRef.current?.slideNext()}
          className="destination-next cursor-hover absolute -right-6 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 p-3 text-white shadow-lg backdrop-blur-sm transition hover:scale-110 hover:bg-apex-500 sm:flex"
        >
          <ChevronRight size={22} />
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
      className="group relative block h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-glow"
    >
      <span className="absolute left-4 top-4 z-10 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
        {destination.category}
      </span>
      <SafeImage
        src={destination.image}
        alt={`${destination.title} luxury expedition tours, Himachal Pradesh`}
        fill
        sizes="(min-width: 1024px) 400px, 380px"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      {/* to-b (top→bottom), not to-t: the title/description sit at the bottom via
          `inset-x-0 bottom-0` below, so the darkest/most opaque stop has to land there
          for the text to actually be readable — from-black/30 at the top keeps the
          image itself visible up there. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/80 to-black" />
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
