import { afterEach, describe, expect, it, vi } from 'vitest';
import { syntheticCosting, SYNTHETIC_JOURNEY } from '@/services/pricing/journeyCosting.fixture';
const mocks = vi.hoisted(() => ({ context: vi.fn(), list: vi.fn(), save: vi.fn(), review: vi.fn(), apply: vi.fn() }));
vi.mock('@/services/pricing/journeyCostingContext.service', () => ({ getCostingJourneys: mocks.context }));
vi.mock('@/services/pricing/journeyCostingStore.service', () => ({ listCostings: mocks.list, saveCosting: mocks.save, changeCostingStatus: mocks.review, approvedPricePreview: mocks.apply }));
import { GET, POST } from './route';
const post = (data: unknown, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/internal/journey-costing', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data) });
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('internal costing security and API validation', () => {
  it('production GET/POST deny before context, store or calculations', async () => {
    vi.stubEnv('NODE_ENV', 'production'); expect((await GET(new Request('http://localhost:3000/api/internal/journey-costing'))).status).toBe(404); expect((await POST(post({ action: 'calculate', input: syntheticCosting() }))).status).toBe(404);
    for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
  });
  it('rejects nonlocal hosts and cross-origin writes in development', async () => {
    vi.stubEnv('NODE_ENV', 'development'); expect((await GET(new Request('https://example.com/api/internal/journey-costing'))).status).toBe(403); expect((await POST(post({}, 'https://attacker.invalid'))).status).toBe(403); expect(mocks.save).not.toHaveBeenCalled();
  });
  it('validates and recalculates on the server; rejects arbitrary Journey mutation fields', async () => {
    vi.stubEnv('NODE_ENV', 'development'); const input = syntheticCosting();
    const result = await POST(post({ action: 'calculate', input })); expect(result.status).toBe(200); expect((await result.json()).calculation.subtotal).toBe(11200); expect(result.headers.get('cache-control')).toBe('no-store');
    for (const invalid of [{ action: 'calculate', input: { ...input, status: 'published' } }, { action: 'save', input, previous: null, status: 'OWNER_APPROVED' }, { action: 'calculate', input: { ...input, adultCount: -1 } }]) expect((await POST(post(invalid))).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('rejects oversized request and unknown review/execute actions', async () => {
    vi.stubEnv('NODE_ENV', 'development'); expect((await POST(post({ action: 'execute', status: 'published' }))).status).toBe(400); expect((await POST(post({ notes: 'x'.repeat(250001) }))).status).toBe(400);
  });
  it('lists Journey context and local revisions only after access checks', async () => {
    vi.stubEnv('NODE_ENV', 'development'); mocks.context.mockResolvedValue([SYNTHETIC_JOURNEY]); mocks.list.mockResolvedValue([]);
    const response = await GET(new Request('http://localhost:3000/api/internal/journey-costing'));
    expect(await response.json()).toMatchObject({ journeys: [SYNTHETIC_JOURNEY], revisions: [], storage: 'LOCAL_ONLY', productionAccess: false });
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
  it('saves only validated inputs matched to authoritative Journey context', async () => {
    vi.stubEnv('NODE_ENV', 'development'); mocks.context.mockResolvedValue([SYNTHETIC_JOURNEY]); mocks.save.mockResolvedValue({ version: 1, status: 'DRAFT' });
    const input = syntheticCosting(); expect((await POST(post({ action: 'save', input, previous: null }))).status).toBe(200);
    expect(mocks.save).toHaveBeenCalledWith(input, SYNTHETIC_JOURNEY, null);
    mocks.save.mockClear(); mocks.context.mockResolvedValue([]);
    expect((await POST(post({ action: 'save', input, previous: null }))).status).toBe(400); expect(mocks.save).not.toHaveBeenCalled();
  });
  it('rejects forged review state/confirmation and stale apply revisions', async () => {
    vi.stubEnv('NODE_ENV', 'development'); const id = '00000000-0000-0000-0000-000000000014';
    for (const patch of [{ status: 'PUBLISHED' }, { confirm: 'true' }, { reviewer: null }, { version: 0 }]) {
      expect((await POST(post({ action: 'review', id, version: 1, status: 'OWNER_APPROVED', reviewer: 'Owner', confirm: true, ...patch }))).status).toBe(400);
    }
    expect(mocks.review).not.toHaveBeenCalled(); mocks.list.mockResolvedValue([{ id, version: 2 }]);
    expect((await POST(post({ action: 'apply', id, version: 1, confirmation: 'APPLY demo-synthetic' }))).status).toBe(400); expect(mocks.apply).not.toHaveBeenCalled();
  });
});
