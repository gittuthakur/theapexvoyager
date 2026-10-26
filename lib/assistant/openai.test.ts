import { describe, expect, it, vi } from 'vitest';
import { callAssistantModel, MAX_COMPLETION_TOKENS, OPENAI_CHAT_URL, type FetchLike } from '@/lib/assistant/openai';
import { MODEL_OUTPUT_JSON_SCHEMA } from '@/lib/assistant/schema';

const config = { apiKey: 'test-key-not-real', model: 'gpt-6-luna', reasoningEffort: 'none' as const };
const messages = [{ role: 'user' as const, content: 'Kashmir in May' }];
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('callAssistantModel', () => {
  it('posts to the fixed OpenAI endpoint with the configured model, bounded output and structured output', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(ok({ choices: [{ message: { content: '{"intent":"ask"}' } }], usage: { total_tokens: 123 } }));
    const result = await callAssistantModel(config, messages, fetchImpl);
    expect(result).toEqual({ ok: true, content: '{"intent":"ask"}', tokens: 123 });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(OPENAI_CHAT_URL);
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.redirect).toBe('error');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key-not-real');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('gpt-6-luna');
    expect(body.max_completion_tokens).toBe(MAX_COMPLETION_TOKENS);
    expect(body.reasoning_effort).toBe('none');
    expect(body.response_format).toEqual({ type: 'json_schema', json_schema: MODEL_OUTPUT_JSON_SCHEMA });
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Kashmir in May' });
  });

  it('sends exactly the documented parameters: no deprecated max_tokens, no sampling parameters, no tools', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(ok({ choices: [{ message: { content: 'x' } }] }));
    await callAssistantModel(config, messages, fetchImpl);
    const body = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
    expect(Object.keys(body).sort()).toEqual(['max_completion_tokens', 'messages', 'model', 'reasoning_effort', 'response_format']);
    for (const absent of ['max_tokens', 'temperature', 'top_p', 'tools', 'stream', 'logprobs']) expect(body).not.toHaveProperty(absent);
  });

  it('uses the configured reasoning effort, and none when it is not provided', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(ok({ choices: [{ message: { content: 'x' } }] }));
    await callAssistantModel({ ...config, reasoningEffort: 'low' }, messages, fetchImpl);
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body)).reasoning_effort).toBe('low');
    await callAssistantModel({ apiKey: 'k', model: 'gpt-6-luna' }, messages, fetchImpl);
    expect(JSON.parse(String(fetchImpl.mock.calls[1][1].body)).reasoning_effort).toBe('none');
  });

  it('sends a strict structured-output schema in the shape strict mode requires', () => {
    const { strict, name, schema } = MODEL_OUTPUT_JSON_SCHEMA;
    expect(strict).toBe(true);
    expect(name).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    // Strict mode: every property must be listed as required.
    expect([...schema.required].sort()).toEqual(Object.keys(schema.properties).sort());
    // Optional values are expressed as nullable type arrays, never by omission.
    for (const key of ['destination', 'nights_min', 'nights_max', 'budget_per_person_inr', 'travellers', 'month']) {
      expect((schema.properties as unknown as Record<string, { type: readonly string[] }>)[key].type).toContain('null');
    }
  });

  it('does not call the network without a key', async () => {
    const fetchImpl = vi.fn<FetchLike>();
    expect(await callAssistantModel({ apiKey: undefined, model: 'm' }, messages, fetchImpl)).toEqual({ ok: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ['non-2xx status', () => new Response('{"error":"rate"}', { status: 429 })],
    ['invalid JSON body', () => new Response('not json', { status: 200 })],
    ['no choices', () => ok({ choices: [] })],
    ['non-string content', () => ok({ choices: [{ message: { content: 5 } }] })],
    ['empty content', () => ok({ choices: [{ message: { content: '' } }] })]
  ])('collapses %s to a failed result', async (_name, make) => {
    expect(await callAssistantModel(config, messages, async () => make())).toEqual({ ok: false });
  });

  it('collapses a network error and a timeout abort to a failed result', async () => {
    expect(await callAssistantModel(config, messages, async () => Promise.reject(new Error('down')))).toEqual({ ok: false });
    const hangs: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    vi.useFakeTimers();
    const pending = callAssistantModel(config, messages, hangs);
    await vi.advanceTimersByTimeAsync(16_000);
    expect(await pending).toEqual({ ok: false });
    vi.useRealTimers();
  });

  it('treats a missing usage block as zero tokens', async () => {
    const result = await callAssistantModel(config, messages, async () => ok({ choices: [{ message: { content: 'x' } }] }));
    expect(result).toEqual({ ok: true, content: 'x', tokens: 0 });
  });

  it('never writes the key, the request or the response to the console', async () => {
    const spies = (['log', 'error', 'warn', 'info', 'debug'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => {}));
    await callAssistantModel(config, messages, async () => new Response('boom', { status: 500 }));
    await callAssistantModel(config, messages, async () => Promise.reject(new Error('Bearer test-key-not-real')));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    spies.forEach((spy) => spy.mockRestore());
  });
});
