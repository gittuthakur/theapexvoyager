import type { LeadgenChange, MetaGraphLead } from '@/lib/metaLeads';
import { normalizeMetaLead } from '@/lib/metaLeads';
import { MetaGraphError, type GraphErrorCategory, type MetaConfig } from '@/lib/metaGraph';

/** Fixed, non-sensitive operational events. Nothing here can carry a token, lead id, contact detail or answer. */
export type IngestFailureCategory =
  | `META_GRAPH_${GraphErrorCategory}_ERROR`
  | 'META_LEAD_NO_CONTACT'
  | 'META_LEAD_INVALID'
  | 'META_LEAD_SAVE_ERROR';

export interface IngestFailure {
  category: IngestFailureCategory;
  stage: 'GRAPH_RETRIEVAL' | 'NORMALIZATION' | 'SAVE';
  retryable: boolean;
  status?: number;
  code?: number;
  subcode?: number;
}

export interface IngestDeps {
  fetchLead: (leadId: string) => Promise<MetaGraphLead>;
  capture: (payload: Record<string, unknown>) => Promise<{ ok: true; value: { created: boolean } } | { ok: false; error: string }>;
  /** Receives only IngestFailure (fixed fields). */
  log?: (failure: IngestFailure) => void;
}
export interface IngestResult { created: number; existing: number; invalid: number; skipped: number; failed: number; failures: IngestFailure[] }

/** The webhook's unix `created_time`, accepted only if it is a plausible recent timestamp. */
function webhookTimeIso(seconds: number | undefined): string | undefined {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return undefined;
  const ms = seconds * 1000;
  return ms > Date.UTC(2015, 0, 1) && ms < Date.now() + 86_400_000 ? new Date(ms).toISOString() : undefined;
}
const validIso = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

/**
 * One leadgen notification -> (retrieve details from Graph) -> normalise -> canonical Lead.
 * Idempotent: legacyRef {MetaLeadAd, leadgen_id} is unique, so Meta's webhook retries and
 * redeliveries return `existing`, never a second Lead.
 *
 *  - `failed`  = RETRYABLE (network, 429/5xx, auth 190/102, permission, 100/33, ambiguous 4xx, database
 *                failure): the route answers non-2xx so Meta redelivers; nothing is acknowledged as saved.
 *  - `invalid` = PERMANENT and safe to acknowledge (HTTP 404, code-100 request error, a lead with no
 *                phone/email, any other validation rejection).
 * Every non-success is reported through `deps.log` with fixed fields only.
 */
export async function ingestLeadgenChanges(changes: LeadgenChange[], cfg: Pick<MetaConfig, 'pageId' | 'formIds'>, deps: IngestDeps): Promise<IngestResult> {
  const result: IngestResult = { created: 0, existing: 0, invalid: 0, skipped: 0, failed: 0, failures: [] };
  const report = (failure: IngestFailure) => {
    result.failures.push(failure);
    if (failure.retryable) result.failed++; else result.invalid++;
    try { deps.log?.(failure); } catch { /* logging must never affect ingestion */ }
  };

  for (const change of changes) {
    if ((cfg.pageId && change.pageId && change.pageId !== cfg.pageId) || (cfg.formIds?.length && change.formId && !cfg.formIds.includes(change.formId))) {
      result.skipped++; // another page/form than the configured business one
      continue;
    }

    let lead: MetaGraphLead;
    try {
      lead = await deps.fetchLead(change.leadgenId);
    } catch (error) {
      if (error instanceof MetaGraphError) {
        report({ category: `META_GRAPH_${error.category}_ERROR`, stage: 'GRAPH_RETRIEVAL', retryable: error.retryable, status: error.status, code: error.code, subcode: error.subcode });
      } else {
        report({ category: 'META_GRAPH_UNKNOWN_ERROR', stage: 'GRAPH_RETRIEVAL', retryable: true });
      }
      continue;
    }

    // Graph is asked only for id/created_time/field_data; form id, ad id and time come from the webhook as fallbacks.
    const normalized = normalizeMetaLead({
      ...lead,
      id: lead?.id ?? change.leadgenId,
      form_id: lead?.form_id ?? change.formId,
      ad_id: lead?.ad_id ?? change.adId,
      created_time: validIso(lead?.created_time) ? lead.created_time : webhookTimeIso(change.createdTime)
    }, { pageId: change.pageId ?? cfg.pageId });
    if (!normalized) {
      report({ category: 'META_LEAD_INVALID', stage: 'NORMALIZATION', retryable: false });
      continue;
    }

    try {
      const saved = await deps.capture(normalized.payload);
      if (!saved.ok) {
        const noContact = /phone, WhatsApp number or email is required/i.test(saved.error);
        report({ category: noContact ? 'META_LEAD_NO_CONTACT' : 'META_LEAD_INVALID', stage: 'NORMALIZATION', retryable: false });
      } else if (saved.value.created) result.created++;
      else result.existing++;
    } catch {
      // A genuine database failure must never be acknowledged as success: retryable -> non-2xx.
      report({ category: 'META_LEAD_SAVE_ERROR', stage: 'SAVE', retryable: true });
    }
  }
  return result;
}
