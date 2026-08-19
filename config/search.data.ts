/**
 * Structured search data for Global Search
 * Destinations and tours are derived directly from the same catalogs that power
 * /destinations and /packages, so Global Search never drifts out of sync with the
 * site's real slugs, prices, and links. Experiences are a curated, cross-cutting
 * layer on top (activity/accommodation concepts that span many destinations).
 */

import { destinations } from '@/config/destinations.config';
import { packages } from '@/config/packages.config';

export interface SearchResult {
  id: string;
  type: 'destination' | 'tour' | 'experience' | 'blog';
  title: string;
  description: string;
  image?: string;
  href: string;
  category?: string;
  metadata?: {
    price?: string;
    duration?: string;
    rating?: number;
    reviewCount?: number;
    location?: string;
  };
  tags?: string[];
  keywords?: string[];
}

function formatInrPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Destinations - generated from the curated destinations directory (config/destinations.config.ts).
 */
export const searchDestinations: SearchResult[] = destinations.map((destination) => ({
  id: `dest-${destination.slug}`,
  type: 'destination',
  title: destination.title,
  description: destination.editorialDescription ?? destination.description,
  image: destination.image,
  category: destination.category,
  href: `/destinations/${destination.slug}`,
  metadata: {
    location: [destination.region, destination.state].filter(Boolean).join(', ') || undefined,
    rating: destination.rating
  },
  keywords: [destination.title, destination.category, destination.region, destination.state].filter(
    (value): value is string => Boolean(value)
  )
}));

/**
 * Tours - generated from the signature package catalog (config/packages.config.ts),
 * linking straight to the real /journeys/[slug] booking page.
 */
export const searchTours: SearchResult[] = packages.map((pkg) => ({
  id: `tour-${pkg.slug}`,
  type: 'tour',
  title: pkg.name,
  description: pkg.shortDescription,
  image: pkg.image,
  category: pkg.category,
  href: `/journeys/${pkg.slug}`,
  metadata: {
    price: formatInrPrice(pkg.price),
    duration: pkg.duration,
    location: pkg.destination
  },
  keywords: [pkg.name, pkg.destination, pkg.category, ...(pkg.destinationSlugs ?? [])]
}));

/**
 * Experiences - types of activities and stays. Curated separately since each one
 * spans many destinations rather than mapping to a single catalog entry.
 */
export const searchExperiences: SearchResult[] = [
  {
    id: 'exp-trekking',
    type: 'experience',
    title: 'Himalayan Trekking',
    description: 'Multi-day mountain treks with professional guides through pristine trails.',
    category: 'Activity',
    href: '/journeys?category=Adventure',
    keywords: ['trekking', 'hiking', 'mountains', 'trails', 'guided', 'adventure']
  },
  {
    id: 'exp-camping',
    type: 'experience',
    title: 'Mountain Camping',
    description: 'Immersive camping experiences under star-filled skies in remote locations.',
    category: 'Activity',
    href: '/stays/glamping',
    keywords: ['camping', 'outdoors', 'nature', 'stargazing', 'adventure', 'wilderness']
  },
  {
    id: 'exp-roadtrips',
    type: 'experience',
    title: 'Himalayan Road Trips',
    description: 'Self-drive or guided road journeys exploring mountain passes and valleys.',
    category: 'Activity',
    href: '/journeys',
    keywords: ['road trip', 'driving', 'journey', 'adventure', 'scenic', 'highway']
  },
  {
    id: 'exp-luxury-stays',
    type: 'experience',
    title: 'Luxury Mountain Stays',
    description: 'Premium accommodations and resorts in the heart of the Himalayas.',
    category: 'Accommodation',
    href: '/stays/resorts',
    keywords: ['luxury', 'stays', 'resort', 'accommodation', 'premium', 'comfort']
  },
  {
    id: 'exp-honeymoon',
    type: 'experience',
    title: 'Honeymoon Experiences',
    description: 'Romantic getaways designed for couples seeking mountain magic.',
    category: 'Couples',
    href: '/journeys?category=Honeymoon',
    keywords: ['honeymoon', 'couples', 'romantic', 'love', 'getaway', 'experience']
  },
  {
    id: 'exp-offbeat',
    type: 'experience',
    title: 'Offbeat Himalayan Experiences',
    description: 'Unique and lesser-known adventures away from the beaten path.',
    category: 'Activity',
    href: '/journeys?category=Offbeat',
    keywords: ['offbeat', 'hidden', 'unique', 'adventure', 'remote', 'unexplored']
  },
  {
    id: 'exp-homestays',
    type: 'experience',
    title: 'Family Homestays',
    description: 'Stay with local families and experience authentic mountain culture.',
    category: 'Accommodation',
    href: '/stays/homestays',
    keywords: ['homestay', 'family', 'local', 'authentic', 'culture', 'community']
  },
  {
    id: 'exp-wellness',
    type: 'experience',
    title: 'Wellness Retreats',
    description: 'Yoga, meditation, and holistic wellness in serene mountain settings.',
    category: 'Wellness',
    href: '/journeys',
    keywords: ['wellness', 'yoga', 'meditation', 'retreat', 'health', 'holistic']
  }
];

/**
 * All searchable results combined.
 * A blog/travel-guides section doesn't exist in the app yet, so there is no
 * `searchBlog` source — the 'blog' type stays in the SearchResult union so wiring
 * one in later is a one-line addition here.
 */
export const allSearchResults: SearchResult[] = [
  ...searchDestinations,
  ...searchTours,
  ...searchExperiences
];

/**
 * Popular searches - shown when search is empty
 */
export const popularSearches: string[] = [
  'Spiti Valley',
  'Manali',
  'Kashmir',
  'Rishikesh',
  'Manali-Leh Highway',
  'Honeymoon',
  'Trekking',
  'Wellness Retreat'
];
