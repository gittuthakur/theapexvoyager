import type { Metadata } from 'next';
import AccessibilityPolicyContent from '@/components/modules/AccessibilityPolicyContent';
import { images } from '@/config/images.config';

const title = 'Accessibility & Assistance Animals Policy | The Apex Voyager India';
const description =
  'Accessibility policy for travelers with disabilities and service animals booking with The Apex Voyager India, aligned with India\'s RPWD Act, 2016.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/accessibility-policy' },
  openGraph: { title, description, url: '/accessibility-policy', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function AccessibilityPolicyPage() {
  return <AccessibilityPolicyContent />;
}
