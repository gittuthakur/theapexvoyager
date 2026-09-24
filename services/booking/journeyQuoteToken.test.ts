import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TravelPackage } from '@/types/package';

const getPackageBySlugMock = vi.fn<(slug: string) => Promise<TravelPackage | undefined>>();
vi.mock('@/lib/packages', () => ({ getPackageBySlug: getPackageBySlugMock }));

const { createJourneyQuote, verifyJourneyQuoteToken } = await import('./journeyQuote.service');

const VALID_SECRET = 'a'.repeat(32);

const TEST_JOURNEY: TravelPackage = {
  slug: 'test-journey',
  name: 'Test Journey',
  destination: 'Test Destination',
  image: '/images/test.jpg',
  duration: '5 Days / 4 Nights',
  price: 10000,
  category: 'Adventure',
  shortDescription: 'A test journey',
  highlights: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  stayOptions: [{ id: 'standard', label: 'Standard', extraPrice: 0 }],
  addOns: []
};

const REQUEST = { journeySlug: 'test-journey', travelDate: '2026-11-10', adults: 2, children: 0, addOnIds: [] };

async function issueToken(): Promise<string> {
  vi.stubEnv('BOOKING_QUOTE_SECRET', VALID_SECRET);
  getPackageBySlugMock.mockResolvedValue(TEST_JOURNEY);
  const result = await createJourneyQuote(REQUEST);
  if (!result.ok) throw new Error('setup failed: could not issue a token');
  return result.quote.token;
}

