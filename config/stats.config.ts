import type { StatItem } from '@/types';

// Values below are placeholders overridden at render time on the homepage with real
// catalog counts (see app/page.tsx's homepageStats). "Happy Travelers", "Safety Record"
// and "Average Rating" were removed — no verified business data backs those figures.
export const statsItems: StatItem[] = [
  { value: '100+', label: 'Destinations' },
  { value: '500+', label: 'Stays & Properties' },
  { value: '150+', label: 'Curated Journeys' }
];
