import { afterEach, describe, expect, it, vi } from 'vitest';
import { costingAccessDenied } from './journeyCostingAccess';
afterEach(() => vi.unstubAllEnvs());
describe('loopback costing gate', () => {
  it.each(['production', 'test'])('denies all requests in %s', env => {
    vi.stubEnv('NODE_ENV', env);
    expect(costingAccessDenied(new Request('http://localhost:3000/test'))?.status).toBe(404);
  });
  it('allows direct loopback GET and same-origin POST in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const host of ['localhost:3000', '127.0.0.1:3100', '[::1]:3000']) {
      expect(costingAccessDenied(new Request(`http://${host}/test`))).toBeNull();
      expect(costingAccessDenied(new Request(`http://${host}/test`, { method: 'POST', headers: { origin: `http://${host}` } }))).toBeNull();
    }
  });
  it('denies host spoofing, proxy mismatch, cross-site reads and missing write origin', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const requests = [new Request('http://example.com/test', { headers: { host: 'localhost:3000' } }),
      new Request('http://localhost:3000/test', { headers: { host: 'example.com' } }),
      new Request('http://localhost:3000/test', { headers: { 'x-forwarded-host': 'example.com' } }),
      new Request('http://localhost:3000/test', { headers: { 'sec-fetch-site': 'cross-site' } }),
      new Request('http://localhost:3000/test', { method: 'POST' })];
    for (const request of requests) expect(costingAccessDenied(request)?.status).toBe(403);
  });
});
