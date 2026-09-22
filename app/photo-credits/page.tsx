import type { Metadata } from 'next';
import PhotoCreditsContent from '@/components/modules/PhotoCreditsContent';
import { images } from '@/config/images.config';

const title = 'Photo Credits | The Apex Voyager India';
const description = 'Attribution for destination photography sourced under Creative Commons licenses.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/photo-credits' },
  openGraph: { title, description, url: '/photo-credits', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function PhotoCreditsPage() {
  return <PhotoCreditsContent />;
}
