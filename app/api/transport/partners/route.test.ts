import { beforeEach, expect, it, vi } from 'vitest';
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/TransportPartner', () => ({ TransportPartner: { create } }));
const { POST } = await import('./route');
beforeEach(() => create.mockReset().mockResolvedValue({ _id: 'fixture', status: 'pending' }));
const fixture = { businessName: 'Fixture', phone: '+91 98765 43210', state: 'Himachal Pradesh', partnerTypes: ['Cab Operator'], serviceAreas: ['Shimla'] };
it('validates contact fields and vehicle counts before persisting', async () => {
  for (const extra of [{ phone: 'abc' }, { email: 'a(b)@example.invalid' }, { numberOfVehicles: -1 }, { numberOfVehicles: 1.2 }]) {
    expect((await POST(new Request('https://test.invalid/api/transport/partners', { method: 'POST', body: JSON.stringify({ ...fixture, ...extra }) }))).status).toBe(400);
  }
  expect(create).not.toHaveBeenCalled();
});
it('accepts a valid application and keeps status server-controlled', async () => {
  const response = await POST(new Request('https://test.invalid/api/transport/partners', { method: 'POST', body: JSON.stringify({ ...fixture, status: 'verified' }) }));
  expect(response.status).toBe(201);
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
});
