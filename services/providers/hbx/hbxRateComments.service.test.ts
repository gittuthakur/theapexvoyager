import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { checkRateMock } = vi.hoisted(() => ({ checkRateMock: vi.fn() }));
vi.mock('./hbxCheckRate.service', () => ({ checkRate: checkRateMock }));

const { resolveApplicableRateComments, resolveRateCommentsById } = await import('./hbxRateComments.service');

const ORIGINAL_ENV = { ...process.env };

const BASE_RATE = {
  provider: 'hbx' as const,
  providerHotelId: '617065',
  currency: 'EUR',
  totalStayPrice: 215.6,
  nightCount: 2,
  displayPerNight: 107.8,
  rateKey: 'some-rate-key',
  cancellationPolicies: [],
  lastCheckedAt: new Date().toISOString(),
  environment: 'test' as const
};

describe('resolveApplicableRateComments — RECHECK', () => {
  beforeEach(() => checkRateMock.mockReset());

  it('resolves comments via CheckRate for a RECHECK rate', async () => {
    checkRateMock.mockResolvedValue({ ok: true, rate: { ...BASE_RATE, rateComments: 'Full CheckRate comment text' } });
    const result = await resolveApplicableRateComments({ ...BASE_RATE, rateType: 'RECHECK' });
    expect(checkRateMock).toHaveBeenCalledWith('some-rate-key', 2);
    expect(result).toEqual({ comments: ['Full CheckRate comment text'], source: 'CHECKRATE_TEXT' });
  });

  it('returns no comments (not invented) when CheckRate succeeds with no comment text', async () => {
    checkRateMock.mockResolvedValue({ ok: true, rate: { ...BASE_RATE } });
    const result = await resolveApplicableRateComments({ ...BASE_RATE, rateType: 'RECHECK' });
    expect(result).toEqual({ comments: [], source: 'CHECKRATE_TEXT' });
  });

  it('reports RESOLUTION_FAILED when CheckRate itself fails, never invents a comment', async () => {
    checkRateMock.mockResolvedValue({ ok: false, reason: 'PROVIDER_ERROR' });
    const result = await resolveApplicableRateComments({ ...BASE_RATE, rateType: 'RECHECK' });
    expect(result).toEqual({ comments: [], source: 'RESOLUTION_FAILED' });
  });
});

describe('resolveApplicableRateComments — BOOKABLE', () => {
  it('uses rateComments text directly when Availability already returned it, no extra call', async () => {
    const result = await resolveApplicableRateComments({ ...BASE_RATE, rateType: 'BOOKABLE', rateComments: 'Direct availability text' });
    expect(checkRateMock).not.toHaveBeenCalled();
    expect(result).toEqual({ comments: ['Direct availability text'], source: 'AVAILABILITY_TEXT' });
  });

  it('returns NONE_AVAILABLE when neither rateComments nor rateCommentsId is present', async () => {
    const result = await resolveApplicableRateComments({ ...BASE_RATE, rateType: 'BOOKABLE' });
    expect(result).toEqual({ comments: [], source: 'NONE_AVAILABLE' });
  });
});

describe('resolveRateCommentsById', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('returns null when HBX is not configured', async () => {
    delete process.env.HOTELBEDS_API_KEY;
    const result = await resolveRateCommentsById('RC-1');
    expect(result).toBeNull();
  });

  it('joins multiple resolved comment texts, never inventing one when the response has none', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ rateComments: { comments: [{ text: 'No pets.' }, { text: 'No smoking.' }] } }), { status: 200 })));
    const result = await resolveRateCommentsById('RC-1');
    expect(result).toBe('No pets. No smoking.');
  });

  it('returns null (never invents) when the resolution call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const result = await resolveRateCommentsById('RC-1');
    expect(result).toBeNull();
  });
});
