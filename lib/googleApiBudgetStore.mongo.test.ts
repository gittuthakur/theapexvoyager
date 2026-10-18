import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { BUDGET_BUCKETS, createGoogleApiBudget, type BudgetBucket, type BudgetLimitsConfig, type StoreReserveRequest } from './googleApiBudget';
import { BudgetStoreError, DEFAULT_STORE_MAX_TIME_MS, createMongoBudgetStore, type BudgetModelLike } from './googleApiBudgetStore.mongo';
import {
  BUDGET_MONTH_PATTERN,
  GOOGLE_API_BUDGET_RETENTION_DAYS,
  GoogleApiBudget,
  GoogleApiBudgetSchema,
  budgetDocumentId,
  budgetExpiresAt
} from '../models/GoogleApiBudget';

// NOTHING in this file connects to MongoDB. The Mongoose model is only inspected (schema, validation) and the store is exercised against
// an in-memory stand-in that reproduces the few MongoDB behaviours the store relies on: atomic single-document conditional updates,
// upsert-with-$setOnInsert and duplicate-key races.

const SECRET = 'SECRET_MARKER_must_never_appear_anywhere_7c2d';
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Doc {
  _id: string;
  bucket?: string;
  month?: string;
  total?: number;
  days?: Record<string, number>;
  expiresAt?: Date;
}

type Op = 'updateOne' | 'findOneAndUpdate' | 'findOne';

/** A stand-in for the Mongoose model. The conditional update is evaluated and applied in ONE synchronous step, as MongoDB does per document. */
class EmulatedBudgetModel implements BudgetModelLike {
  readonly docs = new Map<string, Doc>();
  readonly log: { op: Op; filter: Record<string, unknown>; update?: Record<string, unknown>; options?: Record<string, unknown>; projection?: Record<string, unknown> }[] = [];
  latencyMs = 0;
  duplicateKeysThrown = 0;
  private readonly faults: { op: Op; error: unknown }[] = [];

  failNext(op: Op, error: unknown): void {
    this.faults.push({ op, error });
  }

  private maybeFail(op: Op): void {
    const index = this.faults.findIndex((fault) => fault.op === op);
    if (index >= 0) throw this.faults.splice(index, 1)[0].error;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) await sleep(Math.random() * this.latencyMs);
  }

  async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown>): Promise<unknown> {
    this.log.push({ op: 'updateOne', filter: structuredClone(filter), update: structuredClone(update), options: structuredClone(options) });
    this.maybeFail('updateOne');
    const id = filter._id as string;
    const existedAtCall = this.docs.has(id);
    await this.delay();
    // ATOMIC SECTION
    if (!existedAtCall && this.docs.has(id) && options.upsert) {
      this.duplicateKeysThrown += 1;
      throw Object.assign(new Error(`E11000 duplicate key error collection: ${SECRET}`), { code: 11000 });
    }
    if (!this.docs.has(id)) {
      if (!options.upsert) return { matchedCount: 0 };
      const onInsert = structuredClone((update.$setOnInsert ?? {}) as Record<string, unknown>);
      this.docs.set(id, { _id: id, days: {}, ...onInsert } as Doc);
    }
    return { matchedCount: 1 };
  }

  findOneAndUpdate(filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown>) {
    this.log.push({ op: 'findOneAndUpdate', filter: structuredClone(filter), update: structuredClone(update), options: structuredClone(options) });
    return {
      lean: async () => {
        this.maybeFail('findOneAndUpdate');
        await this.delay();
        // ATOMIC SECTION: evaluate the condition and apply the increments with no await in between.
        const doc = this.docs.get(filter._id as string);
        if (!doc) return null;
        if (!this.evaluate(filter.$expr, doc)) return null;
        for (const [pathKey, amount] of Object.entries((update.$inc ?? {}) as Record<string, number>)) this.increment(doc, pathKey, amount);
        return this.project(doc, options.projection as Record<string, unknown>);
      }
    };
  }

  findOne(filter: Record<string, unknown>, projection: Record<string, unknown>) {
    this.log.push({ op: 'findOne', filter: structuredClone(filter), projection: structuredClone(projection) });
    return {
      lean: async () => {
        this.maybeFail('findOne');
        await this.delay();
        const doc = this.docs.get(filter._id as string);
        return doc ? this.project(doc, projection) : null;
      }
    };
  }

  private lookup(doc: Doc, dotted: string): unknown {
    let value: unknown = doc;
    for (const part of dotted.split('.')) value = value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined;
    return value;
  }

  private increment(doc: Doc, dotted: string, amount: number): void {
    const parts = dotted.split('.');
    let target = doc as unknown as Record<string, unknown>;
    for (const part of parts.slice(0, -1)) {
      if (typeof target[part] !== 'object' || target[part] === null) target[part] = {};
      target = target[part] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    target[last] = ((target[last] as number | undefined) ?? 0) + amount;
  }

  private project(doc: Doc, projection: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = { _id: doc._id };
    for (const key of Object.keys(projection)) {
      const value = this.lookup(doc, key);
      if (value === undefined) continue;
      const parts = key.split('.');
      let cursor = out;
      for (const part of parts.slice(0, -1)) cursor = (cursor[part] ??= {}) as Record<string, unknown>;
      cursor[parts[parts.length - 1]] = value;
    }
    return out;
  }

  /** Evaluates exactly the aggregation operators the store uses: $and, $lte, $add, $ifNull and field paths. */
  private evaluate(node: unknown, doc: Doc): unknown {
    if (typeof node === 'string' && node.startsWith('$')) return this.lookup(doc, node.slice(1));
    if (Array.isArray(node)) return node.map((child) => this.evaluate(child, doc));
    if (node && typeof node === 'object') {
      const [operator, argument] = Object.entries(node as Record<string, unknown>)[0];
      const args = this.evaluate(argument, doc) as unknown[];
      switch (operator) {
        case '$and':
          return args.every(Boolean);
        case '$lte':
          return (args[0] as number) <= (args[1] as number);
        case '$add':
          return (args[0] as number) + (args[1] as number);
        case '$ifNull':
          return args[0] ?? args[1];
        default:
          throw new Error(`emulator does not support ${operator}`);
      }
    }
    return node;
  }
}

