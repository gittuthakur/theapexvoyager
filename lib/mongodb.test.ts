import { beforeEach, expect, it, vi } from 'vitest';

const { connect } = vi.hoisted(() => ({ connect: vi.fn() }));
vi.mock('mongoose', () => ({ default: { connect } }));

beforeEach(() => {
  vi.resetModules();
  global.mongooseCache = undefined;
  connect.mockReset();
  vi.stubEnv('MONGODB_URI', 'mongodb://test.invalid/fixture');
});

it('retries after a transient connection failure instead of caching the rejection', async () => {
  connect.mockRejectedValueOnce(new Error('temporary DNS failure')).mockResolvedValueOnce({ connected: true });
  const { connectDB } = await import('./mongodb');
  await expect(connectDB()).rejects.toThrow('temporary DNS failure');
  await expect(connectDB()).resolves.toEqual({ connected: true });
  expect(connect).toHaveBeenCalledTimes(2);
});

it('coalesces concurrent connection attempts', async () => {
  connect.mockResolvedValue({ connected: true });
  const { connectDB } = await import('./mongodb');
  await Promise.all([connectDB(), connectDB(), connectDB()]);
  expect(connect).toHaveBeenCalledTimes(1);
});
