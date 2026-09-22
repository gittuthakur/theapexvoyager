import type { Metadata } from 'next';
import WhyTheApexVoyagerContent from '@/components/modules/WhyTheApexVoyagerContent';
import { images } from '@/config/images.config';

const title = 'Why The Apex Voyager India | The Apex Voyager India';
const description = 'What makes The Apex Voyager India different — curated journeys, local expertise, transparent pricing and support for the whole trip.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/why-the-apex-voyager' },
  openGraph: { title, description, url: '/why-the-apex-voyager', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function WhyTheApexVoyagerPage() {
  return <WhyTheApexVoyagerContent />;
}
