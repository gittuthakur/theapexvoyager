import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JourneyQuoteResult } from '@/services/booking/quote.types';

const createJourneyQuoteMock = vi.fn<(request: unknown) => Promise<JourneyQuoteResult>>();
vi.mock('@/services/booking/journeyQuote.service', () => ({ createJourneyQuote: createJourneyQuoteMock }));

const routeModule = await import('./route');
const { POST } = routeModule;

// Each test uses its own fake client IP (via X-Forwarded-For) so the real, shared,
// in-memory rate limiter (lib/rateLimit.ts — deliberately NOT mocked, since exercising
// the real limiter is exactly what the dedicated rate-limit test below needs) never
// bleeds state between unrelated tests in this file.
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

function jsonRequest(body: unknown, ip: string = nextIp()): Request {
  return new Request('http://localhost/api/journey-quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body)
  });
}

const VALID_BODY = { journeySlug: 'test-journey', travelDate: '2026-11-10', adults: 2, children: 0, addOnIds: [] };

const VALID_SNAPSHOT = {
  journeySlug: 'test-journey',
  journeyName: 'Test Journey',
  destination: 'Test Destination',
  duration: '5 Days / 4 Nights',
  addOnIds: [],
  addOnLabels: [],
  adults: 2,
  children: 0,
  travelDate: '2026-11-10',
  lineItems: [{ label: 'Base price', amountMinorUnits: 2_000_000 }],
  currency: 'INR' as const,
  totalMinorUnits: 2_000_000,
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:15:00.000Z'
};

beforeEach(() => {
  createJourneyQuoteMock.mockReset();
  createJourneyQuoteMock.mockResolvedValue({ ok: true, quote: { token: '1.payload.signature', snapshot: VALID_SNAPSHOT } });
});

describe('POST /api/journey-quotes — happy path', () => {
  it('delegates to createJourneyQuote with exactly the request fields, nothing computed independently', async () => {
    await POST(jsonRequest({ ...VALID_BODY, stayOptionId: 'deluxe', addOnIds: ['addon-cab'] }));
    expect(createJourneyQuoteMock).toHaveBeenCalledWith({
      journeySlug: 'test-journey',
      travelDate: '2026-11-10',
      adults: 2,
      children: 0,
      stayOptionId: 'deluxe',
      transportOptionId: undefined,
      paceId: undefined,
      addOnIds: ['addon-cab']
    });
  });

  it('returns 200 with the token, quote snapshot, and a clear not-confirmed marker', async () => {
    const res = await POST(jsonRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe('1.payload.signature');
    expect(body.quote.journeySlug).toBe('test-journey');
    expect(body.quote.totalFormatted).toBeDefined();
    expect(body.availabilityStatus).toBe('NOT_CONFIRMED');
    expect(typeof body.disclaimer).toBe('string');
    expect(body.disclaimer.toLowerCase()).toContain('not a confirmed booking');
  });

  it('sets Cache-Control: no-store on a successful response', async () => {
    const res = await POST(jsonRequest(VALID_BODY));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('POST /api/journey-quotes — rejection mapping', () => {
  it('maps UNKNOWN_JOURNEY to 404', async () => {
    createJourneyQuoteMock.mockResolvedValue({ ok: false, reason: 'UNKNOWN_JOURNEY' });
    const res = await POST(jsonRequest(VALID_BODY));
    expect(res.status).toBe(404);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('maps INVALID_DATE to 400', async () => {
    createJourneyQuoteMock.mockResolvedValue({ ok: false, reason: 'INVALID_DATE' });
    const res = await POST(jsonRequest(VALID_BODY));
    expect(res.status).toBe(400);
  });

  it('maps INVALID_TRAVELLER_COUNT to 400', async () => {
    createJourneyQuoteMock.mockResolvedValue({ ok: false, reason: 'INVALID_TRAVELLER_COUNT' });
    const res = await POST(jsonRequest(VALID_BODY));
    expect(res.status).toBe(400);
  });

  it('maps UNKNOWN_STAY_OPTION / UNKNOWN_ADD_ON to 400', async () => {
    createJourneyQuoteMock.mockResolvedValue({ ok: false, reason: 'UNKNOWN_STAY_OPTION' });
    expect((await POST(jsonRequest(VALID_BODY))).status).toBe(400);

    createJourneyQuoteMock.mockResolvedValue({ ok: false, reason: 'UNKNOWN_ADD_ON' });
    expect((await POST(jsonRequest(VALID_BODY))).status).toBe(400);
  });

  it('maps CONFIGURATION_ERROR to a generic 503 that never reveals why', async () => {
    createJourneyQuoteMock.mockResolvedValue({ ok: false, reason: 'CONFIGURATION_ERROR' });
    const res = await POST(jsonRequest(VALID_BODY));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).not.toMatch(/secret|booking_quote_secret|config/);
  });
});

describe('POST /api/journey-quotes — input safety', () => {
  it('rejects malformed (non-JSON) input with 400, never calling the service', async () => {
    const req = new Request('http://localhost/api/journey-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
      body: 'not json at all {{{'
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(createJourneyQuoteMock).not.toHaveBeenCalled();
  });

  it('rejects a JSON array or primitive body', async () => {
    expect((await POST(jsonRequest([1, 2, 3]))).status).toBe(400);
    expect((await POST(jsonRequest('just a string'))).status).toBe(400);
  });

  it('rejects a numeric-string adults value — no coercion', async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, adults: '2' }));
    expect(res.status).toBe(400);
    expect(createJourneyQuoteMock).not.toHaveBeenCalled();
  });

  it('rejects a boolean children value — no coercion', async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, children: false }));
    expect(res.status).toBe(400);
    expect(createJourneyQuoteMock).not.toHaveBeenCalled();
  });

  it('rejects a missing journeySlug', async () => {
    const { journeySlug: _journeySlug, ...withoutSlug } = VALID_BODY;
    const res = await POST(jsonRequest(withoutSlug));
    expect(res.status).toBe(400);
  });

  it('rejects addOnIds that is not an array of strings', async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, addOnIds: [1, 2, 3] }));
    expect(res.status).toBe(400);
  });

  it('rejects an oversized request body', async () => {
    const oversized = { ...VALID_BODY, addOnIds: Array.from({ length: 5000 }, (_, i) => `addon-${i}-padding-padding-padding`) };
    const req = new Request('http://localhost/api/journey-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
      body: JSON.stringify(oversized)
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(createJourneyQuoteMock).not.toHaveBeenCalled();
  });
});

