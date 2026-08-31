import { permanentRedirect } from 'next/navigation';

// /tours is kept as a permanent redirect to /journeys — the Tours vertical has been
// deprecated in favor of the Journeys/Packages catalog. Tour categories don't map
// onto Journeys categories, so query params aren't forwarded.
// permanentRedirect (308), not redirect (307) — this route has no loading.tsx, so
// nothing streams before this fires; the previous redirect() call didn't actually
// match its own "permanent redirect" comment.
export default function ToursRedirect() {
  permanentRedirect('/journeys');
}
