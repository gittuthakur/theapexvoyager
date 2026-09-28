import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
}));

const isLocalDevelopmentMock = vi.fn();
vi.mock('@/lib/env', () => ({ isLocalDevelopment: isLocalDevelopmentMock }));

const getExclusionsMock = vi.fn().mockResolvedValue([]);
vi.mock('@/services/properties/propertyExclusion.service', () => ({ getExclusions: getExclusionsMock }));

const { default: PropertyExclusionsPage } = await import('./page');

describe('PropertyExclusionsPage', () => {
  it('is unavailable in production — calls notFound() before fetching any exclusion data', async () => {
    isLocalDevelopmentMock.mockReturnValue(false);
    getExclusionsMock.mockClear();

    await expect(PropertyExclusionsPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getExclusionsMock).not.toHaveBeenCalled();
  });

  it('renders (does not 404) in local development', async () => {
    isLocalDevelopmentMock.mockReturnValue(true);
    getExclusionsMock.mockClear();
    getExclusionsMock.mockResolvedValue([]);

    const result = await PropertyExclusionsPage();
    expect(result).toBeTruthy();
    expect(getExclusionsMock).toHaveBeenCalledTimes(2); // active + inactive
    expect(getExclusionsMock).toHaveBeenCalledWith({ isActive: true });
    expect(getExclusionsMock).toHaveBeenCalledWith({ isActive: false });
  });
});
