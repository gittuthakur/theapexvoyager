import { describe, expect, it, vi, beforeEach } from 'vitest';

const {
  destinationFindMock,
  regionFindMock,
  journeyFindMock,
  experienceFindMock,
  expertFindMock
} = vi.hoisted(() => ({
  destinationFindMock: vi.fn(),
  regionFindMock: vi.fn(),
  journeyFindMock: vi.fn(),
  experienceFindMock: vi.fn(),
  expertFindMock: vi.fn()
}));

function chain(result: unknown[]) {
  return { select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(result) }) };
}

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Destination', () => ({ Destination: { find: destinationFindMock } }));
vi.mock('@/models/Region', () => ({ Region: { find: regionFindMock } }));
vi.mock('@/models/Journey', () => ({ Journey: { find: journeyFindMock } }));
vi.mock('@/models/Experience', () => ({ Experience: { find: experienceFindMock } }));
vi.mock('@/models/Expert', () => ({ Expert: { find: expertFindMock } }));

const sitemap = (await import('./sitemap')).default;

beforeEach(() => {
  destinationFindMock.mockReset().mockReturnValue(chain([]));
  regionFindMock.mockReset().mockReturnValue(chain([]));
  journeyFindMock.mockReset().mockReturnValue(chain([]));
  experienceFindMock.mockReset().mockReturnValue(chain([]));
  expertFindMock.mockReset().mockReturnValue(chain([]));
});

describe('sitemap — Destination entries exclude drafts (Phase 3B draft/publish workflow)', () => {
  it('queries Destination.find with an explicit { status: "published" } filter', async () => {
    await sitemap();
    expect(destinationFindMock).toHaveBeenCalledWith({ status: 'published' });
  });

  it('only ever includes URLs for the destinations the (published-only) query actually returned — a draft like Ladakh\'s "leh" never appears', async () => {
    destinationFindMock.mockReturnValue(chain([{ slug: 'manali', updatedAt: new Date('2026-01-01') }]));

    const entries = await sitemap();

    const destinationUrls = entries.filter((e) => e.url.includes('/destinations/'));
    expect(destinationUrls).toHaveLength(1);
    expect(destinationUrls[0].url).toContain('manali');
    expect(entries.some((e) => e.url.includes('/destinations/leh'))).toBe(false);
  });
});

describe('sitemap — Journey entries exclude drafts (Phase 2 draft/publish workflow)', () => {
  it('queries Journey.find with an explicit { status: "published" } filter', async () => {
    await sitemap();
    expect(journeyFindMock).toHaveBeenCalledWith({ status: 'published' });
  });

  it('only ever includes URLs for the journeys the (published-only) query actually returned', async () => {
    journeyFindMock.mockReturnValue(chain([{ slug: 'manali-premium-escape', updatedAt: new Date('2026-01-01') }]));

    const entries = await sitemap();

    const journeyUrls = entries.filter((e) => e.url.includes('/journeys/'));
    expect(journeyUrls).toHaveLength(1);
    expect(journeyUrls[0].url).toContain('manali-premium-escape');
  });
});
