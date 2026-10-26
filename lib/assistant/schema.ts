import { redactContactDetails } from '@/lib/assistant/redact';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const MAX_USER_CHARS = 500;
export const MAX_ASSISTANT_CHARS = 600;
export const MAX_MESSAGES = 12;
export const MAX_USER_TURNS = 6;
export const MAX_BODY_BYTES = 12_000;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = (value: string) => value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();

/**
 * Validates an untrusted chat history. User messages over the limit are refused (the UI enforces the same
 * limit), assistant messages are truncated, and every message is redacted of contact details before it can
 * reach a model request. Assistant turns come from the browser and are therefore untrusted too: nothing the
 * model says is ever shown as a package fact (cards and prices are built server-side), so a forged assistant
 * turn cannot create one.
 */
export function parseChatRequest(body: unknown): { ok: true; messages: ChatMessage[] } | { ok: false } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false };
  const raw = (body as Record<string, unknown>).messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return { ok: false };
  const messages: ChatMessage[] = [];
  let userTurns = 0;
  for (const item of raw) {
    if (!item || typeof item !== 'object') return { ok: false };
    const { role, content } = item as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return { ok: false };
    const text = clean(content);
    if (!text) return { ok: false };
    if (role === 'user') {
      if (text.length > MAX_USER_CHARS) return { ok: false };
      userTurns += 1;
    }
    messages.push({ role, content: redactContactDetails(role === 'user' ? text : text.slice(0, MAX_ASSISTANT_CHARS)) });
  }
  if (messages[messages.length - 1].role !== 'user' || userTurns > MAX_USER_TURNS) return { ok: false };
  return { ok: true, messages };
}

export type AssistantIntent = 'ask' | 'search' | 'enquiry';

export interface SearchCriteria {
  destination?: string;
  nightsMin?: number;
  nightsMax?: number;
  budgetPerPerson?: number;
  travellers?: number;
  month?: string;
}

export interface ModelOutput {
  intent: AssistantIntent;
  reply: string;
  criteria: SearchCriteria;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function boundedInt(value: unknown, min: number, max: number): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

/** JSON schema the model is asked to answer in (strict structured output). */
export const MODEL_OUTPUT_JSON_SCHEMA = {
  name: 'assistant_turn',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['intent', 'reply', 'destination', 'nights_min', 'nights_max', 'budget_per_person_inr', 'travellers', 'month'],
    properties: {
      intent: { type: 'string', enum: ['ask', 'search', 'enquiry'] },
      reply: { type: 'string' },
      destination: { type: ['string', 'null'] },
      nights_min: { type: ['integer', 'null'] },
      nights_max: { type: ['integer', 'null'] },
      budget_per_person_inr: { type: ['integer', 'null'] },
      travellers: { type: ['integer', 'null'] },
      month: { type: ['string', 'null'] }
    }
  }
} as const;

/** Parses and clamps the model's answer; anything malformed yields null (the caller then uses a safe fallback). */
export function parseModelOutput(text: string): ModelOutput | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  if (r.intent !== 'ask' && r.intent !== 'search' && r.intent !== 'enquiry') return null;
  if (typeof r.reply !== 'string') return null;

  const destination =
    typeof r.destination === 'string'
      ? clean(r.destination).replace(/[^\p{L}\p{N}\s,&'-]/gu, '').slice(0, 60).trim() || undefined
      : undefined;
  const month = typeof r.month === 'string' && MONTHS.includes(r.month.trim().toLowerCase()) ? r.month.trim().toLowerCase() : undefined;
  const nightsMin = boundedInt(r.nights_min, 1, 30);
  const nightsMax = boundedInt(r.nights_max, 1, 30);
  return {
    intent: r.intent,
    reply: r.reply,
    criteria: {
      destination,
      nightsMin: nightsMin !== undefined && nightsMax !== undefined && nightsMax < nightsMin ? nightsMax : nightsMin,
      nightsMax: nightsMin !== undefined && nightsMax !== undefined && nightsMax < nightsMin ? nightsMin : nightsMax,
      budgetPerPerson: boundedInt(r.budget_per_person_inr, 1000, 10_000_000),
      travellers: boundedInt(r.travellers, 1, 50),
      month
    }
  };
}
