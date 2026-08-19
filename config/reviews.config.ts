import type { Review } from '@/types';

// DEMO DATA — development-only placeholder reviews for the /destinations page's
// Traveler Stories section. `lib/reviews.ts` tries a real `Review` collection first
// and only falls back to this array when the database has none — see that file's
// DB-then-static-fallback pattern (same convention as lib/packages.ts). Replace or
// retire this file once real reviews (or a Booking.com-sourced feed) exist.
// Deliberately separate from app/page.tsx's homepage testimonials array — kept apart
// so this page's content can evolve independently without touching the homepage.
export const DEMO_REVIEWS: Review[] = [
  {
    id: 'demo-review-manali-1',
    destinationSlug: 'manali',
    author: 'Aditi Rao',
    location: 'Pune, India',
    rating: 5,
    quote: 'Old Manali in the off-season was exactly the slow, cafe-and-cedar trip we wanted — no crowds, just the Beas and good coffee.',
    tripTitle: 'Manali Adventure Circuit',
    tripDate: 'Apr 2026',
    verified: true,
    source: { label: 'Google Reviews', url: 'https://www.google.com/search?q=The+Apex+Voyager+reviews' }
  },
  {
    id: 'demo-review-spiti-1',
    destinationSlug: 'spiti-valley',
    author: 'Farhan Sheikh',
    location: 'Ahmedabad, India',
    rating: 5,
    quote: 'Spiti humbled us — Key Monastery at sunrise and the Milky Way over Hikkim are the two things I still think about.',
    tripTitle: 'Spiti Circuit',
    tripDate: 'Sep 2025',
    verified: true
  },
  {
    id: 'demo-review-gulmarg-1',
    destinationSlug: 'gulmarg',
    author: 'Ritika Malhotra',
    location: 'Chandigarh, India',
    rating: 4.9,
    quote: 'The Gondola ride up to Apharwat was worth the trip on its own — Kashmir looked unreal from up there.',
    tripTitle: 'Kashmir Signature Journey',
    tripDate: 'Feb 2026',
    verified: true,
    source: { label: 'Google Reviews', url: 'https://www.google.com/search?q=The+Apex+Voyager+reviews' }
  },
  {
    id: 'demo-review-rishikesh-1',
    destinationSlug: 'rishikesh',
    author: 'Sameer Joshi',
    location: 'Mumbai, India',
    rating: 4.8,
    quote: 'Sunrise yoga on the ghat, rafting by afternoon — Rishikesh packs an unusual amount of range into a short trip.',
    tripTitle: 'Rishikesh Yoga & Rafting',
    tripDate: 'Nov 2025',
    verified: true
  },
  {
    id: 'demo-review-kasol-1',
    destinationSlug: 'kasol',
    author: 'Diya Kapoor',
    location: 'Delhi, India',
    rating: 4.7,
    quote: 'Stayed five days longer than planned. The Kheerganga trek and the café strip made it impossible to leave on schedule.',
    tripTitle: 'Kasol Backpacking Trail',
    tripDate: 'Oct 2025',
    verified: true
  },
  {
    id: 'demo-review-shimla-1',
    destinationSlug: 'shimla',
    author: 'Nikhil Bhatt',
    location: 'Jaipur, India',
    rating: 4.6,
    quote: 'Took my parents on the toy train and a slow evening walk on the Ridge — an easy, unhurried first Himalaya trip for them.',
    tripTitle: 'Shimla Heritage Walk',
    tripDate: 'Dec 2025',
    verified: true,
    source: { label: 'Google Reviews', url: 'https://www.google.com/search?q=The+Apex+Voyager+reviews' }
  }
];
