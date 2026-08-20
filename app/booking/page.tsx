import { redirect } from 'next/navigation';

interface BookingRedirectProps {
  searchParams: Promise<{ tour?: string; destination?: string }>;
}

// /booking is kept as a permanent redirect to /plan-my-journey — the standalone Tour
// booking flow has been deprecated in favor of the unified journey-planning funnel.
// Any ?tour=/?destination= context the link was clicked with is forwarded so the
// wizard can prefill the destination instead of starting from a blank slate.
export default async function BookingRedirect({ searchParams }: BookingRedirectProps) {
  const { tour, destination } = await searchParams;
  const params = new URLSearchParams();
  if (tour) params.set('tour', tour);
  if (destination) params.set('destination', destination);
  const query = params.toString();
  redirect(query ? `/plan-my-journey?${query}` : '/plan-my-journey');
}