describe('verifyJourneyQuoteToken', () => {
  beforeEach(() => {
    vi.stubEnv('BOOKING_QUOTE_SECRET', VALID_SECRET);
    getPackageBySlugMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('verifies a token it just issued, returning the frozen snapshot', async () => {
    const token = await issueToken();
    const result = verifyJourneyQuoteToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.journeySlug).toBe('test-journey');
    expect(result.snapshot.totalMinorUnits).toBe(2 * 10000 * 100);
  });

  it('never reloads or reprices the live journey during verification', async () => {
    const token = await issueToken();
    getPackageBySlugMock.mockClear();
    verifyJourneyQuoteToken(token);
    expect(getPackageBySlugMock).not.toHaveBeenCalled();
  });

  it('a price change to the live journey after issuance never affects an already-issued, still-valid token', async () => {
    const token = await issueToken();
    // Simulate the underlying Journey document changing price after the quote was issued.
    getPackageBySlugMock.mockResolvedValue({ ...TEST_JOURNEY, price: 999999 });
    const result = verifyJourneyQuoteToken(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.totalMinorUnits).toBe(2 * 10000 * 100); // unchanged
  });

  it('rejects a tampered payload (signature no longer matches)', async () => {
    const token = await issueToken();
    const [version, payload, signature] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')), totalMinorUnits: 1 }), 'utf8').toString(
      'base64url'
    );
    const tampered = `${version}.${tamperedPayload}.${signature}`;
    expect(verifyJourneyQuoteToken(tampered)).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
  });

  it('rejects a tampered signature', async () => {
    const token = await issueToken();
    const [version, payload, signature] = token.split('.');
    const flippedChar = signature[0] === 'A' ? 'B' : 'A';
    const tampered = `${version}.${payload}.${flippedChar}${signature.slice(1)}`;
    expect(verifyJourneyQuoteToken(tampered)).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
  });

  it('rejects a malformed token (wrong number of parts)', () => {
    expect(verifyJourneyQuoteToken('not-a-real-token')).toEqual({ ok: false, reason: 'MALFORMED' });
    expect(verifyJourneyQuoteToken('1.only-two-parts')).toEqual({ ok: false, reason: 'MALFORMED' });
    expect(verifyJourneyQuoteToken('')).toEqual({ ok: false, reason: 'MALFORMED' });
  });

  it('rejects a token with a missing part', () => {
    expect(verifyJourneyQuoteToken('1..signature')).toEqual({ ok: false, reason: 'MALFORMED' });
  });

  it('rejects a garbled payload — signature verification runs first, so this fails as INVALID_SIGNATURE rather than ever attempting to decode it', () => {
    // An attacker without the secret cannot produce a payload string that both (a) looks
    // garbled/invalid and (b) still carries a signature that verifies — so this path is
    // only reachable via a wrong signature, never a "valid signature, garbage payload"
    // case (that's the separate "not valid JSON" test below, signed correctly).
    expect(verifyJourneyQuoteToken('1.not valid base64url!!!.abc')).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
  });

  it('rejects a payload that decodes but is not valid JSON', () => {
    const badPayload = Buffer.from('not json at all', 'utf8').toString('base64url');
    // Signed with the real version-bound scheme (`${version}.${payload}`, not the
    // payload alone) so this specifically tests the JSON-parse/shape path, not the
    // signature path.
    const signature = crypto.createHmac('sha256', VALID_SECRET).update(`1.${badPayload}`).digest('base64url');
    expect(verifyJourneyQuoteToken(`1.${badPayload}.${signature}`)).toEqual({ ok: false, reason: 'MALFORMED' });
  });

  it('rejects an unsupported token version', async () => {
    const token = await issueToken();
    const [, payload, signature] = token.split('.');
    expect(verifyJourneyQuoteToken(`2.${payload}.${signature}`)).toEqual({ ok: false, reason: 'UNSUPPORTED_VERSION' });
  });

  describe('version is cryptographically bound to the payload (not just an out-of-band prefix)', () => {
    it('a valid v1 token still verifies', async () => {
      const token = await issueToken();
      expect(token.startsWith('1.')).toBe(true);
      expect(verifyJourneyQuoteToken(token).ok).toBe(true);
    });

    it('changing only the version segment invalidates an otherwise-untouched token', async () => {
      const token = await issueToken();
      const [, payload, signature] = token.split('.');
      const retagged = `9.${payload}.${signature}`;
      const result = verifyJourneyQuoteToken(retagged);
      expect(result.ok).toBe(false);
    });

    it('an unsupported version cannot reuse a valid payload/signature pair from version 1', async () => {
      const token = await issueToken();
      const [, payload, signature] = token.split('.');
      // Rejected as UNSUPPORTED_VERSION here (the version check runs before signature
      // verification) — but the point of binding the version into the signed bytes is
      // that even if a future format supported a second version and re-ordered these
      // checks, this exact payload/signature pair still could NOT be reinterpreted as a
      // different version: the signature was computed over "1.<payload>", not "2.<payload>".
      expect(verifyJourneyQuoteToken(`2.${payload}.${signature}`)).toEqual({ ok: false, reason: 'UNSUPPORTED_VERSION' });
    });

    it('a signature computed the OLD way (payload alone, no version prefix) is rejected — proves the signing input actually changed, not just documentation', async () => {
      getPackageBySlugMock.mockResolvedValue(TEST_JOURNEY);
      const token = await issueToken();
      const [version, payload] = token.split('.');
      const oldStyleSignature = crypto.createHmac('sha256', VALID_SECRET).update(payload).digest('base64url'); // no version prefix
      const forged = `${version}.${payload}.${oldStyleSignature}`;
      expect(verifyJourneyQuoteToken(forged)).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
    });

    it('payload tampering under the version-bound scheme is still rejected', async () => {
      const token = await issueToken();
      const [version, payload, signature] = token.split('.');
      const tamperedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')), totalMinorUnits: 1 }), 'utf8').toString(
        'base64url'
      );
      expect(verifyJourneyQuoteToken(`${version}.${tamperedPayload}.${signature}`)).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
    });

    it('signature tampering under the version-bound scheme is still rejected', async () => {
      const token = await issueToken();
      const [version, payload, signature] = token.split('.');
      const flippedChar = signature[0] === 'A' ? 'B' : 'A';
      expect(verifyJourneyQuoteToken(`${version}.${payload}.${flippedChar}${signature.slice(1)}`)).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
    });
  });

  it('rejects an expired token', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    const token = await issueToken();
    vi.setSystemTime(new Date('2026-06-01T00:20:00.000Z')); // 20 minutes later, past the 15-minute lifetime
    expect(verifyJourneyQuoteToken(token)).toEqual({ ok: false, reason: 'EXPIRED' });
  });

  it('accepts a token right up to (but not past) its expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    const token = await issueToken();
    vi.setSystemTime(new Date('2026-06-01T00:14:00.000Z')); // 14 minutes later, still within 15
    expect(verifyJourneyQuoteToken(token).ok).toBe(true);
  });

  it('fails closed when the secret is missing', async () => {
    const token = await issueToken();
    vi.unstubAllEnvs();
    expect(verifyJourneyQuoteToken(token)).toEqual({ ok: false, reason: 'CONFIGURATION_ERROR' });
  });

  it('fails closed when the secret is empty', async () => {
    const token = await issueToken();
    vi.stubEnv('BOOKING_QUOTE_SECRET', '');
    expect(verifyJourneyQuoteToken(token)).toEqual({ ok: false, reason: 'CONFIGURATION_ERROR' });
  });

  it('fails closed when the secret is too short (weak)', async () => {
    const token = await issueToken();
    vi.stubEnv('BOOKING_QUOTE_SECRET', 'too-short');
    expect(verifyJourneyQuoteToken(token)).toEqual({ ok: false, reason: 'CONFIGURATION_ERROR' });
  });

  it('a token signed with a different secret cannot be verified', async () => {
    const token = await issueToken();
    vi.stubEnv('BOOKING_QUOTE_SECRET', 'b'.repeat(32));
    expect(verifyJourneyQuoteToken(token)).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
  });

  it('never includes the secret in a returned error object', async () => {
    vi.unstubAllEnvs();
    const result = verifyJourneyQuoteToken('anything');
    expect(JSON.stringify(result)).not.toContain(VALID_SECRET);
  });

  it('never includes the raw token in a returned error object', async () => {
    const token = await issueToken();
    const tampered = `${token}x`;
    const result = verifyJourneyQuoteToken(tampered);
    expect(JSON.stringify(result)).not.toContain(tampered);
  });
});
