import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
}));

const isLocalDevelopmentMock = vi.fn();
vi.mock('@/lib/env', () => ({ isLocalDevelopment: isLocalDevelopmentMock }));

const getHbxEnvironmentMock = vi.fn();
vi.mock('@/services/providers/hbx/hbx.client', () => ({ getHbxEnvironment: getHbxEnvironmentMock }));

const getAvailabilityMock = vi.fn();
vi.mock('@/services/providers/hbx/hbxAvailability.service', () => ({ hbxPricingProvider: { id: 'hbx', getAvailability: getAvailabilityMock } }));

const resolveApplicableRateCommentsMock = vi.fn();
vi.mock('@/services/providers/hbx/hbxRateComments.service', () => ({ resolveApplicableRateComments: resolveApplicableRateCommentsMock }));

const retrieveBookingMock = vi.fn();
vi.mock('@/services/providers/hbx/hbxBookingWorkflow.service', () => ({ retrieveBooking: retrieveBookingMock }));

const findOneMock = vi.fn();
vi.mock('@/models/HbxBooking', () => ({ HbxBooking: { findOne: findOneMock } }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));

const { default: HbxCertificationPreviewPage } = await import('./page');

describe('HbxCertificationPreviewPage — production safety (fail-closed)', () => {
  beforeEach(() => {
    isLocalDevelopmentMock.mockReset();
    getHbxEnvironmentMock.mockReset();
    getAvailabilityMock.mockReset().mockResolvedValue({ state: 'UNAVAILABLE', rates: [] });
    retrieveBookingMock.mockReset().mockResolvedValue({ ok: false, reason: 'NOT_FOUND' });
    findOneMock.mockReset().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
  });

  it('is unavailable outside local development, even if the environment is "test"', async () => {
    isLocalDevelopmentMock.mockReturnValue(false);
    getHbxEnvironmentMock.mockReturnValue('test');
    await expect(HbxCertificationPreviewPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getAvailabilityMock).not.toHaveBeenCalled();
  });

  it('is unavailable whenever the HBX environment classifies as "production", even in local development', async () => {
    isLocalDevelopmentMock.mockReturnValue(true);
    getHbxEnvironmentMock.mockReturnValue('production');
    await expect(HbxCertificationPreviewPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getAvailabilityMock).not.toHaveBeenCalled();
  });

  it('renders in local development against the "test" environment', async () => {
    isLocalDevelopmentMock.mockReturnValue(true);
    getHbxEnvironmentMock.mockReturnValue('test');
    const result = await HbxCertificationPreviewPage();
    expect(result).toBeTruthy();
    expect(getAvailabilityMock).toHaveBeenCalledTimes(1);
  });
});

describe('HbxCertificationPreviewPage — demonstrates the flow without creating a new booking', () => {
  beforeEach(() => {
    isLocalDevelopmentMock.mockReturnValue(true);
    getHbxEnvironmentMock.mockReturnValue('test');
    getAvailabilityMock.mockReset().mockResolvedValue({ state: 'UNAVAILABLE', rates: [] });
    retrieveBookingMock.mockReset().mockResolvedValue({ ok: false, reason: 'NOT_FOUND' });
    findOneMock.mockReset().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
  });

  it('never calls anything that would create a new booking — only availability, comment resolution and a read-only retrieval', async () => {
    await HbxCertificationPreviewPage();
    // retrieveBooking is a live, read-only GET — the page never imports confirmBooking,
    // createHbxBooking or cancelBooking at all (only retrieveBooking is imported from
    // hbxBookingWorkflow.service.ts), so no such call can ever happen here.
    expect(retrieveBookingMock).toHaveBeenCalledWith('270-2962712');
    expect(retrieveBookingMock).toHaveBeenCalledTimes(1);
  });

  it('resolves applicable rate comments for the selected rate when Availability returns one', async () => {
    getAvailabilityMock.mockResolvedValue({
      state: 'VERIFIED_LIVE_RATE',
      rates: [{ rateType: 'BOOKABLE', rateKey: 'k1', nightCount: 2, roomName: 'Double', boardName: 'BB', environment: 'test' }]
    });
    resolveApplicableRateCommentsMock.mockResolvedValue({ comments: ['No pets.'], source: 'AVAILABILITY_TEXT' });

    const result = await HbxCertificationPreviewPage();
    expect(resolveApplicableRateCommentsMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });

  it('skips rate-comment resolution entirely when Availability returns no rates', async () => {
    getAvailabilityMock.mockResolvedValue({ state: 'UNAVAILABLE', rates: [] });
    await HbxCertificationPreviewPage();
    expect(resolveApplicableRateCommentsMock).not.toHaveBeenCalled();
  });
});
