import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runGlobalSearchMock, isRateLimitedMock } = vi.hoisted(() => ({ runGlobalSearchMock: vi.fn(), isRateLimitedMock: vi.fn() }));
vi.mock('@/lib/globalSearchServer', () => ({ runGlobalSearch: runGlobalSearchMock }));
vi.mock('@/lib/rateLimit', () => ({ isRateLimited: isRateLimitedMock }));

const { GET } = await import('./route');
const call = (qs: string, headers: Record<string, string> = {}) => GET(new Request(`https://test.invalid/api/search${qs}`, { headers }));

const OK = { query: 'Spiti', sections: {}, total: 0, partial: false };

beforeEach(() => {
  runGlobalSearchMock.mockReset().mockResolvedValue(OK);
  isRateLimitedMock.mockReset().mockReturnValue(false);
});

describe('GET /api/search', () => {
  it('returns the grouped response, never cacheable', async () => {
    const response = await call('?q=Spiti');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual(OK);
    expect(runGlobalSearchMock).toHaveBeenCalledWith(expect.objectContaining({ ok: true, query: 'Spiti', normalized: 'spiti' }));
  });

  it('normalizes the query before it reaches the search', async () => {
    await call('?q=%20%20Spiti%20%20%20Valley%20');
    expect(runGlobalSearchMock).toHaveBeenCalledWith(expect.objectContaining({ query: 'Spiti Valley' }));
  });

  const bad: Array<[string, string, string]> = [
    ['missing q', '', 'QUERY_REQUIRED'],
    ['empty q', '?q=', 'QUERY_REQUIRED'],
    ['blank q', '?q=%20%20', 'QUERY_REQUIRED'],
    ['one character', '?q=a', 'QUERY_TOO_SHORT'],
    ['81 characters', '?q=' + 'x'.repeat(81), 'QUERY_TOO_LONG'],
    ['huge value', '?q=' + 'x'.repeat(100000), 'QUERY_TOO_LONG'],
    ['control character', '?q=ab%00cd', 'QUERY_INVALID'],
    ['escape character', '?q=ab%1Bcd', 'QUERY_INVALID'],
    ['repeated q', '?q=spiti&q=manali', 'QUERY_INVALID']
  ];
  for (const [label, qs, code] of bad) {
    it(`rejects ${label} with 400 ${code} and does no work`, async () => {
      const response = await call(qs);
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe(code);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(runGlobalSearchMock).not.toHaveBeenCalled();
      expect(isRateLimitedMock).not.toHaveBeenCalled();
    });
  }

  it('answers a meaningless but well-formed query through the search (which reads nothing)', async () => {
    await call('?q=%5B%5B');
    expect(runGlobalSearchMock).toHaveBeenCalledWith(expect.objectContaining({ meaningless: true }));
  });

  it('rate-limits by source address and tells the client when to retry', async () => {
    isRateLimitedMock.mockReturnValue(true);
    const response = await call('?q=Spiti', { 'x-forwarded-for': '203.0.113.7' });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(isRateLimitedMock).toHaveBeenCalledWith('search:203.0.113.7', 90);
    expect(runGlobalSearchMock).not.toHaveBeenCalled();
  });

  describe('client address attribution never trusts a client-supplied forwarding header', () => {
    const keyFor = async (headers: Record<string, string>) => {
      isRateLimitedMock.mockClear();
      await call('?q=Spiti', headers);
      return isRateLimitedMock.mock.calls[0][0];
    };
    it('prefers the address the platform sets itself', async () => {
      expect(await keyFor({ 'x-vercel-forwarded-for': '198.51.100.9', 'x-forwarded-for': '1.2.3.4' })).toBe('search:198.51.100.9');
      expect(await keyFor({ 'x-real-ip': '198.51.100.10', 'x-forwarded-for': '1.2.3.4' })).toBe('search:198.51.100.10');
    });
    it('otherwise uses the RIGHT-most forwarded entry, so a prepended fake address changes nothing', async () => {
      expect(await keyFor({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' })).toBe('search:203.0.113.7');
      expect(await keyFor({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8, 203.0.113.7' })).toBe('search:203.0.113.7');
      expect(await keyFor({ 'x-forwarded-for': '5.5.5.5, 203.0.113.7' })).toBe(await keyFor({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' }));
    });
    it('with no usable header every request shares one bucket instead of getting a fresh one', async () => {
      expect(await keyFor({})).toBe('search:unknown');
      expect(await keyFor({ 'x-forwarded-for': ' , ' })).toBe('search:unknown');
    });
  });

  it('an unexpected failure is a generic 500 that leaks nothing', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    runGlobalSearchMock.mockRejectedValue(new Error('mongodb://user:password@host failed'));
    const response = await call('?q=Spiti');
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toMatch(/password|mongodb/);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    spy.mockRestore();
  });
});
