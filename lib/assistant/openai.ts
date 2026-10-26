import { DEFAULT_REASONING_EFFORT, type AssistantConfig } from '@/lib/assistant/config';
import { MODEL_OUTPUT_JSON_SCHEMA, type ChatMessage } from '@/lib/assistant/schema';
import { SYSTEM_PROMPT } from '@/lib/assistant/prompt';

// Fixed endpoint: the API key is only ever sent here, never to a configurable URL.
export const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
export const MODEL_TIMEOUT_MS = 15_000;
export const MAX_COMPLETION_TOKENS = 400;
const MAX_RESPONSE_CHARS = 60_000;

export type ModelCallResult = { ok: true; content: string; tokens: number } | { ok: false };

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/**
 * One server-side REST call (no SDK). Sends the already-redacted conversation, asks for strict structured output,
 * bounds output length and wall-clock time, and never logs the request, the response or the key. Any failure,
 * including a non-2xx status, a timeout or a malformed body, collapses to { ok: false }.
 */
export async function callAssistantModel(
  config: Pick<AssistantConfig, 'apiKey' | 'model'> & Partial<Pick<AssistantConfig, 'reasoningEffort'>>,
  messages: readonly ChatMessage[],
  fetchImpl: FetchLike = fetch
): Promise<ModelCallResult> {
  if (!config.apiKey) return { ok: false };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  try {
    const response = await fetchImpl(OPENAI_CHAT_URL, {
      method: 'POST',
      redirect: 'error',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
        response_format: { type: 'json_schema', json_schema: MODEL_OUTPUT_JSON_SCHEMA },
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        // No sampling parameters (temperature/top_p) are sent: OpenAI's GPT-6 guide says to omit them whenever reasoning is on.
        reasoning_effort: config.reasoningEffort ?? DEFAULT_REASONING_EFFORT
      })
    });
    if (!response.ok) return { ok: false };
    const text = (await response.text()).slice(0, MAX_RESPONSE_CHARS);
    const data = JSON.parse(text) as { choices?: { message?: { content?: unknown } }[]; usage?: { total_tokens?: unknown } };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content) return { ok: false };
    const tokens = typeof data.usage?.total_tokens === 'number' && Number.isFinite(data.usage.total_tokens) ? data.usage.total_tokens : 0;
    return { ok: true, content, tokens };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}
