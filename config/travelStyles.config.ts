import { Compass, Heart, Leaf, Mountain, Sparkles, Users } from 'lucide-react';
import type { DestinationTravelStyle } from '@/types';

// The six canonical "kind of Himalayas" categories for the destinations page. Distinct
// from components/modules/TravelStyleGrid.tsx, which is a static nav grid pointing at
// /tours?category=... — this config instead drives filtering over the curated
// Destination catalog's free-text `travelStyles`/`category` fields via `matchKeywords`
// (see lib/travelStyles.ts), since that catalog was never authored against a fixed
// enum and normalizing it outright would be a much larger content migration.
export const travelStyles: DestinationTravelStyle[] = [
  {
    id: 'adventure',
    label: 'Adventure',
    description: 'Treks, road trips and high-altitude thrills.',
    icon: Mountain,
    matchKeywords: ['adventure', 'road trips', 'trekking']
  },
  {
    id: 'slow-travel',
    label: 'Slow Travel',
    description: 'Quiet valleys, riversides and unhurried mornings.',
    icon: Leaf,
    matchKeywords: ['slow travel', 'nature', 'riverside']
  },
  {
    id: 'romantic',
    label: 'Romantic',
    description: 'Honeymoon-worthy views and intimate stays.',
    icon: Heart,
    matchKeywords: ['romantic', 'honeymoon']
  },
  {
    id: 'family',
    label: 'Family',
    description: 'Easy escapes that work for every generation.',
    icon: Users,
    matchKeywords: ['family']
  },
  {
    id: 'wellness',
    label: 'Wellness',
    description: 'Retreats, yoga and slower, restorative days.',
    icon: Sparkles,
    matchKeywords: ['wellness', 'spiritual']
  },
  {
    id: 'offbeat',
    label: 'Offbeat',
    description: 'Places most travelers never find.',
    icon: Compass,
    matchKeywords: ['offbeat', 'hidden gem']
  }
];

export function getTravelStyleById(id: string): DestinationTravelStyle | undefined {
  return travelStyles.find((style) => style.id === id);
}
