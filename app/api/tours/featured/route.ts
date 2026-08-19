import { NextResponse } from 'next/server';
import type { TourPackage } from '@/types';

// Static fallback data used when the primary MongoDB-backed tour catalog is
// unavailable or empty, so the homepage's Featured Tours section never renders blank.
export const FEATURED_TOURS: TourPackage[] = [
  {
    id: 'featured-spiti-valley-expedition',
    slug: 'spiti-valley-expedition',
    title: 'Spiti Valley Expedition',
    category: 'Adventure',
    badge: 'Best Seller',
    location: 'Spiti Valley',
    price: '₹28,500',
    priceUnit: '/ Person',
    duration: '10 Days / 9 Nights',
    rating: 4.9,
    reviewCount: 140,
    highlights: ['Transport', 'Stays', 'All Meals', 'Expert Guide'],
    inclusions: ['4x4 transport', 'Homestay & camp accommodation', 'All meals', 'Permits & inner-line fees'],
    description: 'The ultimate high-altitude expedition through remote wilderness and alpine villages.',
    image: '/images/spiti-circuit.jpg',
    destinationSlug: 'spiti-valley',
    tags: ['mountains', 'adventure', 'offbeat']
  },
  {
    id: 'featured-manali-leh-highway',
    slug: 'manali-leh-highway',
    title: 'Manali-Leh Highway',
    category: 'Adventure',
    badge: 'Adventure',
    location: 'Manali → Leh',
    price: '₹32,000',
    priceUnit: '/ Person',
    duration: '8 Days / 7 Nights',
    rating: 4.8,
    reviewCount: 96,
    highlights: ['Transport', 'Stays', 'Meals', 'Guide'],
    inclusions: ['4x4 convoy transport', 'Stays & meals', 'Oxygen support', 'Permits'],
    description: "A legendary road adventure across India's most iconic mountain highway.",
    image: '/images/manali-leh-highway.jpg',
    destinationSlug: 'manali',
    tags: ['road-trip', 'mountains', 'adventure']
  },
  {
    id: 'featured-kinnaur-rampur-trek',
    slug: 'kinnaur-rampur-trek',
    title: 'Kinnaur-Rampur Trek',
    category: 'Trekking',
    badge: 'Trending',
    location: 'Kinnaur',
    price: '₹19,900',
    priceUnit: '/ Person',
    duration: '6 Days / 5 Nights',
    rating: 4.7,
    reviewCount: 63,
    highlights: ['Trekking Gear', 'Camping', 'Meals', 'Local Guide'],
    inclusions: ['Camping equipment', 'All meals on trail', 'Certified trek leader', 'First-aid support'],
    description: 'A high-altitude trekking trail through apple orchards and remote Kinnauri villages.',
    image: '/images/destination-kinnaur.jpg',
    destinationSlug: 'kinnaur',
    tags: ['trekking', 'mountains', 'offbeat']
  },
  {
    id: 'featured-dharamshala-retreat',
    slug: 'dharamshala-retreat',
    title: 'Dharamshala Retreat',
    category: 'Wellness',
    badge: 'Wellness',
    location: 'Dharamshala',
    price: '₹22,000',
    priceUnit: '/ Person',
    duration: '6 Days / 5 Nights',
    rating: 4.7,
    reviewCount: 78,
    highlights: ['Stays', 'Meals', 'Guide'],
    inclusions: ['Boutique stays', 'Daily yoga sessions', 'All meals', 'Guided nature walks'],
    description: 'Wellness, culture, and mountain trekking in the shadow of the Dhauladhar range.',
    image: '/images/dharamshala-retreat.jpg',
    destinationSlug: 'dharamshala',
    tags: ['wellness', 'mountains', 'culture']
  },
  {
    id: 'featured-shimla-heritage-walk',
    slug: 'shimla-heritage-walk',
    title: 'Shimla Heritage Walk',
    category: 'Cultural',
    badge: 'Cultural',
    location: 'Shimla',
    price: '₹14,500',
    priceUnit: '/ Person',
    duration: '4 Days / 3 Nights',
    rating: 4.6,
    reviewCount: 52,
    highlights: ['Stays', 'Meals', 'Local Guide'],
    inclusions: ['Colonial-era hotel stays', 'Daily breakfast', 'Guided heritage walks'],
    description: 'Colonial architecture, toy trains, and pine forests along the historic Mall Road.',
    image: '/images/shimla-heritage-walk.jpg',
    destinationSlug: 'shimla',
    tags: ['culture', 'heritage', 'mountains']
  },
  {
    id: 'featured-kasol-parvati-valley',
    slug: 'kasol-parvati-valley',
    title: 'Kasol & Parvati Valley',
    category: 'Adventure',
    badge: 'Popular',
    location: 'Kasol',
    price: '₹17,900',
    priceUnit: '/ Person',
    duration: '5 Days / 4 Nights',
    rating: 4.5,
    reviewCount: 84,
    highlights: ['Stays', 'Meals', 'Riverside Camping'],
    inclusions: ['Riverside camp & guesthouse stays', 'All meals', 'Kheerganga trek support'],
    description: 'Riverside campsites and pine-forest trails through the Parvati Valley backpacker trail.',
    image: '/images/destination-kasol.jpg',
    destinationSlug: 'kasol',
    tags: ['adventure', 'mountains', 'backpacking']
  }
];

export async function GET() {
  return NextResponse.json(
    { tours: FEATURED_TOURS },
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}