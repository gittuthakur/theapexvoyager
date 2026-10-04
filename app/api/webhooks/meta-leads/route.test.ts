import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Real lead.service + real Meta code against an IN-MEMORY Lead model and a stubbed fetch: no database, no Meta. */
type Row = Record<string, any>;
const store = vi.hoisted(() => ({ leads: [] as Row[] }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/Lead', () => ({
  Lead: {
    findOne(q: Row) {
      const value = q['legacyRef.model']
        ? store.leads.find(l => l.legacyRef?.model === q['legacyRef.model'] && l.legacyRef.id === q['legacyRef.id']) ?? null
        : store.leads.filter(l => (q.$or as Row[]).some(c => Object.entries(c).every(([k, v]) => l[k] === v)) && l.leadType === q.leadType
          && (q.destination === undefined || l.destination === q.destination) && l.createdAt >= q.createdAt.$gte && !l.duplicateOf)
          .sort((a, b) => +a.createdAt - +b.createdAt)[0] ?? null;
      return { then: (resolve: (v: unknown) => unknown) => resolve(value), sort: () => Promise.resolve(value) };
    },
    create: async (doc: Row) => { const row = { _id: `lead${store.leads.length + 1}`, createdAt: new Date(), ...doc }; store.leads.push(row); return row; },
    updateOne: async () => ({})
  }
}));

const route = await import('./route');

const SECRET = 'synthetic-app-secret';
const TOKEN = 'PAGE-TOKEN-VALUE-DO-NOT-LEAK';
const ENV = { META_APP_SECRET: SECRET, META_PAGE_ACCESS_TOKEN: TOKEN, META_LEADS_WEBHOOK_VERIFY_TOKEN: 'verify-me', META_PAGE_ID: '111' };
const sign = (body: string) => `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;
const notification = (...ids: string[]) => ({ object: 'page', entry: [{ id: '111', time: 1, changes: ids.map(id => ({ field: 'leadgen', value: { leadgen_id: id, page_id: '111', form_id: '8001', ad_id: '7001', created_time: 1700000000 } })) }] });
const post = (body: unknown, headers: Record<string, string> = {}, raw?: string) => {
  const text = raw ?? JSON.stringify(body);
  return new Request('https://www.example.com/api/webhooks/meta-leads', { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sign(text), ...headers }, body: text });
};
const graph: Record<string, Row> = {
  '555000111222331': { id: '555000111222331', created_time: '2026-10-01T10:00:00+0000', campaign_name: 'Winter', form_id: '8001', platform: 'fb', field_data: [{ name: 'full_name', values: ['Synthetic One'] }, { name: 'phone_number', values: ['+91 98765 43210'] }, { name: 'email', values: ['one@example.com'] }] },
  '555000111222332': { id: '555000111222332', created_time: '2026-10-01T11:00:00+0000', form_id: '8001', field_data: [{ name: 'full_name', values: ['Synthetic One Again'] }, { name: 'phone_number', values: ['9876543210'] }] }
};
let fetchMock: ReturnType<typeof vi.fn>;
let logs: ReturnType<typeof vi.spyOn>[];

beforeEach(() => {
  store.leads.length = 0;
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  fetchMock = vi.fn(async (url: string) => {
    const id = new URL(url).pathname.split('/').pop()!;
    return graph[id] ? new Response(JSON.stringify(graph[id])) : new Response('{"error":{"message":"nope"}}', { status: 400 });
  });
  vi.stubGlobal('fetch', fetchMock);
  logs = [vi.spyOn(console, 'error').mockImplementation(() => {}), vi.spyOn(console, 'log').mockImplementation(() => {}), vi.spyOn(console, 'warn').mockImplementation(() => {})];
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); logs.forEach(l => l.mockRestore()); });

describe('GET verification', () => {
  const get = (q: string) => route.GET(new Request(`https://www.example.com/api/webhooks/meta-leads?${q}`));
  it('echoes the challenge for the right token', async () => {
    const response = await get('hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=424242');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('424242');
  });
  it('rejects a wrong token / mode with 403 and behaves as absent (404) when unconfigured', async () => {
    expect((await get('hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1')).status).toBe(403);
    expect((await get('hub.mode=subscribe&hub.challenge=1')).status).toBe(403);
    vi.stubEnv('META_LEADS_WEBHOOK_VERIFY_TOKEN', '');
    expect((await get('hub.mode=subscribe&hub.verify_token=&hub.challenge=1')).status).toBe(404);
  });
});

