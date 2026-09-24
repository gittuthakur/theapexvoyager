import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    // Mirrors Next's real behavior closely enough for this test: notFound() never
    // returns, it always interrupts rendering.
    throw new Error('NEXT_NOT_FOUND');
  })
}));

const isLocalDevelopmentMock = vi.fn();
vi.mock('@/lib/env', () => ({ isLocalDevelopment: isLocalDevelopmentMock }));

const getMappingCandidatesMock = vi.fn().mockResolvedValue([]);
vi.mock('@/services/pricing/hotelMappingRegistry.service', () => ({ getMappingCandidates: getMappingCandidatesMock }));

const { default: HotelMappingReviewPage } = await import('./page');

describe('HotelMappingReviewPage', () => {
  it('is unavailable in production — calls notFound() before fetching any mapping data', async () => {
    isLocalDevelopmentMock.mockReturnValue(false);
    getMappingCandidatesMock.mockClear();

    await expect(HotelMappingReviewPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getMappingCandidatesMock).not.toHaveBeenCalled();
  });

  it('renders (does not 404) in local development', async () => {
    isLocalDevelopmentMock.mockReturnValue(true);
    getMappingCandidatesMock.mockClear();
    getMappingCandidatesMock.mockResolvedValue([]);

    const result = await HotelMappingReviewPage();
    expect(result).toBeTruthy();
    expect(getMappingCandidatesMock).toHaveBeenCalledTimes(4); // PENDING_REVIEW, CONFIRMED, REJECTED, DISABLED
  });
});
