import { permanentRedirect } from 'next/navigation';
import { getTourBySlug } from '@/lib/tours';
import { getDestinationTitleBySlug } from '@/config/destinations.config';

interface TourDetailRedirectProps {
  params: Promise<{ slug: string }>;
}

// /tours/[slug] is kept as a permanent redirect to /journeys — the Tours vertical
// has been deprecated in favor of the Journeys/Packages catalog. Tour slugs have no
// equivalent Journey slug, so this can't land on a specific journey — but it can at
// least preserve which destination the tour belonged to instead of dropping all
// context on the bare listing. The destination filter on /journeys matches against
// real destination names, not slugs, so `destinationSlug` (e.g. 'spiti-valley') is
// resolved to its curated title ('Spiti Valley') first — passing the raw slug through
// silently produced a real, reproducible "0 journeys found" for every tour whose
// slug otherwise matches a real destination.
export default async function TourDetailRedirect({ params }: TourDetailRedirectProps) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  const destinationTitle = tour?.destinationSlug ? getDestinationTitleBySlug(tour.destinationSlug) : undefined;
  // permanentRedirect (308), not redirect (307) — matches this route's own "permanent
  // redirect" comment above; no loading.tsx on this route, so nothing streams before
  // this fires despite the async lookup.
  permanentRedirect(destinationTitle ? `/journeys?destination=${encodeURIComponent(destinationTitle)}` : '/journeys');
}
