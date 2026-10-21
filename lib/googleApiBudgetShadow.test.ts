import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGoogleBudgetShadow } from './googleApiBudgetShadow';
import { BUDGET_BUCKETS, type BudgetStore } from './googleApiBudget';
import { InMemoryBudgetStore } from './googleApiBudget.fakeStore';

afterEach(() => vi.useRealTimers());

describe('runtime shadow boundary', () => {
  it.each([undefined, '', 'off', 'invalid', 'enforce'])('mode %s is a synchronous pass-through with zero budget operations', (mode) => {
    const store = vi.fn();
    const log = vi.fn();
    const outbound = vi.fn(() => Promise.resolve('original'));
    const original = Promise.resolve('original');
    outbound.mockReturnValue(original);
    const run = createGoogleBudgetShadow({ env: () => ({ GOOGLE_API_BUDGET_MODE: mode }), store, log });
    expect(run('photo-media', outbound)).toBe(original);
    expect(outbound).toHaveBeenCalledTimes(1);
    expect(store).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('records each bucket independently without limits and never blocks or adds Google calls', async () => {
    const store = new InMemoryBudgetStore();
    const log = vi.fn();
    const run = createGoogleBudgetShadow({ env: () => ({ GOOGLE_API_BUDGET_MODE: 'shadow' }), store: async () => store, log });
    const outbound = vi.fn(async () => 'google');
    for (const bucket of BUDGET_BUCKETS) expect(await run(bucket, outbound)).toBe('google');
    expect(outbound).toHaveBeenCalledTimes(4);
    expect(store.requests.map((r) => r.bucket)).toEqual([...BUDGET_BUCKETS]);
    for (const r of store.requests) {
      expect(store.usage(r.bucket, r.day, r.month)).toEqual({ day: 1, month: 1 });
      expect(r.dailyLimit).toBe(Number.MAX_SAFE_INTEGER);
    }
    expect(log).toHaveBeenCalledTimes(4); // missing limits: wouldHaveBlocked
  });

  it('reports wouldHaveBlocked safely when configured limits are exceeded', async () => {
    const store = new InMemoryBudgetStore();
    const log = vi.fn();
    const run = createGoogleBudgetShadow({
      env: () => ({ GOOGLE_API_BUDGET_MODE: 'shadow', GOOGLE_API_BUDGET_PHOTO_MEDIA_DAILY: '0', GOOGLE_API_BUDGET_PHOTO_MEDIA_MONTHLY: '0' }),
      store: async () => store, log
    });
    const result = await run('photo-media', async () => 'places/private/photos/private query private-key');
    expect(result).toContain('private');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('wouldHaveBlocked=true'));
    for (const secret of ['private', 'places/', 'photos/', 'query', 'key=']) expect(JSON.stringify(log.mock.calls)).not.toContain(secret);
  });

  it('store import failures and log failures cannot suppress an outbound call', async () => {
    const log = vi.fn((line: string) => { void line; throw new Error('private log error'); });
    const run = createGoogleBudgetShadow({
      env: () => ({ GOOGLE_API_BUDGET_MODE: 'shadow' }),
      store: async () => { throw new Error('mongodb://private credentials'); }, log
    });
    const outbound = vi.fn(async () => 'ok');
    expect(await run('photo-media', outbound)).toBe('ok');
    expect(outbound).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain('reason=store-failed');
    expect(log.mock.calls[0][0]).not.toContain('private');
  });

  it('bounds a hanging store at the unchanged 250 ms default and still calls Google once', async () => {
    vi.useFakeTimers();
    const log = vi.fn();
    const outbound = vi.fn(async () => 'ok');
    const run = createGoogleBudgetShadow({
      env: () => ({ GOOGLE_API_BUDGET_MODE: 'shadow' }), store: () => new Promise<BudgetStore>(() => {}), log
    });
    const pending = run('photo-media', outbound);
    await vi.advanceTimersByTimeAsync(249);
    expect(outbound).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toBe('ok');
    expect(outbound).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('reason=store-timeout'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves the exact Google rejection and performs no retry', async () => {
    const store = new InMemoryBudgetStore();
    const run = createGoogleBudgetShadow({ env: () => ({ GOOGLE_API_BUDGET_MODE: 'shadow' }), store: async () => store, log: vi.fn() });
    const error = new Error('upstream');
    const outbound = vi.fn(async () => { throw error; });
    await expect(run('photo-media', outbound)).rejects.toBe(error);
    expect(outbound).toHaveBeenCalledTimes(1);
    expect(store.requests).toHaveLength(1);
  });

  it('a cache/coalescing layer outside the boundary invokes accounting once per miss, never per consumer', async () => {
    const store = new InMemoryBudgetStore();
    const run = createGoogleBudgetShadow({ env: () => ({ GOOGLE_API_BUDGET_MODE: 'shadow' }), store: async () => store, log: vi.fn() });
    const outbound = vi.fn(async () => 'photo');
    let cached: Promise<string> | undefined;
    const read = () => cached ??= run('photo-media', outbound);
    expect(await Promise.all([read(), read(), read()])).toEqual(['photo', 'photo', 'photo']);
    expect(await read()).toBe('photo');
    expect(outbound).toHaveBeenCalledTimes(1);
    expect(store.requests).toHaveLength(1);
  });
});
