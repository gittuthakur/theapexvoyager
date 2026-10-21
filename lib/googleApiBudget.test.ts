import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BUDGET_BUCKETS,
  BUDGET_BUCKET_DESCRIPTIONS,
  DEFAULT_STORE_TIMEOUT_MS,
  GOOGLE_API_BUDGET_STORE_TIMEOUT_ENV,
  MAX_RESERVE_AMOUNT,
  budgetLimitEnvName,
  budgetPeriods,
  clampStoreTimeout,
  createGoogleApiBudget,
  describeBudgetDecision,
  parseBudgetLimits,
  parseStoreTimeoutMs,
  type BudgetBucket,
  type BudgetDecision,
  type BudgetLimitsConfig,
  type BudgetStore
} from './googleApiBudget';
import { InMemoryBudgetStore, NonAtomicBudgetStore } from './googleApiBudget.fakeStore';

const DAY1 = '2026-10-18T10:00:00.000Z';
const clock = (iso: string) => () => new Date(iso);
const periodsOf = (iso: string) => budgetPeriods(new Date(iso))!;
const LIMITS: BudgetLimitsConfig = {
  'text-search-visitor': { daily: 5, monthly: 8 },
  'text-search-cron': { daily: 3, monthly: 20 },
  'place-details-metadata': { daily: 4, monthly: 10 },
  'photo-media': { daily: 6, monthly: 9 }
};

function make(mode: 'off' | 'shadow' | 'enforce', store: BudgetStore | undefined, limits: BudgetLimitsConfig = LIMITS, now = clock(DAY1), extra: { storeTimeoutMs?: number } = {}) {
  return createGoogleApiBudget({ mode, limits, store, now, ...extra });
}

async function spend(budget: ReturnType<typeof make>, bucket: BudgetBucket, times: number): Promise<BudgetDecision[]> {
  const out: BudgetDecision[] = [];
  for (let i = 0; i < times; i += 1) out.push(await budget.reserve(bucket));
  return out;
}

describe('OFF mode touches nothing', () => {
  it('never reads the store or the clock, whatever is passed in, and always allows', async () => {
    const store = new InMemoryBudgetStore();
    const now = vi.fn(() => new Date(DAY1));
    const budget = createGoogleApiBudget({ mode: 'off', limits: {}, store, now });
    for (const bucket of BUDGET_BUCKETS) expect(await budget.reserve(bucket)).toEqual({ status: 'allowed', allowed: true, bucket, mode: 'off', counted: false });
    // even nonsense input and an unusable store change nothing
    store.failAlways({ type: 'throw' });
    expect((await budget.reserve('photo-media', 0)).allowed).toBe(true);
    expect((await budget.reserve('nope' as BudgetBucket, -5)).allowed).toBe(true);
    expect(store.requests).toHaveLength(0);
    expect(now).not.toHaveBeenCalled();
  });

  it('is the mode for any unrecognised mode value passed in programmatically', async () => {
    const store = new InMemoryBudgetStore();
    for (const mode of ['ENFORCE', 'on', '', undefined, null, 'blocking'] as unknown[]) {
      const budget = createGoogleApiBudget({ mode: mode as 'off', limits: {}, store, now: clock(DAY1) });
      expect(budget.mode).toBe('off');
      expect((await budget.reserve('photo-media')).allowed).toBe(true);
    }
    expect(store.requests).toHaveLength(0);
  });

  it('works with no store at all', async () => {
    expect((await make('off', undefined, {}).reserve('text-search-visitor')).allowed).toBe(true);
  });
});

