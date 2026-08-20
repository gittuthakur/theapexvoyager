import { redirect } from 'next/navigation';
import { getTourBySlug } from '@/lib/tours';

interface TourDetailRedirectProps {
  params: Promise<{ slug: string }>;
}

// /tours/[slug] is kept as a permanent redirect to /journeys — the Tours vertical
// has been deprecated in favor of the Journeys/Packages catalog. Tour slugs have no
// equivalent Journey slug, so this can't land on a specific journey — but it can at
// least preserve which destination the tour belonged to instead of dropping all
// context on the bare listing.
export default async function TourDetailRedirect({ params }: TourDetailRedirectProps) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  redirect(tour?.destinationSlug ? `/journeys?destination=${tour.destinationSlug}` : '/journeys');
}
