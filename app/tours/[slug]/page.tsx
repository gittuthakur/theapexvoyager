import { redirect } from 'next/navigation';

// /tours/[slug] is kept as a permanent redirect to /journeys — the Tours vertical
// has been deprecated in favor of the Journeys/Packages catalog. Tour slugs have no
// equivalent Journey slug, so this lands on the listing rather than a 404.
export default function TourDetailRedirect() {
  redirect('/journeys');
}
