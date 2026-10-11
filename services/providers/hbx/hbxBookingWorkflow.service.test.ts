import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getHbxEnvironmentMock,
  checkRateMock,
  createHbxBookingMock,
  getHbxBookingDetailMock,
  cancelHbxBookingMock,
  hbxBookingCreateMock,
  hbxBookingUpdateOneMock,
  getHotelContentDetailMock,
  resolveRateCommentsByIdMock
} = vi.hoisted(() => ({
  getHbxEnvironmentMock: vi.fn(),
  checkRateMock: vi.fn(),
  createHbxBookingMock: vi.fn(),
  getHbxBookingDetailMock: vi.fn(),
  cancelHbxBookingMock: vi.fn(),
  hbxBookingCreateMock: vi.fn(),
  hbxBookingUpdateOneMock: vi.fn(),
  getHotelContentDetailMock: vi.fn(),
  resolveRateCommentsByIdMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/HbxBooking', () => ({
  HbxBooking: { create: hbxBookingCreateMock, updateOne: hbxBookingUpdateOneMock },
  generateVoucherAccessToken: () => 'fixed-test-token'
}));
vi.mock('./hbx.client', () => ({ getHbxEnvironment: getHbxEnvironmentMock }));
vi.mock('./hbxCheckRate.service', () => ({ checkRate: checkRateMock }));
vi.mock('./hbxBooking.service', () => ({
  createHbxBooking: createHbxBookingMock,
  getHbxBookingDetail: getHbxBookingDetailMock,
  cancelHbxBooking: cancelHbxBookingMock
}));
vi.mock('./hbxHotels.service', () => ({ getHotelContentDetail: getHotelContentDetailMock }));
vi.mock('./hbxRateComments.service', () => ({ resolveRateCommentsById: resolveRateCommentsByIdMock }));

const { confirmBooking, retrieveBooking, cancelBooking } = await import('./hbxBookingWorkflow.service');

const BOOKABLE_RATE = {
  provider: 'hbx' as const,
  providerHotelId: '617065',
  currency: 'EUR',
  totalStayPrice: 215.6,
  nightCount: 2,
  displayPerNight: 107.8,
  rateKey: 'bookable-rate-key',
  rateType: 'BOOKABLE',
  cancellationPolicies: [],
  lastCheckedAt: new Date().toISOString(),
  environment: 'test' as const
};

const RECHECK_RATE = { ...BOOKABLE_RATE, rateKey: 'recheck-rate-key', rateType: 'RECHECK' };

const HOLDER = { name: 'Test', surname: 'Tester' };
const PAXES = [{ roomId: 1, type: 'AD' as const }, { roomId: 1, type: 'AD' as const }];

const BOOKING_SUMMARY = {
  reference: 'HBX-REF-1',
  clientReference: 'apex-1',
  status: 'CONFIRMED',
  holder: HOLDER,
  hotelCode: 617065,
  hotelName: 'Test Hotel',
  currency: 'EUR',
  checkIn: '2026-10-05',
  checkOut: '2026-10-07',
  rooms: [{ paxes: PAXES, cancellationPolicies: [] }],
  totalNet: '215.60'
};

beforeEach(() => {
  getHbxEnvironmentMock.mockReset().mockReturnValue('test');
  checkRateMock.mockReset();
  createHbxBookingMock.mockReset().mockResolvedValue({ ok: true, booking: BOOKING_SUMMARY });
  getHbxBookingDetailMock.mockReset();
  cancelHbxBookingMock.mockReset();
  hbxBookingCreateMock.mockReset().mockResolvedValue(undefined);
  hbxBookingUpdateOneMock.mockReset().mockResolvedValue(undefined);
  getHotelContentDetailMock.mockReset().mockResolvedValue(null);
  resolveRateCommentsByIdMock.mockReset().mockResolvedValue(null);
});

describe('confirmBooking — BOOKABLE workflow', () => {
  it('a BOOKABLE rate skips CheckRate entirely and books directly with the original rateKey', async () => {
    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(checkRateMock).not.toHaveBeenCalled();
    expect(createHbxBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({ rooms: [{ rateKey: 'bookable-rate-key', paxes: PAXES }] })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.recheckedRoomCount).toBe(0);
  });
});

describe('confirmBooking — RECHECK workflow', () => {
  it('a RECHECK rate calls CheckRate first, then books with the REVALIDATED rateKey — never the original', async () => {
    checkRateMock.mockResolvedValue({ ok: true, rate: { ...RECHECK_RATE, rateKey: 'revalidated-key' } });

    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: RECHECK_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(checkRateMock).toHaveBeenCalledWith('recheck-rate-key', RECHECK_RATE.nightCount);
    expect(createHbxBookingMock).toHaveBeenCalledWith(expect.objectContaining({ rooms: [{ rateKey: 'revalidated-key', paxes: PAXES }] }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.recheckedRoomCount).toBe(1);
  });

  it('never books at all if CheckRate fails — no silent substitution of another rate', async () => {
    checkRateMock.mockResolvedValue({ ok: false, reason: 'RATE_NO_LONGER_AVAILABLE' });

    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: RECHECK_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(createHbxBookingMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'RECHECK_FAILED', error: 'RATE_NO_LONGER_AVAILABLE' });
  });
});

