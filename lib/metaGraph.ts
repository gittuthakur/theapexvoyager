/**
 * Server-only Meta Graph API client for Lead Ads. The Page access token is sent in the
 * Authorization header (never in a URL, so it cannot land in access logs), plus an
 * `appsecret_proof` (HMAC of the token with the App Secret) as Meta recommends. Errors
 * carry only an HTTP status / short code - never the response body, token or lead data.
 */
import { createHmac } from 'node:crypto';
import type { MetaGraphLead } from '@/lib/metaLeads';

/** Fixed, non-sensitive failure categories (safe to log). */
export type GraphErrorCategory =
  | 'NETWORK' | 'RATE_LIMIT' | 'SERVER' | 'AUTH' | 'PERMISSION' | 'OBJECT_ACCESS' | 'NOT_FOUND' | 'BAD_REQUEST' | 'UNKNOWN';

export interface GraphErrorInfo { status: number; code?: number; subcode?: number; category: GraphErrorCategory; retryable: boolean }

const RATE_LIMIT_CODES = new Set([4, 17, 32, 341, 613]);

/**
 * Decides, from sanitised metadata ONLY (HTTP status + Graph error code/subcode), whether a failed lead
 * retrieval must be retried. The guiding rule: never let an auth / permission / access / transient
 * problem be acknowledged as success (that silently loses a real lead) - Meta redelivers non-2xx
 * responses with backoff for a bounded time. Only failures that retrying cannot fix are permanent:
 * an HTTP 404, or a code-100 request error other than subcode 33. Meta words "object does not exist"
 * (100/33) identically for a missing permission, so it is retryable.
 */
export function classifyGraphError(status: number, code?: number, subcode?: number): GraphErrorInfo {
  const info = (category: GraphErrorCategory, retryable: boolean): GraphErrorInfo => ({ status, code, subcode, category, retryable });
  if (status === 0) return info('NETWORK', true);
  if (status === 429 || (code !== undefined && RATE_LIMIT_CODES.has(code))) return info('RATE_LIMIT', true);
  if (code === 190 || code === 102 || status === 401) return info('AUTH', true);
  if (code === 10 || code === 3 || (code !== undefined && code >= 200 && code <= 299) || status === 403) return info('PERMISSION', true);
  if (code === 100 && subcode === 33) return info('OBJECT_ACCESS', true);
  if (status >= 500 || code === 1 || code === 2) return info('SERVER', true);
  if (status === 404) return info('NOT_FOUND', false);
  if (code === 100) return info('BAD_REQUEST', false);
  return info('UNKNOWN', true); // ambiguous 4xx: prefer a bounded retry over silent loss
}

export class MetaGraphError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly subcode?: number;
  readonly category: GraphErrorCategory;
  readonly retryable: boolean;
  /** @deprecated alias of `retryable` kept for older callers. */
  get transient() { return this.retryable; }
  constructor(info: GraphErrorInfo) {
    super(`Meta Graph request failed (${info.status})`);
    this.status = info.status; this.code = info.code; this.subcode = info.subcode; this.category = info.category; this.retryable = info.retryable;
  }
}

export interface MetaConfig { appSecret: string; pageAccessToken: string; pageId?: string; version: string; formIds?: string[] }

/** Names only - values are read here and never logged or returned. */
export function readMetaConfig(env: Record<string, string | undefined> = process.env): Partial<MetaConfig> & { missing: string[] } {
  const missing = ['META_APP_SECRET', 'META_PAGE_ACCESS_TOKEN', 'META_LEADS_WEBHOOK_VERIFY_TOKEN'].filter(k => !env[k]);
  return {
    appSecret: env.META_APP_SECRET, pageAccessToken: env.META_PAGE_ACCESS_TOKEN, pageId: env.META_PAGE_ID,
    version: /^v\d{2}\.\d$/.test(env.META_GRAPH_API_VERSION ?? '') ? env.META_GRAPH_API_VERSION! : 'v26.0',
    formIds: env.META_LEADS_FORM_IDS?.split(',').map(s => s.trim()).filter(Boolean), missing
  };
}

