import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRate } from './hbxCheckRate.service';

const ORIGINAL_ENV = { ...process.env };

const CHECKRATE_HOTEL_RESPONSE = {
  hotel: {
    code: 617065,
    currency: 'EUR',
    rooms: [
      {
        code: 'DBL.SU',
        name: 'double superior',
        rates: [
          {
            net: '220.00',
            boardName: 'BED AND BREAKFAST',
            boardCode: 'BB',
            rateKey: 'revalidated-rate-key',
            rateType: 'RECHECK',
            rooms: 1,
            allotment: 3,
            cancellationPolicies: [{ amount: '220.00', from: '2026-09-27T23:59:00+05:30' }],
            rateCommentsId: undefined,
            rateComments: 'Full comment text resolved at CheckRate'
          }
        ]
      }
    ]
  }
};

describe('checkRate', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('returns NOT_CONFIGURED when HBX credentials are missing, never calls fetch', async () => {
    delete process.env.HOTELBEDS_API_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await checkRate('some-rate-key', 2);
    expect(result).toEqual({ ok: false, reason: 'NOT_CONFIGURED' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls POST /hotel-api/1.0/checkrates with exactly the given rateKey', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify(CHECKRATE_HOTEL_RESPONSE), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    await checkRate('original-rate-key', 2);

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/hotel-api/1.0/checkrates');
    const body = JSON.parse(options.body);
    expect(body.rooms).toEqual([{ rateKey: 'original-rate-key' }]);
    expect(body.sourceMarket).toBe('IN');
  });

  it('returns the revalidated rate — new rateKey, price, room, board, cancellation policies and rate comments', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(CHECKRATE_HOTEL_RESPONSE), { status: 200 })));

    const result = await checkRate('original-rate-key', 2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rate.rateKey).toBe('revalidated-rate-key');
      expect(result.rate.totalStayPrice).toBe(220);
      expect(result.rate.roomName).toBe('double superior');
      expect(result.rate.boardName).toBe('BED AND BREAKFAST');
      expect(result.rate.cancellationPolicies).toEqual([{ chargeAmount: '220.00', chargeFrom: '2026-09-27T23:59:00+05:30' }]);
      expect(result.rate.rateComments).toBe('Full comment text resolved at CheckRate');
    }
  });

  it('never substitutes another rate — returns RATE_NO_LONGER_AVAILABLE when HBX returns no rates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hotel: { code: 617065, currency: 'EUR', rooms: [] } }), { status: 200 })));

    const result = await checkRate('original-rate-key', 2);
    expect(result).toEqual({ ok: false, reason: 'RATE_NO_LONGER_AVAILABLE' });
  });

  it('degrades to PROVIDER_ERROR (never throws) on an HBX 5xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));

    const result = await checkRate('original-rate-key', 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('PROVIDER_ERROR');
  });
});
