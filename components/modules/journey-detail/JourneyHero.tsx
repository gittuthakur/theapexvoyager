import { Clock, MapPin } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import BackButton from '@/components/ui/BackButton';
import type { TravelPackage } from '@/types/package';

export interface JourneyHeroProps {
  pkg: TravelPackage;
}

// Journey Detail-exclusive hero — a cinematic full-bleed treatment distinct from the
// sitewide InnerHeroBanner (which stays untouched and is used by every other inner
// page). Local to this page only; not imported anywhere else.
export default function JourneyHero({ pkg }: JourneyHeroProps) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[2rem] bg-slate-900 sm:h-[480px] lg:h-[560px]">
      <SafeImage src={pkg.image} alt={pkg.name} fill priority sizes="(min-width: 1024px) 1200px, 100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/75 to-transparent" />

      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <BackButton
          fallbackHref="/journeys"
          label="Back to Journeys"
          className="rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm hover:bg-white"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
        <span className="inline-flex rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {pkg.category}
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">{pkg.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-200 sm:text-base">
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-apex-300" /> {pkg.destination}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock size={16} className="text-apex-300" /> {pkg.duration}
          </span>
        </div>
      </div>
    </div>
  );
}