describe('POST leadgen', () => {
  it('creates exactly one META_LEAD_AD lead (source meta) from a signed notification, retrieving details server-side', async () => {
    const response = await route.POST(post(notification('555000111222331')));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, processed: 1 });
    expect(store.leads).toHaveLength(1);
    expect(store.leads[0]).toMatchObject({
      captureKind: 'META_LEAD_AD', source: 'meta', sourceDetail: 'meta-instant-form', leadType: 'GENERAL', status: 'NEW', phoneNormalized: '9876543210',
      legacyRef: { model: 'MetaLeadAd', id: '555000111222331' }, meta: { leadId: '555000111222331', pageId: '111', formId: '8001', campaignName: 'Winter', platform: 'fb' }
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).not.toContain(TOKEN);
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });
  it('the same Meta lead delivered twice (retry) still produces ONE lead', async () => {
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    expect((await route.POST(post(notification('555000111222331', '555000111222331')))).status).toBe(200);
    expect(store.leads).toHaveLength(1);
  });
  it('a different Meta lead from the SAME customer is preserved and linked, never merged or dropped', async () => {
    await route.POST(post(notification('555000111222331')));
    await route.POST(post(notification('555000111222332')));
    expect(store.leads).toHaveLength(2);
    expect(store.leads[1].duplicateOf).toBe(store.leads[0]._id);
    expect(store.leads[1].meta.leadId).toBe('555000111222332');
    expect(store.leads[1].source).toBe('meta');
  });
  it('rejects an invalid, missing or wrong-secret signature before touching Graph or the database', async () => {
    const body = JSON.stringify(notification('555000111222331'));
    for (const headers of [{ 'x-hub-signature-256': 'sha256=' + '0'.repeat(64) }, { 'x-hub-signature-256': '' }, { 'x-hub-signature-256': `sha256=${createHmac('sha256', 'wrong').update(body).digest('hex')}` }]) {
      expect((await route.POST(post(null, headers, body))).status).toBe(403);
    }
    const noHeader = new Request('https://www.example.com/api/webhooks/meta-leads', { method: 'POST', body });
    expect((await route.POST(noHeader)).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.leads).toHaveLength(0);
  });
  it('a body modified after signing is rejected', async () => {
    const original = JSON.stringify(notification('555000111222331'));
    const response = await route.POST(post(null, { 'x-hub-signature-256': sign(original) }, original.replace('555000111222331', '555000111222332')));
    expect(response.status).toBe(403);
    expect(store.leads).toHaveLength(0);
  });
  it('malformed JSON (validly signed) -> 400; non-object -> 400; oversize -> 413', async () => {
    expect((await route.POST(post(null, {}, '{not json'))).status).toBe(400);
    expect((await route.POST(post(null, {}, '[1,2]'))).status).toBe(400);
    expect((await route.POST(post(null, {}, JSON.stringify({ pad: 'x'.repeat(70_000) })))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('unsupported events/objects are acknowledged without any Graph call or lead', async () => {
    for (const body of [{ object: 'instagram', entry: [] }, { object: 'page', entry: [{ id: '1', changes: [{ field: 'feed', value: { leadgen_id: '555000111222331' } }] }] }, { object: 'page', entry: [] }]) {
      const response = await route.POST(post(body));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ received: true, processed: 0 });
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.leads).toHaveLength(0);
  });
  it('skips notifications for a different Page than the configured one', async () => {
    const other = { object: 'page', entry: [{ id: '999', changes: [{ field: 'leadgen', value: { leadgen_id: '555000111222331', page_id: '999' } }] }] };
    expect((await route.POST(post(other))).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.leads).toHaveLength(0);
  });
  it('a Graph/Meta failure answers 502 (so Meta retries), saves nothing, and leaks nothing', async () => {
    fetchMock.mockImplementation(async () => new Response(`{"error":{"message":"token ${TOKEN} expired for Synthetic One"}}`, { status: 500 }));
    const response = await route.POST(post(notification('555000111222331')));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toMatch(/token|Synthetic|PAGE-TOKEN/i);
    expect(store.leads).toHaveLength(0);
    fetchMock.mockImplementation(async () => { throw new Error(`socket hang up ${TOKEN}`); });
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(502);
    // after recovery the redelivery succeeds exactly once
    fetchMock.mockImplementation(async (url: string) => new Response(JSON.stringify(graph[new URL(url).pathname.split('/').pop()!])));
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    expect(store.leads).toHaveLength(1);
  });
  it('a permanent Graph rejection (400) or a lead with no contact is acknowledged, not retried forever', async () => {
    expect((await route.POST(post(notification('999999999999999')))).status).toBe(200); // Graph 400
    graph['555000111222390'] = { id: '555000111222390', field_data: [{ name: 'city', values: ['Pune'] }] };
    expect((await route.POST(post(notification('555000111222390')))).status).toBe(200);
    expect(store.leads).toHaveLength(0);
    delete graph['555000111222390'];
  });
  it('never logs customer data, tokens or secrets', async () => {
    fetchMock.mockImplementation(async () => new Response('boom', { status: 500 }));
    await route.POST(post(notification('555000111222331')));
    fetchMock.mockImplementation(async (url: string) => new Response(JSON.stringify(graph[new URL(url).pathname.split('/').pop()!])));
    await route.POST(post(notification('555000111222331')));
    const output = JSON.stringify(logs.flatMap(l => l.mock.calls));
    expect(output).not.toMatch(new RegExp(`${TOKEN}|${SECRET}|Synthetic|9876543210|one@example\\.com`));
  });
  it('is invisible (404) until the app secret and page token are configured, and answers no other methods', async () => {
    vi.stubEnv('META_APP_SECRET', '');
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(404);
    const source = readFileSync(join(__dirname, 'route.ts'), 'utf8');
    expect(source).not.toMatch(/export (async )?function (PUT|PATCH|DELETE)/);
  });
});

describe('scope and secret hygiene', () => {
  const read = (p: string) => readFileSync(join(__dirname, '..', '..', '..', '..', p), 'utf8');
  it('browser-reachable modules never import node:crypto or the webhook/Graph code (no HMAC code in client bundles)', () => {
    for (const file of ['lib/leads.ts', 'lib/metaProvenance.ts', 'models/Lead.ts', 'app/internal/leads/LeadsClient.tsx', 'lib/customerValidation.ts']) {
      const source = read(file);
      expect(source, file).not.toMatch(/node:crypto|from 'crypto'|@\/lib\/metaLeads'|@\/lib\/metaGraph|createHmac/);
    }
  });
  it('uses no NEXT_PUBLIC variable for Meta secrets and does not touch the pre-existing Pixel/CAPI files', () => {
    for (const file of ['app/api/webhooks/meta-leads/route.ts', 'lib/metaLeads.ts', 'lib/metaGraph.ts', 'services/leads/metaLeadIngest.service.ts', 'scripts/metaLeadsHistoricalImport.ts']) {
      const source = read(file);
      expect(source, file).not.toMatch(/NEXT_PUBLIC_|META_CAPI_ACCESS_TOKEN|from '@\/lib\/(metaPixel|fpixel)'|meta-capi/);
      expect(source, file).not.toMatch(/console\.(log|error|warn)\([^)]*(token|secret|field_data|email|phone)/i);
    }
  });
});
