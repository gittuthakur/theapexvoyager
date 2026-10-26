import type { TravelPackage } from '@/types/package';

// Test fixtures only (never imported by application code). Synthetic packages, not real catalogue data.
export function fixturePackage(overrides: Partial<TravelPackage> = {}): TravelPackage {
  return {
    slug: 'fixture-kashmir-escape',
    name: 'Fixture Kashmir Escape',
    destination: 'Srinagar & Gulmarg, Kashmir',
    destinationSlugs: ['srinagar', 'gulmarg'],
    image: '/images/fixture.jpg',
    duration: '6 Days / 5 Nights',
    price: 24999,
    category: 'Sightseeing',
    shortDescription: 'fixture',
    highlights: ['Fixture houseboat evening'],
    itinerary: [],
    inclusions: ['Fixture inclusion one', 'Fixture inclusion two'],
    exclusions: ['Fixture exclusion'],
    stayOptions: [],
    addOns: [],
    ...overrides
  };
}

export const catalogue = (): TravelPackage[] => [
  fixturePackage(),
  fixturePackage({ slug: 'fixture-manali-break', name: 'Fixture Manali Break', destination: 'Manali, Himachal Pradesh', destinationSlugs: ['manali'], duration: '5 Days / 4 Nights', price: 12999, category: 'Family', highlights: ['Fixture snow point'] }),
  fixturePackage({ slug: 'fixture-spiti-loop', name: 'Fixture Spiti Loop', destination: 'Spiti Valley, Himachal Pradesh', destinationSlugs: ['spiti-valley'], duration: '8 Days / 7 Nights', price: 31999, category: 'Offbeat', featured: true, highlights: ['Fixture monastery'] }),
  fixturePackage({ slug: 'fixture-rishikesh-rush', name: 'Fixture Rishikesh Rush', destination: 'Rishikesh, Uttarakhand', destinationSlugs: ['rishikesh'], duration: '4 Days / 3 Nights', price: 8999, category: 'Adventure', inclusions: [], highlights: ['Fixture rafting'] })
];
