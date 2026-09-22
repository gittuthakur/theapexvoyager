import type { Metadata } from 'next';
import PrivacyPolicyContent from '@/components/modules/PrivacyPolicyContent';
import { images } from '@/config/images.config';

const title = 'Privacy Policy | The Apex Voyager India';
const description = 'How The Apex Voyager India collects, uses, and protects the information you share with us.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/privacy' },
  openGraph: { title, description, url: '/privacy', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function PrivacyPage() {
  return <PrivacyPolicyContent />;
}