describe('confirmBooking — mixed multi-room occupancy', () => {
  it('correctly recomputes only the RECHECK room, leaving the BOOKABLE room untouched', async () => {
    checkRateMock.mockResolvedValue({ ok: true, rate: { ...RECHECK_RATE, rateKey: 'revalidated-key' } });
    const childPaxes = [{ roomId: 2, type: 'AD' as const }, { roomId: 2, type: 'CH' as const, age: 8 }];

    const result = await confirmBooking({
      holder: HOLDER,
      rooms: [
        { selectedRate: BOOKABLE_RATE, paxes: PAXES },
        { selectedRate: RECHECK_RATE, paxes: childPaxes }
      ],
      clientReference: 'apex-1'
    });

    expect(checkRateMock).toHaveBeenCalledTimes(1);
    expect(createHbxBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rooms: [
          { rateKey: 'bookable-rate-key', paxes: PAXES },
          { rateKey: 'revalidated-key', paxes: childPaxes }
        ]
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.recheckedRoomCount).toBe(1);
  });
});

describe('confirmBooking — never repeats Availability', () => {
  it('never imports or calls an availability function — only accepts already-fetched rates', async () => {
    const source = await import('node:fs').then((fs) => fs.readFileSync(new URL('./hbxBookingWorkflow.service.ts', import.meta.url), 'utf-8'));
    expect(source).not.toMatch(/hbxAvailability|getAvailability|getRawPricingResult/);
  });
});

describe('confirmBooking — production safety (fail-closed)', () => {
  it('refuses to book at all when the environment is "unknown" — never calls CheckRate or Booking', async () => {
    getHbxEnvironmentMock.mockReturnValue('unknown');

    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(result).toEqual({ ok: false, reason: 'ENVIRONMENT_UNKNOWN' });
    expect(checkRateMock).not.toHaveBeenCalled();
    expect(createHbxBookingMock).not.toHaveBeenCalled();
  });

  it('proceeds when the environment is genuinely "test"', async () => {
    getHbxEnvironmentMock.mockReturnValue('test');
    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });
    expect(result.ok).toBe(true);
  });
});

