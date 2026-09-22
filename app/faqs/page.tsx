import type { Metadata } from 'next';
import FaqsContent from '@/components/modules/FaqsContent';
import { images } from '@/config/images.config';

const title = 'FAQs | The Apex Voyager India';
const description = 'Answers to common questions about booking, journeys, stays, and transport with The Apex Voyager India.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/faqs' },
  openGraph: { title, description, url: '/faqs', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function FaqsPage() {
  return <FaqsContent />;
}
