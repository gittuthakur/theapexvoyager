import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateBookingResult } from '@/services/booking/createBooking.service';
import type { BookingDocument } from '@/models/Booking';

const createBookingMock = vi.fn<(input: unknown) => Promise<CreateBookingResult>>();
vi.mock('@/services/booking/createBooking.service', () => ({ createBooking: createBookingMock }));

const routeModule = await import('./route');
const { POST } = routeModule;

// Same per-test-IP convention as app/api/journey-quotes/route.test.ts, to keep the real,
// shared, in-memory rate limiter (lib/rateLimit.ts — deliberately not mocked here, since
// the dedicated rate-limit test below needs the real thing) from bleeding state across
// unrelated tests in this file.
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `10.1.0.${ipCounter}`;
}

// The feature gate (JOURNEY_BOOKING_CREATION_ENABLED) is checked before anything else
// in POST, so every test in this file needs it set to the exact string 'true' to
// exercise the route's ordinary behavior. Enabled by default here; the dedicated
// "feature gate" describe block below overrides it per test to exercise the disabled
// path, and this restores whatever the real pre-suite value was (typically unset) after
// every single test — never just at the end of the file — so no test can leak its
// override into an unrelated one.
const GATE_ENV_KEY = 'JOURNEY_BOOKING_CREATION_ENABLED';
let originalGateEnvValue: string | undefined;

function setGate(value: string | undefined): void {
  if (value === undefined) delete process.env[GATE_ENV_KEY];
  else process.env[GATE_ENV_KEY] = value;
}

beforeEach(() => {
  originalGateEnvValue = process.env[GATE_ENV_KEY];
  setGate('true');
});

afterEach(() => {
  setGate(originalGateEnvValue);
});