describe('ENFORCE: daily and monthly boundaries', () => {
  it('allows exactly the daily limit, then blocks with "daily-limit"', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('enforce', store);
    const results = await spend(budget, 'photo-media', 7); // daily 6
    expect(results.slice(0, 6).every((r) => r.status === 'allowed')).toBe(true);
    expect(results[5]).toMatchObject({ status: 'allowed', counted: true, usage: { day: 6, month: 6 } });
    expect(results[6]).toEqual({ status: 'blocked', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'daily-limit' });
  });

  it('a blocked request is not counted: usage stays at the limit', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('enforce', store);
    await spend(budget, 'photo-media', 10);
    expect(store.usage('photo-media', '2026-10-18', '2026-10')).toEqual({ day: 6, month: 6 });
  });

  it('the daily counter resets on the next UTC day while the month keeps counting, until the monthly limit blocks', async () => {
    const store = new InMemoryBudgetStore();
    let moment = '2026-10-18T10:00:00.000Z';
    const budget = createGoogleApiBudget({ mode: 'enforce', limits: LIMITS, store, now: () => new Date(moment) });
    await spend(budget, 'photo-media', 6); // day 1: 6 of 6
    expect((await budget.reserve('photo-media')).allowed).toBe(false);
    moment = '2026-10-19T00:00:00.000Z'; // next UTC day
    const day2 = await spend(budget, 'photo-media', 4); // monthly 9: only 3 more fit
    expect(day2.map((r) => r.status)).toEqual(['allowed', 'allowed', 'allowed', 'blocked']);
    expect(day2[3]).toMatchObject({ reason: 'monthly-limit' });
    expect(store.usage('photo-media', '2026-10-19', '2026-10')).toEqual({ day: 3, month: 9 });
  });

  it('both counters reset when the UTC month changes', async () => {
    const store = new InMemoryBudgetStore();
    let moment = '2026-10-31T23:59:59.999Z';
    const budget = createGoogleApiBudget({ mode: 'enforce', limits: LIMITS, store, now: () => new Date(moment) });
    await spend(budget, 'photo-media', 6);
    expect((await budget.reserve('photo-media')).allowed).toBe(false);
    moment = '2026-11-01T00:00:00.000Z';
    expect(await budget.reserve('photo-media')).toMatchObject({ allowed: true, usage: { day: 1, month: 1 } });
  });

  it('a limit of 0 blocks every request', async () => {
    const budget = make('enforce', new InMemoryBudgetStore(), { 'photo-media': { daily: 0, monthly: 100 } });
    expect(await budget.reserve('photo-media')).toMatchObject({ status: 'blocked', reason: 'daily-limit' });
    const zeroMonthly = make('enforce', new InMemoryBudgetStore(), { 'photo-media': { daily: 100, monthly: 0 } });
    expect(await zeroMonthly.reserve('photo-media')).toMatchObject({ status: 'blocked', reason: 'monthly-limit' });
  });

  it('names the daily limit when both are exhausted', async () => {
    const budget = make('enforce', new InMemoryBudgetStore(), { 'photo-media': { daily: 1, monthly: 1 } });
    await budget.reserve('photo-media');
    expect(await budget.reserve('photo-media')).toMatchObject({ reason: 'daily-limit' });
  });

  it('reservations of more than one are all-or-nothing', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('enforce', store, { 'photo-media': { daily: 5, monthly: 50 } });
    expect((await budget.reserve('photo-media', 3)).allowed).toBe(true); // 3 of 5
    expect((await budget.reserve('photo-media', 3)).allowed).toBe(false); // would be 6
    expect(store.usage('photo-media', '2026-10-18', '2026-10')).toEqual({ day: 3, month: 3 }); // unchanged by the refusal
    expect((await budget.reserve('photo-media', 2)).allowed).toBe(true); // exactly 5
    expect((await budget.reserve('photo-media', 1)).allowed).toBe(false);
  });

  it('a daily refusal does not touch the monthly counter, and a monthly refusal does not touch the daily one (never partial)', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('enforce', store, { 'photo-media': { daily: 100, monthly: 2 } });
    await spend(budget, 'photo-media', 2);
    await spend(budget, 'photo-media', 5); // all monthly refusals
    expect(store.usage('photo-media', '2026-10-18', '2026-10')).toEqual({ day: 2, month: 2 });
  });
});

describe('independent buckets', () => {
  it('exhausting one bucket leaves the others untouched', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('enforce', store);
    await spend(budget, 'text-search-cron', 10); // daily 3
    expect((await budget.reserve('text-search-cron')).allowed).toBe(false);
    for (const other of ['text-search-visitor', 'place-details-metadata', 'photo-media'] as const) expect((await budget.reserve(other)).allowed).toBe(true);
  });

  it('a visitor flood cannot starve the scheduled cron bucket', async () => {
    const budget = make('enforce', new InMemoryBudgetStore());
    await spend(budget, 'text-search-visitor', 50);
    expect(await budget.reserve('text-search-cron')).toMatchObject({ status: 'allowed', usage: { day: 1, month: 1 } });
  });

  it('each bucket applies its own limits', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('enforce', store);
    for (const bucket of BUDGET_BUCKETS) {
      const results = await spend(budget, bucket, 12);
      expect(results.filter((r) => r.allowed).length).toBe(Math.min(LIMITS[bucket]!.daily!, LIMITS[bucket]!.monthly!));
    }
  });

  it('there are exactly four buckets, each with a description and an environment name', () => {
    expect([...BUDGET_BUCKETS]).toEqual(['text-search-visitor', 'text-search-cron', 'place-details-metadata', 'photo-media']);
    for (const bucket of BUDGET_BUCKETS) {
      expect(BUDGET_BUCKET_DESCRIPTIONS[bucket].length).toBeGreaterThan(10);
      expect(budgetLimitEnvName(bucket, 'daily')).toMatch(/^GOOGLE_API_BUDGET_[A-Z_]+_DAILY$/);
      expect(budgetLimitEnvName(bucket, 'monthly')).toMatch(/^GOOGLE_API_BUDGET_[A-Z_]+_MONTHLY$/);
    }
  });
});

