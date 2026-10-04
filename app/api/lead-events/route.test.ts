import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const svc = vi.hoisted(() => ({ captureLead: vi.fn() }));
vi.mock('@/services/leads/lead.service', () => svc);
vi.mock('@/lib/rateLimit', () => ({ isRateLimited: vi.fn().mockReturnValue(false) }));
const route = await import('./route');
const { validateLeadInput } = await import('@/lib/leads');

const body = (o: Record<string, unknown> = {}) => ({ kind: 'transport-whatsapp-customise', clickId: 'click-12345678', vehicle: 'Innova Crysta', pickup: 'Delhi', destination: 'Manali', date: '2026-11-10', ...o });
const post = (data: unknown) => new Request('https://test.invalid/api/lead-events', { method: 'POST', body: JSON.stringify(data) });
beforeEach(() => { svc.captureLead.mockReset().mockResolvedValue({ ok: true, value: { created: true } }); });

describe('POST /api/lead-events (Transport WhatsApp click)', () => {
  it('records TRANSPORT + WHATSAPP_CLICK with no contact details and answers with a bare ack', async () => {
    const response = await route.POST(post({ ...body(), phone: '9876543210', name: 'Injected', email: 'x@y.co', attribution: { utmSource: 'meta', utmCampaign: 'winter', landingPage: '/transport' } }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ received: true });
    const payload = svc.captureLead.mock.calls[0][0];
    expect(payload).toMatchObject({
      leadType: 'TRANSPORT', captureKind: 'WHATSAPP_CLICK', propertyRef: 'Innova Crysta', destination: 'Delhi → Manali', travelStartDate: '2026-11-10',
      legacyRef: { model: 'WhatsAppClick', id: 'click-12345678' },
      attribution: { source: 'whatsapp', utmSource: 'meta', utmCampaign: 'winter', landingPage: '/transport' }
    });
    for (const key of ['name', 'phone', 'email', 'whatsappNumber']) expect(payload).not.toHaveProperty(key);
  });
  it('the payload is a valid lead without any fabricated name/phone/email, and is not FORM_SUBMITTED', async () => {
    await route.POST(post(body()));
    const parsed = validateLeadInput(svc.captureLead.mock.calls[0][0]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.captureKind).toBe('WHATSAPP_CLICK');
      expect([parsed.value.name, parsed.value.phone, parsed.value.email]).toEqual([undefined, undefined, undefined]);
    }
  });
  it.each([
    [{ kind: 'something-else' }], [{ clickId: 'x' }], [{ clickId: 'bad id with spaces!' }], [{ vehicle: '' }], [{ date: '2026-99-99' }], [{ returnDate: 'tomorrow' }]
  ])('rejects invalid input %#', async override => {
    expect((await route.POST(post(body(override)))).status).toBe(400);
    expect(svc.captureLead).not.toHaveBeenCalled();
  });
  it('rejects non-JSON and oversized bodies', async () => {
    expect((await route.POST(new Request('https://test.invalid/api/lead-events', { method: 'POST', body: 'nope' }))).status).toBe(400);
    expect((await route.POST(post(body({ vehicle: 'x'.repeat(30_000) })))).status).toBe(413);
  });
  it('a persistence failure yields a safe 500 with no detail and no PII in logs', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    svc.captureLead.mockRejectedValue(new Error('mongo error for Innova Crysta'));
    const response = await route.POST(post(body()));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toMatch(/mongo|Innova/);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Innova|Delhi/);
    log.mockRestore();
  });
  it('is POST-only and exposes no CRM data', () => {
    const source = readFileSync(join(__dirname, 'route.ts'), 'utf8');
    expect(source).not.toMatch(/export (async )?function (GET|PUT|PATCH|DELETE)/);
    expect(source).not.toMatch(/serializeLead|listLeads|getLeadById/);
  });
});
