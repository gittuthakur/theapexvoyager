import type { Metadata } from 'next';
import WhyTheApexVoyagerContent from '@/components/modules/WhyTheApexVoyagerContent';

export const metadata: Metadata = {
  title: 'Why The Apex Voyager | The Apex Voyager',
  description: 'What makes The Apex Voyager different — curated journeys, local expertise, transparent pricing and support for the whole trip.'
};

export default function WhyTheApexVoyagerPage() {
  return <WhyTheApexVoyagerContent />;
}
