import { NextResponse } from 'next/server';
import { recordTokens, reserveRequest } from '@/lib/assistant/budget';
import { isAssistantReady, readAssistantConfig } from '@/lib/assistant/config';
import { ASSISTANT_HEADERS, jsonError, limitRequest, readJsonBody } from '@/lib/assistant/http';
import { callAssistantModel } from '@/lib/assistant/openai';
import { MAX_BODY_BYTES, parseChatRequest } from '@/lib/assistant/schema';
import { runAssistantTurn } from '@/lib/assistant/turn';
import { getAllPackages } from '@/lib/packages';

// Per request, never cached: whether the assistant is on is decided from the live server environment, and a reply
// depends on the live published catalogue.
export const dynamic = 'force-dynamic';

const CHAT_LIMIT_PER_MINUTE = 12;

/** Tells the widget whether to show itself. Reveals nothing about why it is off (no key, no limit, no mode). */
export async function GET() {
  return NextResponse.json({ enabled: isAssistantReady(readAssistantConfig()) }, { headers: ASSISTANT_HEADERS });
}

export async function POST(request: Request) {
  const limited = limitRequest(request, 'chat', CHAT_LIMIT_PER_MINUTE);
  if (limited) return limited;

  const config = readAssistantConfig();
  if (!isAssistantReady(config)) return jsonError(503, 'ASSISTANT_UNAVAILABLE', 'The assistant is not available right now.');

  const read = await readJsonBody(request, MAX_BODY_BYTES);
  if (!read.ok) return jsonError(read.status, read.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_REQUEST', 'Please send a shorter message.');
  const parsed = parseChatRequest(read.body);
  if (!parsed.ok) return jsonError(400, 'INVALID_REQUEST', 'Please send a shorter message.');

  try {
    const result = await runAssistantTurn(parsed.messages, {
      config,
      reserve: reserveRequest,
      record: (tokens) => recordTokens(tokens),
      callModel: callAssistantModel,
      getPackages: () => getAllPackages({ maxTimeMS: 3000 })
    });
    if (result.status === 200) return NextResponse.json(result.body, { headers: ASSISTANT_HEADERS });
    return jsonError(result.status, result.code, result.message);
  } catch {
    // No message text, no user data: only the fact that a turn failed.
    console.error('[api/assistant] unexpected failure');
    return jsonError(500, 'ASSISTANT_ERROR', 'The assistant could not answer right now.');
  }
}
