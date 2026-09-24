import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuoteVerificationResult } from './quote.types';

const verifyJourneyQuoteTokenMock = vi.fn<(token: string) => QuoteVerificationResult>();
vi.mock('./journeyQuote.service', () => ({ verifyJourneyQuoteToken: verifyJourneyQuoteTokenMock }));

const connectDBMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/mongodb', () => ({ connectDB: connectDBMock }));

const BookingCreateMock = vi.fn();
const BookingFindOneMock = vi.fn();

// The real module is used for `computeQuoteFingerprint` (a pure SHA-256 helper — no
// reason to fake it) and for the schema's own exported constants; only the `Booking`
// model itself (its `create`/`findOne` — the only two methods this service calls) is
// replaced, so no test here ever touches a real MongoDB connection.
vi.mock('@/models/Booking', async () => {
  const actual = await vi.importActual<typeof import('@/models/Booking')>('@/models/Booking');
  return { ...actual, Booking: { create: BookingCreateMock, findOne: BookingFindOneMock } };
});

const { createBooking, computeBookingRequestFingerprint } = await import('./createBooking.service');
const { computeQuoteFingerprint } = await import('@/models/Booking');

const VALID_SNAPSHOT = {
  journeySlug: 'test-journey',
  journeyName: 'Test Journey',
  destination: 'Test Destination',
  duration: '5 Days / 4 Nights',
  stayOptionId: 'deluxe',
  stayOptionLabel: 'Deluxe Stay',
  transportOptionId: 'suv',
  transportOptionLabel: 'Private SUV',
  paceId: 'relaxed',
  paceLabel: 'Relaxed',
  addOnIds: ['addon-cab'],
  addOnLabels: ['Airport Cab'],
  adults: 2,
  children: 1,
  travelDate: '2026-11-10',
  lineItems: [{ label: 'Base price', amountMinorUnits: 2_000_000 }],
  currency: 'INR' as const,
  totalMinorUnits: 2_000_000,
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:15:00.000Z'
};