/** Permission-safe lead retrieval: only what ingestion needs. form_id / ad_id / created_time also arrive in the webhook payload.
 *  Ad/campaign enrichment is deliberately NOT requested - it can need ads permissions and must never block a lead. */
export const LEAD_FIELDS = 'id,created_time,field_data';

/** Fields for the separate, operator-run historical bulk read (scripts/metaLeadsHistoricalImport.ts) - unchanged. */
export const LEAD_BULK_FIELDS = 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data,is_organic,platform';

type Fetcher = typeof fetch;

async function graphGet<T>(path: string, params: Record<string, string>, cfg: Pick<MetaConfig, 'appSecret' | 'pageAccessToken' | 'version'>, fetcher: Fetcher): Promise<T> {
  const proof = createHmac('sha256', cfg.appSecret).update(cfg.pageAccessToken).digest('hex');
  const url = `https://graph.facebook.com/${cfg.version}/${path}?${new URLSearchParams({ ...params, appsecret_proof: proof })}`;
  let response: Response;
  try {
    response = await fetcher(url, { headers: { Authorization: `Bearer ${cfg.pageAccessToken}` }, signal: AbortSignal.timeout(8_000), cache: 'no-store' });
  } catch {
    throw new MetaGraphError(classifyGraphError(0)); // network / timeout
  }
  if (!response.ok) {
    // Read ONLY the numeric error code/subcode; the body (message, ids, data) is never kept.
    let code: number | undefined, subcode: number | undefined;
    try {
      const body = (await response.json()) as { error?: { code?: unknown; error_subcode?: unknown } };
      if (typeof body?.error?.code === 'number') code = body.error.code;
      if (typeof body?.error?.error_subcode === 'number') subcode = body.error.error_subcode;
    } catch { /* unparseable body: classify by HTTP status alone */ }
    throw new MetaGraphError(classifyGraphError(response.status, code, subcode));
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new MetaGraphError(classifyGraphError(502));
  }
}

export const fetchMetaLead = (leadId: string, cfg: MetaConfig, fetcher: Fetcher = fetch) =>
  graphGet<MetaGraphLead>(encodeURIComponent(leadId), { fields: LEAD_FIELDS }, cfg, fetcher);

export interface MetaForm { id: string; name?: string; status?: string }
export async function listPageForms(pageId: string, cfg: MetaConfig, fetcher: Fetcher = fetch): Promise<MetaForm[]> {
  const out: MetaForm[] = [];
  let after: string | undefined;
  for (let page = 0; page < 20; page++) {
    const r = await graphGet<{ data?: MetaForm[]; paging?: { cursors?: { after?: string }; next?: string } }>(`${encodeURIComponent(pageId)}/leadgen_forms`, { fields: 'id,name,status', limit: '100', ...(after ? { after } : {}) }, cfg, fetcher);
    out.push(...(r.data ?? []));
    after = r.paging?.next ? r.paging.cursors?.after : undefined;
    if (!after) break;
  }
  return out;
}

/** Bulk read for historical import. Meta only keeps leads retrievable for a limited window (~90 days). */
export async function listFormLeads(formId: string, cfg: MetaConfig, fetcher: Fetcher = fetch): Promise<MetaGraphLead[]> {
  const out: MetaGraphLead[] = [];
  let after: string | undefined;
  for (let page = 0; page < 200; page++) {
    const r = await graphGet<{ data?: MetaGraphLead[]; paging?: { cursors?: { after?: string }; next?: string } }>(`${encodeURIComponent(formId)}/leads`, { fields: LEAD_BULK_FIELDS, limit: '100', ...(after ? { after } : {}) }, cfg, fetcher);
    out.push(...(r.data ?? []));
    after = r.paging?.next ? r.paging.cursors?.after : undefined;
    if (!after) break;
  }
  return out;
}
