import Link from 'next/link';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import WhatsAppEnquireButton from '@/components/modules/WhatsAppEnquireButton';
import { SafeImage } from '@/components/ui/SafeImage';
import { CATEGORY_TO_STAY_TYPE } from '@/types/stay';
import type { HotelPackage } from '@/types';

export interface HotelCardProps {
  hotel: HotelPackage;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

export default function HotelCard({ hotel, checkIn, checkOut, guests }: HotelCardProps) {
  const detailParams = new URLSearchParams();
  if (checkIn) detailParams.set('checkIn', checkIn);
  if (checkOut) detailParams.set('checkOut', checkOut);
  if (guests) detailParams.set('guests', guests);
  const detailQuery = detailParams.toString();
  const detailHref = detailQuery ? `/homestays/${hotel.slug}?${detailQuery}` : `/homestays/${hotel.slug}`;

  return (
    <article className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow transition hover:-translate-y-1">
      <div className="relative h-72 overflow-hidden rounded-[1.5rem] bg-slate-100">
        <SafeImage
          src={hotel.images[0]}
          alt={hotel.title}
          fill
          sizes="(min-width: 1024px) 33vw, 90vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">
          {hotel.category}
        </span>
      </div>
      {hotel.places?.photos?.length ? (
        <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          {hotel.places.photos.slice(0, 6).map((photo, index) => (
            <div key={photo} className="relative h-20 w-28 shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <SafeImage
                src={photo}
                alt={`${hotel.title} — Google Places photo ${index + 1}`}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-slate-900">{hotel.title}</h3>
          <div className="flex flex-col items-end gap-1">
            {hotel.rating ? (
              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {hotel.rating.toFixed(1)}
                {hotel.reviewCount ? <span className="text-slate-500"> ({hotel.reviewCount})</span> : null}
              </span>
            ) : null}
            {hotel.places?.rating ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                <Star size={11} className="fill-sky-400 text-sky-400" />
                Google {hotel.places.rating.toFixed(1)}
                {hotel.places.userRatingCount ? <span className="text-slate-500"> ({hotel.places.userRatingCount})</span> : null}
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-7 text-slate-600">{hotel.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-apex-600" />
            {hotel.location}
          </span>
        </div>
        {hotel.amenities?.length ? (
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 4).map((amenity) => (
              <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {amenity}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {hotel.places?.customPrice ? 'Starting from' : 'Per night'}
            </p>
            <p className="text-xl font-bold text-slate-900">
              ₹{(hotel.places?.customPrice ?? hotel.pricePerNight).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WhatsAppEnquireButton
              selection={{ name: hotel.title, type: 'stay', stayType: CATEGORY_TO_STAY_TYPE[hotel.category], slug: hotel.slug }}
            />
            <Link
              href={detailHref}
              className="inline-flex items-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              View Details <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
