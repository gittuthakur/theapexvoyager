import { describe, expect, it, vi, beforeEach } from 'vitest';

const { destinationFindMock, destinationFindOneMock } = vi.hoisted(() => ({
  destinationFindMock: vi.fn(),
  destinationFindOneMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Destination', () => ({ Destination: { find: destinationFindMock, findOne: destinationFindOneMock } }));
vi.mock('@/models/DestinationSearchCache', () => ({ DestinationSearchCache: { findOne: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock('@/lib/googlePlaces', () => ({ searchDestinations: vi.fn(), placeName: vi.fn(), placePhotoUrls: vi.fn() }));
vi.mock('@/lib/negativeCache', () => ({ isRecentFailure: vi.fn().mockReturnValue(false), markFailure: vi.fn() }));
vi.mock('@/lib/env', () => ({ isLocalDevelopment: vi.fn().mockReturnValue(false) }));
vi.mock('@/config/destinations.config', () => ({ destinations: [] }));

const { getCuratedDestinations, getCuratedDestinationBySlug } = await import('./destinations');

function destinationDoc(overrides: Record<string, unknown> = {}) {
  return { slug: 'manali', title: 'Manali', category: 'Most Popular', description: 'x', toursCount: 1, image: '/x.jpg', status: 'published', ...overrides };
}

beforeEach(() => {
  destinationFindMock.mockReset();
  destinationFindOneMock.mockReset();
});

describe('getCuratedDestinations — public path filters status: published at the query itself (Phase 3B)', () => {
  it('queries Destination.find with an explicit { status: "published" } filter', async () => {
    const sortMock = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    destinationFindMock.mockReturnValue({ sort: sortMock });

    await getCuratedDestinations();

    expect(destinationFindMock).toHaveBeenCalledWith({ status: 'published' });
  });

  it('returns published destinations and never includes anything the query filtered out', async () => {
    const docs = [destinationDoc({ slug: 'a' }), destinationDoc({ slug: 'b' })];
    destinationFindMock.mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(docs) }) });

    const result = await getCuratedDestinations();

    expect(result.map((d) => d.slug)).toEqual(['a', 'b']);
  });
});

describe('getCuratedDestinationBySlug — a draft slug resolves to undefined, not a leaked destination', () => {
  it('queries Destination.findOne with an explicit { status: "published" } filter alongside the slug', async () => {
    destinationFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await getCuratedDestinationBySlug('some-slug');

    expect(destinationFindOneMock).toHaveBeenCalledWith({ slug: 'some-slug', status: 'published' });
  });

  it('a published destination resolves normally', async () => {
    destinationFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(destinationDoc({ slug: 'manali' })) });

    const result = await getCuratedDestinationBySlug('manali');

    expect(result?.slug).toBe('manali');
  });

  it('a draft slug (e.g. a Ladakh destination) — because the query itself excludes it — resolves to undefined, matching an unknown slug exactly (drives the page\'s existing notFound())', async () => {
    destinationFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const result = await getCuratedDestinationBySlug('leh');

    expect(result).toBeUndefined();
  });
});