const connectOk = vi.fn(async () => undefined);
function storeOn(model: EmulatedBudgetModel, extra: { maxTimeMs?: number; connect?: () => Promise<unknown> } = {}) {
  return createMongoBudgetStore({ model, connect: extra.connect ?? connectOk, maxTimeMs: extra.maxTimeMs });
}
const req = (overrides: Partial<StoreReserveRequest> = {}): StoreReserveRequest => ({
  bucket: 'photo-media',
  day: '2026-10-18',
  month: '2026-10',
  amount: 1,
  dailyLimit: 5,
  monthlyLimit: 8,
  ...overrides
});
const LIMITS: BudgetLimitsConfig = Object.fromEntries(BUDGET_BUCKETS.map((bucket) => [bucket, { daily: 5, monthly: 8 }]));
const at = (iso: string) => () => new Date(iso);

describe('the model (inspected only; no database)', () => {
  it('registers under the established pattern and does not connect by itself', () => {
    expect(mongoose.models.GoogleApiBudget).toBe(GoogleApiBudget);
    expect(GoogleApiBudget.modelName).toBe('GoogleApiBudget');
    expect(GoogleApiBudget.collection.name).toBe('googleapibudgets');
    expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected: importing opened nothing
    expect((globalThis as { mongooseCache?: { conn: unknown } }).mongooseCache?.conn ?? null).toBeNull();
  });

  it('has exactly the documented fields, and nothing that could hold a credential, Place ID or photo name', () => {
    expect(Object.keys(GoogleApiBudgetSchema.paths).sort()).toEqual(['__v', '_id', 'bucket', 'createdAt', 'days', 'expiresAt', 'month', 'total', 'updatedAt']);
    expect(GoogleApiBudgetSchema.path('_id').instance).toBe('String');
    expect(GoogleApiBudgetSchema.path('total').instance).toBe('Number');
    expect(GoogleApiBudgetSchema.path('expiresAt').instance).toBe('Date');
    expect(GoogleApiBudgetSchema.path('days').instance).toBe('Mixed');
    expect(GoogleApiBudgetSchema.get('timestamps')).toBe(true);
  });

  it('allows only the four buckets and a YYYY-MM month', () => {
    expect([...(GoogleApiBudgetSchema.path('bucket') as unknown as { enumValues: string[] }).enumValues]).toEqual([...BUDGET_BUCKETS]);
    for (const good of ['2026-01', '2026-12', '1999-06']) expect(BUDGET_MONTH_PATTERN.test(good)).toBe(true);
    for (const bad of ['2026-1', '2026-13', '2026-00', '2026-10-18', 'October', '', '26-10', '2026/10']) expect(BUDGET_MONTH_PATTERN.test(bad)).toBe(false);
  });

  it('configures TTL cleanup on expiresAt (expire exactly at that time) and nothing else', () => {
    expect(GoogleApiBudgetSchema.indexes()).toEqual([[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]]);
  });

  it('validates a good document and rejects bad ones (validation only, no database)', () => {
    const valid = new GoogleApiBudget({ _id: 'photo-media|2026-10', bucket: 'photo-media', month: '2026-10', total: 3, days: { '2026-10-18': 3 }, expiresAt: budgetExpiresAt('2026-10') });
    expect(valid.validateSync()).toBeUndefined();
    expect(valid.total).toBe(3);
    const withDefaults = new GoogleApiBudget({ _id: 'text-search-cron|2026-10', bucket: 'text-search-cron', month: '2026-10', expiresAt: budgetExpiresAt('2026-10') });
    expect(withDefaults.total).toBe(0);
    expect(withDefaults.days).toEqual({});
    for (const bad of [
      { bucket: 'nope' },
      { month: '2026-13' },
      { total: -1 },
      { expiresAt: undefined },
      { _id: undefined }
    ]) {
      const doc = new GoogleApiBudget({ _id: 'photo-media|2026-10', bucket: 'photo-media', month: '2026-10', expiresAt: budgetExpiresAt('2026-10'), ...bad });
      expect(doc.validateSync(), JSON.stringify(Object.keys(bad))).toBeDefined();
    }
  });

  it('builds deterministic, bucket-plus-month ids', () => {
    expect(budgetDocumentId('photo-media', '2026-10')).toBe('photo-media|2026-10');
    expect(budgetDocumentId('text-search-cron', '2027-01')).toBe('text-search-cron|2027-01');
    expect(() => budgetDocumentId('nope' as BudgetBucket, '2026-10')).toThrow();
    expect(() => budgetDocumentId('photo-media', '2026-1')).toThrow();
  });

  it('expires a month 90 days after that UTC month ends (leap years and year ends included)', () => {
    expect(GOOGLE_API_BUDGET_RETENTION_DAYS).toBe(90);
    expect(budgetExpiresAt('2026-10').toISOString()).toBe('2027-01-30T00:00:00.000Z'); // Oct ends 2026-11-01 00:00Z, plus 90 days
    expect(budgetExpiresAt('2026-12').toISOString()).toBe('2027-04-01T00:00:00.000Z');
    expect(budgetExpiresAt('2028-02').toISOString()).toBe('2028-05-30T00:00:00.000Z'); // leap February
    expect(budgetExpiresAt('2027-02').toISOString()).toBe('2027-05-30T00:00:00.000Z');
    expect(() => budgetExpiresAt('nope')).toThrow();
  });
});

