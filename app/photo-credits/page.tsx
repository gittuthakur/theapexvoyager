import type { Metadata } from 'next';
import PhotoCreditsContent from '@/components/modules/PhotoCreditsContent';

export const metadata: Metadata = {
  title: 'Photo Credits | The Apex Voyager',
  description: 'Attribution for destination photography sourced under Creative Commons licenses.'
};

export default function PhotoCreditsPage() {
  return <PhotoCreditsContent />;
}
