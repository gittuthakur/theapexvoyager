import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { HbxBooking, generateVoucherAccessToken } from './HbxBooking';

async function getValidationError(doc: InstanceType<typeof HbxBooking>): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error as mongoose.Error.ValidationError;
  }
}

function validBookingData(overrides: Record<string, unknown> = {}) {
  return {
    reference: 'HBX-TEST-REF-1',
    clientReference: 'apex-voyager-1',
    status: 'CONFIRMED',
    environment: 'test',
    providerHotelId: '617065',
    voucherAccessToken: generateVoucherAccessToken(),
    currency: 'EUR',
    checkIn: '2026-10-05',
    checkOut: '2026-10-07',
    holderName: 'Test',
    holderSurname: 'Tester',
    rooms: [
      {
        code: 'DBL.SU',
        name: 'double superior',
        rateKey: 'some-rate-key',
        boardCode: 'BB',
        boardName: 'BED AND BREAKFAST',
        netAmount: '215.60',
        paxes: [{ roomId: 1, type: 'AD' }, { roomId: 1, type: 'AD' }],
        cancellationPolicies: [{ chargeAmount: '215.60', chargeFrom: '2026-09-27T23:59:00+05:30' }]
      }
    ],
    totalNetAmount: '215.60',
    ...overrides
  };
}

describe('HbxBooking model — valid shapes', () => {
  it('a fully valid document passes schema validation', async () => {
    const doc = new HbxBooking(validBookingData());
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('accepts every documented environment', async () => {
    for (const environment of ['test', 'unknown', 'production']) {
      const doc = new HbxBooking(validBookingData({ environment }));
      expect(await getValidationError(doc), `environment ${environment} should be valid`).toBeUndefined();
    }
  });

  it('rejects an undocumented environment', async () => {
    const doc = new HbxBooking(validBookingData({ environment: 'staging' }));
    expect((await getValidationError(doc))?.errors.environment).toBeDefined();
  });

  it('preserves a child pax with an age', async () => {
    const doc = new HbxBooking(
      validBookingData({
        rooms: [{ ...validBookingData().rooms[0], paxes: [{ roomId: 1, type: 'AD' }, { roomId: 1, type: 'CH', age: 8 }] }]
      })
    );
    expect(await getValidationError(doc)).toBeUndefined();
    expect(doc.rooms[0].paxes[1]).toMatchObject({ type: 'CH', age: 8 });
  });

  it('preserves multiple rooms with independent occupancy', async () => {
    const doc = new HbxBooking(
      validBookingData({
        rooms: [
          { ...validBookingData().rooms[0], paxes: [{ roomId: 1, type: 'AD' }, { roomId: 1, type: 'AD' }] },
          { ...validBookingData().rooms[0], paxes: [{ roomId: 2, type: 'AD' }, { roomId: 2, type: 'CH', age: 5 }] }
        ]
      })
    );
    expect(await getValidationError(doc)).toBeUndefined();
    expect(doc.rooms).toHaveLength(2);
  });

  it('preserves rateCommentsId and rateComments independently, never invented', () => {
    const doc = new HbxBooking(validBookingData({ rooms: [{ ...validBookingData().rooms[0], rateCommentsId: 'RC-1' }] }));
    expect(doc.rooms[0].rateCommentsId).toBe('RC-1');
    expect(doc.rooms[0].rateComments).toBeUndefined();
  });
});

describe('HbxBooking model — required fields', () => {
  for (const field of ['reference', 'clientReference', 'status', 'environment', 'providerHotelId', 'voucherAccessToken', 'currency', 'holderName', 'holderSurname']) {
    it(`requires ${field}`, async () => {
      const data = validBookingData();
      delete (data as Record<string, unknown>)[field];
      const doc = new HbxBooking(data);
      expect((await getValidationError(doc))?.errors[field]).toBeDefined();
    });
  }
});

describe('HbxBooking model — no credentials stored', () => {
  it('the schema never declares an apiKey/secret/credential-shaped field', () => {
    const forbiddenPattern = /apikey|secret|credential|password|signature/i;
    const offending = Object.keys(HbxBooking.schema.paths).filter((path) => forbiddenPattern.test(path));
    expect(offending).toEqual([]);
  });

  it('never declares an HBX-account-level field (separate from models/HotelProviderMapping.ts)', () => {
    const forbiddenPattern = /googleplaceid|nameSimilarity|distanceMeters/i;
    const offending = Object.keys(HbxBooking.schema.paths).filter((path) => forbiddenPattern.test(path));
    expect(offending).toEqual([]);
  });
});

describe('HbxBooking model — indexes', () => {
  it('defines a unique index on reference', () => {
    const indexes = HbxBooking.schema.indexes();
    const match = indexes.find(([fields, options]) => fields.reference === 1 && options?.unique === true);
    expect(match).toBeDefined();
  });
});

describe('generateVoucherAccessToken — voucher access security', () => {
  it('generates a long, high-entropy, unguessable string — never a short/predictable value', () => {
    const token = generateVoucherAccessToken();
    expect(token.length).toBeGreaterThanOrEqual(40); // 24 random bytes hex-encoded = 48 chars
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('never generates the same token twice in practice (cryptographically random, not sequential)', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateVoucherAccessToken()));
    expect(tokens.size).toBe(100);
  });

  it('is never derivable from the Hotelbeds reference itself (a real, enumerable identifier)', () => {
    const token = generateVoucherAccessToken();
    expect(token).not.toContain('270-2962712');
    expect(token.toLowerCase()).not.toMatch(/^270|2962712/);
  });
});

describe('HbxBooking model — indexes (voucher security)', () => {
  it('defines a unique index on voucherAccessToken (never reused across bookings)', () => {
    const indexes = HbxBooking.schema.indexes();
    const match = indexes.find(([fields, options]) => fields.voucherAccessToken === 1 && options?.unique === true);
    expect(match).toBeDefined();
  });
});

describe('HbxBooking model — hot-reload safety', () => {
  it('is registered on the shared mongoose.models registry (survives a Next.js dev hot-reload)', () => {
    expect(mongoose.models.HbxBooking).toBe(HbxBooking);
  });
});
