import type { Metadata } from 'next';
import TermsAndConditionsContent from '@/components/modules/TermsAndConditionsContent';
import { images } from '@/config/images.config';

const title = 'Terms & Conditions | The Apex Voyager India';
const description = 'The terms that apply to journeys, stays, transport, and experiences booked through The Apex Voyager India.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/terms' },
  openGraph: { title, description, url: '/terms', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function TermsPage() {
  return <TermsAndConditionsContent />;
}
