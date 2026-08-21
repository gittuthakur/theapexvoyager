import type { Metadata } from 'next';
import PrivacyPolicyContent from '@/components/modules/PrivacyPolicyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | The Apex Voyager',
  description: 'How The Apex Voyager collects, uses, and protects the information you share with us.'
};

export default function PrivacyPage() {
  return <PrivacyPolicyContent />;
}
