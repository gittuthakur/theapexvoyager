import type { Metadata } from 'next';
import CareersContent from '@/components/modules/CareersContent';

export const metadata: Metadata = {
  title: 'Careers | The Apex Voyager',
  description: 'Join The Apex Voyager team building expedition travel experiences across the Himalayas.'
};

export default function CareersPage() {
  return <CareersContent />;
}
