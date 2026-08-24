import PackageCard from '@/components/modules/PackageCard';
import RegionTourCard from '@/components/modules/regions/RegionTourCard';
import type { TravelPackage } from '@/types/package';
import type { TourPackage } from '@/types/tour';

export interface RegionJourneysProps {
  journeys: TravelPackage[];
  tours: TourPackage[];
  regionLabel: string;
}

// Journeys (Journey model) and tours (Tour model) are genuinely different
// collections with incompatible field shapes (string vs number price, different
// itinerary/faq subdocuments) — rendered as two independently-empty-hideable
// sub-groups within one section rather than forced into one merged grid.
export default function RegionJourneys({ journeys, tours, regionLabel }: RegionJourneysProps) {
  if (journeys.length === 0 && tours.length === 0) return null;

  return (
    <section id="journeys" className="py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">Ready to book</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">Journeys &amp; Tours in {regionLabel}</h2>

      {journeys.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900">Curated Journeys</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {journeys.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} regionLabel={regionLabel} />
            ))}
          </div>
        </div>
      ) : null}

      {tours.length > 0 ? (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-slate-900">Tours &amp; Experiences</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <RegionTourCard key={tour.slug} tour={tour} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
