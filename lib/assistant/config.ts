// Server-only configuration for the AI Travel Assistant. Everything is read from the environment at
// call time (never at import time, never into client code) so a deployment can switch the assistant
// off without a rebuild. It is OFF unless AI_ASSISTANT_MODE is exactly "on" AND every other requirement
// below is present: a missing key or a missing usage limit fails closed instead of using a default.
export type AssistantMode = 'on' | 'off';

export interface AssistantConfig {
  mode: AssistantMode;
  apiKey?: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  /** Daily cap on assistant requests, shared across instances via MongoDB. Required: no default. */
  requestLimit?: number;
  /** Optional daily cap on total model tokens; enforced only when set. */
  tokenLimit?: number;
}

/**
 * Default model: OpenAI's `gpt-6-luna`, the low-cost model its documentation lists for high-volume work, with Chat Completions
 * and Structured Outputs support (https://developers.openai.com/api/docs/models/gpt-6-luna). Overridable with
 * OPENAI_ASSISTANT_MODEL. (An earlier draft used `gpt-5.6-luna`, which OpenAI's model list does not contain.)
 */
export const DEFAULT_ASSISTANT_MODEL = 'gpt-6-luna';

/**
 * Reasoning effort sent with every request. `none` is documented as supported by gpt-6-luna and keeps the whole output
 * budget for the JSON answer (reasoning tokens count against max_completion_tokens) and the cost low for what is a short
 * question-and-extraction task. A model that does not accept `none` (OpenAI documents that for some GPT-6 models) needs
 * OPENAI_ASSISTANT_REASONING_EFFORT=low.
 */
export const REASONING_EFFORTS = ['none', 'low', 'medium', 'high'] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'none';

function positiveInt(value: string | undefined): number | undefined {
  const text = value?.trim();
  if (!text || !/^\d{1,9}$/.test(text)) return undefined;
  const parsed = Number(text);
  return parsed > 0 ? parsed : undefined;
}

// A key is only usable as an HTTP header value if it is printable ASCII with no spaces. Anything else (a stray control
// character from a paste, a space, Unicode) makes fetch throw before any request is sent, so the key is treated as not
// configured: the widget stays hidden, /api/assistant answers 503, and no daily request slot is spent on a call that
// cannot succeed.
const VALID_API_KEY = /^[\x21-\x7E]+$/;

export function readAssistantConfig(env: Readonly<Record<string, string | undefined>> = process.env): AssistantConfig {
  const apiKey = env.OPENAI_API_KEY?.trim();
  return {
    mode: env.AI_ASSISTANT_MODE?.trim() === 'on' ? 'on' : 'off',
    apiKey: apiKey && VALID_API_KEY.test(apiKey) ? apiKey : undefined,
    model: env.OPENAI_ASSISTANT_MODEL?.trim() || DEFAULT_ASSISTANT_MODEL,
    reasoningEffort: (REASONING_EFFORTS as readonly string[]).includes(env.OPENAI_ASSISTANT_REASONING_EFFORT?.trim() ?? '')
      ? (env.OPENAI_ASSISTANT_REASONING_EFFORT!.trim() as ReasoningEffort)
      : DEFAULT_REASONING_EFFORT,
    requestLimit: positiveInt(env.AI_ASSISTANT_DAILY_REQUEST_LIMIT),
    tokenLimit: positiveInt(env.AI_ASSISTANT_DAILY_TOKEN_LIMIT)
  };
}

/** True only when the assistant may serve a request: switched on, credentialed, and with a configured daily limit. */
export function isAssistantReady(config: AssistantConfig): config is AssistantConfig & { apiKey: string; requestLimit: number } {
  return config.mode === 'on' && Boolean(config.apiKey) && typeof config.requestLimit === 'number' && config.requestLimit > 0;
}
