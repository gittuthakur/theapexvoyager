import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('./JourneyCostingClient', () => ({ default: () => null }));
import Page from './page';
import { headers } from 'next/headers';
afterEach(() => vi.unstubAllEnvs());
it('never renders supplier UI/server props in production', async () => { vi.stubEnv('NODE_ENV', 'production'); await expect(Page()).rejects.toThrow('NOT_FOUND'); });
it('rejects cross-site and forwarded-host page requests before rendering', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  const cases: Record<string, string>[] = [{ host: 'example.com' }, { host: 'localhost:3000', 'x-forwarded-host': 'example.com' }, { host: 'localhost:3000', 'sec-fetch-site': 'cross-site' }];
  for (const requestHeaders of cases) {
    vi.mocked(headers).mockResolvedValue(new Headers(requestHeaders) as Awaited<ReturnType<typeof headers>>);
    await expect(Page()).rejects.toThrow('NOT_FOUND');
  }
});
