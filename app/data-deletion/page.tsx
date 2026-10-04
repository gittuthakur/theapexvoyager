import type { Metadata } from 'next';
import DataDeletionContent from '@/components/modules/DataDeletionContent';
import { images } from '@/config/images.config';

const title = 'User Data Deletion Instructions | The Apex Voyager India';
const description =
  'How to ask The Apex Voyager India to delete personal information received through website enquiries and Facebook or Instagram lead forms.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/data-deletion' },
  openGraph: { title, description, url: '/data-deletion', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function DataDeletionPage() {
  return <DataDeletionContent />;
}