describe('the store: query shape (mocked model)', () => {
  it('ensures the document once, then does ONE conditional increment per reservation', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    expect(await store.tryReserve(req())).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    expect(model.log.map((entry) => entry.op)).toEqual(['updateOne', 'findOneAndUpdate']);
    expect(await store.tryReserve(req())).toEqual({ kind: 'reserved', dayCount: 2, monthCount: 2 });
    expect(model.log.map((entry) => entry.op)).toEqual(['updateOne', 'findOneAndUpdate', 'findOneAndUpdate']); // no second ensure
    expect(connectOk).toHaveBeenCalled();
  });

  it('ensures with an idempotent upsert that only sets fields on insert', () => {
    const model = new EmulatedBudgetModel();
    return storeOn(model)
      .tryReserve(req())
      .then(() => {
        const ensure = model.log[0];
        expect(ensure.filter).toEqual({ _id: 'photo-media|2026-10' });
        expect(ensure.update).toEqual({ $setOnInsert: { bucket: 'photo-media', month: '2026-10', total: 0, expiresAt: budgetExpiresAt('2026-10') } });
        expect(ensure.options).toEqual({ upsert: true, maxTimeMS: DEFAULT_STORE_MAX_TIME_MS });
      });
  });

  it('uses a conditional filter on BOTH limits, increments BOTH counters, and can never insert', async () => {
    const model = new EmulatedBudgetModel();
    await storeOn(model).tryReserve(req({ amount: 2, dailyLimit: 7, monthlyLimit: 9 }));
    const call = model.log[1];
    expect(call.filter).toEqual({
      _id: 'photo-media|2026-10',
      $expr: {
        $and: [
          { $lte: [{ $add: [{ $ifNull: ['$total', 0] }, 2] }, 9] },
          { $lte: [{ $add: [{ $ifNull: ['$days.2026-10-18', 0] }, 2] }, 7] }
        ]
      }
    });
    expect(call.update).toEqual({ $inc: { total: 2, 'days.2026-10-18': 2 } });
    expect(call.options).toEqual({ returnDocument: 'after', upsert: false, projection: { total: 1, 'days.2026-10-18': 1 }, maxTimeMS: DEFAULT_STORE_MAX_TIME_MS });
  });

  it('honours and clamps the server-side time limit', async () => {
    for (const [input, expected] of [[1, 20], [90000, 5000], [350, 350], [Number.NaN, DEFAULT_STORE_MAX_TIME_MS]] as const) {
      const model = new EmulatedBudgetModel();
      await storeOn(model, { maxTimeMs: input }).tryReserve(req());
      expect(model.log[1].options?.maxTimeMS).toBe(expected);
    }
  });

  it('writes nothing for an amount that can never fit (a limit of zero is absolute), and does not even connect', async () => {
    const connect = vi.fn(async () => undefined);
    const model = new EmulatedBudgetModel();
    const store = storeOn(model, { connect });
    expect(await store.tryReserve(req({ dailyLimit: 0 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
    expect(await store.tryReserve(req({ monthlyLimit: 0 }))).toEqual({ kind: 'exhausted', scope: 'monthly' });
    expect(await store.tryReserve(req({ amount: 6, dailyLimit: 5, monthlyLimit: 100 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
    expect(await store.tryReserve(req({ amount: 9, dailyLimit: 100, monthlyLimit: 8 }))).toEqual({ kind: 'exhausted', scope: 'monthly' });
    expect(model.log).toHaveLength(0);
    expect(connect).not.toHaveBeenCalled();
    expect(model.docs.size).toBe(0);
  });

  it('with the unlimited limits shadow mode passes, always matches: exactly one write per counted request', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    for (let i = 0; i < 5; i += 1) await store.tryReserve(req({ dailyLimit: Number.MAX_SAFE_INTEGER, monthlyLimit: Number.MAX_SAFE_INTEGER }));
    expect(model.log.filter((entry) => entry.op === 'findOneAndUpdate')).toHaveLength(5);
    expect(model.log.filter((entry) => entry.op === 'findOne')).toHaveLength(0);
    expect(model.docs.get('photo-media|2026-10')).toMatchObject({ total: 5, days: { '2026-10-18': 5 } });
  });
});

describe('the store: limits and classification', () => {
  it('allows exactly the daily limit, then reports a daily exhaustion without changing anything', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    const outcomes = [];
    for (let i = 0; i < 7; i += 1) outcomes.push(await store.tryReserve(req({ dailyLimit: 5, monthlyLimit: 100 })));
    expect(outcomes.filter((o) => o.kind === 'reserved')).toHaveLength(5);
    expect(outcomes[5]).toEqual({ kind: 'exhausted', scope: 'daily' });
    expect(model.docs.get('photo-media|2026-10')).toMatchObject({ total: 5, days: { '2026-10-18': 5 } });
  });

  it('reports a monthly exhaustion once the month total is used, even if the day has room', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    for (const day of ['2026-10-18', '2026-10-19']) for (let i = 0; i < 2; i += 1) await store.tryReserve(req({ day, dailyLimit: 10, monthlyLimit: 4 }));
    expect(await store.tryReserve(req({ day: '2026-10-20', dailyLimit: 10, monthlyLimit: 4 }))).toEqual({ kind: 'exhausted', scope: 'monthly' });
    expect(model.docs.get('photo-media|2026-10')).toMatchObject({ total: 4, days: { '2026-10-18': 2, '2026-10-19': 2 } });
    expect(model.docs.get('photo-media|2026-10')?.days?.['2026-10-20']).toBeUndefined();
  });

  it('names the daily limit when both are exhausted (the order the core expects)', async () => {
    const store = storeOn(new EmulatedBudgetModel());
    await store.tryReserve(req({ dailyLimit: 1, monthlyLimit: 1 }));
    expect(await store.tryReserve(req({ dailyLimit: 1, monthlyLimit: 1 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
  });

  it('is all-or-nothing for a reservation of more than one', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    expect(await store.tryReserve(req({ amount: 3, dailyLimit: 5, monthlyLimit: 50 }))).toMatchObject({ kind: 'reserved', dayCount: 3 });
    expect(await store.tryReserve(req({ amount: 3, dailyLimit: 5, monthlyLimit: 50 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
    expect(model.docs.get('photo-media|2026-10')).toMatchObject({ total: 3, days: { '2026-10-18': 3 } });
    expect(await store.tryReserve(req({ amount: 2, dailyLimit: 5, monthlyLimit: 50 }))).toMatchObject({ kind: 'reserved', dayCount: 5, monthCount: 5 });
  });

  it('keeps buckets in separate documents', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    for (const bucket of BUDGET_BUCKETS) await store.tryReserve(req({ bucket }));
    expect([...model.docs.keys()].sort()).toEqual(BUDGET_BUCKETS.map((bucket) => `${bucket}|2026-10`).sort());
  });
});

describe('the store: UTC rollover', () => {
  it('a new UTC day adds a day field to the same document; the monthly total keeps counting', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    await store.tryReserve(req({ day: '2026-10-18' }));
    await store.tryReserve(req({ day: '2026-10-19' }));
    expect(model.docs.get('photo-media|2026-10')).toMatchObject({ total: 2, days: { '2026-10-18': 1, '2026-10-19': 1 } });
    expect(model.docs.size).toBe(1);
  });

  it('a new UTC month starts a NEW document with fresh counters and its own expiry', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    await store.tryReserve(req({ day: '2026-10-31', month: '2026-10' }));
    expect(await store.tryReserve(req({ day: '2026-11-01', month: '2026-11' }))).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    expect(model.docs.get('photo-media|2026-10')?.total).toBe(1);
    expect(model.docs.get('photo-media|2026-11')).toMatchObject({ total: 1, expiresAt: budgetExpiresAt('2026-11') });
    expect(model.log.filter((entry) => entry.op === 'updateOne')).toHaveLength(2); // one ensure per document
  });

  it('crosses a year boundary and a leap day correctly', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    await store.tryReserve(req({ day: '2026-12-31', month: '2026-12' }));
    await store.tryReserve(req({ day: '2027-01-01', month: '2027-01' }));
    await store.tryReserve(req({ day: '2028-02-29', month: '2028-02' }));
    expect([...model.docs.keys()].sort()).toEqual(['photo-media|2026-12', 'photo-media|2027-01', 'photo-media|2028-02']);
    expect(model.docs.get('photo-media|2028-02')?.days).toEqual({ '2028-02-29': 1 });
  });

  it('works end to end with the core, deriving UTC periods from its clock (including the offset a date was written with)', async () => {
    const model = new EmulatedBudgetModel();
    const budget = createGoogleApiBudget({ mode: 'enforce', limits: LIMITS, store: storeOn(model), now: at('2026-10-19T03:30:00+05:30') });
    expect(await budget.reserve('photo-media')).toMatchObject({ status: 'allowed', usage: { day: 1, month: 1 } });
    expect(model.docs.get('photo-media|2026-10')?.days).toEqual({ '2026-10-18': 1 }); // 03:30 IST on the 19th is still the 18th in UTC
  });
});

describe('the store: initialisation races and missing documents', () => {
  it('ignores a duplicate-key error when another instance created the document first', async () => {
    const model = new EmulatedBudgetModel();
    model.failNext('updateOne', Object.assign(new Error(`E11000 duplicate key ${SECRET}`), { code: 11000 }));
    const store = storeOn(model);
    expect(await store.tryReserve(req())).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 }); // (the injected failure created no document: the conditional step still ran)
  });

  it('recovers when the document is missing at update time: re-ensures once and retries', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    await store.tryReserve(req()); // creates and counts 1
    model.docs.clear(); // e.g. removed by hand, or expired early
    expect(await store.tryReserve(req())).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    expect(model.log.filter((entry) => entry.op === 'updateOne')).toHaveLength(2); // ensured again
    expect(model.log.filter((entry) => entry.op === 'findOne')).toHaveLength(1); // the single classification read
  });

  it('gives up with a generic error if the document is still missing after the one retry (no endless loop)', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    const original = model.updateOne.bind(model);
    model.updateOne = async (filter, update, options) => {
      await original(filter, update, options);
      model.docs.delete(filter._id as string); // the document never sticks
      return { matchedCount: 1 };
    };
    await expect(store.tryReserve(req())).rejects.toMatchObject({ name: 'BudgetStoreError', code: 'document-unavailable', message: 'document-unavailable' });
    expect(model.log.filter((entry) => entry.op === 'updateOne')).toHaveLength(2);
    expect(model.log.filter((entry) => entry.op === 'findOneAndUpdate')).toHaveLength(2);
  });

  it('reports a refused update that cannot be explained by the counts as an invalid-document store error (never guesses)', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    await store.tryReserve(req());
    const original = model.findOneAndUpdate.bind(model);
    model.findOneAndUpdate = (filter, update, options) => {
      original(filter, { $inc: {} }, options); // keep log symmetrical
      return { lean: async () => null }; // refuse although the counts are far below the limits
    };
    await expect(store.tryReserve(req())).rejects.toMatchObject({ code: 'invalid-document' });
  });

  it('rejects a stored document with malformed counters instead of trusting it', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    await store.tryReserve(req());
    model.docs.get('photo-media|2026-10')!.total = 'many' as unknown as number;
    await expect(store.tryReserve(req({ dailyLimit: 1, monthlyLimit: 1 }))).rejects.toMatchObject({ code: expect.stringMatching(/invalid-document|store-operation-failed/) });
  });
});

describe('the store: invalid requests', () => {
  it.each([
    ['an unknown bucket', { bucket: 'nope' as BudgetBucket }],
    ['a bad month', { month: '2026-13' }],
    ['a bad day', { day: '2026-10-32' }],
    ['a day outside the month', { day: '2026-11-01', month: '2026-10' }],
    ['a zero amount', { amount: 0 }],
    ['a fractional amount', { amount: 1.5 }],
    ['a negative amount', { amount: -1 }],
    ['a NaN limit', { dailyLimit: Number.NaN }],
    ['a negative limit', { monthlyLimit: -1 }],
    ['a fractional limit', { dailyLimit: 2.5 }],
    ['an infinite limit', { monthlyLimit: Number.POSITIVE_INFINITY }]
  ])('rejects %s before any database work', async (_label, overrides) => {
    const model = new EmulatedBudgetModel();
    const connect = vi.fn(async () => undefined);
    await expect(storeOn(model, { connect }).tryReserve(req(overrides))).rejects.toMatchObject({ name: 'BudgetStoreError', code: 'invalid-request', message: 'invalid-request' });
    expect(model.log).toHaveLength(0);
    expect(connect).not.toHaveBeenCalled();
  });

  it('rejects a missing or non-object request', async () => {
    const store = storeOn(new EmulatedBudgetModel());
    for (const bad of [undefined, null, 'x', 5]) await expect(store.tryReserve(bad as unknown as StoreReserveRequest)).rejects.toMatchObject({ code: 'invalid-request' });
  });
});

describe('the store: errors and timeouts never leak', () => {
  const leaks = (error: unknown) => JSON.stringify({ message: (error as Error).message, stack: (error as Error).stack, name: (error as Error).name, cause: (error as { cause?: unknown }).cause });

  it('a failed connection becomes a generic connect-failed error', async () => {
    const connect = async () => {
      throw new Error(`failed to connect to ${SECRET}`);
    };
    const error = await storeOn(new EmulatedBudgetModel(), { connect }).tryReserve(req()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BudgetStoreError);
    expect(error).toMatchObject({ code: 'connect-failed', message: 'connect-failed' });
    expect(leaks(error)).not.toContain('SECRET_MARKER');
    expect((error as { cause?: unknown }).cause).toBeUndefined();
  });

  it.each([
    ['updateOne rejecting', 'updateOne' as const, new Error(`write failed ${SECRET}`)],
    ['findOneAndUpdate rejecting', 'findOneAndUpdate' as const, Object.assign(new Error(`exceeded time limit ${SECRET}`), { code: 50, codeName: 'MaxTimeMSExpired' })],
    ['a non-Error rejection', 'findOneAndUpdate' as const, { uri: SECRET }],
    ['a string rejection', 'updateOne' as const, SECRET]
  ])('%s becomes a generic store-operation-failed error with nothing of the original', async (_label, op, failure) => {
    const model = new EmulatedBudgetModel();
    model.failNext(op, failure);
    const error = await storeOn(model).tryReserve(req()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BudgetStoreError);
    expect(error).toMatchObject({ code: 'store-operation-failed', message: 'store-operation-failed' });
    expect(leaks(error)).not.toContain('SECRET_MARKER');
  });

  it('a failure while classifying (the read) is also generic', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    await store.tryReserve(req({ dailyLimit: 1, monthlyLimit: 5 }));
    model.failNext('findOne', new Error(SECRET));
    const error = await store.tryReserve(req({ dailyLimit: 1, monthlyLimit: 5 })).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'store-operation-failed' });
    expect(leaks(error)).not.toContain('SECRET_MARKER');
  });

  it('a synchronous throw from the model is generic too', async () => {
    const model = new EmulatedBudgetModel();
    model.findOneAndUpdate = () => {
      throw new Error(SECRET);
    };
    const error = await storeOn(model).tryReserve(req()).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'store-operation-failed' });
    expect(leaks(error)).not.toContain('SECRET_MARKER');
  });

  it('the core turns every store error into a fail-closed block (enforce) or a harmless store-error (shadow), with no detail', async () => {
    const model = new EmulatedBudgetModel();
    model.failNext('updateOne', new Error(SECRET));
    const enforce = createGoogleApiBudget({ mode: 'enforce', limits: LIMITS, store: storeOn(model), now: at('2026-10-18T10:00:00Z') });
    const blocked = await enforce.reserve('photo-media');
    expect(blocked).toEqual({ status: 'store-error', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'store-failed' });
    model.failNext('findOneAndUpdate', new Error(SECRET));
    const shadow = createGoogleApiBudget({ mode: 'shadow', limits: LIMITS, store: storeOn(model), now: at('2026-10-18T10:00:00Z') });
    const observed = await shadow.reserve('photo-media');
    expect(observed).toMatchObject({ status: 'store-error', allowed: true, reason: 'store-failed' });
    expect(JSON.stringify([blocked, observed])).not.toContain('SECRET_MARKER');
  });

  it('the store never writes to the console', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    const model = new EmulatedBudgetModel();
    model.failNext('updateOne', new Error(SECRET));
    await storeOn(model).tryReserve(req()).catch(() => undefined);
    await storeOn(new EmulatedBudgetModel()).tryReserve(req());
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe('concurrent reservations (the mocked contract)', () => {
  it('500 parallel requests on a fresh month against a limit of 100 allow exactly 100, including the creation race', async () => {
    const model = new EmulatedBudgetModel();
    model.latencyMs = 3;
    const store = storeOn(model);
    const outcomes = await Promise.all(Array.from({ length: 500 }, () => store.tryReserve(req({ dailyLimit: 100, monthlyLimit: 1000 }))));
    expect(outcomes.filter((o) => o.kind === 'reserved')).toHaveLength(100);
    expect(outcomes.filter((o) => o.kind === 'exhausted')).toHaveLength(400);
    expect(model.docs.get('photo-media|2026-10')).toMatchObject({ total: 100, days: { '2026-10-18': 100 } });
    expect(model.duplicateKeysThrown).toBeGreaterThan(0); // the duplicate-key path really was exercised, and was handled
  });

  it('five instances (separate stores with separate memory) sharing one database never exceed the limit together', async () => {
    const model = new EmulatedBudgetModel();
    model.latencyMs = 2;
    const stores = Array.from({ length: 5 }, () => storeOn(model));
    const outcomes = await Promise.all(stores.flatMap((store) => Array.from({ length: 60 }, () => store.tryReserve(req({ dailyLimit: 70, monthlyLimit: 70 })))));
    expect(outcomes.filter((o) => o.kind === 'reserved')).toHaveLength(70);
    expect(model.docs.get('photo-media|2026-10')?.total).toBe(70);
  });

  it('the monthly limit holds across days under concurrency', async () => {
    const model = new EmulatedBudgetModel();
    model.latencyMs = 2;
    const store = storeOn(model);
    const outcomes = await Promise.all(
      ['2026-10-18', '2026-10-19', '2026-10-20'].flatMap((day) => Array.from({ length: 50 }, () => store.tryReserve(req({ day, dailyLimit: 40, monthlyLimit: 90 }))))
    );
    expect(outcomes.filter((o) => o.kind === 'reserved')).toHaveLength(90);
    const doc = model.docs.get('photo-media|2026-10')!;
    expect(doc.total).toBe(90);
    for (const count of Object.values(doc.days ?? {})) expect(count).toBeLessThanOrEqual(40);
  });

  it('mixed amounts never push a total past its limit', async () => {
    const model = new EmulatedBudgetModel();
    model.latencyMs = 2;
    const store = storeOn(model);
    const amounts = Array.from({ length: 150 }, (_, i) => (i % 5) + 1);
    const outcomes = await Promise.all(amounts.map((amount) => store.tryReserve(req({ amount, dailyLimit: 97, monthlyLimit: 500 }))));
    const granted = outcomes.reduce((sum, outcome, i) => sum + (outcome.kind === 'reserved' ? amounts[i] : 0), 0);
    expect(granted).toBeLessThanOrEqual(97);
    expect(model.docs.get('photo-media|2026-10')?.total).toBe(granted);
  });

  it('through the core: 300 parallel enforced requests against a daily limit of 50 allow exactly 50', async () => {
    const model = new EmulatedBudgetModel();
    model.latencyMs = 2;
    const budget = createGoogleApiBudget({ mode: 'enforce', limits: { 'photo-media': { daily: 50, monthly: 500 } }, store: storeOn(model), now: at('2026-10-18T10:00:00Z') });
    const results = await Promise.all(Array.from({ length: 300 }, () => budget.reserve('photo-media')));
    expect(results.filter((r) => r.allowed)).toHaveLength(50);
    expect(results.filter((r) => r.status === 'blocked' && r.reason === 'daily-limit')).toHaveLength(250);
  });

  it('through the core in shadow mode: nothing is blocked, every request is counted once, and wouldHaveBlocked flips after the limit', async () => {
    const model = new EmulatedBudgetModel();
    model.latencyMs = 2;
    const budget = createGoogleApiBudget({ mode: 'shadow', limits: { 'photo-media': { daily: 20, monthly: 500 } }, store: storeOn(model), now: at('2026-10-18T10:00:00Z') });
    const results = await Promise.all(Array.from({ length: 60 }, () => budget.reserve('photo-media')));
    expect(results.every((r) => r.allowed && r.status === 'allowed')).toBe(true);
    expect(model.docs.get('photo-media|2026-10')?.total).toBe(60);
    expect(results.filter((r) => r.status === 'allowed' && r.wouldHaveBlocked)).toHaveLength(40);
    expect(model.log.filter((entry) => entry.op === 'findOneAndUpdate')).toHaveLength(60); // one write per request, no duplicates
  });

  it('a mix of buckets counts each in its own document', async () => {
    const model = new EmulatedBudgetModel();
    model.latencyMs = 2;
    const store = storeOn(model);
    await Promise.all(BUDGET_BUCKETS.flatMap((bucket) => Array.from({ length: 30 }, () => store.tryReserve(req({ bucket, dailyLimit: 1000, monthlyLimit: 1000 })))));
    for (const bucket of BUDGET_BUCKETS) expect(model.docs.get(`${bucket}|2026-10`)?.total).toBe(30);
  });
});

describe('what is stored: counts only', () => {
  it('every document has only the whitelisted keys, with enum, date or numeric values', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    for (const bucket of BUDGET_BUCKETS) {
      await store.tryReserve(req({ bucket }));
      await store.tryReserve(req({ bucket, day: '2026-10-19' }));
    }
    for (const [id, doc] of model.docs) {
      expect(id).toMatch(/^(text-search-visitor|text-search-cron|place-details-metadata|photo-media)\|\d{4}-\d{2}$/);
      expect(Object.keys(doc).sort()).toEqual(['_id', 'bucket', 'days', 'expiresAt', 'month', 'total']);
      expect(typeof doc.total).toBe('number');
      expect(doc.expiresAt).toBeInstanceOf(Date);
      expect(Object.keys(doc.days ?? {}).length).toBeLessThanOrEqual(31);
      for (const [dayKey, count] of Object.entries(doc.days ?? {})) {
        expect(dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isInteger(count)).toBe(true);
      }
      const text = JSON.stringify(doc).toLowerCase();
      for (const forbidden of ['places/', 'chij', 'aiza', 'mongodb', 'http', 'password', 'secret', 'photo name']) expect(text).not.toContain(forbidden);
    }
  });

  it('a day never adds more than one field per UTC day, so a document cannot grow without bound', async () => {
    const model = new EmulatedBudgetModel();
    const store = storeOn(model);
    for (let day = 1; day <= 31; day += 1) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      for (let i = 0; i < 3; i += 1) await store.tryReserve(req({ day: date, dailyLimit: 100, monthlyLimit: 1000 }));
    }
    expect(Object.keys(model.docs.get('photo-media|2026-10')?.days ?? {})).toHaveLength(31);
    expect(model.docs.size).toBe(1);
  });
});

