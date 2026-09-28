import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { ExcludedPlace } from './ExcludedPlace';

async function getValidationError(doc: InstanceType<typeof ExcludedPlace>): Promise<mongoose.Error.ValidationError | undefined> {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error as mongoose.Error.ValidationError;
  }
}

function validExclusionData(overrides: Record<string, unknown> = {}) {
  return {
    provider: 'google',
    providerPlaceId: 'ChIJ-example-place-id',
    propertyName: 'Example Homestay',
    reason: 'Owner requested removal',
    requestedBy: 'front desk call',
    requestDate: new Date(),
    notes: 'Confirmed via phone',
    isActive: true,
    ...overrides
  };
}

describe('ExcludedPlace model — valid shapes', () => {
  it('a fully valid document passes schema validation', async () => {
    const doc = new ExcludedPlace(validExclusionData());
    expect(await getValidationError(doc)).toBeUndefined();
  });

  it('defaults isActive to true when omitted', () => {
    const doc = new ExcludedPlace({ provider: 'google', providerPlaceId: 'ChIJ-x' });
    expect(doc.isActive).toBe(true);
  });

  it('rejects an undocumented provider', async () => {
    const doc = new ExcludedPlace(validExclusionData({ provider: 'booking' }));
    expect((await getValidationError(doc))?.errors.provider).toBeDefined();
  });

  it('does not require propertyName/reason/requestedBy/notes — minimal input is valid', async () => {
    const doc = new ExcludedPlace({ provider: 'google', providerPlaceId: 'ChIJ-minimal' });
    expect(await getValidationError(doc)).toBeUndefined();
  });
});

describe('ExcludedPlace model — required fields', () => {
  for (const field of ['provider', 'providerPlaceId']) {
    it(`requires ${field}`, async () => {
      const data = validExclusionData();
      delete (data as Record<string, unknown>)[field];
      const doc = new ExcludedPlace(data);
      expect((await getValidationError(doc))?.errors[field]).toBeDefined();
    });
  }
});

describe('ExcludedPlace model — no unnecessary personal information', () => {
  it('never declares a structured contact-detail field (email/phone/address)', () => {
    const forbiddenPattern = /email|phone|address|contact/i;
    const offending = Object.keys(ExcludedPlace.schema.paths).filter((path) => forbiddenPattern.test(path));
    expect(offending).toEqual([]);
  });
});

describe('ExcludedPlace model — indexes', () => {
  it('defines a unique index on (provider, providerPlaceId) scoped to active exclusions only', () => {
    const indexes = ExcludedPlace.schema.indexes();
    const match = indexes.find(
      ([fields, options]) =>
        fields.provider === 1 &&
        fields.providerPlaceId === 1 &&
        options?.unique === true &&
        options?.partialFilterExpression?.isActive === true
    );
    expect(match).toBeDefined();
  });
});

describe('ExcludedPlace model — hot-reload safety', () => {
  it('is registered on the shared mongoose.models registry (survives a Next.js dev hot-reload)', () => {
    expect(mongoose.models.ExcludedPlace).toBe(ExcludedPlace);
  });
});
