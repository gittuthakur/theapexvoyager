import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ postJSON: vi.fn(), track: vi.fn(), open: vi.fn() }));
vi.mock('@/lib/api', () => ({ postJSON: m.postJSON }));
vi.mock('@/lib/googleAds', () => ({ trackWhatsAppConversion: m.track }));
const { openTransportWhatsAppLead } = await import('./whatsapp');

const vehicle = { id: 'veh-1', slug: 'innova-crysta', name: 'Innova Crysta', serviceType: 'CHAUFFEUR' };
const call = (overrides = {}) => openTransportWhatsAppLead({ vehicle, pickup: 'Delhi', destination: 'Manali', date: '2026-11-10', travelers: '4', ...overrides });

beforeEach(() => {
  Object.values(m).forEach(f => f.mockReset());
  m.postJSON.mockResolvedValue({ received: true });
  vi.stubGlobal('window', { open: m.open });
});
afterEach(() => vi.unstubAllGlobals());

describe('Transport "Customise on WhatsApp"', () => {
  it('never sends the placeholder phone, a name or an email, and never uses /api/booking-requests', async () => {
    await call();
    expect(m.postJSON).toHaveBeenCalledTimes(1);
    const [url, payload] = m.postJSON.mock.calls[0];
    expect(url).toBe('/api/lead-events');
    expect(JSON.stringify(payload)).not.toMatch(/Not provided|WhatsApp Lead/);
    for (const key of ['phone', 'name', 'email', 'whatsappNumber']) expect(payload).not.toHaveProperty(key);
    expect(payload).toMatchObject({ kind: 'transport-whatsapp-customise', vehicle: 'Innova Crysta', pickup: 'Delhi', destination: 'Manali', date: '2026-11-10' });
  });
  it('opens WhatsApp exactly as before (same link, noopener) and fires the Google Ads conversion once', async () => {
    await call();
    expect(m.track).toHaveBeenCalledTimes(1);
    expect(m.open).toHaveBeenCalledTimes(1);
    const [href, target, features] = m.open.mock.calls[0];
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(decodeURIComponent(href)).toContain('Vehicle: Innova Crysta');
    expect([target, features]).toEqual(['_blank', 'noopener,noreferrer']);
    expect(m.track.mock.invocationCallOrder[0]).toBeLessThan(m.open.mock.invocationCallOrder[0]);
  });
  it('still opens WhatsApp and converts when click capture rejects, logging only a constant technical message', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.postJSON.mockRejectedValue(new Error('db down - Innova Crysta Delhi Manali'));
    await call();
    expect(m.open).toHaveBeenCalledTimes(1);
    expect(m.track).toHaveBeenCalledTimes(1);
    await new Promise(r => setTimeout(r, 0));
    expect(log).toHaveBeenCalledWith('WhatsApp click capture failed');
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Innova|Delhi|Manali/);
    log.mockRestore();
  });
  it('does not wait for the capture request before opening WhatsApp', async () => {
    m.postJSON.mockReturnValue(new Promise(() => {}));
    await call();
    expect(m.open).toHaveBeenCalledTimes(1);
  });
  it('reuses one clickId for a rapid double click on the same route, but not a different route', async () => {
    await call({ pickup: 'Shimla' });
    await call({ pickup: 'Shimla' });
    await call({ pickup: 'Chandigarh' });
    const ids = m.postJSON.mock.calls.map(c => c[1].clickId);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[0]);
    expect(ids[0]).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
});
