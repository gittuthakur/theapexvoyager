import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const captureLead = vi.fn();
const getPackageBySlug = vi.fn();

vi.mock('@/services/leads/lead.service', () => ({ captureLead: (...a: unknown[]) => captureLead(...a) }));
vi.mock('@/lib/packages', () => ({ getPackageBySlug: (...a: unknown[]) => getPackageBySlug(...a) }));

import { POST } from '@/app/api/assistant/enquiry/route';

let ipCounter = 0;
const nextIp = () => `192.0.2.${(ipCounter += 1)}`;
const valid = { name: 'Asha Rao', phone: '+91 98765 43210', consent: true, destination: 'Kashmir' };

function post(body: unknown, ip = nextIp()) {
  return POST(new Request('http://localhost/api/assistant/enquiry', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'x-real-ip': ip } }));
}

beforeEach(() => {
  captureLead.mockReset().mockResolvedValue({ ok: true, value: { created: true } });
  getPackageBySlug.mockReset().mockResolvedValue({ slug: 'fixture-kashmir-escape' });
});
afterEach(() => vi.restoreAllMocks());

describe('POST /api/assistant/enquiry', () => {
  it('saves through the existing lead service and returns a bare acknowledgement only', async () => {
    const response = await post(valid);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ received: true });
    expect(captureLead).toHaveBeenCalledTimes(1);
    const [payload, actor] = captureLead.mock.calls[0];
    expect(actor).toBe('website');
    expect(payload).toMatchObject({ leadType: 'CUSTOM_TRIP', name: 'Asha Rao', attribution: { sourceDetail: 'ai-assistant' } });
  });

  it('works while the assistant is switched off (it does not involve the model)', async () => {
    vi.stubEnv('AI_ASSISTANT_MODE', 'off');
    expect((await post(valid)).status).toBe(201);
    vi.unstubAllEnvs();
  });

  it('marks an enquiry about a package as a JOURNEY lead, after checking the package is published', async () => {
    const response = await post({ ...valid, journeySlug: 'fixture-kashmir-escape' });
    expect(response.status).toBe(201);
    expect(getPackageBySlug).toHaveBeenCalledWith('fixture-kashmir-escape');
    expect(captureLead.mock.calls[0][0]).toMatchObject({ leadType: 'JOURNEY', journeySlug: 'fixture-kashmir-escape' });
  });

  it('refuses a package reference that is not a published journey', async () => {
    getPackageBySlug.mockResolvedValue(undefined);
    const response = await post({ ...valid, journeySlug: 'a-draft-or-made-up-slug' });
    expect(response.status).toBe(400);
    expect(captureLead).not.toHaveBeenCalled();
  });

  it('rejects invalid input without touching the lead service', async () => {
    for (const body of [{ ...valid, consent: false }, { ...valid, name: '' }, { name: 'A', consent: true }, '{bad json', JSON.stringify([])]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(captureLead).not.toHaveBeenCalled();
  });

  it('passes the lead validator error through (400) and never an internal one', async () => {
    captureLead.mockResolvedValue({ ok: false, error: 'Invalid phone number', status: 400 });
    const response = await post({ ...valid, phone: '12' });
    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toBe('Invalid phone number');
  });

  it('acknowledges a honeypot hit without saving anything', async () => {
    const response = await post({ ...valid, company: 'Spam Inc' });
    expect(response.status).toBe(201);
    expect(captureLead).not.toHaveBeenCalled();
  });

  it('refuses an oversized body', async () => {
    expect((await post(JSON.stringify({ ...valid, padding: 'x'.repeat(30_000) }))).status).toBe(413);
    expect(captureLead).not.toHaveBeenCalled();
  });

  it('returns a generic 500 with no details and logs no customer data when saving fails', async () => {
    captureLead.mockRejectedValue(new Error('mongo error for 9876543210'));
    const spies = (['log', 'error', 'warn'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const response = await post(valid);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toMatch(/mongo|9876543210/);
    expect(JSON.stringify(spies.flatMap((s) => s.mock.calls))).not.toMatch(/9876543210|Asha/);
  });

  it('rate limits per source address', async () => {
    const ip = '198.51.100.77';
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) statuses.push((await post(valid, ip)).status);
    expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});
