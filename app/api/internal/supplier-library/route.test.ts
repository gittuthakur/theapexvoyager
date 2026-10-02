import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoSupplier, demoHotelRate, demoSelection } from '@/services/pricing/supplierLibrary.fixture';
const mocks = vi.hoisted(() => ({ read: vi.fn(), supplier: vi.fn(), rate: vi.fn(), verify: vi.fn(), journeys: vi.fn(), costings: vi.fn() }));
vi.mock('@/services/pricing/supplierLibraryStore.service', async importOriginal => ({ ...await importOriginal<typeof import('@/services/pricing/supplierLibraryStore.service')>(), readLibrary: mocks.read, saveSupplier: mocks.supplier, saveRate: mocks.rate, verifySupplier: mocks.verify }));
vi.mock('@/services/pricing/journeyCostingContext.service', () => ({ getCostingJourneys: mocks.journeys }));
vi.mock('@/services/pricing/journeyCostingStore.service', () => ({ listCostings: mocks.costings }));
import { GET, POST } from './route';
const post = (data: unknown, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/internal/supplier-library', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data) });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });
describe('supplier library API isolation and explicit selection', () => {
  it('production GET/POST returns 404 before all storage/context access', async () => {
    vi.stubEnv('NODE_ENV', 'production'); expect((await GET(new Request('http://localhost:3000/api/internal/supplier-library'))).status).toBe(404); expect((await POST(post({ action: 'saveSupplier' }))).status).toBe(404);
    for (const m of Object.values(mocks)) expect(m).not.toHaveBeenCalled();
  });
  it('denies nonlocal hosts, cross-origin reads/writes, and missing origin', async () => {
    vi.stubEnv('NODE_ENV', 'development'); expect((await GET(new Request('https://example.com/api/internal/supplier-library'))).status).toBe(403); expect((await POST(post({}, 'https://example.com'))).status).toBe(403);
    expect((await POST(new Request('http://localhost:3000/api/internal/supplier-library', { method: 'POST' }))).status).toBe(403); expect(mocks.supplier).not.toHaveBeenCalled();
  });
  it('returns local data with no-store headers and conservative coverage', async () => {
    vi.stubEnv('NODE_ENV', 'development'); mocks.read.mockResolvedValue({ suppliers: [], rates: [], supplierHistory: [], rateHistory: [] }); mocks.journeys.mockResolvedValue([]); mocks.costings.mockResolvedValue([]);
    const result = await GET(new Request('http://localhost:3000/api/internal/supplier-library')); expect(result.status).toBe(200); expect(result.headers.get('cache-control')).toBe('no-store'); expect((await result.json()).coverage.summary.fullyCostable).toBe(0);
  });
  it('rejects field injection, unknown actions, invalid revisions and oversized bodies before store mutation', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const data of [{ action: 'saveSupplier', input: demoSupplier().input, previous: null, verified: true }, { action: 'publishJourney' }, { action: 'saveRate', input: demoHotelRate().input, previous: { id: 'bad', version: 0 } }, { action: 'verifySupplier', previous: null, status: 'VERIFIED', notes: 'x', confirmation: 'x' }, { notes: 'x'.repeat(250001) }]) expect((await POST(post(data))).status).toBe(400);
    for (const m of [mocks.supplier, mocks.rate, mocks.verify]) expect(m).not.toHaveBeenCalled();
  });
  it('requires explicit selection of current revision; snapshot excludes supplier contacts', async () => {
    vi.stubEnv('NODE_ENV', 'development'); const supplier = demoSupplier(); supplier.input.phone = '+91 9999999999'; supplier.input.email = 'demo@example.invalid'; const rate = demoHotelRate(); mocks.read.mockResolvedValue({ suppliers: [supplier], rates: [rate] });
    const request = { action: 'selectRate', previous: { id: rate.id, version: rate.version }, selection: demoSelection(), explicitSelection: false };
    expect((await POST(post(request))).status).toBe(400); const response = await POST(post({ ...request, explicitSelection: true })); const text = await response.text(); expect(response.status).toBe(200); expect(text).toContain('snapshotRate'); expect(text).not.toContain(supplier.input.phone); expect(text).not.toContain(supplier.input.email);
    expect((await POST(post({ ...request, explicitSelection: true, previous: { id: rate.id, version: 99 } }))).status).toBe(400);
  });
});
