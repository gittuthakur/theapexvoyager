import type { Metadata } from 'next';
import CancellationPolicyContent from '@/components/modules/CancellationPolicyContent';
import { images } from '@/config/images.config';

const title = 'Cancellation Policy | The Apex Voyager India';
const description = 'How cancellations, date changes, and refunds are handled for bookings with The Apex Voyager India.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/cancellation-policy' },
  openGraph: { title, description, url: '/cancellation-policy', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function CancellationPolicyPage() {
  return <CancellationPolicyContent />;
}
