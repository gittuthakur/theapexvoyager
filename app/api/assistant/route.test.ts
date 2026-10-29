import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogue } from '@/lib/assistant/testFixtures';

const reserveRequest = vi.fn();
const recordTokens = vi.fn();
const callAssistantModel = vi.fn();
const getAllPackages = vi.fn();

vi.mock('@/lib/assistant/budget', () => ({ reserveRequest: (...a: unknown[]) => reserveRequest(...a), recordTokens: (...a: unknown[]) => recordTokens(...a) }));
vi.mock('@/lib/assistant/openai', () => ({ callAssistantModel: (...a: unknown[]) => callAssistantModel(...a) }));
vi.mock('@/lib/packages', () => ({ getAllPackages: (...a: unknown[]) => getAllPackages(...a) }));

import { GET, POST } from '@/app/api/assistant/route';

let ipCounter = 0;
const nextIp = () => `203.0.113.${(ipCounter += 1)}`;

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(new Request('http://localhost/api/assistant', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'x-real-ip': nextIp(), ...headers } }));
}
const chat = (content = 'Kashmir in May') => ({ messages: [{ role: 'user', content }] });
const modelAnswer = (o: Record<string, unknown>) =>
  JSON.stringify({ intent: 'search', reply: 'ok', destination: 'Kashmir', nights_min: null, nights_max: null, budget_per_person_inr: null, travellers: null, month: null, ...o });

function turnOn() {
  vi.stubEnv('AI_ASSISTANT_MODE', 'on');
  vi.stubEnv('OPENAI_API_KEY', 'test-key-not-real');
  vi.stubEnv('AI_ASSISTANT_DAILY_REQUEST_LIMIT', '100');
}

beforeEach(() => {
  reserveRequest.mockReset().mockResolvedValue({ ok: true, day: '2027-03-05' });
  recordTokens.mockReset().mockResolvedValue(undefined);
  callAssistantModel.mockReset().mockResolvedValue({ ok: true, content: modelAnswer({}), tokens: 50 });
  getAllPackages.mockReset().mockResolvedValue(catalogue());
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GET /api/assistant (status)', () => {
  it('reports disabled by default and reveals no reason', async () => {
    const response = await GET();
    expect(await response.json()).toEqual({ enabled: false });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('reports enabled only when mode, key and daily limit are all set', async () => {
    turnOn();
    expect(await (await GET()).json()).toEqual({ enabled: true });
    vi.stubEnv('AI_ASSISTANT_DAILY_REQUEST_LIMIT', '');
    expect(await (await GET()).json()).toEqual({ enabled: false });
  });
});

describe('a malformed OPENAI_API_KEY', () => {
  it('keeps the widget hidden and spends no budget, model call or database read', async () => {
    turnOn();
    vi.stubEnv('OPENAI_API_KEY', `test${String.fromCharCode(0x16)}key-not-real`);
    expect(await (await GET()).json()).toEqual({ enabled: false });
    const response = await post(chat());
    expect(response.status).toBe(503);
    expect(reserveRequest).not.toHaveBeenCalled();
    expect(callAssistantModel).not.toHaveBeenCalled();
    expect(getAllPackages).not.toHaveBeenCalled();
  });
});

describe('POST /api/assistant', () => {
  it('is disabled by default: 503 and no budget use, model call or database read', async () => {
    const response = await post(chat());
    expect(response.status).toBe(503);
    expect(reserveRequest).not.toHaveBeenCalled();
    expect(callAssistantModel).not.toHaveBeenCalled();
    expect(getAllPackages).not.toHaveBeenCalled();
  });

  it('answers with verified cards when enabled', async () => {
    turnOn();
    const response = await post(chat());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cards[0].url).toBe('/journeys/fixture-kashmir-escape');
    expect(getAllPackages).toHaveBeenCalledWith({ maxTimeMS: 3000 });
    expect(recordTokens).toHaveBeenCalledWith(50);
  });

  it('sends contact details to nobody: the model request is redacted', async () => {
    turnOn();
    await post(chat('call me on 9876543210 or mail me at a@b.com, Kashmir please'));
    const sent = JSON.stringify(callAssistantModel.mock.calls[0][1]);
    expect(sent).not.toMatch(/9876543210|a@b\.com/);
    expect(sent).toContain('Kashmir');
  });

  it('fails closed when the shared budget is exhausted, without calling the model', async () => {
    turnOn();
    reserveRequest.mockResolvedValue({ ok: false, reason: 'exhausted' });
    const response = await post(chat());
    expect(response.status).toBe(503);
    expect(callAssistantModel).not.toHaveBeenCalled();
  });

  it('fails closed when the budget cannot be checked', async () => {
    turnOn();
    reserveRequest.mockResolvedValue({ ok: false, reason: 'unavailable' });
    expect((await post(chat())).status).toBe(503);
    expect(callAssistantModel).not.toHaveBeenCalled();
  });

  it('returns a clean error when the model call fails', async () => {
    turnOn();
    callAssistantModel.mockResolvedValue({ ok: false });
    const response = await post(chat());
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe('ASSISTANT_ERROR');
  });

  it('validates the request before spending anything', async () => {
    turnOn();
    for (const body of ['not json', '[]', JSON.stringify({ messages: [] }), JSON.stringify(chat('a'.repeat(501)))]) {
      const response = await post(body);
      expect(response.status).toBe(400);
    }
    expect(reserveRequest).not.toHaveBeenCalled();
    expect(callAssistantModel).not.toHaveBeenCalled();
  });

  it('refuses an oversized body', async () => {
    turnOn();
    const response = await post(JSON.stringify({ messages: [{ role: 'user', content: 'x' }], padding: 'y'.repeat(20_000) }));
    expect(response.status).toBe(413);
    expect(reserveRequest).not.toHaveBeenCalled();
  });

  it('rate limits per source address using the trusted address, not a spoofable left-most header', async () => {
    turnOn();
    const ip = '198.51.100.9';
    const statuses: number[] = [];
    for (let i = 0; i < 14; i += 1) {
      statuses.push((await POST(new Request('http://localhost/api/assistant', { method: 'POST', body: JSON.stringify(chat()), headers: { 'x-real-ip': ip, 'x-forwarded-for': `10.0.0.${i}` } }))).status);
    }
    expect(statuses.slice(0, 12).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(12)).toEqual([429, 429]);
  });

  it('does not log user text, the key or the request on an unexpected failure', async () => {
    turnOn();
    getAllPackages.mockRejectedValue(new Error('db down with secret'));
    const spies = (['log', 'error', 'warn'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    reserveRequest.mockRejectedValue(new Error('boom with a@b.com'));
    const response = await post(chat('my number is 9876543210'));
    expect(response.status).toBe(500);
    const logged = JSON.stringify(spies.flatMap((s) => s.mock.calls));
    expect(logged).not.toMatch(/9876543210|a@b\.com|test-key-not-real|secret/);
  });
});
