import PackageCard from '@/components/modules/PackageCard';
import type { TravelPackage } from '@/types/package';

export interface RelatedJourneysProps {
  journeys: TravelPackage[];
}

// Journey Detail-exclusive section. Reuses the existing, unmodified PackageCard (the
// same card the /journeys listing page renders) — no new card design, just a new
// place it's shown. Renders nothing when there's nothing real to show (no invented
// "related" entries).
export default function RelatedJourneys({ journeys }: RelatedJourneysProps) {
  if (!journeys.length) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">More Journeys to Explore</h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {journeys.map((journey) => (
          <PackageCard key={journey.slug} pkg={journey} />
        ))}
      </div>
    </div>
  );
}
