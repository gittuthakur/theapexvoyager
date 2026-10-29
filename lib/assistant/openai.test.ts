import { describe, expect, it, vi } from 'vitest';
import { callAssistantModel, MAX_COMPLETION_TOKENS, MODEL_TIMEOUT_MS, OPENAI_CHAT_URL, type FetchLike } from '@/lib/assistant/openai';
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

  describe('console diagnostics', () => {
    const SAFE_KEYS = ['category', 'code', 'status', 'type'];
    const secrets = ['test-key-not-real', 'Bearer', 'Authorization', 'Kashmir in May', 'SECRET-ERROR-MESSAGE', 'SECRET-BODY-FIELD'];

    function spyConsole() {
      const quiet = (['log', 'warn', 'info', 'debug'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => {}));
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      return {
        error,
        restore: () => [...quiet, error].forEach((spy) => spy.mockRestore()),
        expectQuiet: () => quiet.forEach((spy) => expect(spy).not.toHaveBeenCalled()),
        expectNoSecrets: () => {
          const logged = JSON.stringify(error.mock.calls);
          for (const secret of secrets) expect(logged).not.toContain(secret);
        }
      };
    }

    it('logs only category, status, error type and error code for an HTTP failure, never the key, request, message or body', async () => {
      const spy = spyConsole();
      const body = { error: { type: 'invalid_request_error', code: 'model_not_found', message: 'SECRET-ERROR-MESSAGE', extra: 'SECRET-BODY-FIELD' } };
      const result = await callAssistantModel(config, messages, async () => new Response(JSON.stringify(body), { status: 404 }));
      expect(result).toEqual({ ok: false });
      expect(spy.error).toHaveBeenCalledTimes(1);
      const [label, fields] = spy.error.mock.calls[0];
      expect(label).toBe('[api/assistant] model call failed');
      expect(Object.keys(fields as object).sort()).toEqual(SAFE_KEYS);
      expect(fields).toEqual({ category: 'http_error', status: 404, type: 'invalid_request_error', code: 'model_not_found' });
      spy.expectQuiet();
      spy.expectNoSecrets();
      spy.restore();
    });

    it('logs the status alone when the error body is not JSON or has no error object, without echoing the body', async () => {
      const spy = spyConsole();
      await callAssistantModel(config, messages, async () => new Response('SECRET-BODY-FIELD Bearer test-key-not-real', { status: 500 }));
      await callAssistantModel(config, messages, async () => new Response(JSON.stringify({ detail: 'SECRET-BODY-FIELD' }), { status: 401 }));
      expect(spy.error.mock.calls.map(([, fields]) => fields)).toEqual([
        { category: 'http_error', status: 500, type: undefined, code: undefined },
        { category: 'http_error', status: 401, type: undefined, code: undefined }
      ]);
      spy.expectQuiet();
      spy.expectNoSecrets();
      spy.restore();
    });

    it('reduces an unexpected error type or code to a short, safe token', async () => {
      const spy = spyConsole();
      const body = { error: { type: 'bad type\nwith "quotes" and Bearer test-key-not-real'.repeat(5), code: 429 } };
      await callAssistantModel(config, messages, async () => new Response(JSON.stringify(body), { status: 429 }));
      const [, fields] = spy.error.mock.calls[0] as [string, { type: string; code: string }];
      expect(fields.type.length).toBeLessThanOrEqual(60);
      expect(fields.type).toMatch(/^[\w.-]+$/);
      expect(fields.code).toBe('429');
      spy.restore();
    });

    it('logs only a category and the error class for a rejected fetch, never the thrown message', async () => {
      const spy = spyConsole();
      const result = await callAssistantModel(config, messages, async () => Promise.reject(new Error('Bearer test-key-not-real SECRET-ERROR-MESSAGE')));
      expect(result).toEqual({ ok: false });
      expect(spy.error.mock.calls).toEqual([
        ['[api/assistant] model call failed', { category: 'network_error', status: undefined, type: undefined, code: undefined, errorName: 'Error', causeCode: undefined, causeName: undefined }]
      ]);
      spy.expectQuiet();
      spy.expectNoSecrets();
      spy.restore();
    });

    it('logs errorName, causeCode and causeName for a fetch failure like Node undici produces, and nothing else', async () => {
      const spy = spyConsole();
      const cause = Object.assign(new Error('getaddrinfo ENOTFOUND api.openai.com SECRET-ERROR-MESSAGE'), { code: 'ENOTFOUND', hostname: 'SECRET-BODY-FIELD' });
      const thrown = Object.assign(new TypeError('fetch failed Bearer test-key-not-real'), { cause });
      await callAssistantModel(config, messages, async () => Promise.reject(thrown));
      expect(spy.error).toHaveBeenCalledTimes(1);
      const [label, fields] = spy.error.mock.calls[0];
      expect(label).toBe('[api/assistant] model call failed');
      expect(Object.keys(fields as object).sort()).toEqual(['category', 'causeCode', 'causeName', 'code', 'errorName', 'status', 'type']);
      expect(fields).toEqual({ category: 'network_error', status: undefined, type: undefined, code: undefined, errorName: 'TypeError', causeCode: 'ENOTFOUND', causeName: 'Error' });
      spy.expectQuiet();
      spy.expectNoSecrets();
      expect(JSON.stringify(spy.error.mock.calls)).not.toMatch(/getaddrinfo|api\.openai\.com|fetch failed|stack|at .*\(/);
      spy.restore();
    });

    it('drops message-like error names and cause fields instead of logging them, and tolerates non-Error throws', async () => {
      const spy = spyConsole();
      const cause = { code: 'E BAD\nCODE Bearer test-key-not-real', name: `${'A'.repeat(61)}` };
      const thrown = Object.assign(new Error('SECRET-ERROR-MESSAGE'), { name: 'Odd Name "x" test-key-not-real' }, { cause });
      await callAssistantModel(config, messages, async () => Promise.reject(thrown));
      await callAssistantModel(config, messages, async () => Promise.reject('SECRET-ERROR-MESSAGE Bearer test-key-not-real'));
      await callAssistantModel(config, messages, async () => Promise.reject(Object.assign(new Error('x'), { cause: 'SECRET-BODY-FIELD' })));
      await callAssistantModel(config, messages, async () => Promise.reject(Object.assign(new Error('x'), { cause: { code: 42, name: null } })));
      const logged = spy.error.mock.calls.map(([, fields]) => fields);
      expect(logged).toEqual([
        { category: 'network_error', status: undefined, type: undefined, code: undefined, errorName: undefined, causeCode: undefined, causeName: undefined },
        { category: 'network_error', status: undefined, type: undefined, code: undefined, errorName: 'string', causeCode: undefined, causeName: undefined },
        { category: 'network_error', status: undefined, type: undefined, code: undefined, errorName: 'Error', causeCode: undefined, causeName: undefined },
        { category: 'network_error', status: undefined, type: undefined, code: undefined, errorName: 'Error', causeCode: undefined, causeName: undefined }
      ]);
      spy.expectQuiet();
      spy.expectNoSecrets();
      spy.restore();
    });

    it('does not add error metadata fields to HTTP failures', async () => {
      const spy = spyConsole();
      await callAssistantModel(config, messages, async () => new Response('{}', { status: 500 }));
      expect(Object.keys(spy.error.mock.calls[0][1] as object).sort()).toEqual(SAFE_KEYS);
      spy.restore();
    });

    it('logs the malformed_body and empty_content categories without the response text', async () => {
      const spy = spyConsole();
      await callAssistantModel(config, messages, async () => new Response('SECRET-BODY-FIELD not json', { status: 200 }));
      await callAssistantModel(config, messages, async () => ok({ choices: [{ message: { content: '' } }], note: 'SECRET-BODY-FIELD' }));
      expect(spy.error.mock.calls.map(([, fields]) => fields)).toEqual([
        { category: 'malformed_body', status: undefined, type: undefined, code: undefined, errorName: 'SyntaxError', causeCode: undefined, causeName: undefined },
        { category: 'empty_content', status: 200, type: undefined, code: undefined }
      ]);
      spy.expectQuiet();
      spy.expectNoSecrets();
      spy.restore();
    });

    it('logs the timeout category, and nothing at all on success', async () => {
      const spy = spyConsole();
      vi.useFakeTimers();
      const pending = callAssistantModel(config, messages, (_url, init) => new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
      await vi.advanceTimersByTimeAsync(MODEL_TIMEOUT_MS + 1);
      expect(await pending).toEqual({ ok: false });
      vi.useRealTimers();
      expect(spy.error.mock.calls).toEqual([['[api/assistant] model call failed', { category: 'timeout', status: undefined, type: undefined, code: undefined, errorName: 'Error', causeCode: undefined, causeName: undefined }]]);

      spy.error.mockClear();
      await callAssistantModel(config, messages, async () => ok({ choices: [{ message: { content: 'x' } }] }));
      expect(spy.error).not.toHaveBeenCalled();
      spy.expectQuiet();
      spy.restore();
    });
  });
});
