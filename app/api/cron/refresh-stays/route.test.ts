import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshAllConfiguredStaysMock, staysRefreshRunCreateMock, staysRefreshRunFindByIdAndUpdateMock, staysRefreshRunUpdateManyMock } =
  vi.hoisted(() => ({
    refreshAllConfiguredStaysMock: vi.fn(),
    staysRefreshRunCreateMock: vi.fn(),
    staysRefreshRunFindByIdAndUpdateMock: vi.fn(),
    staysRefreshRunUpdateManyMock: vi.fn()
  }));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/staysRefresh', () => ({ refreshAllConfiguredStays: refreshAllConfiguredStaysMock }));
vi.mock('@/models/StaysRefreshRun', () => ({
  StaysRefreshRun: {
    create: staysRefreshRunCreateMock,
    findByIdAndUpdate: staysRefreshRunFindByIdAndUpdateMock,
    updateMany: staysRefreshRunUpdateManyMock
  }
}));

const { GET } = await import('./route');

function baseSummary() {
  return {
    manifestTagCount: 4,
    searchGroupCount: 2,
    dueGroupCount: 2,
    searchGroupsAttempted: 2,
    searchGroupsSkippedForBudget: 0,
    destinationsProcessed: 2,
    googleRequestCount: 2,
    recordsUpserted: 4,
    budgetLimited: false,
    errors: [] as Array<{ destinationSlug: string; stayType: string; message: string }>
  };
}

function cronRequest(secret?: string, query = '') {
  return new Request(`http://localhost/api/cron/refresh-stays${query}`, {
    headers: secret !== undefined ? { authorization: `Bearer ${secret}` } : {}
  });
}

function duplicateKeyError() {
  return Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
}

beforeEach(() => {
  refreshAllConfiguredStaysMock.mockReset();
  staysRefreshRunCreateMock.mockReset();
  staysRefreshRunFindByIdAndUpdateMock.mockReset();
  staysRefreshRunUpdateManyMock.mockReset().mockResolvedValue({});
  vi.stubEnv('CRON_SECRET', 'test-secret');
});
afterEach(() => vi.unstubAllEnvs());

describe('GET /api/cron/refresh-stays — auth (Part 5 of the pre-commit correction)', () => {
  it('rejects a request with no secret (401) and never touches Google/Mongo', async () => {
    const res = await GET(cronRequest());
    expect(res.status).toBe(401);
    expect(refreshAllConfiguredStaysMock).not.toHaveBeenCalled();
  });

  it('rejects a request with the wrong secret (401)', async () => {
    const res = await GET(cronRequest('wrong-secret'));
    expect(res.status).toBe(401);
    expect(refreshAllConfiguredStaysMock).not.toHaveBeenCalled();
  });

  it('fails closed (401) when CRON_SECRET is not configured at all, even with a matching-looking header', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const res = await GET(cronRequest(''));
    expect(res.status).toBe(401);
    expect(refreshAllConfiguredStaysMock).not.toHaveBeenCalled();
  });

  it('a correct secret in the Authorization header is allowed through', async () => {
    staysRefreshRunCreateMock.mockResolvedValue({ _id: 'run-1' });
    refreshAllConfiguredStaysMock.mockResolvedValue(baseSummary());

    const res = await GET(cronRequest('test-secret'));

    expect(res.status).toBe(200);
    expect(refreshAllConfiguredStaysMock).toHaveBeenCalledTimes(1);
  });

  it('a correct secret passed only as a query string is NOT accepted — only the Authorization header counts', async () => {
    const res = await GET(cronRequest(undefined, '?secret=test-secret'));
    expect(res.status).toBe(401);
    expect(refreshAllConfiguredStaysMock).not.toHaveBeenCalled();
  });

  it('an ordinary public visitor request (no auth at all) cannot trigger a refresh', async () => {
    const res = await GET(new Request('http://localhost/api/cron/refresh-stays'));
    expect(res.status).toBe(401);
    expect(refreshAllConfiguredStaysMock).not.toHaveBeenCalled();
  });

  it('never echoes the configured secret back in any response body', async () => {
    staysRefreshRunCreateMock.mockResolvedValue({ _id: 'run-1' });
    refreshAllConfiguredStaysMock.mockResolvedValue(baseSummary());

    const okRes = await GET(cronRequest('test-secret'));
    const okBody = await okRes.text();
    expect(okBody).not.toContain('test-secret');

    const deniedRes = await GET(cronRequest('wrong-secret'));
    const deniedBody = await deniedRes.text();
    expect(deniedBody).not.toContain('test-secret');
    expect(deniedBody).not.toContain('wrong-secret');
  });
});

describe('GET /api/cron/refresh-stays — overlap protection', () => {
  it('refuses to start a second run while one is already in flight (409)', async () => {
    staysRefreshRunCreateMock.mockRejectedValue(duplicateKeyError());

    const res = await GET(cronRequest('test-secret'));

    expect(res.status).toBe(409);
    expect(refreshAllConfiguredStaysMock).not.toHaveBeenCalled();
  });

  it('self-heals a stale >30-minute-old "running" lock before attempting a new run', async () => {
    staysRefreshRunCreateMock.mockResolvedValue({ _id: 'run-2' });
    refreshAllConfiguredStaysMock.mockResolvedValue(baseSummary());

    await GET(cronRequest('test-secret'));

    expect(staysRefreshRunUpdateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'running' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'failed' }) })
    );
  });
});

describe('GET /api/cron/refresh-stays — a real scheduled run', () => {
  it('calls refreshAllConfiguredStays exactly once and records a completed run', async () => {
    staysRefreshRunCreateMock.mockResolvedValue({ _id: 'run-1' });
    refreshAllConfiguredStaysMock.mockResolvedValue(baseSummary());

    const res = await GET(cronRequest('test-secret'));

    expect(refreshAllConfiguredStaysMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
    expect(staysRefreshRunFindByIdAndUpdateMock).toHaveBeenCalledWith('run-1', expect.objectContaining({ status: 'completed' }));
  });

  it('records status "partial" when the refresh reports per-group errors, but still returns 200', async () => {
    staysRefreshRunCreateMock.mockResolvedValue({ _id: 'run-1' });
    refreshAllConfiguredStaysMock.mockResolvedValue({
      ...baseSummary(),
      errors: [{ destinationSlug: 'manali', stayType: 'hotel', message: 'boom' }]
    });

    const res = await GET(cronRequest('test-secret'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('partial');
  });

  it('records status "partial" (not "completed") when the run was budget-limited, even with zero errors', async () => {
    staysRefreshRunCreateMock.mockResolvedValue({ _id: 'run-1' });
    refreshAllConfiguredStaysMock.mockResolvedValue({ ...baseSummary(), budgetLimited: true, searchGroupsSkippedForBudget: 3 });

    const res = await GET(cronRequest('test-secret'));

    const body = await res.json();
    expect(body.status).toBe('partial');
    expect(staysRefreshRunFindByIdAndUpdateMock).toHaveBeenCalledWith('run-1', expect.objectContaining({ budgetLimited: true }));
  });

  it('records status "failed" and returns 500 if the refresh throws entirely — existing data is never touched by this route itself', async () => {
    staysRefreshRunCreateMock.mockResolvedValue({ _id: 'run-1' });
    refreshAllConfiguredStaysMock.mockRejectedValue(new Error('catastrophic failure'));

    const res = await GET(cronRequest('test-secret'));

    expect(res.status).toBe(500);
    expect(staysRefreshRunFindByIdAndUpdateMock).toHaveBeenCalledWith('run-1', expect.objectContaining({ status: 'failed' }));
  });
});
