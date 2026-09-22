import type { Metadata } from 'next';
import AboutContent from '@/components/modules/AboutContent';
import { images } from '@/config/images.config';

const title = 'About Us | The Apex Voyager India';
const description =
  'The Apex Voyager India crafts curated, safety-first Himalayan journeys backed by local expertise and 24/7 support. Learn our mission and what guides every trip.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: { title, description, url: '/about', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function AboutPage() {
  return <AboutContent />;
}
