import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { MetaGraphError, fetchMetaLead, listFormLeads, readMetaConfig, type MetaConfig } from './metaGraph';

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
    expect(new URL(url).searchParams.get('fields')).toContain('field_data');
  });
  it('errors carry only a status, classify transient vs permanent, and never echo the body or token', async () => {
    const body = { error: { message: 'Invalid OAuth access token PAGE-TOKEN-VALUE for lead of Synthetic Person' } };
    for (const [status, transient] of [[400, false], [403, false], [404, false], [429, true], [500, true], [503, true]] as const) {
      const err = await fetchMetaLead('1', cfg, (async () => json(body, status)) as unknown as typeof fetch).catch(e => e);
      expect(err).toBeInstanceOf(MetaGraphError);
      expect(err).toMatchObject({ status, transient });
      expect(String(err.message) + JSON.stringify(err)).not.toMatch(/PAGE-TOKEN|Synthetic|OAuth/);
    }
    const net = await fetchMetaLead('1', cfg, (async () => { throw new Error('ECONNRESET PAGE-TOKEN-VALUE'); }) as unknown as typeof fetch).catch(e => e);
    expect(net).toMatchObject({ status: 0, transient: true });
    expect(net.message).not.toContain('PAGE-TOKEN');
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