describe('ENFORCE fails closed on missing or malformed limits', () => {
  it.each([
    ['no limits at all', {}],
    ['no entry for the bucket', { 'text-search-cron': { daily: 1, monthly: 1 } }],
    ['only a daily limit', { 'photo-media': { daily: 5 } }],
    ['only a monthly limit', { 'photo-media': { monthly: 5 } }],
    ['an empty entry', { 'photo-media': {} }]
  ])('%s: blocked as limit-missing, and the store is never consulted', async (_label, limits) => {
    const store = new InMemoryBudgetStore();
    const result = await make('enforce', store, limits as BudgetLimitsConfig).reserve('photo-media');
    expect(result).toEqual({ status: 'blocked', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'limit-missing' });
    expect(store.requests).toHaveLength(0);
  });

  it.each([Number.NaN, -1, 1.5, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 2, '5', null, true, {}])('a malformed limit (%j) is never read as unlimited', async (bad) => {
    const store = new InMemoryBudgetStore();
    for (const limits of [{ 'photo-media': { daily: bad, monthly: 5 } }, { 'photo-media': { daily: 5, monthly: bad } }]) {
      const result = await make('enforce', store, limits as unknown as BudgetLimitsConfig).reserve('photo-media');
      expect(result).toMatchObject({ status: 'blocked', allowed: false, reason: 'limit-missing' });
    }
    expect(store.requests).toHaveLength(0);
  });

  it('zero is a valid limit, not a missing one', async () => {
    const result = await make('enforce', new InMemoryBudgetStore(), { 'photo-media': { daily: 0, monthly: 0 } }).reserve('photo-media');
    expect(result).toMatchObject({ status: 'blocked', reason: 'daily-limit' });
  });
});

describe('SHADOW counts and reports, but never blocks', () => {
  it('allows past the limits, keeps counting, and flags wouldHaveBlocked once a limit is exceeded', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('shadow', store);
    const results = await spend(budget, 'photo-media', 8); // daily limit 6
    expect(results.every((r) => r.status === 'allowed' && r.allowed)).toBe(true);
    expect(results.slice(0, 6).map((r) => (r as { wouldHaveBlocked?: boolean }).wouldHaveBlocked)).toEqual([false, false, false, false, false, false]);
    expect(results.slice(6).map((r) => (r as { wouldHaveBlocked?: boolean }).wouldHaveBlocked)).toEqual([true, true]);
    expect(results[7]).toMatchObject({ counted: true, usage: { day: 8, month: 8 } });
    expect(store.usage('photo-media', '2026-10-18', '2026-10')).toEqual({ day: 8, month: 8 });
  });

  it('asks the store to count without limiting', async () => {
    const store = new InMemoryBudgetStore();
    await make('shadow', store).reserve('photo-media');
    expect(store.requests[0]).toMatchObject({ dailyLimit: Number.MAX_SAFE_INTEGER, monthlyLimit: Number.MAX_SAFE_INTEGER });
  });

  it('with missing limits it still counts, and reports that enforce would have blocked', async () => {
    const result = await make('shadow', new InMemoryBudgetStore(), {}).reserve('photo-media');
    expect(result).toMatchObject({ status: 'allowed', allowed: true, counted: true, wouldHaveBlocked: true });
  });

  it('with no store it allows without counting', async () => {
    expect(await make('shadow', undefined).reserve('photo-media')).toEqual({ status: 'allowed', allowed: true, bucket: 'photo-media', mode: 'shadow', counted: false });
  });

  it('a store problem never affects the caller: it is reported as a store-error that is still allowed', async () => {
    const store = new InMemoryBudgetStore();
    store.failAlways({ type: 'throw' });
    const result = await make('shadow', store).reserve('photo-media');
    expect(result).toEqual({ status: 'store-error', allowed: true, bucket: 'photo-media', mode: 'shadow', reason: 'store-failed' });
  });

  it('an invalid request is allowed without being counted', async () => {
    const store = new InMemoryBudgetStore();
    expect(await make('shadow', store).reserve('photo-media', 0)).toMatchObject({ status: 'allowed', allowed: true, counted: false });
    expect(store.requests).toHaveLength(0);
  });
});

