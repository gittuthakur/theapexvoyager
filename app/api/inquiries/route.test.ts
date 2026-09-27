import { beforeEach, expect, it, vi } from 'vitest';
const { create, notify } = vi.hoisted(() => ({ create: vi.fn(), notify: vi.fn() }));
vi.mock('next/server', async (original) => ({ ...await original<typeof import('next/server')>(), after: (callback: () => unknown) => callback() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/Inquiry', () => ({ Inquiry: { create } }));
vi.mock('@/lib/mailer', () => ({ sendBookingConfirmationEmails: notify }));
const { POST } = await import('./route');
const request = (phone: string) => new Request('https://test.invalid/api/inquiries', {
  method: 'POST', body: JSON.stringify({ name: 'Fixture', phone, selection: 'Fixture stay', selectionType: 'stay' })
});
beforeEach(() => { create.mockReset().mockImplementation(async value => ({ ...value, _id: 'fixture-id' })); notify.mockReset(); });
it('persists a valid enquiry before notifying the team', async () => {
  expect((await POST(request('+44 20 7946 0123'))).status).toBe(201);
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ referenceId: 'fixture-id', itemName: 'Fixture stay' }));
  expect(create.mock.invocationCallOrder[0]).toBeLessThan(notify.mock.invocationCallOrder[0]);
});
it('rejects an unusable phone number without persisting or notifying', async () => {
  expect((await POST(request('not a phone'))).status).toBe(400);
  expect(create).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalled();
});
