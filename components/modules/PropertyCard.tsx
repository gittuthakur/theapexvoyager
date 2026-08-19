'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Heart, MapPin, Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import WhatsAppEnquireButton from '@/components/modules/WhatsAppEnquireButton';
import { getPlaceholderImageForCategory } from '@/lib/hotelImages';
import { CATEGORY_TO_STAY_TYPE } from '@/types/stay';
import { cn } from '@/lib/utils';
import type { HotelPackage } from '@/types';

export interface PropertyCardProps {
  hotel: HotelPackage;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  priority?: boolean;
}

// Client-only, non-persisted wishlist — a real `favorites` collection (see the
// Apex Stays plan) is a future backend addition; this keeps the UI functional
// today without inventing server-side state ahead of that.
const WISHLIST_STORAGE_KEY = 'apex-stays-wishlist';

function readWishlist(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

// `toLocaleString('en-IN')` depends on the JS engine's ICU data — Node's SSR
// runtime doesn't always ship the full locale tables the browser has, so the
// same price can render with different digit grouping on the server vs. the
// client and trip a hydration mismatch. This does the Indian lakh/crore
// grouping with plain string math instead, so server and client always agree.
function formatIndianPrice(amount: number): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const digits = String(Math.abs(rounded));
  const lastThree = digits.slice(-3);
  const remaining = digits.slice(0, -3);
  const grouped = remaining ? `${remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}` : lastThree;
  return `${isNegative ? '-' : ''}${grouped}`;
}

export default function PropertyCard({ hotel, checkIn, checkOut, guests, priority = false }: PropertyCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(readWishlist().has(hotel.slug));
  }, [hotel.slug]);

  function toggleWishlist() {
    const current = readWishlist();
    if (current.has(hotel.slug)) {
      current.delete(hotel.slug);
    } else {
      current.add(hotel.slug);
    }
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(Array.from(current)));
    setWishlisted(current.has(hotel.slug));
  }

  const detailParams = new URLSearchParams();
  if (checkIn) detailParams.set('checkIn', checkIn);
  if (checkOut) detailParams.set('checkOut', checkOut);
  if (guests) detailParams.set('guests', guests);
  const detailQuery = detailParams.toString();
  const detailHref = detailQuery ? `/stays/${hotel.slug}?${detailQuery}` : `/stays/${hotel.slug}`;

  const price = hotel.places?.customPrice ?? hotel.pricePerNight;
  const imageSrc = hotel.images[0] ?? getPlaceholderImageForCategory(hotel.category);

  return (
    <article className="group flex h-full flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out motion-safe:hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-52 overflow-hidden bg-slate-300 sm:h-52">
        <SafeImage
          src={imageSrc}
          alt={hotel.title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition duration-500 ease-in-out motion-safe:group-hover:scale-105"
          priority={priority}
        />
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-apex-600 backdrop-blur-sm">
            {hotel.category}
          </span>
          {hotel.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-emerald-700 backdrop-blur-sm">
              <BadgeCheck size={13} className="text-emerald-600" />
              Apex Verified
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          className="cursor-hover absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 backdrop-blur-sm transition-colors duration-300 ease-in-out hover:text-rose-500"
        >
          <Heart size={16} className={cn(wishlisted && 'fill-rose-500 text-rose-500')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">{hotel.title}</h3>
          {hotel.rating ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-500">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {hotel.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={14} className="text-apex-600 shrink-0" />
          {hotel.location}
          {hotel.reviewCount ? <span className="text-slate-400"> &nbsp;•&nbsp; {hotel.reviewCount} reviews</span> : null}
        </span>

        {hotel.amenities?.length ? (
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                {amenity}
              </span>
            ))}
          </div>
        ) : null}

        {hotel.cancellationPolicy || hotel.mealPlan ? (
          <p className="text-xs text-slate-500">{[hotel.cancellationPolicy, hotel.mealPlan].filter(Boolean).join(' · ')}</p>
        ) : null}

        <div className="flex-1" />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              {hotel.places?.customPrice ? 'Starting from' : 'From'}
            </p>
            <p className="text-3xl font-bold text-slate-900">
              ₹{formatIndianPrice(price)} <span className="text-sm font-normal text-slate-500">/ night</span>
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3">
            <WhatsAppEnquireButton selection={{ name: hotel.title, type: 'stay', stayType: CATEGORY_TO_STAY_TYPE[hotel.category] }} />
            <Link
              href={detailHref}
              className="cursor-hover inline-flex items-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              View Stay
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
