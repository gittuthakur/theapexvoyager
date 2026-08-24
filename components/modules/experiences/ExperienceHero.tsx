import { BadgeCheck, MapPin, Star } from 'lucide-react';
import DetailHero from '@/components/modules/detail/DetailHero';
import type { Experience } from '@/types/experience';

const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'bg-apex-500 text-white',
  Popular: 'bg-slate-900 text-white',
  New: 'bg-emerald-600 text-white'
};

export interface ExperienceHeroProps {
  experience: Experience;
  /** The chosen primary/first gallery image — the caller still owns building the full
   *  gallery list and rendering the rest as a thumbnail strip below. */
  image: string;
}

// Thin adapter over the shared DetailHero. Previously a plain title block followed by
// a side-by-side (non-overlaid) image grid; now the same image-led hero language as
// Region/Journey/Destination/Stay. Booking CTA stays in the sticky pricing aside
// further down the page, unchanged.
export default function ExperienceHero({ experience, image }: ExperienceHeroProps) {
  return (
    <DetailHero
      image={image}
      imageAlt={experience.title}
      imageSizes="(min-width: 640px) 65vw, 100vw"
      title={experience.title}
      meta={
        <>
          {experience.badge ? (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] ${BADGE_STYLES[experience.badge]}`}>
              {experience.badge}
            </span>
          ) : null}
          {experience.verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
              <BadgeCheck size={13} /> Verified Experience
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-apex-300" /> {experience.location}
          </span>
          {experience.rating ? (
            <span className="inline-flex items-center gap-2">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              {experience.rating.toFixed(1)}
              {experience.reviewCount ? <span className="text-white/60"> ({experience.reviewCount} reviews)</span> : null}
            </span>
          ) : null}
        </>
      }
    />
  );
}
