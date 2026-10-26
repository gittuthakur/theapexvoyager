import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSISTANT_MODEL, DEFAULT_REASONING_EFFORT, isAssistantReady, readAssistantConfig } from '@/lib/assistant/config';

const full = { AI_ASSISTANT_MODE: 'on', OPENAI_API_KEY: 'test-key-not-real', AI_ASSISTANT_DAILY_REQUEST_LIMIT: '50' };

describe('assistant config', () => {
  it('is off by default', () => {
    const config = readAssistantConfig({});
    expect(config.mode).toBe('off');
    expect(isAssistantReady(config)).toBe(false);
  });

  it('only the exact value "on" switches it on', () => {
    for (const mode of ['ON', 'true', '1', 'yes', ' off', '']) {
      expect(readAssistantConfig({ ...full, AI_ASSISTANT_MODE: mode }).mode).toBe('off');
    }
    expect(readAssistantConfig({ ...full, AI_ASSISTANT_MODE: ' on ' }).mode).toBe('on');
  });

  it('fails closed when the key or the daily request limit is missing or invalid', () => {
    expect(isAssistantReady(readAssistantConfig({ ...full, OPENAI_API_KEY: '' }))).toBe(false);
    expect(isAssistantReady(readAssistantConfig({ ...full, OPENAI_API_KEY: '   ' }))).toBe(false);
    for (const limit of [undefined, '', '0', '-5', '1.5', 'abc', '99999999999']) {
      expect(isAssistantReady(readAssistantConfig({ ...full, AI_ASSISTANT_DAILY_REQUEST_LIMIT: limit }))).toBe(false);
    }
    expect(isAssistantReady(readAssistantConfig(full))).toBe(true);
  });

  it('has no built-in spending limit', () => {
    expect(readAssistantConfig({ ...full, AI_ASSISTANT_DAILY_REQUEST_LIMIT: undefined }).requestLimit).toBeUndefined();
    expect(readAssistantConfig(full).tokenLimit).toBeUndefined();
  });

  it('defaults to gpt-6-luna, the model OpenAI documents, and never to the nonexistent gpt-5.6-luna', () => {
    expect(DEFAULT_ASSISTANT_MODEL).toBe('gpt-6-luna');
    expect(DEFAULT_ASSISTANT_MODEL).not.toBe('gpt-5.6-luna');
    expect(readAssistantConfig(full).model).toBe('gpt-6-luna');
    expect(readAssistantConfig({ ...full, OPENAI_ASSISTANT_MODEL: '' }).model).toBe('gpt-6-luna');
    expect(readAssistantConfig({ ...full, OPENAI_ASSISTANT_MODEL: '   ' }).model).toBe('gpt-6-luna');
  });

  it('keeps the model configurable on the server', () => {
    expect(readAssistantConfig({ ...full, OPENAI_ASSISTANT_MODEL: ' other-model ' }).model).toBe('other-model');
  });

  it('defaults reasoning effort to none and only accepts known values', () => {
    expect(DEFAULT_REASONING_EFFORT).toBe('none');
    expect(readAssistantConfig(full).reasoningEffort).toBe('none');
    for (const value of ['low', 'medium', 'high', ' low ']) expect(readAssistantConfig({ ...full, OPENAI_ASSISTANT_REASONING_EFFORT: value }).reasoningEffort).toBe(value.trim());
    for (const value of ['xhigh', 'LOW', 'fast', '']) expect(readAssistantConfig({ ...full, OPENAI_ASSISTANT_REASONING_EFFORT: value }).reasoningEffort).toBe('none');
  });
});