const VALID_CUSTOMER = { name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com' };
const VALID_TOKEN = '1.fake-payload.fake-signature';

function validVerification(): QuoteVerificationResult {
  return { ok: true, snapshot: VALID_SNAPSHOT };
}

function duplicateKeyError(field: 'idempotencyKey' | 'bookingReference') {
  return { code: 11000, keyPattern: { [field]: 1 } };
}

function fakeExistingBooking(overrides: Partial<{ quoteFingerprint: string; customer: typeof VALID_CUSTOMER }> = {}) {
  return {
    _id: 'existing-id',
    bookingReference: 'TAV-EXISTING01',
    idempotencyKey: 'existing-idem-key-000000',
    customer: overrides.customer ?? VALID_CUSTOMER,
    quoteFingerprint: overrides.quoteFingerprint ?? computeQuoteFingerprint(VALID_TOKEN),
    status: 'PENDING_PAYMENT',
    paymentStatus: 'NOT_INITIATED',
    fulfilmentStatus: 'NOT_STARTED',
    createdAt: new Date('2026-01-01T00:00:00.000Z')
  };
}

beforeEach(() => {
  verifyJourneyQuoteTokenMock.mockReset();
  verifyJourneyQuoteTokenMock.mockReturnValue(validVerification());
  BookingCreateMock.mockReset();
  BookingFindOneMock.mockReset();
  // Default: no existing Booking for this Idempotency-Key yet — the ordinary
  // "first-time request" path. Individual tests override this to exercise replay/
  // conflict behavior.
  BookingFindOneMock.mockResolvedValue(null);
  connectDBMock.mockClear();
});

describe('createBooking — quote verification / trust boundary', () => {
  it('creates a booking from the verified snapshot only, ignoring anything the caller might otherwise imply', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date('2026-01-01T00:00:00.000Z') }));

    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    expect(result.ok).toBe(true);
    expect(BookingCreateMock).toHaveBeenCalledTimes(1);
    const [doc] = BookingCreateMock.mock.calls[0];
    expect(doc.journeySlug).toBe(VALID_SNAPSHOT.journeySlug);
    expect(doc.journeySnapshot).toEqual({
      name: VALID_SNAPSHOT.journeyName,
      destination: VALID_SNAPSHOT.destination,
      duration: VALID_SNAPSHOT.duration,
      stayOptionLabel: VALID_SNAPSHOT.stayOptionLabel,
      transportOptionLabel: VALID_SNAPSHOT.transportOptionLabel,
      paceLabel: VALID_SNAPSHOT.paceLabel,
      addOnLabels: VALID_SNAPSHOT.addOnLabels
    });
    expect(doc.travelDate).toBe(VALID_SNAPSHOT.travelDate);
    expect(doc.adults).toBe(VALID_SNAPSHOT.adults);
    expect(doc.children).toBe(VALID_SNAPSHOT.children);
    expect(doc.money.totalMinorUnits).toBe(VALID_SNAPSHOT.totalMinorUnits);
  });

  it('never persists the raw quote token — only its one-way fingerprint', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    const [doc] = BookingCreateMock.mock.calls[0];
    expect(doc.quoteFingerprint).toBe(computeQuoteFingerprint(VALID_TOKEN));
    expect(JSON.stringify(doc)).not.toContain(VALID_TOKEN);
  });

  it('rejects an empty/non-string quoteToken as INVALID_QUOTE without calling the verifier', async () => {
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: '', customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'INVALID_QUOTE' } });
    expect(verifyJourneyQuoteTokenMock).not.toHaveBeenCalled();
  });

  it('maps a MALFORMED/UNSUPPORTED_VERSION/INVALID_SIGNATURE verification failure to INVALID_QUOTE', async () => {
    for (const reason of ['MALFORMED', 'UNSUPPORTED_VERSION', 'INVALID_SIGNATURE'] as const) {
      verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason });
      const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
      expect(result).toEqual({ ok: false, rejection: { reason: 'INVALID_QUOTE' } });
    }
    expect(BookingCreateMock).not.toHaveBeenCalled();
  });

  it('maps an EXPIRED verification failure to EXPIRED_QUOTE', async () => {
    verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason: 'EXPIRED' });
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'EXPIRED_QUOTE' } });
    expect(BookingCreateMock).not.toHaveBeenCalled();
  });

  it('maps a CONFIGURATION_ERROR verification failure through unchanged, and never creates a booking', async () => {
    verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason: 'CONFIGURATION_ERROR' });
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'CONFIGURATION_ERROR' } });
    expect(BookingCreateMock).not.toHaveBeenCalled();
  });

  it('only verifies the token when no existing Booking is found for this Idempotency-Key', async () => {
    BookingFindOneMock.mockResolvedValue(fakeExistingBooking({ customer: VALID_CUSTOMER }));
    await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(verifyJourneyQuoteTokenMock).not.toHaveBeenCalled();
  });
});

describe('createBooking — customer validation', () => {
  it('rejects an invalid customer field and reports which one, without ever calling connectDB', async () => {
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: { ...VALID_CUSTOMER, phone: '123' } });
    expect(result).toEqual({ ok: false, rejection: { reason: 'INVALID_CUSTOMER', field: 'phone' } });
    expect(connectDBMock).not.toHaveBeenCalled();
    expect(BookingCreateMock).not.toHaveBeenCalled();
  });
});

describe('createBooking — money invariant', () => {
  it('uses FULL payment mode with payableNow == total and balance == 0, straight from the verified total', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    const [doc] = BookingCreateMock.mock.calls[0];
    expect(doc.money).toEqual({
      currency: 'INR',
      totalMinorUnits: VALID_SNAPSHOT.totalMinorUnits,
      payableNowMinorUnits: VALID_SNAPSHOT.totalMinorUnits,
      balanceMinorUnits: 0,
      paymentMode: 'FULL'
    });
  });
});

describe('createBooking — initial state and excluded fields', () => {
  it('omits status/paymentStatus/fulfilmentStatus so the schema defaults apply', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    const [doc] = BookingCreateMock.mock.calls[0];
    expect(doc.status).toBeUndefined();
    expect(doc.paymentStatus).toBeUndefined();
    expect(doc.fulfilmentStatus).toBeUndefined();
  });

  it('never populates any payment-provider field', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    const [doc] = BookingCreateMock.mock.calls[0];
    expect(doc.paymentProvider).toBeUndefined();
    expect(doc.paymentProviderOrderId).toBeUndefined();
    expect(doc.paymentProviderPaymentId).toBeUndefined();
  });
});

