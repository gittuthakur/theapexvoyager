import Link from 'next/link';
import { Clock } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import type { TourPackage } from '@/types/tour';

export interface RegionTourCardProps {
  tour: TourPackage;
}

// Region Hub-specific — the shared TourCard lives as a private, carousel-coupled
// function inside components/modules/FeatureGrid.tsx and isn't reusable standalone,
// so this is a presentational-only variant visually consistent with PackageCard
// (same rounded-corner/shadow/price-badge language) but with no carousel/selection props.
export default function RegionTourCard({ tour }: RegionTourCardProps) {
  return (
    <Link
      href="/journeys"
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:shadow-xl"
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {tour.image ? (
          <SafeImage src={tour.image} alt={tour.title} fill sizes="(min-width: 1024px) 360px, 45vw" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-semibold text-slate-900">{tour.title}</h3>
        <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Clock size={14} className="text-apex-600" />
          {tour.duration}
        </p>
        <div className="flex-1" />
        <p className="mt-2 text-2xl font-bold text-apex-600">{tour.price}</p>
      </div>
    </Link>
  );
}
