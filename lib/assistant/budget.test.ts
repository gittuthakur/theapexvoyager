import { beforeEach, describe, expect, it, vi } from 'vitest';

const findOneAndUpdate = vi.fn();
const updateOne = vi.fn();
const connectDB = vi.fn();
const init = vi.fn();
const indexes = vi.fn();

vi.mock('@/lib/mongodb', () => ({ connectDB: () => connectDB() }));
vi.mock('@/models/AiAssistantUsage', () => ({
  AiAssistantUsage: {
    findOneAndUpdate: (...a: unknown[]) => findOneAndUpdate(...a),
    updateOne: (...a: unknown[]) => updateOne(...a),
    init: () => init(),
    collection: { indexes: () => indexes() }
  }
}));

import { recordTokens, reserveRequest, resetIndexCheckForTests, utcDay } from '@/lib/assistant/budget';

const GOOD_INDEXES = [{ key: { _id: 1 } }, { key: { day: 1 }, unique: true }, { key: { expireAt: 1 }, expireAfterSeconds: 0 }];

const NOW = new Date('2027-03-05T10:00:00.000Z');
const duplicateKey = () => Object.assign(new Error('E11000 duplicate key'), { code: 11000 });

beforeEach(() => {
  findOneAndUpdate.mockReset();
  updateOne.mockReset();
  connectDB.mockReset().mockResolvedValue(undefined);
  init.mockReset().mockResolvedValue(undefined);
  indexes.mockReset().mockResolvedValue(GOOD_INDEXES);
  resetIndexCheckForTests();
});

describe('reserveRequest', () => {
  it('fails closed without a configured limit, and never touches the database', async () => {
    for (const requestLimit of [undefined, 0, -1, Number.NaN]) {
      expect(await reserveRequest({ requestLimit }, NOW)).toEqual({ ok: false, reason: 'unconfigured' });
    }
    expect(connectDB).not.toHaveBeenCalled();
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('reserves with one conditional, atomic upsert keyed on the UTC day', async () => {
    findOneAndUpdate.mockResolvedValue({ requests: 1 });
    expect(await reserveRequest({ requestLimit: 10 }, NOW)).toEqual({ ok: true, day: '2027-03-05' });
    const [filter, update, options] = findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ day: '2027-03-05', requests: { $lt: 10 } });
    expect(update.$inc).toEqual({ requests: 1 });
    expect(options).toMatchObject({ upsert: true, new: true });
  });

  it('adds the token ceiling to the filter only when one is configured', async () => {
    findOneAndUpdate.mockResolvedValue({});
    await reserveRequest({ requestLimit: 10, tokenLimit: 5000 }, NOW);
    expect(findOneAndUpdate.mock.calls[0][0]).toEqual({ day: '2027-03-05', requests: { $lt: 10 }, tokens: { $lt: 5000 } });
  });

  it('reports exhaustion when the unique index rejects the second insert (limit reached)', async () => {
    findOneAndUpdate.mockRejectedValue(duplicateKey());
    expect(await reserveRequest({ requestLimit: 3 }, NOW)).toEqual({ ok: false, reason: 'exhausted' });
    expect(findOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('retries once when two first-of-the-day inserts race', async () => {
    findOneAndUpdate.mockRejectedValueOnce(duplicateKey()).mockResolvedValueOnce({ requests: 2 });
    expect(await reserveRequest({ requestLimit: 3 }, NOW)).toEqual({ ok: true, day: '2027-03-05' });
  });

  it('fails closed on any other database problem', async () => {
    findOneAndUpdate.mockRejectedValue(new Error('network down'));
    expect(await reserveRequest({ requestLimit: 3 }, NOW)).toEqual({ ok: false, reason: 'unavailable' });
    connectDB.mockRejectedValue(new Error('no connection'));
    expect(await reserveRequest({ requestLimit: 3 }, NOW)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('fails closed if the database returns nothing', async () => {
    findOneAndUpdate.mockResolvedValue(null);
    expect(await reserveRequest({ requestLimit: 3 }, NOW)).toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('reserveRequest: the unique index on day is verified before any counting', () => {
  it('waits for the model index build and checks the live index list once, then remembers success', async () => {
    findOneAndUpdate.mockResolvedValue({});
    await reserveRequest({ requestLimit: 10 }, NOW);
    await reserveRequest({ requestLimit: 10 }, NOW);
    expect(init).toHaveBeenCalledTimes(1);
    expect(indexes).toHaveBeenCalledTimes(1);
    expect(findOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['no day index at all', [{ key: { _id: 1 } }, { key: { expireAt: 1 }, expireAfterSeconds: 0 }]],
    ['a non-unique day index', [{ key: { _id: 1 } }, { key: { day: 1 } }]],
    ['a unique index on another key', [{ key: { _id: 1 } }, { key: { requests: 1 }, unique: true }]],
    ['a compound index that merely starts with day', [{ key: { day: 1, requests: 1 }, unique: true }]]
  ])('refuses to count (fail closed) and never upserts when there is %s', async (_name, list) => {
    indexes.mockResolvedValue(list);
    expect(await reserveRequest({ requestLimit: 10 }, NOW)).toEqual({ ok: false, reason: 'unavailable' });
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses when the index build itself fails, or the collection cannot be inspected', async () => {
    init.mockRejectedValue(new Error('not authorized to create index'));
    expect(await reserveRequest({ requestLimit: 10 }, NOW)).toEqual({ ok: false, reason: 'unavailable' });
    init.mockResolvedValue(undefined);
    indexes.mockRejectedValue(Object.assign(new Error('ns does not exist'), { code: 26 }));
    expect(await reserveRequest({ requestLimit: 10 }, NOW)).toEqual({ ok: false, reason: 'unavailable' });
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not remember a failure: the next request checks again and can succeed', async () => {
    indexes.mockResolvedValueOnce([{ key: { _id: 1 } }]).mockResolvedValue(GOOD_INDEXES);
    findOneAndUpdate.mockResolvedValue({});
    expect(await reserveRequest({ requestLimit: 10 }, NOW)).toEqual({ ok: false, reason: 'unavailable' });
    expect(await reserveRequest({ requestLimit: 10 }, NOW)).toEqual({ ok: true, day: '2027-03-05' });
    expect(indexes).toHaveBeenCalledTimes(2);
  });

  it('does not verify anything when no limit is configured', async () => {
    await reserveRequest({ requestLimit: undefined }, NOW);
    expect(init).not.toHaveBeenCalled();
  });
});

describe('recordTokens', () => {
  it('adds usage to the day counter, bounded', async () => {
    updateOne.mockResolvedValue({});
    await recordTokens(321.4, NOW);
    expect(updateOne).toHaveBeenCalledWith({ day: '2027-03-05' }, { $inc: { tokens: 321 } });
    await recordTokens(5_000_000, NOW);
    expect(updateOne.mock.calls[1][1]).toEqual({ $inc: { tokens: 1_000_000 } });
  });

  it('ignores nonsense and never throws', async () => {
    await recordTokens(0, NOW);
    await recordTokens(Number.NaN, NOW);
    expect(updateOne).not.toHaveBeenCalled();
    updateOne.mockRejectedValue(new Error('boom'));
    await expect(recordTokens(10, NOW)).resolves.toBeUndefined();
  });

  it('utcDay is the UTC calendar day', () => {
    expect(utcDay(new Date('2027-03-05T23:59:59.000Z'))).toBe('2027-03-05');
    expect(utcDay(new Date('2027-03-06T00:00:00.000Z'))).toBe('2027-03-06');
  });
});
