import { redirect } from 'next/navigation';

// /booking is kept as a permanent redirect to /plan-my-journey — the standalone Tour
// booking flow has been deprecated in favor of the unified journey-planning funnel.
export default function BookingRedirect() {
  redirect('/plan-my-journey');
}
