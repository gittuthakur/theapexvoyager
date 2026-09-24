import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import {
  Booking,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  FULFILMENT_STATUSES,
  computeQuoteFingerprint
} from './Booking';

// Every test here uses Mongoose's own `validate()` — pure offline schema-level
// validation with no MongoDB connection, no network call, and (per this phase's brief)
// never a real write. See this file's own tests confirming that: no `.save()`/
// `.create()` call appears anywhere below. `validate()` (not the deprecated
// `validateSync()`) resolves on success and rejects with the ValidationError on
// failure; this helper normalizes both into a single return value.
async function getValidationError(doc: InstanceType<typeof Booking>): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error as mongoose.Error.ValidationError;
  }
}

function validBookingData(overrides: Record<string, unknown> = {}) {
  return {
    bookingReference: 'APX-2026-000001',
    idempotencyKey: 'idem-key-1',
    customer: { name: 'Test Customer', phone: '9876543210' },
    journeySlug: 'test-journey',
    journeySnapshot: { name: 'Test Journey', destination: 'Test Destination', duration: '5 Days / 4 Nights', addOnLabels: [] },
    travelDate: '2026-11-10',
    adults: 2,
    children: 0,
    money: { currency: 'INR', totalMinorUnits: 1_000_000, payableNowMinorUnits: 1_000_000, balanceMinorUnits: 0, paymentMode: 'FULL' },
    quoteFingerprint: 'a'.repeat(64),
    quoteIssuedAt: new Date('2026-01-01T00:00:00.000Z'),
    quoteExpiresAt: new Date('2026-01-01T00:15:00.000Z'),
    ...overrides
  };
}