describe('createBooking — booking reference generation', () => {
  it('generates a TAV-<24 uppercase hex chars> reference (96 bits), using crypto not Math.random', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    const [doc] = BookingCreateMock.mock.calls[0];
    expect(doc.bookingReference).toMatch(/^TAV-[0-9A-F]{24}$/);
  });

  it('generates a fresh, distinct reference across separate calls (never a fixed/predictable value)', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    await createBooking({ idempotencyKey: 'b'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    const references = BookingCreateMock.mock.calls.map((call) => call[0].bookingReference);
    expect(new Set(references).size).toBe(2);
  });

  it('retries with a fresh reference on a bookingReference collision, then succeeds', async () => {
    let attempts = 0;
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => {
      attempts += 1;
      if (attempts < 3) throw duplicateKeyError('bookingReference');
      return { ...doc, createdAt: new Date() };
    });

    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result.ok).toBe(true);
    expect(BookingCreateMock).toHaveBeenCalledTimes(3);
    const references = BookingCreateMock.mock.calls.map((call) => call[0].bookingReference);
    expect(new Set(references).size).toBe(3); // each attempt used a distinct reference
  });

  it('fails closed with SERVER_ERROR after exhausting bounded retries — never loops forever', async () => {
    BookingCreateMock.mockImplementation(async () => {
      throw duplicateKeyError('bookingReference');
    });

    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'SERVER_ERROR' } });
    expect(BookingCreateMock).toHaveBeenCalledTimes(5); // MAX_REFERENCE_ATTEMPTS
  });
});

describe('createBooking — idempotency lookup ordering', () => {
  it('a fresh idempotency key (no existing Booking) creates a new (non-replay) booking', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.idempotentReplay).toBe(false);
  });

  it('looks up the Idempotency-Key with findOne before ever calling create — the read decides replay eligibility, not race safety (see race tests below)', async () => {
    BookingCreateMock.mockImplementation(async (doc: Record<string, unknown>) => ({ ...doc, createdAt: new Date() }));
    const idempotencyKey = 'a'.repeat(16);
    await createBooking({ idempotencyKey, quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });

    expect(BookingFindOneMock).toHaveBeenCalledWith({ idempotencyKey });
    const findOneOrder = BookingFindOneMock.mock.invocationCallOrder[0];
    const createOrder = BookingCreateMock.mock.invocationCallOrder[0];
    expect(findOneOrder).toBeLessThan(createOrder);
  });
});

describe('createBooking — replay resolved via the initial lookup (no create attempt at all)', () => {
  it('an identical replay (same key, same logical request) returns the original booking, marked as a replay, without ever calling create', async () => {
    const existing = fakeExistingBooking();
    BookingFindOneMock.mockResolvedValue(existing);

    const result = await createBooking({ idempotencyKey: existing.idempotencyKey, quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: true, booking: existing, idempotentReplay: true });
    expect(BookingCreateMock).not.toHaveBeenCalled();
  });

  it('an identical replay succeeds even though the quote has since expired — the existing record is already authoritative', async () => {
    const existing = fakeExistingBooking();
    BookingFindOneMock.mockResolvedValue(existing);
    verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason: 'EXPIRED' }); // would reject a first-time request

    const result = await createBooking({ idempotencyKey: existing.idempotencyKey, quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: true, booking: existing, idempotentReplay: true });
    expect(verifyJourneyQuoteTokenMock).not.toHaveBeenCalled();
  });

  it('an identical replay succeeds even if the signing secret has since rotated or gone missing', async () => {
    const existing = fakeExistingBooking();
    BookingFindOneMock.mockResolvedValue(existing);
    verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason: 'CONFIGURATION_ERROR' }); // would reject a first-time request with 503

    const result = await createBooking({ idempotencyKey: existing.idempotencyKey, quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: true, booking: existing, idempotentReplay: true });
  });

  it('the same key reused with an altered quote token after the original expired is rejected as CONFLICT, without leaking the existing booking', async () => {
    const existing = fakeExistingBooking(); // fingerprint bound to VALID_TOKEN
    BookingFindOneMock.mockResolvedValue(existing);
    verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason: 'EXPIRED' });

    const result = await createBooking({ idempotencyKey: existing.idempotencyKey, quoteToken: '1.a-different-payload.a-different-signature', customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'CONFLICT' } });
    expect(BookingCreateMock).not.toHaveBeenCalled();
  });

  it('the same key reused for a genuinely different customer is rejected as CONFLICT, without leaking the existing booking', async () => {
    const existing = fakeExistingBooking({ customer: { name: 'Someone Else', phone: '9999999999', email: 'someone@else.com' } });
    BookingFindOneMock.mockResolvedValue(existing);

    const result = await createBooking({ idempotencyKey: existing.idempotencyKey, quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'CONFLICT' } });
    expect(JSON.stringify(result)).not.toContain('Someone Else');
    expect(JSON.stringify(result)).not.toContain('someone@else.com');
  });
});

