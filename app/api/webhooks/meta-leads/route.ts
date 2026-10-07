import { NextResponse } from 'next/server';
import { MAX_WEBHOOK_BYTES, parseLeadgenWebhook, verifyMetaChallenge, verifyMetaSignature } from '@/lib/metaLeads';
import { fetchMetaLead, readMetaConfig, type MetaConfig } from '@/lib/metaGraph';
import { ingestLeadgenChanges, type IngestFailure } from '@/services/leads/metaLeadIngest.service';
import { captureLead } from '@/services/leads/lead.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const noStore = { 'Cache-Control': 'no-store' };

/** Operational log: ONLY the fixed IngestFailure fields (category, stage, retryable, HTTP status, Graph code/subcode).
 *  Never a token, secret, proof, lead id, contact detail, answer, payload or Graph body. */
function logIngestFailure(failure: IngestFailure) {
  const line = JSON.stringify({
    event: 'META_WEBHOOK_INGEST_FAILURE', category: failure.category, stage: failure.stage, retryable: failure.retryable,
    status: failure.status, graphCode: failure.code, graphSubcode: failure.subcode
  });
  if (failure.retryable) console.error(line); else console.warn(line);
}

/** Meta subscription handshake. Without the verify token configured the endpoint simply does not exist (404). */
export async function GET(request: Request) {
  const token = process.env.META_LEADS_WEBHOOK_VERIFY_TOKEN;
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStore });
  const challenge = verifyMetaChallenge(new URL(request.url).searchParams, token);
  if (challenge === null) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStore });
  return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain', ...noStore } });
}

/**
 * Meta `leadgen` notifications. Order of checks: configured -> byte cap -> HMAC signature
 * over the RAW body (App Secret) -> JSON -> schema. Nothing from the body is trusted before
 * the signature passes. No customer data, tokens or response bodies are ever logged.
 */
export async function POST(request: Request) {
  const cfg = readMetaConfig();
  if (!cfg.appSecret || !cfg.pageAccessToken) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStore });

  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_WEBHOOK_BYTES) return NextResponse.json({ error: 'Request body too large' }, { status: 413, headers: noStore });

  let raw = '';
  try {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const part = reader ? await reader.read() : { done: true as const, value: undefined };
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_WEBHOOK_BYTES) { await reader!.cancel().catch(() => {}); return NextResponse.json({ error: 'Request body too large' }, { status: 413, headers: noStore }); }
      chunks.push(part.value);
    }
    raw = new TextDecoder().decode(Buffer.concat(chunks));
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: noStore });
  }

  if (!verifyMetaSignature(raw, request.headers.get('x-hub-signature-256'), cfg.appSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403, headers: noStore });
  }

  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: noStore }); }
  const parsed = parseLeadgenWebhook(body);
  if (!parsed.ok) return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: noStore });

  const full = cfg as MetaConfig;
  try {
    const result = await ingestLeadgenChanges(parsed.changes, { pageId: cfg.pageId, formIds: cfg.formIds }, {
      fetchLead: id => fetchMetaLead(id, full),
      capture: payload => captureLead(payload, 'meta-lead-ads', { allowMeta: true }),
      log: logIngestFailure
    });
    // Any RETRYABLE failure (network, 429/5xx, auth/permission/access, database) -> non-2xx so Meta redelivers;
    // leads already saved in this batch come back as `existing`, so redelivery is idempotent.
    if (result.failed > 0) return NextResponse.json({ received: false, retry: true }, { status: 502, headers: noStore });
    return NextResponse.json({ received: true, processed: result.created + result.existing }, { status: 200, headers: noStore });
  } catch {
    console.error(JSON.stringify({ event: 'META_WEBHOOK_INGEST_FAILURE', category: 'META_LEAD_SAVE_ERROR', stage: 'SAVE', retryable: true }));
    return NextResponse.json({ received: false, retry: true }, { status: 502, headers: noStore });
  }
}
