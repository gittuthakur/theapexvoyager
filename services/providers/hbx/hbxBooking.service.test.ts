import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHbxBooking, getHbxBookingDetail, cancelHbxBooking } from './hbxBooking.service';

const ORIGINAL_ENV = { ...process.env };

// Shape confirmed against a real captured Hotelbeds TEST booking response (2026-09-28
// certification-readiness verification) — rate/board/comments/cancellation data nests
// under room.rates[], never flattened onto the room itself.
const BOOKING_RESPONSE = {
  booking: {
    reference: 'HBX-REF-123',
    clientReference: 'apex-voyager-1',
    creationDate: '2026-09-27T20:00:00Z',
    status: 'CONFIRMED',
    holder: { name: 'Test', surname: 'Tester' },
    hotel: {
      code: 617065,
      name: 'Test Hotel',
      currency: 'EUR',
      checkIn: '2026-10-05',
      checkOut: '2026-10-07',
      rooms: [
        {
          status: 'CONFIRMED',
          id: 1,
          code: 'DBL.SU',
          name: 'double superior',
          paxes: [{ roomId: 1, type: 'AD' }, { roomId: 1, type: 'AD' }],
          rates: [
            {
              boardCode: 'BB',
              boardName: 'BED AND BREAKFAST',
              net: '215.60',
              cancellationPolicies: [{ amount: '215.60', from: '2026-09-27T23:59:00+05:30' }],
              rateComments: 'A comment'
            }
          ]
        }
      ],
      totalNet: '215.60',
      supplier: { name: 'HOTELBEDS DMCC', vatNumber: '100035906500003' }
    },
    totalNet: '215.60'
  }
};

function stubJsonResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe('createHbxBooking', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  const input = {
    holder: { name: 'Test', surname: 'Tester' },
    rooms: [{ rateKey: 'confirmed-rate-key', paxes: [{ roomId: 1, type: 'AD' as const }, { roomId: 1, type: 'AD' as const }] }],
    clientReference: 'apex-voyager-1'
  };

  it('returns NOT_CONFIGURED when HBX credentials are missing, never calls fetch', async () => {
    delete process.env.HOTELBEDS_API_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await createHbxBooking(input);
    expect(result).toEqual({ ok: false, reason: 'NOT_CONFIGURED' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls POST /hotel-api/1.0/bookings with holder, rooms, sourceMarket and clientReference', async () => {
    const fetchSpy = stubJsonResponse(BOOKING_RESPONSE);
    vi.stubGlobal('fetch', fetchSpy);

    await createHbxBooking(input);

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/hotel-api/1.0/bookings');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body.holder).toEqual({ name: 'Test', surname: 'Tester' });
    expect(body.rooms).toEqual(input.rooms);
    expect(body.clientReference).toBe('apex-voyager-1');
    expect(body.sourceMarket).toBe('IN');
  });

  it('returns the created booking summary, including reference and holder', async () => {
    vi.stubGlobal('fetch', stubJsonResponse(BOOKING_RESPONSE));
    const result = await createHbxBooking(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.reference).toBe('HBX-REF-123');
      expect(result.booking.status).toBe('CONFIRMED');
      expect(result.booking.holder).toEqual({ name: 'Test', surname: 'Tester' });
      expect(result.booking.rooms[0].rateComments).toBe('A comment');
      expect(result.booking.rooms[0].boardCode).toBe('BB');
      expect(result.booking.rooms[0].net).toBe('215.60');
      expect(result.booking.supplierName).toBe('HOTELBEDS DMCC');
      expect(result.booking.supplierVatNumber).toBe('100035906500003');
    }
  });

  it('degrades to PROVIDER_ERROR (never throws) on an HBX 5xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const result = await createHbxBooking(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('PROVIDER_ERROR');
  });

  it('uses a Booking Confirmation timeout of at least 60 seconds (Hotelbeds certification requirement)', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    vi.stubGlobal('fetch', stubJsonResponse(BOOKING_RESPONSE));

    await createHbxBooking(input);

    expect(timeoutSpy.mock.calls[0][0]).toBeGreaterThanOrEqual(60_000);
    timeoutSpy.mockRestore();
  });
});

describe('getHbxBookingDetail', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('calls GET /hotel-api/1.0/bookings/{reference}', async () => {
    const fetchSpy = stubJsonResponse(BOOKING_RESPONSE);
    vi.stubGlobal('fetch', fetchSpy);

    const result = await getHbxBookingDetail('HBX-REF-123');

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/hotel-api/1.0/bookings/HBX-REF-123');
    expect(options.method).toBe('GET');
    expect(result.ok).toBe(true);
  });

  it('returns NOT_FOUND on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));
    const result = await getHbxBookingDetail('does-not-exist');
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('does NOT use the Booking Confirmation 60s timeout — only createHbxBooking does', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    vi.stubGlobal('fetch', stubJsonResponse(BOOKING_RESPONSE));
    await getHbxBookingDetail('HBX-REF-123');
    expect(timeoutSpy.mock.calls[0][0]).toBeLessThan(60_000);
    timeoutSpy.mockRestore();
  });
});

describe('cancelHbxBooking', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('calls DELETE /hotel-api/1.0/bookings/{reference}?cancellationFlag=CANCELLATION', async () => {
    const fetchSpy = stubJsonResponse({ booking: { ...BOOKING_RESPONSE.booking, status: 'CANCELLED', cancellationReference: 'cancel-ref-1' } });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await cancelHbxBooking('HBX-REF-123');

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/hotel-api/1.0/bookings/HBX-REF-123?cancellationFlag=CANCELLATION');
    expect(options.method).toBe('DELETE');
    expect(result).toEqual({ ok: true, status: 'CANCELLED', cancellationReference: 'cancel-ref-1' });
  });

  it('returns NOT_FOUND on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));
    const result = await cancelHbxBooking('does-not-exist');
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });
});
