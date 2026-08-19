import type { Metadata } from 'next';
import AboutContent from '@/components/modules/AboutContent';

export const metadata: Metadata = {
  title: 'About Us | The Apex Voyager',
  description:
    'The Apex Voyager crafts curated, safety-first Himalayan journeys backed by local expertise and 24/7 support — learn about our mission and the pillars behind every trip.'
};

export default function AboutPage() {
  return <AboutContent />;
}
