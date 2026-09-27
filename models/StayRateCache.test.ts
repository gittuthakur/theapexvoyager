import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { StayRateCache } from './StayRateCache';

async function getValidationError(doc: InstanceType<typeof StayRateCache>): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error as mongoose.Error.ValidationError;
  }
}

function validCacheData(overrides: Record<string, unknown> = {}) {
  return {
    provider: 'hbx',
    hotelIdsKey: '142378',
    providerHotelIds: ['142378'],
    destinationSlug: 'manali',
    checkIn: '2026-10-10',
    checkOut: '2026-10-12',
    adults: 2,
    children: 0,
    rooms: 1,
    state: 'VERIFIED_LIVE_RATE',
    rates: [
      {
        provider: 'hbx',
        providerHotelId: '142378',
        currency: 'EUR',
        totalStayPrice: 188.54,
        nightCount: 2,
        displayPerNight: 94.27,
        cancellationPolicies: [],
        lastCheckedAt: new Date().toISOString(),
        environment: 'test'
      }
    ],
    ...overrides
  };
}

describe('StayRateCache model — valid shapes', () => {
  it('a fully valid document passes schema validation', async () => {
    const doc = new StayRateCache(validCacheData());
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('accepts an empty rates array (UNAVAILABLE/PRICE_ON_REQUEST states never invent a rate)', async () => {
    const doc = new StayRateCache(validCacheData({ state: 'UNAVAILABLE', rates: [] }));
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('accepts every documented state', async () => {
    for (const state of ['VERIFIED_LIVE_RATE', 'VERIFIED_MANUAL_RATE', 'PRICE_ON_REQUEST', 'UNAVAILABLE', 'PROVIDER_ERROR']) {
      const doc = new StayRateCache(validCacheData({ state, rates: [] }));
      expect(await getValidationError(doc), `state ${state} should be valid`).toBeUndefined();
    }
  });

  it('rejects an undocumented state', async () => {
    const doc = new StayRateCache(validCacheData({ state: 'MADE_UP_STATE' }));
    expect((await getValidationError(doc))?.errors.state).toBeDefined();
  });

  it('preserves every cancellation-policy tier on an embedded rate, never truncated', async () => {
    const doc = new StayRateCache(
      validCacheData({
        rates: [
          {
            ...validCacheData().rates[0],
            cancellationPolicies: [
              { chargeAmount: '0', chargeFrom: '2026-10-01T00:00:00+05:30' },
              { chargeAmount: '94.27', chargeFrom: '2026-10-05T00:00:00+05:30' },
              { chargeAmount: '188.54', chargeFrom: '2026-10-08T00:00:00+05:30' }
            ]
          }
        ]
      })
    );
    expect(await getValidationError(doc)).toBeUndefined();
    expect(doc.rates[0].cancellationPolicies).toHaveLength(3);
  });
});

describe('StayRateCache model — required fields', () => {
  for (const field of ['provider', 'hotelIdsKey', 'providerHotelIds', 'destinationSlug', 'checkIn', 'checkOut', 'adults', 'children', 'rooms', 'state']) {
    it(`requires ${field}`, async () => {
      const data = validCacheData();
      delete (data as Record<string, unknown>)[field];
      const doc = new StayRateCache(data);
      expect((await getValidationError(doc))?.errors[field]).toBeDefined();
    });
  }
});

describe('StayRateCache model — indexes', () => {
  it('defines a unique index on the exact search-context identity', () => {
    const indexes = StayRateCache.schema.indexes();
    const match = indexes.find(
      ([fields, options]) =>
        fields.provider === 1 &&
        fields.hotelIdsKey === 1 &&
        fields.checkIn === 1 &&
        fields.checkOut === 1 &&
        fields.adults === 1 &&
        fields.children === 1 &&
        fields.rooms === 1 &&
        options?.unique === true
    );
    expect(match).toBeDefined();
  });

  it('defines a TTL index on updatedAt', () => {
    const indexes = StayRateCache.schema.indexes();
    const match = indexes.find(([fields, options]) => fields.updatedAt === 1 && typeof options?.expireAfterSeconds === 'number');
    expect(match).toBeDefined();
  });
});

describe('StayRateCache model — no credentials stored', () => {
  it('the schema never declares an apiKey/secret/credential-shaped field', () => {
    const forbiddenPattern = /apikey|secret|credential|password/i;
    const offending = Object.keys(StayRateCache.schema.paths).filter((path) => forbiddenPattern.test(path));
    expect(offending).toEqual([]);
  });
});

describe('StayRateCache model — hot-reload safety', () => {
  it('is registered on the shared mongoose.models registry (survives a Next.js dev hot-reload)', () => {
    expect(mongoose.models.StayRateCache).toBe(StayRateCache);
  });
});