describe('isolation: dark, no import-time effects, no runtime caller', () => {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const SCAN_DIRS = ['app', 'components', 'config', 'lib', 'models', 'scripts', 'services', 'types'];
  const files: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx|mts|js|mjs)$/.test(entry) && !entry.endsWith('.d.ts')) files[path.relative(ROOT, full).split(path.sep).join('/')] = readFileSync(full, 'utf8');
    }
  };
  for (const dir of SCAN_DIRS) walk(path.join(ROOT, dir));
  const isTest = (file: string) => /\.(test|spec)\.[a-z]+$/.test(file);
  const importers = (moduleName: string, ignore: string[]) =>
    Object.entries(files)
      .filter(([file]) => !ignore.includes(file) && !isTest(file))
      .filter(([, source]) => new RegExp(`(?:\\bfrom\\s*|\\bimport\\s*\\(?\\s*|\\brequire\\s*\\(\\s*)['"][^'"]*${moduleName}['"]`).test(source))
      .map(([file]) => file);

  it('no production file imports the Mongo budget store or the budget model (the import graph is a closed island)', () => {
    // Stage B1: the contract-test harness (test support, itself imported only by its own tests) is the one other importer.
    const ignore = ['lib/googleApiBudgetStore.mongo.ts', 'lib/googleApiBudgetContract.harness.ts'];
    expect(importers('googleApiBudgetStore\\.mongo', ignore)).toEqual([]);
    expect(importers('models/GoogleApiBudget', ignore)).toEqual([]);
    expect(importers('GoogleApiBudget', ignore)).toEqual([]);
  });

  it('only the store (and the contract-test harness) import the model, and only they, the fake store and the model import the budget core', () => {
    expect(Object.keys(files).filter((file) => !isTest(file) && /@\/models\/GoogleApiBudget|\.\.\/models\/GoogleApiBudget/.test(files[file])).sort()).toEqual([
      'lib/googleApiBudgetContract.harness.ts',
      'lib/googleApiBudgetStore.mongo.ts'
    ]);
    const coreImporters = Object.keys(files).filter((file) => !isTest(file) && new RegExp(`from\\s*['"]@/lib/googleApiBudget['"]`).test(files[file])).sort();
    expect(coreImporters).toEqual(['lib/googleApiBudget.fakeStore.ts', 'lib/googleApiBudgetContract.harness.ts', 'lib/googleApiBudgetStore.mongo.ts', 'models/GoogleApiBudget.ts']);
  });

  it('the store and model import only what they should', () => {
    const imports = (file: string) => (files[file].match(/from\s*['"][^'"]+['"]/g) ?? []).map((m) => m.replace(/from\s*/, '')).sort();
    expect(imports('lib/googleApiBudgetStore.mongo.ts')).toEqual(["'@/lib/googleApiBudget'", "'@/lib/mongodb'", "'@/models/GoogleApiBudget'"]);
    expect(imports('models/GoogleApiBudget.ts')).toEqual(["'@/lib/googleApiBudget'", "'mongoose'"]);
  });

  it('importing them opens no connection and starts no database work', () => {
    expect(mongoose.connection.readyState).toBe(0);
    expect(mongoose.connections).toHaveLength(1);
    expect((globalThis as { mongooseCache?: { conn: unknown; promise: unknown } }).mongooseCache?.conn ?? null).toBeNull();
    expect((globalThis as { mongooseCache?: { conn: unknown; promise: unknown } }).mongooseCache?.promise ?? null).toBeNull();
  });

  it('the store module has no import-time side effects: it exports a factory, and creates no store, model call, timer or connection at load', () => {
    const code = files['lib/googleApiBudgetStore.mongo.ts'].replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/^(export\s+)?const\s+\w+\s*=\s*createMongoBudgetStore\(/m);
    expect(code).not.toMatch(/^(await\s+)?(connectDB|connect)\(/m); // no top-level call (the only call is the indented one inside tryReserve)
    for (const forbidden of ['process.env', 'console.', 'fetch(', 'createConnection', 'mongoose.connect', 'new MongoClient', 'setInterval', 'setTimeout']) expect(code, forbidden).not.toContain(forbidden);
    expect(code).toContain('export function createMongoBudgetStore');
  });

  it('no existing Google caller, route, cron or switch mentions the budget store or model', () => {
    for (const file of ['lib/googlePlaces.ts', 'lib/googlePhotoFetch.ts', 'app/api/places/photo/route.ts', 'lib/staysRefresh.ts', 'lib/destinations.ts', 'app/api/cron/refresh-stays/route.ts', 'services/providers/google/googlePlaces.attractions.ts', 'lib/googleRegionAttractionsMode.ts', 'lib/mongodb.ts']) {
      expect(files[file], file).toBeDefined();
      expect(files[file], file).not.toMatch(/GoogleApiBudget|googleApiBudget|GOOGLE_API_BUDGET/);
    }
  });

  it('there is exactly one budget model file, and no other model mentions the budget', () => {
    const models = Object.keys(files).filter((file) => file.startsWith('models/') && !isTest(file));
    expect(models.filter((file) => /budget/i.test(file))).toEqual(['models/GoogleApiBudget.ts']);
    expect(models.filter((file) => file !== 'models/GoogleApiBudget.ts' && /googleApiBudget|GoogleApiBudget|GOOGLE_API_BUDGET/.test(files[file]))).toEqual([]);
  });
});