describe('confirmBooking — rate comments must be resolved before confirmation', () => {
  it('a RECHECK rate never calls resolveRateCommentsById — uses CheckRate\'s own rateComments text', async () => {
    checkRateMock.mockResolvedValue({ ok: true, rate: { ...RECHECK_RATE, rateKey: 'revalidated-key', rateComments: 'No pets allowed.' } });

    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: RECHECK_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(resolveRateCommentsByIdMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(hbxBookingCreateMock).toHaveBeenCalledWith(expect.objectContaining({ rooms: [expect.objectContaining({ rateComments: 'No pets allowed.' })] }));
  });

  it('a BOOKABLE rate with rateComments already present never calls resolveRateCommentsById', async () => {
    const result = await confirmBooking({
      holder: HOLDER,
      rooms: [{ selectedRate: { ...BOOKABLE_RATE, rateComments: 'Direct availability text' }, paxes: PAXES }],
      clientReference: 'apex-1'
    });

    expect(resolveRateCommentsByIdMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(hbxBookingCreateMock).toHaveBeenCalledWith(expect.objectContaining({ rooms: [expect.objectContaining({ rateComments: 'Direct availability text' })] }));
  });

  it('a BOOKABLE rate with only rateCommentsId resolves it via the Content API before booking', async () => {
    resolveRateCommentsByIdMock.mockResolvedValue('No smoking. Non-refundable.');

    const result = await confirmBooking({
      holder: HOLDER,
      rooms: [{ selectedRate: { ...BOOKABLE_RATE, rateCommentsId: 'RC-1' }, paxes: PAXES }],
      clientReference: 'apex-1'
    });

    expect(resolveRateCommentsByIdMock).toHaveBeenCalledWith('RC-1');
    expect(createHbxBookingMock).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(hbxBookingCreateMock).toHaveBeenCalledWith(expect.objectContaining({ rooms: [expect.objectContaining({ rateComments: 'No smoking. Non-refundable.' })] }));
  });

  it('refuses to book at all when a rateCommentsId cannot be resolved — never invents or silently drops it', async () => {
    resolveRateCommentsByIdMock.mockResolvedValue(null);

    const result = await confirmBooking({
      holder: HOLDER,
      rooms: [{ selectedRate: { ...BOOKABLE_RATE, rateCommentsId: 'RC-1' }, paxes: PAXES }],
      clientReference: 'apex-1'
    });

    expect(createHbxBookingMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'RATE_COMMENTS_UNRESOLVED', error: expect.stringContaining('RC-1') });
  });

  it('proceeds normally when a rate genuinely has neither rateComments nor rateCommentsId', async () => {
    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });
    expect(resolveRateCommentsByIdMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it('falls back to the pre-confirmation resolved comment when the real Booking Confirmation response omits rateComments', async () => {
    resolveRateCommentsByIdMock.mockResolvedValue('Resolved before booking.');
    createHbxBookingMock.mockResolvedValue({
      ok: true,
      booking: { ...BOOKING_SUMMARY, rooms: [{ paxes: PAXES, cancellationPolicies: [] }] }
    });

    await confirmBooking({
      holder: HOLDER,
      rooms: [{ selectedRate: { ...BOOKABLE_RATE, rateCommentsId: 'RC-1' }, paxes: PAXES }],
      clientReference: 'apex-1'
    });

    expect(hbxBookingCreateMock).toHaveBeenCalledWith(expect.objectContaining({ rooms: [expect.objectContaining({ rateComments: 'Resolved before booking.' })] }));
  });
});

describe('confirmBooking — persistence', () => {
  it('persists the booking with the correct environment tag and holder/room data', async () => {
    await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(hbxBookingCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: 'HBX-REF-1',
        environment: 'test',
        providerHotelId: '617065',
        holderName: 'Test',
        holderSurname: 'Tester'
      })
    );
  });

  it('returns the generated voucherAccessToken on success', async () => {
    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.voucherAccessToken).toBe('fixed-test-token');
  });

  it('enriches the persisted record with best-effort hotel content detail, never inventing missing fields', async () => {
    getHotelContentDetailMock.mockResolvedValue({
      hbxCode: 617065,
      name: 'Test Hotel',
      address: 'Main Street 1',
      city: 'Manali',
      postalCode: '175131',
      categoryDescription: '4 STARS',
      destinationName: 'Himachal Pradesh',
      phone: '+91-1234'
    });

    await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(getHotelContentDetailMock).toHaveBeenCalledWith(617065);
    expect(hbxBookingCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hotelAddress: 'Main Street 1',
        hotelCity: 'Manali',
        hotelPostalCode: '175131',
        hotelCategoryDescription: '4 STARS',
        hotelPhone: '+91-1234',
        destinationName: 'Himachal Pradesh'
      })
    );
  });

  it('leaves content-enrichment fields undefined (never invented) when the content lookup fails or returns null', async () => {
    getHotelContentDetailMock.mockResolvedValue(null);
    await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });
    expect(hbxBookingCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ hotelAddress: undefined, hotelCity: undefined, hotelPhone: undefined })
    );
  });

  it('never persists a booking when creation fails', async () => {
    createHbxBookingMock.mockResolvedValue({ ok: false, reason: 'PROVIDER_ERROR', error: 'boom' });
    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });
    expect(result).toEqual({ ok: false, reason: 'PROVIDER_ERROR', error: 'boom' });
    expect(hbxBookingCreateMock).not.toHaveBeenCalled();
  });

  it('still returns the real HBX booking reference even if our own persistence write fails — never loses a genuine reservation', async () => {
    hbxBookingCreateMock.mockRejectedValue(new Error('schema mismatch'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await confirmBooking({ holder: HOLDER, rooms: [{ selectedRate: BOOKABLE_RATE, paxes: PAXES }], clientReference: 'apex-1' });

    expect(result).toEqual({ ok: true, booking: BOOKING_SUMMARY, recheckedRoomCount: 0 });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('retrieveBooking', () => {
  it('fetches the current state directly from Hotelbeds', async () => {
    getHbxBookingDetailMock.mockResolvedValue({ ok: true, booking: BOOKING_SUMMARY });
    const result = await retrieveBooking('HBX-REF-1');
    expect(result).toEqual({ ok: true, booking: BOOKING_SUMMARY });
    expect(getHbxBookingDetailMock).toHaveBeenCalledWith('HBX-REF-1');
  });
});

describe('cancelBooking', () => {
  it('cancels with Hotelbeds and updates the persisted record status', async () => {
    cancelHbxBookingMock.mockResolvedValue({ ok: true, status: 'CANCELLED' });
    const result = await cancelBooking('HBX-REF-1');
    expect(result).toEqual({ ok: true, status: 'CANCELLED' });
    expect(hbxBookingUpdateOneMock).toHaveBeenCalledWith({ reference: 'HBX-REF-1' }, { status: 'CANCELLED' });
  });

  it('never updates the persisted record when cancellation fails', async () => {
    cancelHbxBookingMock.mockResolvedValue({ ok: false, reason: 'NOT_FOUND' });
    const result = await cancelBooking('does-not-exist');
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
    expect(hbxBookingUpdateOneMock).not.toHaveBeenCalled();
  });
});