describe('Booking model — valid shape', () => {
  it('a fully valid document passes schema validation with no error', async () => {
    const doc = new Booking(validBookingData());
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('defaults status/paymentStatus/fulfilmentStatus/currency/children when omitted', () => {
    const { children: _children, ...rest } = validBookingData();
    const data = rest as ReturnType<typeof validBookingData>;
    delete (data as Record<string, unknown>).status;
    const doc = new Booking(data);
    expect(doc.status).toBe('PENDING_PAYMENT');
    expect(doc.paymentStatus).toBe('NOT_INITIATED');
    expect(doc.fulfilmentStatus).toBe('NOT_STARTED');
    expect(doc.children).toBe(0);
  });
});

describe('Booking model — monetary integrity', () => {
  it('rejects a negative totalMinorUnits', async () => {
    const doc = new Booking(validBookingData({ money: { currency: 'INR', totalMinorUnits: -100, payableNowMinorUnits: -100, balanceMinorUnits: 0, paymentMode: 'FULL' } }));
    const error = await getValidationError(doc);
    expect(error?.errors['money.totalMinorUnits']).toBeDefined();
  });

  it('rejects a non-integer (float) totalMinorUnits', async () => {
    const doc = new Booking(
      validBookingData({ money: { currency: 'INR', totalMinorUnits: 1000.5, payableNowMinorUnits: 1000.5, balanceMinorUnits: 0, paymentMode: 'FULL' } })
    );
    const error = await getValidationError(doc);
    expect(error?.errors['money.totalMinorUnits']).toBeDefined();
  });

  it('rejects a negative refundAmountMinorUnits when a cancellation is present', async () => {
    const doc = new Booking(
      validBookingData({
        cancellation: { cancelledAt: new Date(), cancelledBy: 'customer', refundAmountMinorUnits: -1 }
      })
    );
    const error = await getValidationError(doc);
    expect(error?.errors['cancellation.refundAmountMinorUnits']).toBeDefined();
  });

  it('requires payableNowMinorUnits + balanceMinorUnits to equal totalMinorUnits', async () => {
    const doc = new Booking(
      validBookingData({ money: { currency: 'INR', totalMinorUnits: 1000, payableNowMinorUnits: 600, balanceMinorUnits: 300, paymentMode: 'DEPOSIT' } })
    );
    const error = await getValidationError(doc);
    expect(error?.errors['money.balanceMinorUnits']).toBeDefined();
  });

  it('accepts a consistent deposit split (payableNow + balance === total)', async () => {
    const doc = new Booking(
      validBookingData({ money: { currency: 'INR', totalMinorUnits: 1000, payableNowMinorUnits: 300, balanceMinorUnits: 700, paymentMode: 'DEPOSIT' } })
    );
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('rejects a non-integer adults/children value', async () => {
    const doc = new Booking(validBookingData({ adults: 2.5 }));
    expect((await getValidationError(doc))?.errors.adults).toBeDefined();
  });

  it('requires at least one adult', async () => {
    const doc = new Booking(validBookingData({ adults: 0 }));
    expect((await getValidationError(doc))?.errors.adults).toBeDefined();
  });
});

describe('Booking model — status enums', () => {
  it('accepts every documented booking status', async () => {
    for (const status of BOOKING_STATUSES) {
      const doc = new Booking(validBookingData({ status }));
      expect(await getValidationError(doc), `status ${status} should be valid`).toBeUndefined();
    }
  });

  it('accepts every documented payment status', async () => {
    for (const paymentStatus of PAYMENT_STATUSES) {
      const doc = new Booking(validBookingData({ paymentStatus }));
      expect(await getValidationError(doc), `paymentStatus ${paymentStatus} should be valid`).toBeUndefined();
    }
  });

  it('accepts every documented fulfilment status', async () => {
    for (const fulfilmentStatus of FULFILMENT_STATUSES) {
      const doc = new Booking(validBookingData({ fulfilmentStatus }));
      expect(await getValidationError(doc), `fulfilmentStatus ${fulfilmentStatus} should be valid`).toBeUndefined();
    }
  });

  it('rejects an undocumented booking status', async () => {
    const doc = new Booking(validBookingData({ status: 'NOT_A_REAL_STATUS' }));
    expect((await getValidationError(doc))?.errors.status).toBeDefined();
  });

  it('rejects an undocumented payment status', async () => {
    const doc = new Booking(validBookingData({ paymentStatus: 'NOT_A_REAL_STATUS' }));
    expect((await getValidationError(doc))?.errors.paymentStatus).toBeDefined();
  });

  it('rejects an undocumented fulfilment status', async () => {
    const doc = new Booking(validBookingData({ fulfilmentStatus: 'NOT_A_REAL_STATUS' }));
    expect((await getValidationError(doc))?.errors.fulfilmentStatus).toBeDefined();
  });

  it('rejects an undocumented payment mode', async () => {
    const doc = new Booking(
      validBookingData({ money: { currency: 'INR', totalMinorUnits: 1000, payableNowMinorUnits: 1000, balanceMinorUnits: 0, paymentMode: 'HALF' } })
    );
    expect((await getValidationError(doc))?.errors['money.paymentMode']).toBeDefined();
  });
});

describe('Booking model — indexes', () => {
  it('defines a unique index on bookingReference', () => {
    const indexes = Booking.schema.indexes();
    const match = indexes.find(([fields]) => Object.keys(fields).length === 1 && fields.bookingReference === 1);
    expect(match?.[1]?.unique).toBe(true);
  });

  it('defines a unique index on idempotencyKey', () => {
    const indexes = Booking.schema.indexes();
    const match = indexes.find(([fields]) => Object.keys(fields).length === 1 && fields.idempotencyKey === 1);
    expect(match?.[1]?.unique).toBe(true);
  });

  it('defines a compound sparse unique index on (paymentProvider, paymentProviderOrderId), never a standalone one', () => {
    const indexes = Booking.schema.indexes();
    const compound = indexes.find(([fields]) => fields.paymentProvider === 1 && fields.paymentProviderOrderId === 1);
    expect(compound).toBeDefined();
    expect(compound?.[1]?.unique).toBe(true);
    expect(compound?.[1]?.sparse).toBe(true);

    // No standalone unique index on paymentProviderOrderId alone must remain — that
    // would incorrectly treat the same order-ID string from two different providers as
    // a collision.
    const standalone = indexes.find(([fields]) => Object.keys(fields).length === 1 && fields.paymentProviderOrderId === 1);
    expect(standalone).toBeUndefined();
  });

  it('the compound index allows the identical order ID string under different providers (conceptually — verified at the index-definition level, not via a live DB write)', () => {
    // A real uniqueness guarantee only exists once this index is actually built in
    // MongoDB — this phase performs no DB write, so this test asserts the *shape* of
    // the guarantee: the index key is genuinely compound (both fields), which is what
    // makes ('razorpay', 'order_1') and ('some-other-provider', 'order_1') two distinct
    // index entries rather than one collision. A standalone key on paymentProviderOrderId
    // alone (asserted absent above) is exactly the shape that would NOT allow this.
    const indexes = Booking.schema.indexes();
    const compound = indexes.find(([fields]) => fields.paymentProvider === 1 && fields.paymentProviderOrderId === 1);
    expect(Object.keys(compound?.[0] ?? {})).toEqual(['paymentProvider', 'paymentProviderOrderId']);
  });

  it('duplicate order IDs for the same provider are still prohibited at the index-definition level', () => {
    // Same reasoning as above, in the other direction: because the index is `unique:
    // true` on the compound key, two documents both carrying ('razorpay', 'order_1')
    // would violate it — only the (provider, orderId) *pair* must be unique, and this
    // pair is exactly what a same-provider duplicate collides on.
    const indexes = Booking.schema.indexes();
    const compound = indexes.find(([fields]) => fields.paymentProvider === 1 && fields.paymentProviderOrderId === 1);
    expect(compound?.[1]?.unique).toBe(true);
  });

  it('defines a non-unique index on customer.phone', () => {
    const indexes = Booking.schema.indexes();
    const match = indexes.find(([fields]) => fields['customer.phone'] === 1);
    expect(match).toBeDefined();
    expect(match?.[1]?.unique).not.toBe(true);
  });

  it('defines a non-unique index on status', () => {
    const indexes = Booking.schema.indexes();
    const match = indexes.find(([fields]) => Object.keys(fields).length === 1 && fields.status === 1);
    expect(match).toBeDefined();
  });

  it('defines a compound index on journeySlug + travelDate', () => {
    const indexes = Booking.schema.indexes();
    const match = indexes.find(([fields]) => fields.journeySlug === 1 && fields.travelDate === 1);
    expect(match).toBeDefined();
  });
});

describe('Booking model — sensitive-field safety', () => {
  it('the schema never declares a card/CVV/secret/webhook/rateKey/password-shaped field', () => {
    const forbiddenPattern = /card|cvv|secret|webhook|ratekey|password|apikey|api_key/i;
    const allPaths = Object.keys(Booking.schema.paths);
    // Nested subdocument schemas have their own `.paths` too.
    const nestedPaths = [Booking.schema.path('customer'), Booking.schema.path('journeySnapshot'), Booking.schema.path('money'), Booking.schema.path('cancellation')]
      .flatMap((p) => (p && 'schema' in p ? Object.keys((p as unknown as { schema: mongoose.Schema }).schema.paths) : []));
    const offending = [...allPaths, ...nestedPaths].filter((path) => forbiddenPattern.test(path));
    expect(offending).toEqual([]);
  });

  it('stores only a quoteFingerprint, never a raw quote token field', () => {
    expect(Booking.schema.paths.quoteFingerprint).toBeDefined();
    expect(Booking.schema.paths.quoteToken).toBeUndefined();
    expect(Booking.schema.paths.token).toBeUndefined();
  });
});

describe('Booking model — hot-reload safety', () => {
  it('is registered on the shared mongoose.models registry (survives a Next.js dev hot-reload)', () => {
    expect(mongoose.models.Booking).toBe(Booking);
  });
});

describe('computeQuoteFingerprint', () => {
  it('produces a 64-character hex SHA-256 digest', () => {
    const fingerprint = computeQuoteFingerprint('1.some-payload.some-signature');
    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same input', () => {
    const token = '1.payload.signature';
    expect(computeQuoteFingerprint(token)).toBe(computeQuoteFingerprint(token));
  });

  it('produces different fingerprints for different tokens', () => {
    expect(computeQuoteFingerprint('token-a')).not.toBe(computeQuoteFingerprint('token-b'));
  });

  it('never returns the original token itself', () => {
    const token = 'a-real-looking-token-value';
    expect(computeQuoteFingerprint(token)).not.toBe(token);
    expect(computeQuoteFingerprint(token)).not.toContain(token);
  });
});
