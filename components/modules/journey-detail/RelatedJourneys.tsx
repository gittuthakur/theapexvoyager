import PackageCard from '@/components/modules/PackageCard';
import type { TravelPackage } from '@/types/package';

export interface RelatedJourneysProps {
  journeys: TravelPackage[];
  /** Region badge per journey slug — same derivation /journeys' own PackageCard uses, computed server-side (see app/journeys/[slug]/page.tsx). Omitted (no badge) when it can't be resolved. */
  regionLabelsBySlug?: Record<string, string>;
}

// Journey Detail-exclusive section. Reuses the existing, unmodified PackageCard (the
// same card the /journeys listing page renders) — no new card design, just a new
// place it's shown. Renders nothing when there's nothing real to show (no invented
// "related" entries).
export default function RelatedJourneys({ journeys, regionLabelsBySlug }: RelatedJourneysProps) {
  if (!journeys.length) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">More Journeys to Explore</h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {journeys.map((journey) => (
          <PackageCard key={journey.slug} pkg={journey} regionLabel={regionLabelsBySlug?.[journey.slug]} />
        ))}
      </div>
    </div>
  );
}