const VALID_IDEMPOTENCY_KEY = 'a'.repeat(20);
const VALID_BODY = { quoteToken: '1.payload.signature', customer: { name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com' } };

function bookingRequest(body: unknown, options: { ip?: string; idempotencyKey?: string | null; raw?: string } = {}): Request {
  const headers = new Headers({ 'Content-Type': 'application/json', 'x-forwarded-for': options.ip ?? nextIp() });
  if (options.idempotencyKey !== null) headers.set('Idempotency-Key', options.idempotencyKey ?? VALID_IDEMPOTENCY_KEY);
  return new Request('http://localhost/api/bookings', {
    method: 'POST',
    headers,
    body: options.raw ?? JSON.stringify(body)
  });
}

function fakeBooking(overrides: Partial<BookingDocument> = {}): BookingDocument {
  return {
    bookingReference: 'TAV-ABCDEF0123',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'NOT_INITIATED',
    fulfilmentStatus: 'NOT_STARTED',
    journeySlug: 'test-journey',
    journeySnapshot: { name: 'Test Journey', destination: 'Test Destination', duration: '5 Days / 4 Nights', addOnLabels: [] },
    travelDate: '2026-11-10',
    adults: 2,
    children: 0,
    money: { currency: 'INR', totalMinorUnits: 2_000_000, payableNowMinorUnits: 2_000_000, balanceMinorUnits: 0, paymentMode: 'FULL' },
    quoteFingerprint: 'fingerprint-hex',
    quoteIssuedAt: new Date('2026-01-01T00:00:00.000Z'),
    quoteExpiresAt: new Date('2026-01-01T00:15:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:05.000Z'),
    updatedAt: new Date('2026-01-01T00:00:05.000Z'),
    idempotencyKey: VALID_IDEMPOTENCY_KEY,
    customer: { name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com' },
    ...overrides
  } as unknown as BookingDocument;
}

beforeEach(() => {
  createBookingMock.mockReset();
  createBookingMock.mockResolvedValue({ ok: true, booking: fakeBooking(), idempotentReplay: false });
});

describe('POST /api/bookings — happy path', () => {
  it('delegates to createBooking with exactly the idempotency key, quoteToken and customer object', async () => {
    await POST(bookingRequest(VALID_BODY));
    expect(createBookingMock).toHaveBeenCalledWith({
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
      quoteToken: VALID_BODY.quoteToken,
      customer: VALID_BODY.customer
    });
  });

  it('returns 201 for a newly created booking', async () => {
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.booking.bookingReference).toBe('TAV-ABCDEF0123');
    expect(body.idempotentReplay).toBe(false);
    expect(body.availabilityStatus).toBe('NOT_CONFIRMED');
    expect(typeof body.disclaimer).toBe('string');
  });

  it('returns 200 (not 201) with idempotentReplay: true for a replay', async () => {
    createBookingMock.mockResolvedValue({ ok: true, booking: fakeBooking(), idempotentReplay: true });
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.idempotentReplay).toBe(true);
  });

  it('sets Cache-Control: no-store on a successful response', async () => {
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('never returns Mongo internals, the idempotency key, the quote fingerprint, the raw token, or the customer email/phone', async () => {
    const res = await POST(bookingRequest(VALID_BODY));
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('_id');
    expect(text).not.toContain('__v');
    expect(text).not.toContain(VALID_IDEMPOTENCY_KEY);
    expect(text).not.toContain('fingerprint-hex');
    expect(text).not.toContain(VALID_BODY.quoteToken);
    expect(text).not.toContain('ravi@example.com');
    expect(text).not.toContain('9876543210');
  });
});

describe('POST /api/bookings — rejection mapping', () => {
  it('maps INVALID_QUOTE to 400', async () => {
    createBookingMock.mockResolvedValue({ ok: false, rejection: { reason: 'INVALID_QUOTE' } });
    expect((await POST(bookingRequest(VALID_BODY))).status).toBe(400);
  });

  it('maps EXPIRED_QUOTE to 410', async () => {
    createBookingMock.mockResolvedValue({ ok: false, rejection: { reason: 'EXPIRED_QUOTE' } });
    expect((await POST(bookingRequest(VALID_BODY))).status).toBe(410);
  });

  it('maps CONFIGURATION_ERROR to a generic 503 that never reveals why', async () => {
    createBookingMock.mockResolvedValue({ ok: false, rejection: { reason: 'CONFIGURATION_ERROR' } });
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).not.toMatch(/secret|booking_quote_secret|config/);
  });

  it('maps INVALID_CUSTOMER to 400, naming the offending field', async () => {
    createBookingMock.mockResolvedValue({ ok: false, rejection: { reason: 'INVALID_CUSTOMER', field: 'phone' } });
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('phone');
  });

  it('maps CONFLICT to 409', async () => {
    createBookingMock.mockResolvedValue({ ok: false, rejection: { reason: 'CONFLICT' } });
    expect((await POST(bookingRequest(VALID_BODY))).status).toBe(409);
  });

  it('maps SERVER_ERROR to 500', async () => {
    createBookingMock.mockResolvedValue({ ok: false, rejection: { reason: 'SERVER_ERROR' } });
    expect((await POST(bookingRequest(VALID_BODY))).status).toBe(500);
  });

  it('sets Cache-Control: no-store on every rejection response', async () => {
    createBookingMock.mockResolvedValue({ ok: false, rejection: { reason: 'INVALID_QUOTE' } });
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('POST /api/bookings — Idempotency-Key header validation', () => {
  it('rejects a missing Idempotency-Key header with 400, never calling the service', async () => {
    const res = await POST(bookingRequest(VALID_BODY, { idempotencyKey: null }));
    expect(res.status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('rejects a too-short Idempotency-Key with 400', async () => {
    const res = await POST(bookingRequest(VALID_BODY, { idempotencyKey: 'short' }));
    expect(res.status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('rejects an Idempotency-Key with disallowed characters with 400', async () => {
    // An embedded (not trailing) disallowed character — a trailing space would be
    // stripped by the Headers implementation's own value normalization before this
    // route ever sees it, which would defeat the point of this test.
    const res = await POST(bookingRequest(VALID_BODY, { idempotencyKey: 'a'.repeat(10) + '!' + 'a'.repeat(9) }));
    expect(res.status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/bookings — request body validation', () => {
  it('rejects malformed (non-JSON) input with 400, never calling the service', async () => {
    const res = await POST(bookingRequest(null, { raw: 'not json at all {{{' }));
    expect(res.status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('rejects a JSON array or primitive body', async () => {
    expect((await POST(bookingRequest([1, 2, 3]))).status).toBe(400);
    expect((await POST(bookingRequest('just a string'))).status).toBe(400);
  });

  it('rejects a missing quoteToken', async () => {
    const { quoteToken: _quoteToken, ...withoutToken } = VALID_BODY;
    const res = await POST(bookingRequest(withoutToken));
    expect(res.status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('rejects a non-string quoteToken', async () => {
    const res = await POST(bookingRequest({ ...VALID_BODY, quoteToken: 12345 }));
    expect(res.status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('rejects a missing or non-object customer', async () => {
    const { customer: _customer, ...withoutCustomer } = VALID_BODY;
    expect((await POST(bookingRequest(withoutCustomer))).status).toBe(400);
    expect((await POST(bookingRequest({ ...VALID_BODY, customer: 'not-an-object' }))).status).toBe(400);
    expect((await POST(bookingRequest({ ...VALID_BODY, customer: ['a', 'b'] }))).status).toBe(400);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized request body with 413, never calling the service', async () => {
    const oversized = { ...VALID_BODY, customer: { ...VALID_BODY.customer, specialRequests: 'a'.repeat(20_000) } };
    const res = await POST(bookingRequest(oversized));
    expect(res.status).toBe(413);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('never echoes any request body content back in the response, for either a 413 or a 400', async () => {
    const marker = 'UNIQUE_MARKER_b71cf03a';
    const oversizedRes = await POST(bookingRequest({ ...VALID_BODY, customer: { ...VALID_BODY.customer, specialRequests: marker + 'a'.repeat(20_000) } }));
    expect(oversizedRes.status).toBe(413);
    expect(JSON.stringify(await oversizedRes.json())).not.toContain(marker);

    const malformedRes = await POST(bookingRequest(null, { raw: `not json ${marker} {{{` }));
    expect(malformedRes.status).toBe(400);
    expect(JSON.stringify(await malformedRes.json())).not.toContain(marker);
  });

  it('the route never calls request.json() — only its own raw byte-counted reader', async () => {
    const routeSource = await import('node:fs').then((fs) => fs.readFileSync(new URL('./route.ts', import.meta.url), 'utf8'));
    // Strip comment lines first — the route's own doc comments mention
    // "`request.json()`" by name to explain why it's avoided, which would otherwise
    // false-positive a naive whole-file match.
    const codeOnly = routeSource
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    expect(codeOnly).not.toMatch(/request\.json\(\)/);
  });
});

describe('POST /api/bookings — error handling', () => {
  it('an unexpected exception from the service returns a generic 500 with no stack trace', async () => {
    createBookingMock.mockRejectedValue(new Error('Something exploded deep in Mongoose at /app/models/Booking.ts:99'));
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('Mongoose');
    expect(text).not.toContain('.ts:99');
    expect(text).not.toMatch(/at \S+:\d+:\d+/);
  });
});

describe('POST /api/bookings — rate limiting', () => {
  it('rate-limits repeated requests from the same client within the window', async () => {
    const ip = nextIp();
    let sawTooMany = false;
    for (let i = 0; i < 20; i += 1) {
      const res = await POST(bookingRequest(VALID_BODY, { ip }));
      if (res.status === 429) {
        sawTooMany = true;
        expect(res.headers.get('Retry-After')).toBeTruthy();
        break;
      }
    }
    expect(sawTooMany).toBe(true);
  });
});

describe('POST /api/bookings — no unintended side effects or extra surfaces', () => {
  it('has no GET/PUT/PATCH/DELETE handler', () => {
    const mod = routeModule as Record<string, unknown>;
    expect(mod.GET).toBeUndefined();
    expect(mod.PUT).toBeUndefined();
    expect(mod.PATCH).toBeUndefined();
    expect(mod.DELETE).toBeUndefined();
  });

  it('never imports a mailer, WhatsApp, payment SDK, HBX, or Google Places module directly', async () => {
    const routeSource = await import('node:fs').then((fs) => fs.readFileSync(new URL('./route.ts', import.meta.url), 'utf8'));
    // Only actual import statements are checked — the route's own doc comments
    // deliberately name WhatsApp/HBX/payment to explain that this phase makes none of
    // those calls, which would otherwise false-positive a naive whole-file match.
    const importLines = routeSource
      .split('\n')
      .filter((line) => /^\s*import\b/.test(line))
      .join('\n');
    expect(importLines).not.toMatch(/mailer|whatsapp|hotelbeds|hbx|google-places|razorpay|stripe/i);
  });

  it('never logs the request body, token, Idempotency-Key, or customer fields on error', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createBookingMock.mockRejectedValue(new Error('boom'));
    await POST(bookingRequest(VALID_BODY));
    const loggedText = logSpy.mock.calls.map((call) => JSON.stringify(call)).join(' ');
    expect(loggedText).not.toContain(VALID_BODY.quoteToken);
    expect(loggedText).not.toContain(VALID_IDEMPOTENCY_KEY);
    expect(loggedText).not.toContain('ravi@example.com');
    logSpy.mockRestore();
  });
});

describe('POST /api/bookings — feature gate (JOURNEY_BOOKING_CREATION_ENABLED)', () => {
  it('returns 503 when the flag is unset', async () => {
    setGate(undefined);
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Booking service is temporarily unavailable' });
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('returns 503 when the flag is an empty string', async () => {
    setGate('');
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("returns 503 when the flag is the string 'false'", async () => {
    setGate('false');
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("returns 503 when the flag is 'TRUE' — comparison is case-sensitive, no truthy coercion", async () => {
    setGate('TRUE');
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('returns 503 for a near-miss typo value', async () => {
    setGate('ture');
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("allows the route's normal behavior when the flag is exactly 'true'", async () => {
    setGate('true');
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(201);
    expect(createBookingMock).toHaveBeenCalledTimes(1);
  });

  it('checks the gate before body parsing, quote verification, MongoDB, or customer processing — a malformed body still yields 503, not 400', async () => {
    setGate(undefined);
    const res = await POST(bookingRequest(null, { raw: 'not json at all {{{' }));
    expect(res.status).toBe(503);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('checks the gate before rate limiting — repeated disabled requests never trip 429', async () => {
    setGate(undefined);
    const ip = nextIp();
    for (let i = 0; i < 20; i += 1) {
      expect((await POST(bookingRequest(VALID_BODY, { ip }))).status).toBe(503);
    }
  });

  it('blocks idempotent replay of an already-created booking while disabled — no probing an Idempotency-Key against a closed endpoint', async () => {
    createBookingMock.mockResolvedValue({ ok: true, booking: fakeBooking(), idempotentReplay: true });
    setGate(undefined);
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('sets Cache-Control: no-store on the disabled response', async () => {
    setGate(undefined);
    const res = await POST(bookingRequest(VALID_BODY));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('never echoes request/token/customer data, and never reveals the flag or the word "flag", while disabled', async () => {
    setGate(undefined);
    const marker = 'UNIQUE_MARKER_gate_9c21a4';
    const res = await POST(bookingRequest({ ...VALID_BODY, quoteToken: marker, customer: { ...VALID_BODY.customer, name: marker } }));
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain(marker);
    expect(text.toLowerCase()).not.toMatch(/journey_booking_creation_enabled|\bflag\b|\bconfig/);
  });

  it('is read at request time, not cached — toggling it takes effect on the very next request', async () => {
    setGate(undefined);
    expect((await POST(bookingRequest(VALID_BODY))).status).toBe(503);
    setGate('true');
    expect((await POST(bookingRequest(VALID_BODY))).status).toBe(201);
    setGate(undefined);
    expect((await POST(bookingRequest(VALID_BODY))).status).toBe(503);
  });
});
