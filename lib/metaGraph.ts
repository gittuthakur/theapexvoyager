/**
 * Server-only Meta Graph API client for Lead Ads. The Page access token is sent in the
 * Authorization header (never in a URL, so it cannot land in access logs), plus an
 * `appsecret_proof` (HMAC of the token with the App Secret) as Meta recommends. Errors
 * carry only an HTTP status / short code - never the response body, token or lead data.
 */
import { createHmac } from 'node:crypto';
import type { MetaGraphLead } from '@/lib/metaLeads';

export class MetaGraphError extends Error {
  constructor(public status: number, public transient: boolean) {
    super(`Meta Graph request failed (${status})`);
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

export const LEAD_FIELDS = 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data,is_organic,platform';

type Fetcher = typeof fetch;

async function graphGet<T>(path: string, params: Record<string, string>, cfg: Pick<MetaConfig, 'appSecret' | 'pageAccessToken' | 'version'>, fetcher: Fetcher): Promise<T> {
  const proof = createHmac('sha256', cfg.appSecret).update(cfg.pageAccessToken).digest('hex');
  const url = `https://graph.facebook.com/${cfg.version}/${path}?${new URLSearchParams({ ...params, appsecret_proof: proof })}`;
  let response: Response;
  try {
    response = await fetcher(url, { headers: { Authorization: `Bearer ${cfg.pageAccessToken}` }, signal: AbortSignal.timeout(8_000), cache: 'no-store' });
  } catch {
    throw new MetaGraphError(0, true); // network / timeout
  }
  if (!response.ok) throw new MetaGraphError(response.status, response.status === 429 || response.status >= 500);
  try {
    return (await response.json()) as T;
  } catch {
    throw new MetaGraphError(502, true);
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
    const r = await graphGet<{ data?: MetaGraphLead[]; paging?: { cursors?: { after?: string }; next?: string } }>(`${encodeURIComponent(formId)}/leads`, { fields: LEAD_FIELDS, limit: '100', ...(after ? { after } : {}) }, cfg, fetcher);
    out.push(...(r.data ?? []));
    after = r.paging?.next ? r.paging.cursors?.after : undefined;
    if (!after) break;
  }
  return out;
}
