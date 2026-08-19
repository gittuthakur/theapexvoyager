'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ExploreStays.css';
import { SafeImage } from '@/components/ui/SafeImage';
import { images } from '@/config/images.config';
import { fadeInUp, viewportOnce } from '@/lib/motion';

export interface PropertyTypeCategory {
  /** Apex Stays SEO slug — links to /stays/[slug] (see config/stayTypes.config.ts). */
  slug: string;
  title: string;
  description: string;
  image: string;
}

export interface ExploreStaysProps {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  categories?: PropertyTypeCategory[];
}

const defaultCategories: PropertyTypeCategory[] = [
  {
    slug: 'hotels',
    title: 'Hotels',
    description: 'Comfortable stays with modern amenities in every town.',
    image: images.destinations.shimla
  },
  {
    slug: 'resorts',
    title: 'Resorts',
    description: 'Full-service getaways with dining, views, and leisure.',
    image: images.destinations.manali
  },
  {
    slug: 'homestays',
    title: 'Homestays',
    description: 'Live with local families in cozy mountain homes.',
    image: images.destinations.dharamshala
  },
  {
    slug: 'cottages',
    title: 'Cottages & Cabins',
    description: 'Wood-panelled hideouts tucked into the hillside.',
    image: images.destinations.kinnaur
  },
  {
    slug: 'treehouses',
    title: 'Treehouses',
    description: 'Sleep among the pines in raised forest hideouts.',
    image: images.destinations.kasol
  },
  {
    slug: 'glamping',
    title: 'Glamping',
    description: 'Riverside and high-altitude camps under open skies.',
    image: images.destinations.spitiValley
  },
  {
    slug: 'villas',
    title: 'Villas',
    description: 'Spacious private villas for families and groups.',
    image: images.destinations.kasol
  },
  {
    slug: 'boutique-stays',
    title: 'Boutique Stays',
    description: 'Handpicked, design-led properties across the Himalayas.',
    image: images.destinations.shimla
  }
];

export default function ExploreStays({
  eyebrow = 'APEX STAYS',
  title = 'Stay Somewhere ',
  highlight = 'Worth Remembering',
  subtitle = 'From mountain resorts and local homestays to hidden cabins and unforgettable treehouses, discover stays that make the Himalayas part of the experience.',
  viewAllLabel = 'View All Stays',
  viewAllHref = '/stays',
  categories = defaultCategories
}: ExploreStaysProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);

  // Swiper's loop implementation needs slides.length >= slidesPerView * 2 or it logs
  // "not enough slides for loop mode" and silently disables itself — guard against
  // that instead of hardcoding loop:true so a shorter custom `categories` list degrades
  // gracefully rather than warning in the console.
  const desktopSlidesPerView = 4;
  const canLoop = categories.length >= desktopSlidesPerView * 2;

  return (
    <section className="py-14 lg:py-20 bg-white">
      <div className="mx-auto max-w-[1440px] px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-4xl">
            <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              {title} <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{highlight}</span>
            </h2>
            <p className="mt-3 text-slate-600">{subtitle}</p>
          </div>
          <Link
            href={viewAllHref}
            className="cursor-hover inline-flex items-center gap-1 text-md font-medium text-apex-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
          >
            {viewAllLabel} <ArrowRight size={20} />
          </Link>
        </motion.div>

        <div className="relative mt-6">
          <Swiper
            modules={[Navigation, Pagination]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            grabCursor
            loop={canLoop}
            speed={600}
            slidesPerGroup={1}
            slidesPerView={1.2}
            spaceBetween={16}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 20 },
              1280: { slidesPerView: desktopSlidesPerView, spaceBetween: 24 }
            }}
            pagination={{ clickable: true }}
            navigation={{ prevEl: '.explore-stays-prev', nextEl: '.explore-stays-next' }}
            className="explore-stays-swiper"
          >
            {categories.map((item) => (
              <SwiperSlide key={item.slug}>
                <Link
                  href={`/stays/${item.slug}`}
                  className="group relative z-0 block h-80 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl transition-transform duration-300 ease-out hover:-translate-y-1 hover:z-10"
                >
                  <SafeImage
                    src={item.image}
                    alt={`${item.title} in Himachal Pradesh`}
                    fill
                    sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 60vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-300">{item.description}</p>
                    <span className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-apex-500">
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            aria-label="Previous property types"
            onClick={() => swiperRef.current?.slidePrev()}
            className="explore-stays-prev cursor-hover absolute -left-5 top-[calc(50%-1.5rem)] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-apex-500 sm:flex"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next property types"
            onClick={() => swiperRef.current?.slideNext()}
            className="explore-stays-next cursor-hover absolute -right-5 top-[calc(50%-1.5rem)] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-apex-500 sm:flex"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
