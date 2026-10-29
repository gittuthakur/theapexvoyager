import { DEFAULT_REASONING_EFFORT, type AssistantConfig } from '@/lib/assistant/config';
import { MODEL_OUTPUT_JSON_SCHEMA, type ChatMessage } from '@/lib/assistant/schema';
import { SYSTEM_PROMPT } from '@/lib/assistant/prompt';

// Fixed endpoint: the API key is only ever sent here, never to a configurable URL.
export const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
export const MODEL_TIMEOUT_MS = 15_000;
export const MAX_COMPLETION_TOKENS = 400;
const MAX_RESPONSE_CHARS = 60_000;

export type ModelCallResult = { ok: true; content: string; tokens: number } | { ok: false };

// Sanitized failure diagnostics (server console only), so an operator can tell a provider error from a network or
// configuration fault without exposing anything sensitive. One line per failed model call, built only from an allowlist:
// a category, the HTTP status, OpenAI's error.type / error.code and, for a rejected fetch, the error and cause class
// names / codes, each reduced to a short token. Never the key, headers, prompt, response body, error message or stack.
function safeToken(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number' ? String(value).slice(0, 60).replace(/[^\w.-]/g, '_') : undefined;
}

// Stricter than safeToken, for error metadata: a value is logged only if it already is a plain identifier such as
// "TypeError" or "ENOTFOUND"; anything message-like (spaces, quotes, long text) is dropped, not mangled.
function safeIdentifier(value: unknown): string | undefined {
  return typeof value === 'string' && /^[A-Za-z][\w.-]{0,59}$/.test(value) ? value : undefined;
}

function logDiagnostic(category: string, status?: number, type?: unknown, code?: unknown, thrown?: unknown): void {
  const fields: Record<string, unknown> = { category, status, type: safeToken(type), code: safeToken(code) };
  if (thrown !== undefined) {
    // Rejected fetch only: the error's class name and its cause's code/name (e.g. ENOTFOUND). Never `message` or `stack`.
    const cause = thrown instanceof Error ? (thrown as { cause?: { code?: unknown; name?: unknown } | null }).cause : undefined;
    fields.errorName = thrown instanceof Error ? safeIdentifier(thrown.name) : typeof thrown;
    fields.causeCode = safeIdentifier(cause?.code);
    fields.causeName = safeIdentifier(cause?.name);
  }
  console.error('[api/assistant] model call failed', fields);
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/**
 * One server-side REST call (no SDK). Sends the already-redacted conversation, asks for strict structured output,
 * bounds output length and wall-clock time, and never logs the request, the response or the key. Any failure,
 * including a non-2xx status, a timeout or a malformed body, collapses to { ok: false } after one sanitized
 * diagnostic line (see logDiagnostic); the caller shows the visitor only a generic message.
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
    if (!response.ok) {
      let type: unknown;
      let code: unknown;
      try {
        const err = JSON.parse((await response.text()).slice(0, MAX_RESPONSE_CHARS)) as { error?: { type?: unknown; code?: unknown } };
        type = err.error?.type;
        code = err.error?.code;
      } catch {
        // Error body was not JSON: log the status alone.
      }
      logDiagnostic('http_error', response.status, type, code);
      return { ok: false };
    }
    const text = (await response.text()).slice(0, MAX_RESPONSE_CHARS);
    const data = JSON.parse(text) as { choices?: { message?: { content?: unknown } }[]; usage?: { total_tokens?: unknown } };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content) {
      logDiagnostic('empty_content', response.status);
      return { ok: false };
    }
    const tokens = typeof data.usage?.total_tokens === 'number' && Number.isFinite(data.usage.total_tokens) ? data.usage.total_tokens : 0;
    return { ok: true, content, tokens };
  } catch (error) {
    const name = error instanceof Error ? error.name : 'unknown';
    logDiagnostic(controller.signal.aborted ? 'timeout' : name === 'SyntaxError' ? 'malformed_body' : 'network_error', undefined, undefined, undefined, error);
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}
