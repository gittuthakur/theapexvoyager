/**
 * C4-B2-2 Stage B1 — LIVE MongoDB contract tests for the Google API budget store (models/GoogleApiBudget.ts,
 * lib/googleApiBudgetStore.mongo.ts, lib/googleApiBudget.ts).
 *
 * SKIPPED BY DEFAULT. Nothing here connects unless an owner deliberately supplies a scratch-database URI and the opt-ins; see
 * lib/googleApiBudgetContract.safety.ts for every condition (and docs/c4-b2-2b-mongo-contract-tests.md for the run instructions).
 * With the variables unset (ordinary CI, Vercel, a developer's shell), the live suite is reported as skipped and no connection is made.
 * If the variables are set but unsafe, the run FAILS with a fixed refusal code and still makes no connection.
 *
 * The suite uses a real MongoDB through its own standalone Mongoose connection and a collection created for this run only; the
 * application's connection (`connectDB()` / `MONGODB_URI`) is never used or modified. The 500-request scenarios use a generous
 * server time limit because they deliberately pile contention onto ONE counter document.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { createGoogleApiBudget, type BudgetBucket, type BudgetStore, type StoreReserveOutcome, type StoreReserveRequest } from '@/lib/googleApiBudget';
import { BudgetStoreError, createMongoBudgetStore } from '@/lib/googleApiBudgetStore.mongo';
import { budgetExpiresAt } from '@/models/GoogleApiBudget';
import { evaluateContractTarget, scrubTarget } from '@/lib/googleApiBudgetContract.safety';
import { openContractHarness, type ContractHarness } from '@/lib/googleApiBudgetContract.harness';

const evaluation = evaluateContractTarget(process.env);
const live = evaluation.status === 'ready';

const BUCKET: BudgetBucket = 'photo-media';
const SLOW_SERVER_MS = 5000;

function request(overrides: Partial<StoreReserveRequest> = {}): StoreReserveRequest {
  return { bucket: BUCKET, day: '2026-10-18', month: '2026-10', amount: 1, dailyLimit: 100, monthlyLimit: 1000, ...overrides };
}

function tally(outcomes: StoreReserveOutcome[]): { reserved: StoreReserveOutcome[]; exhausted: StoreReserveOutcome[] } {
  return { reserved: outcomes.filter((o) => o.kind === 'reserved'), exhausted: outcomes.filter((o) => o.kind === 'exhausted') };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A misconfigured or unsafe run must be loud, not silently skipped. This test makes no connection.
describe('budget store contract: safety gate', () => {
  it.runIf(evaluation.status === 'refuse')('refuses to run against an unsafe contract target', () => {
    const code = evaluation.status === 'refuse' ? evaluation.code : 'unknown';
    throw new Error(`Contract run refused (${code}). No connection was made.`);
  });

  it('reports why the live suite is skipped, when it is', () => {
    if (evaluation.status === 'skip') expect(['test-uri-not-set', 'write-opt-in-missing']).toContain(evaluation.reason);
    else expect(['ready', 'refuse']).toContain(evaluation.status);
  });
});

describe.skipIf(!live)('budget store contract: real MongoDB', () => {
  let h!: ContractHarness;

  beforeAll(async () => {
    if (evaluation.status !== 'ready') return;
    h = await openContractHarness(evaluation.target);
  }, 30_000);

  afterAll(async () => {
    await h?.close();
  }, 30_000);

  beforeEach(async () => {
    await h.reset();
  });

  // ---- 1-3. atomic conditional reservation and the two limits ---------------------------------------------------------------------

  it('reserves atomically and returns the new counts', async () => {
    const store = h.createStore();
    expect(await store.tryReserve(request({ dailyLimit: 3 }))).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    expect(await store.tryReserve(request({ dailyLimit: 3 }))).toEqual({ kind: 'reserved', dayCount: 2, monthCount: 2 });
    expect(await store.tryReserve(request({ dailyLimit: 3 }))).toEqual({ kind: 'reserved', dayCount: 3, monthCount: 3 });
    expect(await store.tryReserve(request({ dailyLimit: 3 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
    const doc = await h.readRaw(BUCKET, '2026-10');
    expect(doc?.total).toBe(3);
    expect((doc?.days as Record<string, number>)['2026-10-18']).toBe(3);
  });

  it('enforces the daily limit and resets it on the next UTC day', async () => {
    const store = h.createStore();
    const limits = { dailyLimit: 2, monthlyLimit: 100 };
    await store.tryReserve(request(limits));
    await store.tryReserve(request(limits));
    expect(await store.tryReserve(request(limits))).toEqual({ kind: 'exhausted', scope: 'daily' });
    expect(await store.tryReserve(request({ ...limits, day: '2026-10-19' }))).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 3 });
  });

  it('enforces the monthly limit across days, and names the daily limit first when both are exhausted', async () => {
    const store = h.createStore();
    await store.tryReserve(request({ day: '2026-10-01', monthlyLimit: 3 }));
    await store.tryReserve(request({ day: '2026-10-01', monthlyLimit: 3 }));
    await store.tryReserve(request({ day: '2026-10-02', monthlyLimit: 3 }));
    expect(await store.tryReserve(request({ day: '2026-10-03', monthlyLimit: 3 }))).toEqual({ kind: 'exhausted', scope: 'monthly' });
    expect(await store.tryReserve(request({ day: '2026-10-02', dailyLimit: 1, monthlyLimit: 3 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
    const doc = await h.readRaw(BUCKET, '2026-10');
    expect(doc?.total).toBe(3); // refusals changed nothing
  });

  it('is all-or-nothing: a refusal increments neither counter', async () => {
    const store = h.createStore();
    await store.tryReserve(request({ dailyLimit: 1 }));
    for (let i = 0; i < 5; i += 1) expect(await store.tryReserve(request({ dailyLimit: 1 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
    const doc = await h.readRaw(BUCKET, '2026-10');
    expect(doc?.total).toBe(1);
    expect(doc?.days).toEqual({ '2026-10-18': 1 });
  });

  // ---- 4. zero limits ------------------------------------------------------------------------------------------------------------

  it('treats a zero limit as absolute and writes nothing', async () => {
    const store = h.createStore();
    expect(await store.tryReserve(request({ dailyLimit: 0 }))).toEqual({ kind: 'exhausted', scope: 'daily' });
    expect(await store.tryReserve(request({ monthlyLimit: 0 }))).toEqual({ kind: 'exhausted', scope: 'monthly' });
    expect(await h.readRaw(BUCKET, '2026-10')).toBeNull();
  });

  // ---- 5-6. concurrency ----------------------------------------------------------------------------------------------------------

  it('allows exactly 100 of 500 concurrent reservations against a limit of 100 (one store)', async () => {
    const store = h.createStore({ maxTimeMs: SLOW_SERVER_MS });
    const outcomes = await Promise.all(Array.from({ length: 500 }, () => store.tryReserve(request({ dailyLimit: 100 }))));
    const { reserved, exhausted } = tally(outcomes);
    expect(reserved).toHaveLength(100);
    expect(exhausted).toHaveLength(400);
    const counts = reserved.map((o) => (o.kind === 'reserved' ? o.dayCount : -1)).sort((a, b) => a - b);
    expect(counts).toEqual(Array.from({ length: 100 }, (_, i) => i + 1)); // every count 1..100 handed out exactly once
    expect((await h.readRaw(BUCKET, '2026-10'))?.total).toBe(100);
  }, 120_000);

  it('allows exactly 100 of 500 concurrent reservations across 5 store instances sharing the database', async () => {
    const stores = Array.from({ length: 5 }, () => h.createStore({ maxTimeMs: SLOW_SERVER_MS }));
    const outcomes = await Promise.all(Array.from({ length: 500 }, (_, i) => stores[i % 5].tryReserve(request({ dailyLimit: 100 }))));
    const { reserved } = tally(outcomes);
    expect(reserved).toHaveLength(100);
    expect((await h.readRaw(BUCKET, '2026-10'))?.total).toBe(100);
  }, 120_000);

  it('enforces the monthly limit under concurrency across several days', async () => {
    const store = h.createStore({ maxTimeMs: SLOW_SERVER_MS });
    const outcomes = await Promise.all(
      Array.from({ length: 300 }, (_, i) => store.tryReserve(request({ day: `2026-10-${String((i % 5) + 1).padStart(2, '0')}`, dailyLimit: 1000, monthlyLimit: 120 })))
    );
    expect(tally(outcomes).reserved).toHaveLength(120);
    expect((await h.readRaw(BUCKET, '2026-10'))?.total).toBe(120);
  }, 120_000);

  it('keeps buckets independent under concurrency', async () => {
    const store = h.createStore({ maxTimeMs: SLOW_SERVER_MS });
    const buckets: BudgetBucket[] = ['text-search-visitor', 'text-search-cron', 'place-details-metadata', 'photo-media'];
    const outcomes = await Promise.all(Array.from({ length: 200 }, (_, i) => store.tryReserve(request({ bucket: buckets[i % 4], dailyLimit: 25 }))));
    expect(tally(outcomes).reserved).toHaveLength(100); // 25 per bucket
    for (const bucket of buckets) expect((await h.readRaw(bucket, '2026-10'))?.total).toBe(25);
  }, 120_000);

  // ---- 7-8. UTC rollover ---------------------------------------------------------------------------------------------------------

  it('rolls over at the UTC day boundary', async () => {
    const store = h.createStore();
    expect(await store.tryReserve(request({ day: '2026-10-18', dailyLimit: 1 }))).toMatchObject({ kind: 'reserved', dayCount: 1 });
    expect(await store.tryReserve(request({ day: '2026-10-18', dailyLimit: 1 }))).toMatchObject({ kind: 'exhausted', scope: 'daily' });
    expect(await store.tryReserve(request({ day: '2026-10-19', dailyLimit: 1 }))).toMatchObject({ kind: 'reserved', dayCount: 1 });
    expect((await h.readRaw(BUCKET, '2026-10'))?.days).toEqual({ '2026-10-18': 1, '2026-10-19': 1 });
  });

  it.each([
    ['month', '2026-10-31', '2026-10', '2026-11-01', '2026-11'],
    ['year', '2026-12-31', '2026-12', '2027-01-01', '2027-01'],
    ['leap day', '2028-02-29', '2028-02', '2028-03-01', '2028-03']
  ])('rolls over at the UTC %s boundary into a new document with fresh counters', async (_name, dayA, monthA, dayB, monthB) => {
    const store = h.createStore();
    expect(await store.tryReserve(request({ day: dayA, month: monthA, dailyLimit: 1, monthlyLimit: 1 }))).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    expect(await store.tryReserve(request({ day: dayA, month: monthA, dailyLimit: 1, monthlyLimit: 1 }))).toMatchObject({ kind: 'exhausted' });
    expect(await store.tryReserve(request({ day: dayB, month: monthB, dailyLimit: 1, monthlyLimit: 1 }))).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    expect((await h.readRaw(BUCKET, monthA))?.total).toBe(1);
    expect((await h.readRaw(BUCKET, monthB))?.total).toBe(1);
  });

  it('derives the UTC day from an instant with a non-UTC offset, through the core', async () => {
    const budget = createGoogleApiBudget({
      mode: 'enforce',
      limits: { [BUCKET]: { daily: 5, monthly: 50 } },
      store: h.createStore(),
      storeTimeoutMs: 2000, // Test-only allowance for Atlas round trips.
      now: () => new Date('2026-10-19T03:30:00+05:30') // 22:00 UTC on the 18th
    });
    expect(await budget.reserve(BUCKET)).toMatchObject({ status: 'allowed', usage: { day: 1, month: 1 } });
    expect((await h.readRaw(BUCKET, '2026-10'))?.days).toEqual({ '2026-10-18': 1 });
  });

  // ---- 9-11. Mongo semantics the mocks cannot prove ------------------------------------------------------------------------------

  it('increments dotted days.<date> fields and the total together', async () => {
    const store = h.createStore();
    for (const day of ['2026-10-05', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-07', '2026-10-07']) await store.tryReserve(request({ day }));
    const doc = await h.readRaw(BUCKET, '2026-10');
    expect(doc?.total).toBe(6);
    expect(doc?.days).toEqual({ '2026-10-05': 2, '2026-10-06': 1, '2026-10-07': 3 });
  });

  it('treats missing total, missing days and missing day fields as zero ($expr with $ifNull)', async () => {
    const store = h.createStore();
    const base = { bucket: BUCKET, month: '2026-10', expiresAt: budgetExpiresAt('2026-10') };

    await h.insertRaw({ _id: 'photo-media|2026-10', ...base }); // no total, no days at all
    expect(await store.tryReserve(request())).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });

    await h.reset();
    await h.insertRaw({ _id: 'photo-media|2026-10', ...base, total: 4, days: { '2026-10-01': 4 } }); // days present, this day missing
    expect(await store.tryReserve(request({ day: '2026-10-18' }))).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 5 });
    expect((await h.readRaw(BUCKET, '2026-10'))?.days).toEqual({ '2026-10-01': 4, '2026-10-18': 1 });

    await h.reset();
    await h.insertRaw({ _id: 'photo-media|2026-10', ...base, total: 5 }); // at the monthly limit, days missing
    expect(await store.tryReserve(request({ monthlyLimit: 5 }))).toEqual({ kind: 'exhausted', scope: 'monthly' });
    expect((await h.readRaw(BUCKET, '2026-10'))?.total).toBe(5);
  });

  it('applies the Mongoose defaults and timestamps when the document is created by upsert', async () => {
    await h.createStore().tryReserve(request());
    const doc = await h.readRaw(BUCKET, '2026-10');
    expect(doc).not.toBeNull();
    expect(doc?._id).toBe('photo-media|2026-10');
    expect(doc?.bucket).toBe('photo-media');
    expect(doc?.month).toBe('2026-10');
    expect(doc?.total).toBe(1);
    expect(doc?.days).toEqual({ '2026-10-18': 1 });
    expect(doc?.expiresAt).toBeInstanceOf(Date);
    expect((doc?.expiresAt as Date).toISOString()).toBe(budgetExpiresAt('2026-10').toISOString());
    expect(doc?.createdAt).toBeInstanceOf(Date);
    expect(doc?.updatedAt).toBeInstanceOf(Date);
    expect(Object.keys(doc ?? {}).sort()).toEqual(expect.arrayContaining(['_id', 'bucket', 'month', 'total', 'days', 'expiresAt', 'createdAt', 'updatedAt']));
  });

  // ---- 12-13. races and recovery -------------------------------------------------------------------------------------------------

  it('survives a creation race between many fresh store instances', async () => {
    const stores = Array.from({ length: 12 }, () => h.createStore({ maxTimeMs: SLOW_SERVER_MS }));
    const outcomes = await Promise.all(stores.map((store) => store.tryReserve(request({ dailyLimit: 1000 }))));
    expect(tally(outcomes).reserved).toHaveLength(12);
    expect((await h.readRaw(BUCKET, '2026-10'))?.total).toBe(12);
  });

  it('only ever sees duplicate-key (11000) errors from concurrent creation upserts, and ends with one document', async () => {
    const doc = { bucket: BUCKET, month: '2026-10', total: 0, expiresAt: budgetExpiresAt('2026-10') };
    const id = 'photo-media|2026-10';
    h.track(BUCKET, '2026-10'); // the raw upserts below bypass the store, so register the document for cleanup

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => h.model.collection.updateOne({ _id: id }, { $setOnInsert: doc }, { upsert: true }))
    );
    for (const result of results) {
      if (result.status === 'rejected') expect((result.reason as { code?: number }).code).toBe(11000);
    }
    expect(await h.readRaw(BUCKET, '2026-10')).toMatchObject({ _id: id, total: 0 });
  });

  it('recovers when a counter document disappears after the store cached its creation', async () => {
    const store = h.createStore();
    expect(await store.tryReserve(request())).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 });
    await h.deleteRaw(BUCKET, '2026-10'); // someone removes the counter behind the store's back
    expect(await store.tryReserve(request())).toEqual({ kind: 'reserved', dayCount: 1, monthCount: 1 }); // re-created, counting restarts
    expect((await h.readRaw(BUCKET, '2026-10'))?.total).toBe(1);
  });

  // ---- 14. TTL -------------------------------------------------------------------------------------------------------------------

  it('creates the TTL index on expiresAt and stores the expiry metadata', async () => {
    await h.createIndexes();
    const indexes = await h.indexes();
    const ttl = indexes.find((index) => JSON.stringify(index.key) === JSON.stringify({ expiresAt: 1 }));
    expect(ttl).toBeDefined();
    expect(ttl?.expireAfterSeconds).toBe(0);
    expect(indexes.some((index) => JSON.stringify(index.key) === JSON.stringify({ _id: 1 }))).toBe(true);

    await h.createStore().tryReserve(request({ month: '2026-10', day: '2026-10-18' }));
    await h.createStore().tryReserve(request({ month: '2028-02', day: '2028-02-29' }));
    expect(((await h.readRaw(BUCKET, '2026-10'))?.expiresAt as Date).toISOString()).toBe('2027-01-30T00:00:00.000Z');
    expect(((await h.readRaw(BUCKET, '2028-02'))?.expiresAt as Date).toISOString()).toBe('2028-05-30T00:00:00.000Z');
  });

  // ---- 15. errors and timeouts ---------------------------------------------------------------------------------------------------

  it('turns a connection failure into a fixed, secret-free error', async () => {
    const secret = 'SECRET_MARKER_contract_connect';
    const store = createMongoBudgetStore({
      model: h.model,
      connect: async () => {
        throw new Error(`cannot reach ${secret}`);
      }
    });
    const error = await store.tryReserve(request()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BudgetStoreError);
    expect((error as BudgetStoreError).code).toBe('connect-failed');
    expect(String((error as Error).message)).not.toContain(secret);
    expect(await h.readRaw(BUCKET, '2026-10')).toBeNull();
  });

  it('turns a database failure into a fixed error that carries no connection detail', async () => {
    if (evaluation.status !== 'ready') return;
    const second = await openContractHarness(evaluation.target);
    const store = second.createStore();
    await second.close(); // its connection is now closed: every operation must fail
    const error = await store.tryReserve(request()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BudgetStoreError);
    expect(['connect-failed', 'store-operation-failed']).toContain((error as BudgetStoreError).code);
    expect(scrubTarget(String((error as Error).message), evaluation.target)).toBe(String((error as Error).message));
  });

  it('reports a malformed counter document without changing it or leaking details', async () => {
    const store = h.createStore();
    await h.insertRaw({ _id: 'photo-media|2026-10', bucket: BUCKET, month: '2026-10', expiresAt: budgetExpiresAt('2026-10'), total: 2, days: 5 });
    const error = await store.tryReserve(request()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BudgetStoreError);
    expect(['store-operation-failed', 'invalid-document']).toContain((error as BudgetStoreError).code);
    const doc = await h.readRaw(BUCKET, '2026-10');
    expect(doc?.total).toBe(2);
    expect(doc?.days).toBe(5);
  });

  it('lets the core report a slow store as a timeout (fail open in shadow, fail closed in enforce)', async () => {
    const real = h.createStore();
    const slow: BudgetStore = {
      async tryReserve(r) {
        await sleep(400);
        return real.tryReserve(r);
      }
    };
    const now = () => new Date('2026-10-18T10:00:00Z');
    const limits = { [BUCKET]: { daily: 5, monthly: 50 } };
    const shadow = await createGoogleApiBudget({ mode: 'shadow', limits, store: slow, now, storeTimeoutMs: 50 }).reserve(BUCKET);
    expect(shadow).toMatchObject({ status: 'store-error', allowed: true, reason: 'store-timeout' });
    const enforce = await createGoogleApiBudget({ mode: 'enforce', limits, store: slow, now, storeTimeoutMs: 50 }).reserve(BUCKET);
    expect(enforce).toMatchObject({ status: 'store-error', allowed: false, reason: 'store-timeout' });
    await sleep(900); // let the abandoned writes finish so cleanup sees them
  });

  it('works end to end through the core in enforce and shadow modes', async () => {
    const now = () => new Date('2026-10-18T10:00:00Z');
    const limits = { [BUCKET]: { daily: 2, monthly: 50 } };
    const enforce = createGoogleApiBudget({ mode: 'enforce', limits, store: h.createStore(), now, storeTimeoutMs: 2000 });
    expect(await enforce.reserve(BUCKET)).toMatchObject({ status: 'allowed', counted: true, usage: { day: 1, month: 1 } });
    expect(await enforce.reserve(BUCKET)).toMatchObject({ status: 'allowed', usage: { day: 2, month: 2 } });
    expect(await enforce.reserve(BUCKET)).toEqual({ status: 'blocked', allowed: false, bucket: BUCKET, mode: 'enforce', reason: 'daily-limit' });

    await h.reset();
    const shadow = createGoogleApiBudget({ mode: 'shadow', limits, store: h.createStore(), now, storeTimeoutMs: 2000 });
    await shadow.reserve(BUCKET);
    await shadow.reserve(BUCKET);
    const third = await shadow.reserve(BUCKET);
    expect(third).toMatchObject({ status: 'allowed', allowed: true, counted: true, wouldHaveBlocked: true, usage: { day: 3, month: 3 } });
  });

  // ---- 16. what is stored --------------------------------------------------------------------------------------------------------

  it('stores only counters and dates: no credentials, hosts, Place IDs or photo names', async () => {
    if (evaluation.status !== 'ready') return;
    const store = h.createStore();
    for (const bucket of ['text-search-visitor', 'text-search-cron', 'place-details-metadata', 'photo-media'] as BudgetBucket[]) {
      await store.tryReserve(request({ bucket }));
      await store.tryReserve(request({ bucket, day: '2026-10-19' }));
    }
    const allowedKeys = ['_id', 'bucket', 'month', 'total', 'days', 'expiresAt', 'createdAt', 'updatedAt', '__v'];
    for (const bucket of ['text-search-visitor', 'text-search-cron', 'place-details-metadata', 'photo-media'] as BudgetBucket[]) {
      const doc = await h.readRaw(bucket, '2026-10');
      expect(doc).not.toBeNull();
      for (const key of Object.keys(doc ?? {})) expect(allowedKeys).toContain(key);
      for (const [day, count] of Object.entries(doc?.days as Record<string, unknown>)) {
        expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isSafeInteger(count)).toBe(true);
      }
      const text = JSON.stringify(doc);
      expect(scrubTarget(text, evaluation.target)).toBe(text); // no URI, user, password or host in the document
      expect(text).not.toMatch(/places\/|photos\/|AIza|mongodb|ChIJ/i);
    }
  });

  // ---- isolation: the application's own connection stays untouched --------------------------------------------------------------

  it("never touched the application's global connection", () => {
    expect(mongoose.connection.readyState).toBe(0);
    expect((globalThis as { mongooseCache?: { conn?: unknown } }).mongooseCache?.conn ?? null).toBeNull();
  });
});