// Constructs a valid-shaped JSON body padded with an ignored extra field so its exact
// UTF-8 byte length can be controlled precisely — used to test the 5,000-byte boundary
// itself, not just "some oversized body".
function paddedAsciiBody(totalBytes: number): string {
  const base = { ...VALID_BODY, pad: '' };
  const baseBytes = Buffer.byteLength(JSON.stringify(base), 'utf8');
  const padLength = Math.max(0, totalBytes - baseBytes);
  const body = { ...VALID_BODY, pad: 'a'.repeat(padLength) };
  const actual = Buffer.byteLength(JSON.stringify(body), 'utf8');
  // Absorb the few bytes of rounding error from the pad field's own quotes.
  if (actual !== totalBytes) {
    return JSON.stringify({ ...VALID_BODY, pad: 'a'.repeat(padLength - (actual - totalBytes)) });
  }
  return JSON.stringify(body);
}

describe('POST /api/journey-quotes — raw byte-size limit (before JSON.parse)', () => {
  it('accepts a raw ASCII body exactly at the 5,000-byte limit', async () => {
    const raw = paddedAsciiBody(5000);
    expect(Buffer.byteLength(raw, 'utf8')).toBe(5000);
    const req = new Request('http://localhost/api/journey-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
      body: raw
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('rejects a raw ASCII body one byte over the limit', async () => {
    const raw = paddedAsciiBody(5001);
    expect(Buffer.byteLength(raw, 'utf8')).toBe(5001);
    const req = new Request('http://localhost/api/journey-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
      body: raw
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(createJourneyQuoteMock).not.toHaveBeenCalled();
  });

  it('rejects multibyte UTF-8 content whose CHARACTER count is under 5,000 but whose real BYTE count exceeds it', async () => {
    // Each Devanagari character below is 3 bytes in UTF-8 but exactly 1 UTF-16 code
    // unit (1 toward .length) in JS — 1700 of them is only 1700 JS characters (well
    // under any character-count-based limit) but ~5100 real bytes on the wire.
    const multibytePad = 'अ'.repeat(1700);
    const body = { ...VALID_BODY, pad: multibytePad };
    const raw = JSON.stringify(body);
    expect(raw.length).toBeLessThan(5000); // character count — would wrongly look "under limit"
    expect(Buffer.byteLength(raw, 'utf8')).toBeGreaterThan(5000); // real byte count — correctly over

    const req = new Request('http://localhost/api/journey-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
      body: raw
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(createJourneyQuoteMock).not.toHaveBeenCalled();
  });

  it('malformed JSON under the byte limit returns 400, not 413', async () => {
    const raw = 'not json at all {{{';
    expect(Buffer.byteLength(raw, 'utf8')).toBeLessThan(5000);
    const req = new Request('http://localhost/api/journey-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
      body: raw
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('oversized malformed (non-JSON) content is rejected as 413 before JSON.parse is ever attempted — never 400', async () => {
    const raw = 'not valid json at all, just garbage padding: ' + 'x'.repeat(6000);
    expect(Buffer.byteLength(raw, 'utf8')).toBeGreaterThan(5000);
    const req = new Request('http://localhost/api/journey-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
      body: raw
    });
    const res = await POST(req);
    expect(res.status).toBe(413); // NOT 400 — proves the size check runs before JSON.parse
    expect(createJourneyQuoteMock).not.toHaveBeenCalled();
  });

  it('never echoes any request body content back in the response, for either a 413 or a 400', async () => {
    const marker = 'UNIQUE_MARKER_9f3e7a21';

    const oversizedRaw = `{"journeySlug":"${marker}",${'"pad":"' + 'x'.repeat(6000) + '"'}}`;
    const oversizedRes = await POST(
      new Request('http://localhost/api/journey-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
        body: oversizedRaw
      })
    );
    expect(oversizedRes.status).toBe(413);
    expect(JSON.stringify(await oversizedRes.json())).not.toContain(marker);

    const malformedRes = await POST(
      new Request('http://localhost/api/journey-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': nextIp() },
        body: `not json ${marker} {{{`
      })
    );
    expect(malformedRes.status).toBe(400);
    expect(JSON.stringify(await malformedRes.json())).not.toContain(marker);
  });

  it('the route never calls request.json() — only its own raw byte-counted reader', async () => {
    const routeSource = await import('node:fs').then((fs) => fs.readFileSync(new URL('./route.ts', import.meta.url), 'utf8'));
    expect(routeSource).not.toMatch(/request\.json\(\)/);
  });
});

describe('POST /api/journey-quotes — error handling', () => {
  it('an unexpected exception from the service returns a generic 500 with no stack trace', async () => {
    createJourneyQuoteMock.mockRejectedValue(new Error('Something exploded deep in Mongoose at /app/models/Journey.ts:42'));
    const res = await POST(jsonRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('Mongoose');
    expect(text).not.toContain('.ts:42');
    expect(text).not.toMatch(/at \S+:\d+:\d+/);
  });
});

describe('POST /api/journey-quotes — rate limiting', () => {
  it('rate-limits repeated requests from the same client within the window', async () => {
    const ip = nextIp();
    let sawTooMany = false;
    for (let i = 0; i < 40; i += 1) {
      const res = await POST(jsonRequest(VALID_BODY, ip));
      if (res.status === 429) {
        sawTooMany = true;
        break;
      }
    }
    expect(sawTooMany).toBe(true);
  });
});

describe('POST /api/journey-quotes — no unintended side effects or extra surfaces', () => {
  it('has no GET handler', () => {
    expect((routeModule as Record<string, unknown>).GET).toBeUndefined();
  });

  it('never calls MongoDB/mailer/WhatsApp directly — the route module imports none of them', async () => {
    const routeSource = await import('node:fs').then((fs) => fs.readFileSync(new URL('./route.ts', import.meta.url), 'utf8'));
    expect(routeSource).not.toMatch(/@\/lib\/mongodb|@\/lib\/mailer|@\/lib\/whatsapp|@\/models\//);
  });
});
