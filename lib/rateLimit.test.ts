import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => vi.useRealTimers());
it('bounds active keys without dropping protection for existing clients', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  const { isRateLimited } = await import('./rateLimit');
  for (let i = 0; i < 10_000; i++) expect(isRateLimited(`fixture-${i}`, 1)).toBe(false);
  expect(isRateLimited('new-key', 1)).toBe(true);
  expect(isRateLimited('fixture-0', 1)).toBe(true);
  vi.advanceTimersByTime(60_001);
  expect(isRateLimited('new-key', 1)).toBe(false);
});
