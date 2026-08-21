import type { Metadata } from 'next';
import FaqsContent from '@/components/modules/FaqsContent';

export const metadata: Metadata = {
  title: 'FAQs | The Apex Voyager',
  description: 'Answers to common questions about booking, journeys, stays, and transport with The Apex Voyager.'
};

export default function FaqsPage() {
  return <FaqsContent />;
}
