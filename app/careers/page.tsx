import type { Metadata } from 'next';
import CareersContent from '@/components/modules/CareersContent';
import { images } from '@/config/images.config';

const title = 'Careers | The Apex Voyager India';
const description = 'Join The Apex Voyager India team building expedition travel experiences across the Himalayas.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/careers' },
  openGraph: { title, description, url: '/careers', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function CareersPage() {
  return <CareersContent />;
}
