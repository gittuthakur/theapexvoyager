import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fix A, second entry point: /plan-my-journey?source=destination&slug=... resolves through resolveBookingContext. The
// REAL lib/destinations is used here (only its Google client, database models and exclusion service are mocked), so
// these tests prove an arbitrary slug cannot start a Google request while a published destination still resolves.
const m = vi.hoisted(() => ({
  searchDestinations: vi.fn(),
  cacheFindOne: vi.fn(),
  cacheUpsert: vi.fn(),
  destinationFindOne: vi.fn(),
  getActiveExclusionSet: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Destination', () => ({ Destination: { find: vi.fn(), findOne: m.destinationFindOne } }));
vi.mock('@/models/DestinationSearchCache', () => ({ DestinationSearchCache: { findOne: m.cacheFindOne, findOneAndUpdate: m.cacheUpsert } }));
vi.mock('@/lib/googlePlaces', () => ({ searchDestinations: m.searchDestinations, placeName: () => 'x', placePhotoUrls: () => [] }));
vi.mock('@/lib/negativeCache', () => ({ isRecentFailure: () => false, markFailure: vi.fn() }));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: () => false }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({ ExclusionLookupError: class extends Error {}, getActiveExclusionSet: m.getActiveExclusionSet }));
vi.mock('@/lib/packages', () => ({ getPackageBySlug: vi.fn() }));
vi.mock('@/lib/tours', () => ({ getTourBySlug: vi.fn() }));
vi.mock('@/lib/hotels', () => ({ getHotelBySlug: vi.fn() }));
vi.mock('@/lib/experiences', () => ({ getExperienceBySlug: vi.fn() }));
vi.mock('@/lib/transport', () => ({ getVehicleBySlug: vi.fn() }));
vi.mock('@/lib/regions', () => ({ getRegionForState: vi.fn() }));
vi.mock('@/services/regions/regionHub.service', () => ({ getRegionProfileBySlug: vi.fn() }));

const { resolveBookingContext } = await import('./bookingContext');
const leanOf = (value: unknown) => ({ lean: () => Promise.resolve(value) });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GOOGLE_PLACES_API_KEY = 'test-key-not-real';
  m.cacheFindOne.mockReturnValue(leanOf(null));
  m.destinationFindOne.mockReturnValue(leanOf(null));
  m.getActiveExclusionSet.mockResolvedValue(new Set<string>());
});

describe('resolveBookingContext source=destination', () => {
  it.each(['hotels-near-me', 'zzz', 'drop-table-users', 'x'.repeat(300)])('an arbitrary slug "%s" resolves to null and starts no Google request', async (slug) => {
    const context = await resolveBookingContext({ source: 'destination', slug });

    expect(context).toBeNull();
    expect(m.searchDestinations).not.toHaveBeenCalled();
    expect(m.cacheUpsert).not.toHaveBeenCalled();
  });

  it('even the slug of an authored (but not curated-published) location never starts a Google request', async () => {
    const context = await resolveBookingContext({ source: 'destination', slug: 'kasol' });

    expect(context).toBeNull();
    expect(m.searchDestinations).not.toHaveBeenCalled();
  });

  it('a published curated destination still resolves and prefills, with no Google involvement', async () => {
    m.destinationFindOne.mockReturnValue(
      leanOf({ slug: 'manali', title: 'Manali', category: 'Most Popular', description: 'd', toursCount: 1, image: '/m.jpg', status: 'published', state: 'Himachal Pradesh' })
    );

    const context = await resolveBookingContext({ source: 'destination', slug: 'manali' });

    expect(context).toMatchObject({ source: 'destination', slug: 'manali', title: 'Manali' });
    expect(m.searchDestinations).not.toHaveBeenCalled();
  });

  it('missing source or slug still resolves to null as before', async () => {
    expect(await resolveBookingContext({ source: 'destination' })).toBeNull();
    expect(await resolveBookingContext({ slug: 'manali' })).toBeNull();
    expect(await resolveBookingContext({ source: 'not-a-source', slug: 'manali' })).toBeNull();
  });
});
