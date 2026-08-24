import { BadgeCheck, MapPin, Star } from 'lucide-react';
import DetailHero from '@/components/modules/detail/DetailHero';
import type { HotelPackage } from '@/types';

export interface StayHeroProps {
  hotel: HotelPackage;
  /** The chosen primary/first gallery image — the caller (PropertyDetail) still owns
   *  building the full gallery list and rendering the rest as a thumbnail strip below. */
  image: string;
}

// Thin adapter over the shared DetailHero. Previously a plain white-card title block
// followed by a separate, un-overlaid gallery image; now the same image-led hero
// language as Region/Journey/Destination. Booking CTA stays exactly where it is today
// (the sticky pricing aside further down the page) — not relocated into the hero.
export default function StayHero({ hotel, image }: StayHeroProps) {
  return (
    <DetailHero
      image={image}
      imageAlt={hotel.title}
      imageSizes="(min-width: 1024px) 1200px, 100vw"
      eyebrow={hotel.category}
      title={hotel.title}
      meta={
        <>
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-apex-300" /> {hotel.location}
          </span>
          {hotel.verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
              <BadgeCheck size={13} /> Apex Verified
            </span>
          ) : null}
          {hotel.rating ? (
            <span className="inline-flex items-center gap-2">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {hotel.rating.toFixed(1)}
              {hotel.reviewCount ? <span className="text-white/60"> ({hotel.reviewCount} reviews)</span> : null}
            </span>
          ) : null}
        </>
      }
    />
  );
}
