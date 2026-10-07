import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { LEAD_BULK_FIELDS, LEAD_FIELDS, MetaGraphError, classifyGraphError, fetchMetaLead, listFormLeads, readMetaConfig, type MetaConfig } from './metaGraph';

const cfg: MetaConfig = { appSecret: 'app-secret-value', pageAccessToken: 'PAGE-TOKEN-VALUE', pageId: '111', version: 'v26.0' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('Meta Graph client', () => {
  it('sends the token in the Authorization header, never in the URL, with a valid appsecret_proof', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ id: '1' }));
    await fetchMetaLead('555000111', cfg, fetcher as unknown as typeof fetch);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toMatch(/^https:\/\/graph\.facebook\.com\/v26\.0\/555000111\?/);
    expect(url).not.toContain('PAGE-TOKEN-VALUE');
    expect(url).not.toContain('access_token');
    expect(new URL(url).searchParams.get('appsecret_proof')).toBe(createHmac('sha256', cfg.appSecret).update(cfg.pageAccessToken).digest('hex'));
    expect(init.headers.Authorization).toBe('Bearer PAGE-TOKEN-VALUE');
    expect(new URL(url).searchParams.get('fields')).toBe('id,created_time,field_data');
  });
  it('requests ONLY id,created_time,field_data - no ad/campaign/form/platform enrichment that could need ads permissions', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ id: '1' }));
    await fetchMetaLead('555000111', cfg, fetcher as unknown as typeof fetch);
    const fields = new URL(fetcher.mock.calls[0][0]).searchParams.get('fields')!.split(',');
    expect(fields).toEqual(['id', 'created_time', 'field_data']);
    expect(LEAD_FIELDS).toBe('id,created_time,field_data');
    for (const banned of ['ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name', 'form_id', 'is_organic', 'platform']) expect(fields).not.toContain(banned);
  });
  it('the operator-run historical bulk read keeps its own (unchanged) field list', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ data: [] }));
    await listFormLeads('8001', cfg, fetcher as unknown as typeof fetch);
    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('fields')).toBe(LEAD_BULK_FIELDS);
  });
  it.each([
    ['OAuth code 190 (HTTP 400)', 400, 190, 463, 'AUTH', true],
    ['OAuth code 190 (HTTP 401)', 401, 190, undefined, 'AUTH', true],
    ['code 102 session', 400, 102, undefined, 'AUTH', true],
    ['permission code 10', 403, 10, undefined, 'PERMISSION', true],
    ['permission code 200', 403, 200, undefined, 'PERMISSION', true],
    ['permission code 210', 400, 210, undefined, 'PERMISSION', true],
    ['permission code 299', 400, 299, undefined, 'PERMISSION', true],
    ['code 3 capability/permission', 400, 3, undefined, 'PERMISSION', true],
    ['code 100 / subcode 33 (missing OR no access)', 400, 100, 33, 'OBJECT_ACCESS', true],
    ['HTTP 429', 429, undefined, undefined, 'RATE_LIMIT', true],
    ['rate-limit code 4', 400, 4, undefined, 'RATE_LIMIT', true],
    ['rate-limit code 17', 400, 17, undefined, 'RATE_LIMIT', true],
    ['rate-limit code 613', 400, 613, undefined, 'RATE_LIMIT', true],
    ['HTTP 500', 500, undefined, undefined, 'SERVER', true],
    ['HTTP 503', 503, undefined, undefined, 'SERVER', true],
    ['Graph code 1 / 2', 400, 2, undefined, 'SERVER', true],
    ['ambiguous 4xx without a code', 400, undefined, undefined, 'UNKNOWN', true],
    ['HTTP 404 (genuinely missing)', 404, undefined, undefined, 'NOT_FOUND', false],
    ['code 100 request error (other subcode)', 400, 100, 2500, 'BAD_REQUEST', false]
  ] as const)('classifies %s', async (_label, status, code, subcode, category, retryable) => {
    expect(classifyGraphError(status, code, subcode)).toMatchObject({ category, retryable, status, code, subcode });
    const body = { error: { message: 'Invalid OAuth access token PAGE-TOKEN-VALUE for lead of Synthetic Person', type: 'OAuthException', code, error_subcode: subcode, fbtrace_id: 'TRACE' } };
    const err = await fetchMetaLead('1', cfg, (async () => json(body, status)) as unknown as typeof fetch).catch(e => e);
    expect(err).toBeInstanceOf(MetaGraphError);
    expect(err).toMatchObject({ status, code, subcode, category, retryable, transient: retryable });
    // only sanitised metadata survives: no message, token, body, name or trace id
    expect(String(err.message) + JSON.stringify(err) + String(err.stack)).not.toMatch(/PAGE-TOKEN|Synthetic|OAuth|TRACE|Person/);
  });
  it('network failure and timeout are retryable and never echo the token', async () => {
    for (const failure of [new Error('ECONNRESET PAGE-TOKEN-VALUE'), Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' })]) {
      const err = await fetchMetaLead('1', cfg, (async () => { throw failure; }) as unknown as typeof fetch).catch(e => e);
      expect(err).toMatchObject({ status: 0, category: 'NETWORK', retryable: true });
      expect(err.message).not.toContain('PAGE-TOKEN');
    }
  });
  it('an unparseable error body or invalid success body is classified from the status alone', async () => {
    const badBody = await fetchMetaLead('1', cfg, (async () => new Response('<html>nope', { status: 403 })) as unknown as typeof fetch).catch(e => e);
    expect(badBody).toMatchObject({ status: 403, category: 'PERMISSION', retryable: true, code: undefined });
    const badOk = await fetchMetaLead('1', cfg, (async () => new Response('not json', { status: 200 })) as unknown as typeof fetch).catch(e => e);
    expect(badOk).toMatchObject({ retryable: true });
  });
  it('follows paging cursors for bulk reads', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ data: [{ id: 'a' }], paging: { cursors: { after: 'C1' }, next: 'https://x' } }))
      .mockResolvedValueOnce(json({ data: [{ id: 'b' }] }));
    const leads = await listFormLeads('8001', cfg, fetcher as unknown as typeof fetch);
    expect(leads.map(l => l.id)).toEqual(['a', 'b']);
    expect(new URL(fetcher.mock.calls[1][0]).searchParams.get('after')).toBe('C1');
  });
  it('reads config by variable name only and reports what is missing without values', () => {
    const empty = readMetaConfig({});
    expect(empty.missing).toEqual(['META_APP_SECRET', 'META_PAGE_ACCESS_TOKEN', 'META_LEADS_WEBHOOK_VERIFY_TOKEN']);
    expect(empty.version).toBe('v26.0');
    const full = readMetaConfig({ META_APP_SECRET: 's', META_PAGE_ACCESS_TOKEN: 't', META_LEADS_WEBHOOK_VERIFY_TOKEN: 'v', META_GRAPH_API_VERSION: 'v25.0', META_LEADS_FORM_IDS: '1, 2' });
    expect(full).toMatchObject({ missing: [], version: 'v25.0', formIds: ['1', '2'] });
    expect(readMetaConfig({ META_GRAPH_API_VERSION: 'latest' }).version).toBe('v26.0');
  });
});
