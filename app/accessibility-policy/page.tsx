import type { Metadata } from 'next';
import AccessibilityPolicyContent from '@/components/modules/AccessibilityPolicyContent';

export const metadata: Metadata = {
  title: 'Accessibility & Assistance Animals Policy | The Apex Voyager',
  description:
    'The Apex Voyager\'s accessibility policy for travelers with disabilities and service animals, in line with the Rights of Persons with Disabilities (RPWD) Act, 2016.'
};

export default function AccessibilityPolicyPage() {
  return <AccessibilityPolicyContent />;
}
