import {
  Compass,
  Gem,
  Heart,
  Home,
  Mountain,
  Sparkles,
  TreePine,
  Users,
  Waves,
  Wind,
  type LucideIcon
} from 'lucide-react';
import type { HotelCategory } from '@/types/hotel';

/**
 * "How do you want to stay?" — discovery by travel intent rather than destination
 * or property type. Each mood maps to a real, honest starting filter (a category
 * and/or a keyword matched against amenities/description) rather than a fabricated
 * recommendation — this is the placeholder a future real recommendation engine
 * (Section 22 of the brief: "AI Stay Finder") hooks into; nothing here pretends to
 * be smarter than a heuristic starting filter today.
 */
export interface StayMoodDefinition {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category?: HotelCategory;
  /** Matched case-insensitively as a substring against amenities/description. */
  keyword?: string;
}

export const stayMoods: StayMoodDefinition[] = [
  { slug: 'mountain-views', label: 'Mountain Views', description: 'Wake up to snow-capped peaks.', icon: Mountain, keyword: 'view' },
  { slug: 'deep-in-nature', label: 'Deep in Nature', description: 'Forest, river and orchard settings.', icon: TreePine, keyword: 'forest' },
  { slug: 'riverside', label: 'Riverside', description: 'Fall asleep to the sound of the river.', icon: Waves, keyword: 'river' },
  { slug: 'romantic-escape', label: 'Romantic Escape', description: 'Private, intimate stays for two.', icon: Heart, category: 'Villa' },
  { slug: 'family-comfort', label: 'Family Comfort', description: 'Space and comfort for the whole family.', icon: Users, category: 'Resort' },
  { slug: 'adventure-base', label: 'Adventure Base', description: 'A basecamp for treks and trails.', icon: Compass, category: 'Camp' },
  { slug: 'wellness-quiet', label: 'Wellness & Quiet', description: 'Slow mornings, quiet corners.', icon: Wind, category: 'Homestay' },
  { slug: 'offbeat-escape', label: 'Offbeat Escape', description: 'Away from the well-trodden trail.', icon: Sparkles, category: 'Treehouse' },
  { slug: 'luxury-retreat', label: 'Luxury Retreat', description: 'Elevated comfort, considered detail.', icon: Gem, category: 'Heritage' },
  { slug: 'village-living', label: 'Village Living', description: 'Everyday life in a Himalayan village.', icon: Home, category: 'GuestHouse' }
];

export function findStayMoodBySlug(slug: string): StayMoodDefinition | undefined {
  return stayMoods.find((mood) => mood.slug === slug);
}