describe('createBooking — first-time (no existing Booking) rejection paths', () => {
  it('a first-time request with an expired quote is rejected with EXPIRED_QUOTE (410 at the route)', async () => {
    verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason: 'EXPIRED' });
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'EXPIRED_QUOTE' } });
  });

  it('a first-time request with a missing/weak signing secret is rejected with CONFIGURATION_ERROR (503 at the route)', async () => {
    verifyJourneyQuoteTokenMock.mockReturnValue({ ok: false, reason: 'CONFIGURATION_ERROR' });
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'CONFIGURATION_ERROR' } });
  });
});

describe('createBooking — concurrent race safety (both requests miss the initial read)', () => {
  it('a concurrent-race duplicate on idempotencyKey is resolved by re-reading the winner and comparing fingerprints — same replay outcome as the initial-read path', async () => {
    const existing = fakeExistingBooking();
    // First findOne call (the initial lookup) misses; the second (race recovery, after
    // the create attempt below loses the race) returns the row the concurrent request won.
    BookingFindOneMock.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    BookingCreateMock.mockImplementation(async () => {
      throw duplicateKeyError('idempotencyKey');
    });

    const result = await createBooking({ idempotencyKey: existing.idempotencyKey, quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(BookingCreateMock).toHaveBeenCalledTimes(1); // no retry loop for idempotencyKey collisions
    expect(result).toEqual({ ok: true, booking: existing, idempotentReplay: true });
  });

  it('a concurrent-race duplicate whose winner turns out to be a different logical request is still rejected as CONFLICT', async () => {
    const existing = fakeExistingBooking({ customer: { name: 'Someone Else', phone: '9999999999', email: 'someone@else.com' } });
    BookingFindOneMock.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    BookingCreateMock.mockImplementation(async () => {
      throw duplicateKeyError('idempotencyKey');
    });

    const result = await createBooking({ idempotencyKey: existing.idempotencyKey, quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'CONFLICT' } });
  });

  it('fails closed with SERVER_ERROR if the winning row is gone by the time it is re-read', async () => {
    BookingFindOneMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    BookingCreateMock.mockImplementation(async () => {
      throw duplicateKeyError('idempotencyKey');
    });

    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'SERVER_ERROR' } });
  });

  it('an unrecognized create error (no E11000 shape) is a generic SERVER_ERROR, never surfaced in detail', async () => {
    BookingCreateMock.mockImplementation(async () => {
      throw new Error('connection reset by peer at /internal/mongo/pool.ts:88');
    });
    const result = await createBooking({ idempotencyKey: 'a'.repeat(16), quoteToken: VALID_TOKEN, customer: VALID_CUSTOMER });
    expect(result).toEqual({ ok: false, rejection: { reason: 'SERVER_ERROR' } });
  });
});

describe('computeBookingRequestFingerprint', () => {
  it('is deterministic for identical input', () => {
    const input = { quoteFingerprint: 'abc', customerName: 'Ravi', customerPhone: '9876543210', customerEmail: 'ravi@example.com' };
    expect(computeBookingRequestFingerprint(input)).toBe(computeBookingRequestFingerprint({ ...input }));
  });

  it('changes when any single field changes', () => {
    const base = { quoteFingerprint: 'abc', customerName: 'Ravi', customerPhone: '9876543210', customerEmail: 'ravi@example.com' };
    const baseline = computeBookingRequestFingerprint(base);
    expect(computeBookingRequestFingerprint({ ...base, quoteFingerprint: 'xyz' })).not.toBe(baseline);
    expect(computeBookingRequestFingerprint({ ...base, customerName: 'Someone Else' })).not.toBe(baseline);
    expect(computeBookingRequestFingerprint({ ...base, customerPhone: '9999999999' })).not.toBe(baseline);
    expect(computeBookingRequestFingerprint({ ...base, customerEmail: 'other@example.com' })).not.toBe(baseline);
  });
});
