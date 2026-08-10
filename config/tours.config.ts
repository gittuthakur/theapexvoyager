import type { TourPackage } from '@/types';

export const tours: TourPackage[] = [
  {
    slug: 'spiti-circuit',
    title: 'Spiti Circuit',
    category: 'Adventure',
    badge: 'Best Seller',
    location: 'Spiti Valley',
    price: '₹28,500',
    duration: '10 Days / 9 Nights',
    rating: 4.9,
    reviewCount: 140,
    highlights: ['Transport', 'Stays', 'All Meals', 'Expert Guide'],
    description: 'The ultimate high-altitude expedition through remote wilderness and alpine villages.',
    image: '/images/tours/spiti-circuit.jpg',
    destinationSlug: 'spiti-valley',
    featured: true
  },
  {
    slug: 'manali-leh-highway',
    title: 'Manali-Leh Highway',
    category: 'Adventure',
    badge: 'Adventure',
    location: 'Manali → Leh',
    price: '₹32,000',
    duration: '8 Days / 7 Nights',
    rating: 4.8,
    reviewCount: 96,
    description: "A legendary road adventure across India's most iconic mountain highway.",
    image: '/images/tours/manali-leh-highway.jpg',
    destinationSlug: 'manali'
  },
  {
    slug: 'dharamshala-retreat',
    title: 'Dharamshala Retreat',
    category: 'Wellness',
    badge: 'Wellness',
    location: 'Dharamshala',
    price: '₹22,000',
    duration: '6 Days / 5 Nights',
    rating: 4.7,
    reviewCount: 78,
    description: 'Wellness, culture, and mountain trekking in the shadow of the Dhauladhar range.',
    image: '/images/tours/dharamshala-retreat.jpg',
    destinationSlug: 'dharamshala'
  },
  {
    slug: 'shimla-heritage-walk',
    title: 'Shimla Heritage Walk',
    category: 'Cultural',
    badge: 'Cultural',
    location: 'Shimla',
    price: '₹14,500',
    duration: '4 Days / 3 Nights',
    rating: 4.6,
    reviewCount: 52,
    description: 'Colonial architecture, Mall Road markets, and pine-clad ridge walks.',
    image: '/images/tours/shimla-heritage-walk.jpg',
    destinationSlug: 'shimla'
  },
  {
    slug: 'kasol-backpacking-trail',
    title: 'Kasol Backpacking Trail',
    category: 'Adventure',
    badge: 'Budget Friendly',
    location: 'Kasol',
    price: '₹11,000',
    duration: '5 Days / 4 Nights',
    rating: 4.5,
    reviewCount: 64,
    description: 'Riverside cafes, Parvati Valley treks, and a laid-back backpacker trail.',
    image: '/images/tours/kasol-backpacking-trail.jpg',
    destinationSlug: 'kasol'
  }
];
