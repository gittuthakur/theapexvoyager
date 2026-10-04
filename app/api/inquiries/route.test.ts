import { beforeEach, expect, it, vi } from 'vitest';
const { create, notify } = vi.hoisted(() => ({ create: vi.fn(), notify: vi.fn() }));
vi.mock('next/server', async (original) => ({ ...await original<typeof import('next/server')>(), after: (callback: () => unknown) => callback() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
const { mirror } = vi.hoisted(() => ({ mirror: vi.fn() }));
vi.mock('@/services/leads/lead.service', () => ({ mirrorLegacyLead: mirror }));
vi.mock('@/models/Inquiry', () => ({ Inquiry: { create } }));
vi.mock('@/lib/mailer', () => ({ sendBookingConfirmationEmails: notify }));
const { POST } = await import('./route');
const request = (phone: string) => new Request('https://test.invalid/api/inquiries', {
  method: 'POST', body: JSON.stringify({ name: 'Fixture', phone, selection: 'Fixture destination', selectionType: 'destination' })
});
beforeEach(() => { create.mockReset().mockImplementation(async value => ({ ...value, _id: 'fixture-id' })); notify.mockReset(); });
it('persists a valid enquiry before notifying the team', async () => {
  expect((await POST(request('+44 20 7946 0123'))).status).toBe(201);
  expect(notify).toHaveBeenCalledWith(expect.objectContaining({ referenceId: 'fixture-id', itemName: 'Fixture destination' }));
  expect(create.mock.invocationCallOrder[0]).toBeLessThan(notify.mock.invocationCallOrder[0]);
});
it('rejects an unusable phone number without persisting or notifying', async () => {
  expect((await POST(request('not a phone'))).status).toBe(400);
  expect(create).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalled();
});
it('rejects a "stay" selectionType — no booking/pricing agreement exists with any Stay property', async () => {
  const staySelection = new Request('https://test.invalid/api/inquiries', {
    method: 'POST',
    body: JSON.stringify({ name: 'Fixture', phone: '+44 20 7946 0123', selection: 'Fixture stay', selectionType: 'stay' })
  });
  expect((await POST(staySelection)).status).toBe(400);
  expect(create).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalled();
});
it('mirrors a saved enquiry into the CRM with its attribution, after persistence, without changing the response', async () => {
  const body = { name: 'Fixture', phone: '+44 20 7946 0123', selection: 'Fixture destination', selectionType: 'destination', sourcePage: '/destinations/x', attribution: { utmSource: 'meta', utmCampaign: 'winter' } };
  const response = await POST(new Request('https://test.invalid/api/inquiries', { method: 'POST', body: JSON.stringify(body) }));
  expect(response.status).toBe(201);
  expect(mirror).toHaveBeenCalledWith(expect.objectContaining({ captureKind: 'FORM_SUBMITTED', destination: 'Fixture destination', legacyRef: { model: 'Inquiry', id: 'fixture-id' }, attribution: expect.objectContaining({ utmSource: 'meta', source: 'meta', landingPage: '/destinations/x' }) }));
  expect(create.mock.invocationCallOrder[0]).toBeLessThan(mirror.mock.invocationCallOrder[0]);
  expect(JSON.stringify(await response.json())).not.toMatch(/status|priority|internalNotes|events/);
});
it('does not mirror a rejected submission', async () => {
  await POST(request('not a phone'));
  expect(mirror).not.toHaveBeenCalled();
});
