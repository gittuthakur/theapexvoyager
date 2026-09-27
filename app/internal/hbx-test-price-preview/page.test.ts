import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
}));

const isLocalDevelopmentMock = vi.fn();
vi.mock('@/lib/env', () => ({ isLocalDevelopment: isLocalDevelopmentMock }));

const resolveTestModePriceMock = vi.fn();
vi.mock('@/services/pricing/stayPricing.service', () => ({ resolveTestModePrice: resolveTestModePriceMock }));

const { default: HbxTestPricePreviewPage } = await import('./page');

describe('HbxTestPricePreviewPage', () => {
  it('is unavailable in production — calls notFound() before ever calling resolveTestModePrice', async () => {
    isLocalDevelopmentMock.mockReturnValue(false);
    resolveTestModePriceMock.mockClear();

    await expect(HbxTestPricePreviewPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(resolveTestModePriceMock).not.toHaveBeenCalled();
  });

  it('renders (does not 404) in local development', async () => {
    isLocalDevelopmentMock.mockReturnValue(true);
    resolveTestModePriceMock.mockReset().mockResolvedValue({ state: 'UNAVAILABLE' });

    const result = await HbxTestPricePreviewPage();
    expect(result).toBeTruthy();
    expect(resolveTestModePriceMock).toHaveBeenCalledWith(expect.objectContaining({ providerHotelId: '617065', destinationSlug: 'manali' }));
  });
});
