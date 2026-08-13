import Link from 'next/link';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import type { HotelPackage } from '@/types';

export interface HotelCardProps {
  hotel: HotelPackage;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-glow transition hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-900">
        <img src={hotel.images[0]} alt={hotel.title} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">
          {hotel.category}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-white">{hotel.title}</h3>
          {hotel.rating ? (
            <span className="inline-flex items-center gap-1 text-sm text-slate-400">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {hotel.rating.toFixed(1)}
              {hotel.reviewCount ? <span className="text-slate-500"> ({hotel.reviewCount})</span> : null}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-7 text-slate-300">{hotel.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-apex-300" />
            {hotel.location}
          </span>
        </div>
        {hotel.amenities?.length ? (
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 4).map((amenity) => (
              <span key={amenity} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                {amenity}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Per night</p>
            <p className="text-xl font-bold text-white">₹{hotel.pricePerNight.toLocaleString('en-IN')}</p>
          </div>
          <Link
            href={`/homestays/${hotel.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-apex-400"
          >
            View Details <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
