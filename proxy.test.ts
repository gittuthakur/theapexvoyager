import { NextRequest } from 'next/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { destinationExistsMock, regionExistsMock, journeyExistsMock } = vi.hoisted(() => ({
  destinationExistsMock: vi.fn(),
  regionExistsMock: vi.fn(),
  journeyExistsMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Destination', () => ({ Destination: { exists: destinationExistsMock } }));
vi.mock('@/models/Region', () => ({ Region: { exists: regionExistsMock } }));
vi.mock('@/models/Journey', () => ({ Journey: { exists: journeyExistsMock } }));

const proxy = (await import('./proxy')).default;

beforeEach(() => {
  destinationExistsMock.mockReset();
  regionExistsMock.mockReset();
  journeyExistsMock.mockReset();
});

describe('proxy — Destination existence check filters by status: published (Phase 3B draft/publish workflow)', () => {
  it('queries Destination.exists with an explicit { status: "published" } filter alongside the slug', async () => {
    destinationExistsMock.mockResolvedValue(null);
    const request = new NextRequest('https://example.com/destinations/leh');

    await proxy(request);

    expect(destinationExistsMock).toHaveBeenCalledWith({ slug: 'leh', status: 'published' });
  });

  it('a draft Destination slug (e.g. the Ladakh foundation) rewrites to the real not-found page, not a soft-404', async () => {
    destinationExistsMock.mockResolvedValue(null);
    const request = new NextRequest('https://example.com/destinations/leh');

    const response = await proxy(request);

    expect(response?.headers.get('x-middleware-rewrite')).toContain('__not-found__');
  });

  it('a published Destination slug passes through untouched', async () => {
    destinationExistsMock.mockResolvedValue({ _id: 'x' });
    const request = new NextRequest('https://example.com/destinations/manali');

    const response = await proxy(request);

    expect(response?.headers.get('x-middleware-rewrite')).toBeNull();
  });
});

describe('proxy — Journey existence check filters by status: published (Phase 2 draft/publish workflow)', () => {
  it('queries Journey.exists with an explicit { status: "published" } filter alongside the slug', async () => {
    journeyExistsMock.mockResolvedValue(null);
    const request = new NextRequest('https://example.com/journeys/some-slug');

    await proxy(request);

    expect(journeyExistsMock).toHaveBeenCalledWith({ slug: 'some-slug', status: 'published' });
  });

  it('a draft Journey slug (excluded by the query) rewrites to the real not-found page, not a soft-404', async () => {
    // Simulates what { status: 'published' } does for a draft: no match.
    journeyExistsMock.mockResolvedValue(null);
    const request = new NextRequest('https://example.com/journeys/a-draft-journey-slug');

    const response = await proxy(request);

    expect(response?.headers.get('x-middleware-rewrite')).toContain('__not-found__');
  });

  it('a published Journey slug passes through untouched', async () => {
    journeyExistsMock.mockResolvedValue({ _id: 'x' });
    const request = new NextRequest('https://example.com/journeys/manali-premium-escape');

    const response = await proxy(request);

    expect(response?.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
