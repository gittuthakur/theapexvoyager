'use client';

import { useRef } from 'react';
import Link from 'next/link';
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
import type { HotelCategory } from '@/types';

export interface PropertyTypeCategory {
  category: HotelCategory;
  title: string;
  description: string;
  image: string;
}

export interface ExploreStaysProps {
  title?: string;
  highlight?: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  categories?: PropertyTypeCategory[];
}

const defaultCategories: PropertyTypeCategory[] = [
  {
    category: 'Homestay',
    title: 'Homestays',
    description: 'Live with local families in cozy mountain homes.',
    image: images.destinations.dharamshala
  },
  {
    category: 'Hotel',
    title: 'Hotels',
    description: 'Comfortable stays with modern amenities in every town.',
    image: images.destinations.shimla
  },
  {
    category: 'Resort',
    title: 'Resorts',
    description: 'Full-service getaways with dining, views, and leisure.',
    image: images.destinations.manali
  },
  {
    category: 'Villa',
    title: 'Villas & Cottages',
    description: 'Private cottages and villas for a quiet retreat.',
    image: images.destinations.kasol
  },
  {
    category: 'Camp',
    title: 'Camps & Tents',
    description: 'Riverside and high-altitude camps under open skies.',
    image: images.destinations.spitiValley
  },
  {
    category: 'Treehouse',
    title: 'Treehouses',
    description: 'Sleep among the pines in raised forest hideouts.',
    image: images.destinations.kinnaur
  },
  {
    category: 'Farmstay',
    title: 'Farmstays & Orchards',
    description: 'Pick apples by day, sleep in orchard cottages by night.',
    image: images.destinations.manali
  },
  {
    category: 'Hostel',
    title: 'Backpacker Hostels',
    description: 'Budget bunks and community vibes for solo travelers.',
    image: images.destinations.kasol
  },
  {
    category: 'Heritage',
    title: 'Heritage Properties',
    description: 'Colonial-era mansions and forts turned boutique stays.',
    image: images.destinations.shimla
  },
  {
    category: 'GuestHouse',
    title: 'Guest Houses & Lodges',
    description: 'Simple, welcoming lodges run by local hosts.',
    image: images.destinations.dharamshala
  }
];

export default function ExploreStays({
  title = 'Explore Places to',
  highlight = 'Stay',
  subtitle = 'From cozy rooms to luxury villas',
  viewAllLabel = 'View All Stays',
  viewAllHref = '/homestays',
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
    <section className="mx-auto mt-20 max-w-7xl px-6 sm:px-10 lg:px-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {title} <span className="text-apex-300">{highlight}</span>
          </h2>
          <p className="mt-3 text-slate-300">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className="cursor-hover inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          {viewAllLabel} <ArrowRight size={16} />
        </Link>
      </div>

      <div className="relative mt-8">
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
            <SwiperSlide key={item.category}>
              <Link
                href={`/homestays?category=${item.category}`}
                className="group relative z-0 block h-64 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-glow transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:z-10"
              >
                <SafeImage
                  src={item.image}
                  alt={`${item.title} in Himachal Pradesh`}
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 60vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/35 to-transparent" />
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
          className="explore-stays-prev cursor-hover absolute -left-4 top-[calc(50%-1.5rem)] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Next property types"
          onClick={() => swiperRef.current?.slideNext()}
          className="explore-stays-next cursor-hover absolute -right-4 top-[calc(50%-1.5rem)] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 p-2 text-white backdrop-blur-sm transition hover:bg-apex-500 sm:flex"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
