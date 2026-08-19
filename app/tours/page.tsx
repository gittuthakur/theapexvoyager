import { redirect } from 'next/navigation';

// /tours is kept as a permanent redirect to /journeys — the Tours vertical has been
// deprecated in favor of the Journeys/Packages catalog. Tour categories don't map
// onto Journeys categories, so query params aren't forwarded.
export default function ToursRedirect() {
  redirect('/journeys');
}
