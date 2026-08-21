import type { Metadata } from 'next';
import CancellationPolicyContent from '@/components/modules/CancellationPolicyContent';

export const metadata: Metadata = {
  title: 'Cancellation Policy | The Apex Voyager',
  description: 'How cancellations, date changes, and refunds are handled for bookings with The Apex Voyager.'
};

export default function CancellationPolicyPage() {
  return <CancellationPolicyContent />;
}
