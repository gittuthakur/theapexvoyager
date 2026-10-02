import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('./SupplierLibraryClient', () => ({ default: () => null }));
import { headers } from 'next/headers';
import Page from './page';
afterEach(() => vi.unstubAllEnvs());
it('production page never renders supplier identity/contact/rate props', async () => { vi.stubEnv('NODE_ENV', 'production'); await expect(Page()).rejects.toThrow('NOT_FOUND'); });
it('rejects nonlocal and proxy/cross-site page requests', async () => {
  vi.stubEnv('NODE_ENV', 'development'); const inputs: Record<string, string>[] = [{ host: 'example.com' }, { host: 'localhost:3000', 'x-forwarded-host': 'example.com' }, { host: 'localhost:3000', 'sec-fetch-site': 'cross-site' }];
  for (const input of inputs) { vi.mocked(headers).mockResolvedValue(new Headers(input) as Awaited<ReturnType<typeof headers>>); await expect(Page()).rejects.toThrow('NOT_FOUND'); }
});
