import { describe, expect, it, vi, beforeEach } from 'vitest';

const { journeyFindMock, journeyFindOneMock } = vi.hoisted(() => ({
  journeyFindMock: vi.fn(),
  journeyFindOneMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Journey', () => ({ Journey: { find: journeyFindMock, findOne: journeyFindOneMock } }));

const { getAllPackages, getPackageBySlug, getFeaturedPackages, getPackagesByDestinationSlug } = await import('./packages');

function journeyDoc(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'test-journey',
    name: 'Test Journey',
    destination: 'Manali',
    destinationSlugs: ['manali'],
    duration: '5D/4N',
    category: 'Adventure',
    shortDescription: 'A test journey.',
    highlights: [],
    itinerary: [],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    status: 'published',
    ...overrides
  };
}

beforeEach(() => {
  journeyFindMock.mockReset();
  journeyFindOneMock.mockReset();
});

describe('getAllPackages — public path filters status: published at the query itself', () => {
  it('queries Journey.find with an explicit { status: "published" } filter', async () => {
    const sortMock = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    journeyFindMock.mockReturnValue({ sort: sortMock });

    await getAllPackages();

    expect(journeyFindMock).toHaveBeenCalledWith({ status: 'published' });
  });

  it('returns published journeys and never includes anything the query filtered out', async () => {
    const docs = [journeyDoc({ slug: 'a', status: 'published' }), journeyDoc({ slug: 'b', status: 'published' })];
    journeyFindMock.mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(docs) }) });

    const result = await getAllPackages();

    expect(result.map((p) => p.slug)).toEqual(['a', 'b']);
    expect(result.every((p) => p.status === 'published')).toBe(true);
  });
});

describe('getPackageBySlug — a draft slug resolves to undefined, not a leaked package', () => {
  it('queries Journey.findOne with an explicit { status: "published" } filter alongside the slug', async () => {
    journeyFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await getPackageBySlug('some-slug');

    expect(journeyFindOneMock).toHaveBeenCalledWith({ slug: 'some-slug', status: 'published' });
  });

  it('a published Journey resolves normally', async () => {
    journeyFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(journeyDoc({ slug: 'manali-premium-escape' })) });

    const result = await getPackageBySlug('manali-premium-escape');

    expect(result?.slug).toBe('manali-premium-escape');
  });

  it('a draft slug — because the query itself excludes it — resolves to undefined, matching an unknown slug exactly (drives the page\'s existing notFound())', async () => {
    // The mock simulates what the real { status: 'published' } filter does for a draft:
    // Journey.findOne finds nothing, since a draft document never matches that query.
    journeyFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const result = await getPackageBySlug('a-draft-journey-slug');

    expect(result).toBeUndefined();
  });
});

describe('getFeaturedPackages — built entirely from the already-published-only getAllPackages', () => {
  it('never surfaces a non-published journey, because none ever reaches it', async () => {
    const docs = [journeyDoc({ slug: 'a', featured: true }), journeyDoc({ slug: 'b', featured: false })];
    journeyFindMock.mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(docs) }) });

    const result = await getFeaturedPackages();

    expect(result.every((p) => p.status === 'published')).toBe(true);
  });
});

describe('getPackagesByDestinationSlug — destination "Journeys through X" sections exclude drafts', () => {
  it('filters by destinationSlugs on top of the already-published-only base list', async () => {
    const docs = [
      journeyDoc({ slug: 'a', destinationSlugs: ['manali'] }),
      journeyDoc({ slug: 'b', destinationSlugs: ['gulmarg'] })
    ];
    journeyFindMock.mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(docs) }) });

    const result = await getPackagesByDestinationSlug('manali');

    expect(result.map((p) => p.slug)).toEqual(['a']);
  });
});
