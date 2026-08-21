import type { Metadata } from 'next';
import TermsAndConditionsContent from '@/components/modules/TermsAndConditionsContent';

export const metadata: Metadata = {
  title: 'Terms & Conditions | The Apex Voyager',
  description: 'The terms that apply to journeys, stays, transport, and experiences booked through The Apex Voyager.'
};

export default function TermsPage() {
  return <TermsAndConditionsContent />;
}
