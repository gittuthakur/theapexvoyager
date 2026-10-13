import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dest, regions, packages, experiences, experts } = vi.hoisted(() => ({ dest: vi.fn(), regions: vi.fn(), packages: vi.fn(), experiences: vi.fn(), experts: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/lib/destinations', () => ({ getCuratedDestinations: dest }));
vi.mock('@/lib/publishedRegions', () => ({ getPublishedRegionRefs: regions }));
vi.mock('@/lib/packages', () => ({ getAllPackages: packages }));
vi.mock('@/lib/experiences', () => ({ getAllExperiences: experiences }));
vi.mock('@/lib/experts', () => ({ getAllExperts: experts }));
vi.mock('@/lib/staysSearch', () => ({ searchStaySuggestions: vi.fn() }));

const { SECTION_DB_TIME_LIMIT_MS, SECTION_READ_ABORT_AFTER_MS, defaultLoaders, resetSectionReadsForTests } = await import('@/lib/globalSearchServer');
const options = { maxTimeMS: SECTION_DB_TIME_LIMIT_MS };

beforeEach(() => {
  vi.useFakeTimers();
  resetSectionReadsForTests();
  for (const mock of [dest, regions, packages, experiences, experts]) mock.mockReset().mockImplementation(() => new Promise(() => undefined));
});
afterEach(() => {
  resetSectionReadsForTests();
  vi.useRealTimers();
});

describe('each older catalog read gets an AbortSignal and keeps its database limit', () => {
  it('passes the signal and the 1.5 s database limit to every read, with the same projections as before', () => {
    void defaultLoaders.destinations(options);
    void defaultLoaders.regions(options);
    void defaultLoaders.journeys(options);
    void defaultLoaders.experiences(options);
    void defaultLoaders.experts(options);
    expect(dest).toHaveBeenCalledWith(expect.objectContaining({ maxTimeMS: 1500, signal: expect.any(AbortSignal), projection: expect.objectContaining({ slug: 1, title: 1 }) }));
    expect(regions).toHaveBeenCalledWith(expect.objectContaining({ maxTimeMS: 1500, signal: expect.any(AbortSignal) }));
    expect(packages).toHaveBeenCalledWith(expect.objectContaining({ maxTimeMS: 1500, signal: expect.any(AbortSignal), projection: expect.objectContaining({ slug: 1, name: 1 }) }));
    expect(experiences).toHaveBeenCalledWith(1500, expect.objectContaining({ slug: 1, title: 1 }), expect.any(AbortSignal));
    expect(experts).toHaveBeenCalledWith(expect.objectContaining({ maxTimeMS: 1500, signal: expect.any(AbortSignal) }));
  });

  it('shares one read per catalog, and aborts each signal only after the maximum lifetime', async () => {
    void defaultLoaders.regions(options);
    void defaultLoaders.regions(options);
    expect(regions).toHaveBeenCalledTimes(1);
    const signal = regions.mock.calls[0][0].signal as AbortSignal;
    await vi.advanceTimersByTimeAsync(SECTION_READ_ABORT_AFTER_MS - 1);
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(signal.aborted).toBe(true);
    void defaultLoaders.regions(options);
    expect(regions).toHaveBeenCalledTimes(1); // the aborted read has not settled, so it is still the one flight
  });

  it('reads with a different database limit are separate flights', () => {
    void defaultLoaders.experts({ maxTimeMS: 1500 });
    void defaultLoaders.experts({ maxTimeMS: 3000 });
    expect(experts).toHaveBeenCalledTimes(2);
  });
});