describe('store failure handling (ENFORCE fails closed)', () => {
  const SECRET = 'SECRET_MARKER_must_never_appear_in_any_result_9f3a';

  it('a throwing store blocks the request and exposes no part of the error', async () => {
    const store = new InMemoryBudgetStore();
    store.failNext({ type: 'throw', error: new Error(`connect failed to ${SECRET}`) });
    const result = await make('enforce', store).reserve('photo-media');
    expect(result).toEqual({ status: 'store-error', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'store-failed' });
    expect(JSON.stringify(result)).not.toContain('SECRET_MARKER_must_never');
    expect(describeBudgetDecision(result)).not.toContain('mongodb');
  });

  it.each([['a string', 'boom'], ['undefined', undefined], ['an object', { code: 11000, uri: SECRET }], ['null', null]])('a store that rejects with %s is a store-failed block', async (_label, error) => {
    const store = new InMemoryBudgetStore();
    store.failNext({ type: 'throw', error });
    const result = await make('enforce', store).reserve('photo-media');
    expect(result).toMatchObject({ status: 'store-error', allowed: false, reason: 'store-failed' });
    expect(JSON.stringify(result)).not.toContain('SECRET_MARKER_must_never');
  });

  it('a synchronous throw inside tryReserve is also a clean store-failed block', async () => {
    const store: BudgetStore = {
      tryReserve() {
        throw new Error(SECRET);
      }
    };
    const result = await make('enforce', store).reserve('photo-media');
    expect(result).toMatchObject({ status: 'store-error', allowed: false, reason: 'store-failed' });
    expect(JSON.stringify(result)).not.toContain('SECRET_MARKER_must_never');
  });

  it('recovers on the next request after a transient failure (no sticky state)', async () => {
    const store = new InMemoryBudgetStore();
    store.failNext({ type: 'throw' });
    const budget = make('enforce', store);
    expect((await budget.reserve('photo-media')).allowed).toBe(false);
    expect(await budget.reserve('photo-media')).toMatchObject({ status: 'allowed', usage: { day: 1, month: 1 } });
  });

  it('enforce with no store at all fails closed', async () => {
    expect(await make('enforce', undefined).reserve('photo-media')).toEqual({ status: 'store-error', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'store-failed' });
  });

  describe('timeouts', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('a store that never answers is a store-timeout after 250 ms by default (enforce: blocked)', async () => {
      const store = new InMemoryBudgetStore();
      store.failAlways({ type: 'hang' });
      const pending = make('enforce', store).reserve('photo-media');
      await vi.advanceTimersByTimeAsync(DEFAULT_STORE_TIMEOUT_MS - 1);
      let settled = false;
      void pending.then(() => (settled = true));
      await Promise.resolve();
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(5);
      expect(await pending).toEqual({ status: 'store-error', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'store-timeout' });
    });

    it('distinguishes a 300 ms exhausted reservation from the default timeout with a test-only override', async () => {
      expect(DEFAULT_STORE_TIMEOUT_MS).toBe(250);
      const store: BudgetStore = {
        async tryReserve() {
          await new Promise<void>((resolve) => setTimeout(resolve, 300));
          return { kind: 'exhausted', scope: 'daily' };
        }
      };
      const defaultPending = make('enforce', store).reserve('photo-media');
      const extendedPending = make('enforce', store, LIMITS, clock(DAY1), { storeTimeoutMs: 2000 }).reserve('photo-media');
      let extendedSettled = false;
      void extendedPending.then(() => (extendedSettled = true));

      await vi.advanceTimersByTimeAsync(250);
      expect(await defaultPending).toEqual({ status: 'store-error', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'store-timeout' });
      await vi.advanceTimersByTimeAsync(49);
      expect(extendedSettled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await extendedPending).toEqual({ status: 'blocked', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'daily-limit' });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('in shadow a hanging store times out and still allows', async () => {
      const store = new InMemoryBudgetStore();
      store.failAlways({ type: 'hang' });
      const pending = make('shadow', store).reserve('photo-media');
      await vi.advanceTimersByTimeAsync(300);
      expect(await pending).toMatchObject({ status: 'store-error', allowed: true, reason: 'store-timeout' });
    });

    it('honours a custom timeout, clamped to 50 to 5,000 ms', async () => {
      const store = new InMemoryBudgetStore();
      store.failAlways({ type: 'hang' });
      const pending = make('enforce', store, LIMITS, clock(DAY1), { storeTimeoutMs: 1 }).reserve('photo-media'); // clamped up to 50
      await vi.advanceTimersByTimeAsync(49);
      let settled = false;
      void pending.then(() => (settled = true));
      await Promise.resolve();
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(2);
      expect(await pending).toMatchObject({ reason: 'store-timeout' });
    });

    it('leaves no timer behind after a fast answer', async () => {
      await make('enforce', new InMemoryBudgetStore()).reserve('photo-media');
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'ok'],
    ['a number', 1],
    ['an empty object', {}],
    ['an unknown kind', { kind: 'maybe' }],
    ['reserved without counts', { kind: 'reserved' }],
    ['reserved with negative counts', { kind: 'reserved', dayCount: -1, monthCount: 1 }],
    ['reserved with NaN counts', { kind: 'reserved', dayCount: Number.NaN, monthCount: 1 }],
    ['reserved with fractional counts', { kind: 'reserved', dayCount: 1.5, monthCount: 2 }],
    ['reserved with string counts', { kind: 'reserved', dayCount: '1', monthCount: '1' }],
    ['exhausted without a scope', { kind: 'exhausted' }],
    ['exhausted with an unknown scope', { kind: 'exhausted', scope: 'yearly' }]
  ])('a malformed store answer (%s) fails closed as invalid-store-response', async (_label, value) => {
    const store = new InMemoryBudgetStore();
    store.failNext({ type: 'respond', value });
    expect(await make('enforce', store).reserve('photo-media')).toEqual({ status: 'store-error', allowed: false, bucket: 'photo-media', mode: 'enforce', reason: 'invalid-store-response' });
  });

  it('a store that reports counts above the limit it was given has broken the contract, so enforce blocks', async () => {
    const store = new InMemoryBudgetStore();
    store.failNext({ type: 'respond', value: { kind: 'reserved', dayCount: 7, monthCount: 7 } }); // daily limit 6
    expect(await make('enforce', store).reserve('photo-media')).toMatchObject({ status: 'store-error', allowed: false, reason: 'invalid-store-response' });
    store.failNext({ type: 'respond', value: { kind: 'reserved', dayCount: 1, monthCount: 10 } }); // monthly limit 9
    expect(await make('enforce', store).reserve('photo-media')).toMatchObject({ status: 'store-error', allowed: false, reason: 'invalid-store-response' });
  });

  it('shadow treats malformed answers, and an impossible "exhausted", as a harmless store-error', async () => {
    const store = new InMemoryBudgetStore();
    store.failNext({ type: 'respond', value: { kind: 'exhausted', scope: 'daily' } });
    expect(await make('shadow', store).reserve('photo-media')).toMatchObject({ status: 'store-error', allowed: true, reason: 'invalid-store-response' });
    store.failNext({ type: 'respond', value: 'garbage' });
    expect(await make('shadow', store).reserve('photo-media')).toMatchObject({ status: 'store-error', allowed: true, reason: 'invalid-store-response' });
  });
});

describe('invalid requests', () => {
  it.each([
    ['an unknown bucket', 'nope', 1],
    ['an empty bucket', '', 1],
    ['a non-string bucket', 7, 1],
    ['an amount of zero', 'photo-media', 0],
    ['a negative amount', 'photo-media', -1],
    ['a fractional amount', 'photo-media', 1.5],
    ['NaN', 'photo-media', Number.NaN],
    ['Infinity', 'photo-media', Number.POSITIVE_INFINITY],
    ['an amount above the maximum', 'photo-media', MAX_RESERVE_AMOUNT + 1],
    ['a string amount', 'photo-media', '1']
  ])('enforce blocks %s without consulting the store', async (_label, bucket, amount) => {
    const store = new InMemoryBudgetStore();
    const result = await make('enforce', store).reserve(bucket as BudgetBucket, amount as number);
    expect(result).toMatchObject({ status: 'blocked', allowed: false, mode: 'enforce', reason: 'invalid-request' });
    expect(store.requests).toHaveLength(0);
  });

  it('accepts the maximum amount', async () => {
    const budget = make('enforce', new InMemoryBudgetStore(), { 'photo-media': { daily: 5000, monthly: 5000 } });
    expect(await budget.reserve('photo-media', MAX_RESERVE_AMOUNT)).toMatchObject({ status: 'allowed', usage: { day: MAX_RESERVE_AMOUNT, month: MAX_RESERVE_AMOUNT } });
  });

  it.each([['an invalid date', () => new Date('not a date')], ['a throwing clock', () => { throw new Error('clock'); }], ['a non-date', () => 'now' as unknown as Date]])('%s blocks in enforce and is uncounted in shadow', async (_label, now) => {
    const store = new InMemoryBudgetStore();
    const enforce = createGoogleApiBudget({ mode: 'enforce', limits: LIMITS, store, now });
    expect(await enforce.reserve('photo-media')).toMatchObject({ status: 'blocked', reason: 'invalid-request' });
    const shadow = createGoogleApiBudget({ mode: 'shadow', limits: LIMITS, store, now });
    expect(await shadow.reserve('photo-media')).toMatchObject({ status: 'allowed', counted: false });
    expect(store.requests).toHaveLength(0);
  });
});

describe('concurrent reservations (the atomic contract)', () => {
  it('500 parallel requests against a limit of 100 allow exactly 100', async () => {
    const store = new InMemoryBudgetStore();
    store.latencyMs = 3;
    const budget = make('enforce', store, { 'photo-media': { daily: 100, monthly: 1000 } });
    const results = await Promise.all(Array.from({ length: 500 }, () => budget.reserve('photo-media')));
    expect(results.filter((r) => r.allowed)).toHaveLength(100);
    expect(results.filter((r) => r.status === 'blocked' && r.reason === 'daily-limit')).toHaveLength(400);
    expect(store.usage('photo-media', '2026-10-18', '2026-10')).toEqual({ day: 100, month: 100 });
  });

  it('several instances sharing one store (separate budget objects) still never exceed the limit together', async () => {
    const store = new InMemoryBudgetStore();
    store.latencyMs = 2;
    const instances = Array.from({ length: 5 }, () => make('enforce', store, { 'photo-media': { daily: 60, monthly: 60 } }));
    const results = await Promise.all(instances.flatMap((instance) => Array.from({ length: 80 }, () => instance.reserve('photo-media'))));
    expect(results.filter((r) => r.allowed)).toHaveLength(60);
    expect(store.usage('photo-media', '2026-10-18', '2026-10')).toEqual({ day: 60, month: 60 });
  });

  it('the monthly limit holds under concurrency across several days', async () => {
    const store = new InMemoryBudgetStore();
    store.latencyMs = 1;
    const limits = { 'photo-media': { daily: 50, monthly: 80 } };
    const day1 = createGoogleApiBudget({ mode: 'enforce', limits, store, now: clock('2026-10-18T05:00:00Z') });
    const day2 = createGoogleApiBudget({ mode: 'enforce', limits, store, now: clock('2026-10-19T05:00:00Z') });
    const results = await Promise.all([...Array.from({ length: 70 }, () => day1.reserve('photo-media')), ...Array.from({ length: 70 }, () => day2.reserve('photo-media'))]);
    expect(results.filter((r) => r.allowed)).toHaveLength(80); // 50 on day 1 plus 30 on day 2, or similar: never more than 80
    expect(store.usage('photo-media', '2026-10-18', '2026-10').month).toBe(80);
    expect(store.usage('photo-media', '2026-10-18', '2026-10').day).toBeLessThanOrEqual(50);
    expect(store.usage('photo-media', '2026-10-19', '2026-10').day).toBeLessThanOrEqual(50);
  });

  it('mixed amounts never push the total past the limit', async () => {
    const store = new InMemoryBudgetStore();
    store.latencyMs = 2;
    const budget = make('enforce', store, { 'photo-media': { daily: 97, monthly: 500 } });
    const amounts = Array.from({ length: 120 }, (_, i) => (i % 5) + 1);
    const results = await Promise.all(amounts.map((amount) => budget.reserve('photo-media', amount)));
    const granted = results.reduce((sum, r, i) => sum + (r.allowed ? amounts[i] : 0), 0);
    expect(granted).toBeLessThanOrEqual(97);
    expect(store.usage('photo-media', '2026-10-18', '2026-10').day).toBe(granted);
  });

  it('parallel traffic in different buckets does not interfere', async () => {
    const store = new InMemoryBudgetStore();
    store.latencyMs = 2;
    const budget = make('enforce', store);
    const results = await Promise.all(BUDGET_BUCKETS.flatMap((bucket) => Array.from({ length: 40 }, () => budget.reserve(bucket))));
    for (const bucket of BUDGET_BUCKETS) {
      const granted = results.filter((r) => r.bucket === bucket && r.allowed).length;
      expect(granted).toBe(Math.min(LIMITS[bucket]!.daily!, LIMITS[bucket]!.monthly!));
    }
  });

  it('the concurrency test really detects a store that is not atomic (it overshoots)', async () => {
    const broken = new NonAtomicBudgetStore();
    const budget = make('enforce', broken, { 'photo-media': { daily: 20, monthly: 1000 } });
    const results = await Promise.all(Array.from({ length: 200 }, () => budget.reserve('photo-media')));
    // The broken store loses updates: many callers read the same count, so far more than the limit of 20 are told "reserved".
    // The atomic fake store above grants exactly 100 of 500 in the same harness, so this assertion proves the harness can see a violation.
    expect(results.filter((r) => r.allowed).length).toBeGreaterThan(20);
  });
});

describe('diagnostics carry no credentials, identifiers or free text', () => {
  const ALLOWED_KEYS = new Set(['status', 'allowed', 'bucket', 'mode', 'counted', 'usage', 'wouldHaveBlocked', 'reason']);

  it('every decision, in every mode and outcome, contains only whitelisted keys with enum or numeric values', async () => {
    const decisions: BudgetDecision[] = [];
    for (const mode of ['off', 'shadow', 'enforce'] as const) {
      const store = new InMemoryBudgetStore();
      const budget = make(mode, store);
      decisions.push(...(await spend(budget, 'photo-media', 8)));
      decisions.push(await make(mode, store, {}).reserve('photo-media'));
      decisions.push(await budget.reserve('x' as BudgetBucket));
      store.failNext({ type: 'throw', error: new Error('secret-token-123') });
      decisions.push(await budget.reserve('photo-media'));
      store.failNext({ type: 'respond', value: { kind: 'bogus', uri: 'https://secret.example/x' } });
      decisions.push(await budget.reserve('photo-media'));
    }
    for (const decision of decisions) {
      for (const [key, value] of Object.entries(decision)) {
        expect(ALLOWED_KEYS.has(key), key).toBe(true);
        if (key === 'usage') {
          expect(Object.keys(value as object).sort()).toEqual(['day', 'month']);
        } else {
          expect(['string', 'boolean', 'object'].includes(typeof value) || value === null).toBe(true);
        }
      }
      const text = JSON.stringify(decision) + describeBudgetDecision(decision);
      for (const forbidden of ['secret', 'mongodb', 'http', 'places/', 'ChIJ', 'AIza', 'password', 'token']) expect(text.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it('describeBudgetDecision is one line of enum values and numbers', async () => {
    const store = new InMemoryBudgetStore();
    const budget = make('enforce', store);
    await spend(budget, 'photo-media', 6);
    expect(describeBudgetDecision(await budget.reserve('photo-media'))).toBe('[google-budget] bucket=photo-media mode=enforce status=blocked allowed=false reason=daily-limit');
    expect(describeBudgetDecision(await make('shadow', new InMemoryBudgetStore()).reserve('text-search-cron'))).toBe(
      '[google-budget] bucket=text-search-cron mode=shadow status=allowed allowed=true counted=true wouldHaveBlocked=false day=1 month=1'
    );
    expect(describeBudgetDecision(await make('off', undefined).reserve('photo-media'))).toBe('[google-budget] bucket=photo-media mode=off status=allowed allowed=true counted=false');
  });

  it('the core never writes to the console', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    const store = new InMemoryBudgetStore();
    store.failNext({ type: 'throw', error: new Error('secret') });
    for (const mode of ['off', 'shadow', 'enforce'] as const) await make(mode, store).reserve('photo-media');
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe('time handling', () => {
  it('uses UTC for the day and the month', () => {
    expect(budgetPeriods(new Date('2026-10-18T23:59:59.999Z'))).toEqual({ day: '2026-10-18', month: '2026-10' });
    expect(budgetPeriods(new Date('2026-10-19T00:00:00.000Z'))).toEqual({ day: '2026-10-19', month: '2026-10' });
    expect(budgetPeriods(new Date('2026-12-31T23:59:59.999Z'))).toEqual({ day: '2026-12-31', month: '2026-12' });
    expect(budgetPeriods(new Date('2027-01-01T00:00:00.000Z'))).toEqual({ day: '2027-01-01', month: '2027-01' });
    expect(budgetPeriods(new Date('2028-02-29T12:00:00.000Z'))).toEqual({ day: '2028-02-29', month: '2028-02' });
  });

  it('is independent of the offset a date was written with', () => {
    expect(budgetPeriods(new Date('2026-10-19T03:30:00+05:30'))).toEqual({ day: '2026-10-18', month: '2026-10' });
  });

  it('returns null for an invalid date or a non-date', () => {
    expect(budgetPeriods(new Date('nope'))).toBeNull();
    expect(budgetPeriods('2026-10-18' as unknown as Date)).toBeNull();
    expect(budgetPeriods(null as unknown as Date)).toBeNull();
  });
});

describe('configuration parsing', () => {
  it('builds the documented variable names', () => {
    expect(budgetLimitEnvName('text-search-visitor', 'daily')).toBe('GOOGLE_API_BUDGET_TEXT_SEARCH_VISITOR_DAILY');
    expect(budgetLimitEnvName('text-search-cron', 'monthly')).toBe('GOOGLE_API_BUDGET_TEXT_SEARCH_CRON_MONTHLY');
    expect(budgetLimitEnvName('place-details-metadata', 'daily')).toBe('GOOGLE_API_BUDGET_PLACE_DETAILS_METADATA_DAILY');
    expect(budgetLimitEnvName('photo-media', 'monthly')).toBe('GOOGLE_API_BUDGET_PHOTO_MEDIA_MONTHLY');
  });

  it('reads plain non-negative integers (including zero and padded text) and leaves everything else unconfigured', () => {
    const config = parseBudgetLimits({
      GOOGLE_API_BUDGET_PHOTO_MEDIA_DAILY: ' 250 ',
      GOOGLE_API_BUDGET_PHOTO_MEDIA_MONTHLY: '0',
      GOOGLE_API_BUDGET_TEXT_SEARCH_VISITOR_DAILY: '12'
    });
    expect(config).toEqual({ 'photo-media': { daily: 250, monthly: 0 }, 'text-search-visitor': { daily: 12 } });
  });

  it.each(['', ' ', '-1', '+5', '1.5', '1e3', '0x10', 'abc', 'Infinity', 'NaN', '5 5', '5,000', '99999999999999999999', '１２', 'null', 'undefined'])('rejects %j (never becomes a limit)', (value) => {
    expect(parseBudgetLimits({ GOOGLE_API_BUDGET_PHOTO_MEDIA_DAILY: value, GOOGLE_API_BUDGET_PHOTO_MEDIA_MONTHLY: value })).toEqual({});
  });

  it('an environment with no budget variables yields no limits, which enforce treats as limit-missing', async () => {
    const limits = parseBudgetLimits({ SOMETHING_ELSE: '5', GOOGLE_PLACES_DAILY_REFRESH_REQUEST_BUDGET: '20' });
    expect(limits).toEqual({});
    expect(await make('enforce', new InMemoryBudgetStore(), limits).reserve('text-search-cron')).toMatchObject({ reason: 'limit-missing' });
  });

  it('parses the store timeout with a default, and clamps it', () => {
    expect(GOOGLE_API_BUDGET_STORE_TIMEOUT_ENV).toBe('GOOGLE_API_BUDGET_STORE_TIMEOUT_MS');
    expect(parseStoreTimeoutMs({})).toBe(DEFAULT_STORE_TIMEOUT_MS);
    expect(parseStoreTimeoutMs({ GOOGLE_API_BUDGET_STORE_TIMEOUT_MS: '400' })).toBe(400);
    expect(parseStoreTimeoutMs({ GOOGLE_API_BUDGET_STORE_TIMEOUT_MS: '1' })).toBe(50);
    expect(parseStoreTimeoutMs({ GOOGLE_API_BUDGET_STORE_TIMEOUT_MS: '999999' })).toBe(5000);
    for (const bad of ['abc', '-5', '1.5', '', '1e3']) expect(parseStoreTimeoutMs({ GOOGLE_API_BUDGET_STORE_TIMEOUT_MS: bad })).toBe(DEFAULT_STORE_TIMEOUT_MS);
    expect(clampStoreTimeout(Number.NaN)).toBe(DEFAULT_STORE_TIMEOUT_MS);
    expect(clampStoreTimeout(undefined)).toBe(DEFAULT_STORE_TIMEOUT_MS);
  });
});

describe('isolation: dark, no database, no environment, no runtime wiring', () => {
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
  const BUDGET_FILES = ['lib/googleApiBudget.ts', 'lib/googleApiBudgetMode.ts', 'lib/googleApiBudget.fakeStore.ts'];
  // C4-B2-2 Stage A: the two approved DARK database files. They import the core, but nothing imports THEM (asserted in
  // lib/googleApiBudgetStore.mongo.test.ts), so there is still no runtime path to the budget.
  // C4-B2-2 Stage B1 adds the contract-test harness (test support, never imported by the app) to the same dark island.
  const APPROVED_DARK_DB_FILES = ['lib/googleApiBudgetStore.mongo.ts', 'models/GoogleApiBudget.ts', 'lib/googleApiBudgetContract.harness.ts'];
  const importersOf = (moduleName: string) =>
    Object.entries(files)
      .filter(([file]) => !BUDGET_FILES.includes(file) && !APPROVED_DARK_DB_FILES.includes(file) && !isTest(file))
      .filter(([, source]) => new RegExp(`(?:\\bfrom\\s*|\\bimport\\s*\\(?\\s*|\\brequire\\s*\\(\\s*)['"][^'"]*${moduleName}['"]`).test(source))
      .map(([file]) => file);

  it('no production file imports the budget core, the mode parser or the fake store (zero runtime wiring)', () => {
    expect(importersOf('googleApiBudget')).toEqual([]);
    expect(importersOf('googleApiBudgetMode')).toEqual([]);
    expect(importersOf('googleApiBudget\\.fakeStore')).toEqual([]);
  });

  it('the new files only import each other (the core imports only the mode type; the fake store only the core)', () => {
    const imports = (file: string) => (files[file].match(/from\s*['"][^'"]+['"]/g) ?? []).map((m) => m.replace(/from\s*/, ''));
    expect(imports('lib/googleApiBudget.ts')).toEqual(["'@/lib/googleApiBudgetMode'"]);
    expect(imports('lib/googleApiBudgetMode.ts')).toEqual([]);
    expect(imports('lib/googleApiBudget.fakeStore.ts')).toEqual(["'@/lib/googleApiBudget'"]);
  });

  it('they contain no database, network, environment, logging or Google access', () => {
    for (const file of BUDGET_FILES) {
      const code = files[file].replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const forbidden of ['mongoose', '@/models', 'connectDB', 'fetch(', 'process.env', 'console.', 'googlePlaces', 'XMLHttpRequest', 'readFile', 'writeFile']) expect(code, `${file}: ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('has exactly one budget model (the approved dark Stage A model), and no other model mentions the budget', () => {
    const modelFiles = Object.keys(files).filter((file) => file.startsWith('models/') && !isTest(file));
    expect(modelFiles.filter((file) => /budget/i.test(file))).toEqual(['models/GoogleApiBudget.ts']);
    expect(modelFiles.filter((file) => file !== 'models/GoogleApiBudget.ts' && /googleApiBudget|GoogleApiBudget|GOOGLE_API_BUDGET/.test(files[file]))).toEqual([]);
  });

  it('no existing Google caller, route or cron mentions the budget', () => {
    for (const file of ['lib/googlePlaces.ts', 'lib/googlePhotoFetch.ts', 'app/api/places/photo/route.ts', 'lib/staysRefresh.ts', 'lib/destinations.ts', 'app/api/cron/refresh-stays/route.ts', 'services/providers/google/googlePlaces.attractions.ts', 'lib/googleRegionAttractionsMode.ts']) {
      expect(files[file], file).toBeDefined();
      expect(files[file], file).not.toMatch(/googleApiBudget|GOOGLE_API_BUDGET/);
    }
  });
});
