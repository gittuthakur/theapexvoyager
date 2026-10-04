import type { LeadgenChange, MetaGraphLead } from '@/lib/metaLeads';
import { normalizeMetaLead } from '@/lib/metaLeads';
import { MetaGraphError, type MetaConfig } from '@/lib/metaGraph';

export interface IngestDeps {
  fetchLead: (leadId: string) => Promise<MetaGraphLead>;
  capture: (payload: Record<string, unknown>) => Promise<{ ok: true; value: { created: boolean } } | { ok: false; error: string }>;
}
export interface IngestResult { created: number; existing: number; invalid: number; skipped: number; failed: number }

/**
 * One leadgen notification -> (retrieve details from Graph) -> normalise -> canonical Lead.
 * Idempotent: legacyRef {MetaLeadAd, leadgen_id} is unique, so Meta's webhook retries and
 * redeliveries return `existing`, never a second Lead. Genuine repeat enquiries (new
 * leadgen ids) are always kept. `failed` = transient (Meta/Graph/DB) -> caller answers non-200
 * so Meta retries; `invalid` = permanently unusable (e.g. no contact detail) -> not retried.
 */
export async function ingestLeadgenChanges(changes: LeadgenChange[], cfg: Pick<MetaConfig, 'pageId' | 'formIds'>, deps: IngestDeps): Promise<IngestResult> {
  const result: IngestResult = { created: 0, existing: 0, invalid: 0, skipped: 0, failed: 0 };
  for (const change of changes) {
    if ((cfg.pageId && change.pageId && change.pageId !== cfg.pageId) || (cfg.formIds?.length && change.formId && !cfg.formIds.includes(change.formId))) {
      result.skipped++; // another page/form than the configured business one
      continue;
    }
    try {
      const lead = await deps.fetchLead(change.leadgenId);
      const normalized = normalizeMetaLead({ ...lead, id: lead?.id ?? change.leadgenId, form_id: lead?.form_id ?? change.formId, ad_id: lead?.ad_id ?? change.adId }, { pageId: change.pageId ?? cfg.pageId });
      if (!normalized) { result.invalid++; continue; }
      const saved = await deps.capture(normalized.payload);
      if (!saved.ok) result.invalid++;
      else if (saved.value.created) result.created++;
      else result.existing++;
    } catch (error) {
      // Permanent Graph errors (bad id / no permission) are not retryable; everything else is.
      if (error instanceof MetaGraphError && !error.transient) result.invalid++;
      else result.failed++;
    }
  }
  return result;
}
