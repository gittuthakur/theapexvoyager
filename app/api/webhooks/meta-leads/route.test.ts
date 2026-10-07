import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Real lead.service + real Meta code against an IN-MEMORY Lead model and a stubbed fetch: no database, no Meta. */
type Row = Record<string, any>;
const store = vi.hoisted(() => ({ leads: [] as Row[], failCreate: false }));
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
    create: async (doc: Row) => { if (store.failCreate) throw new Error('db down: LEAK-MARKER-DB Synthetic One 9876543210'); const row = { _id: `lead${store.leads.length + 1}`, createdAt: new Date(), ...doc }; store.leads.push(row); return row; },
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
  store.failCreate = false;
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
    expect(new URL(url).searchParams.get('fields')).toBe('id,created_time,field_data');
    for (const banned of ['ad_name', 'adset', 'campaign', 'platform', 'is_organic', 'form_id', 'ad_id']) expect(new URL(url).searchParams.get('fields')).not.toContain(banned);
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
  const graphError = (status: number, code?: number, subcode?: number) => async () =>
    new Response(JSON.stringify({ error: { message: `token ${TOKEN} Synthetic One`, type: 'OAuthException', code, error_subcode: subcode } }), { status });
  const goodGraph = async (url: string) => new Response(JSON.stringify(graph[new URL(url).pathname.split('/').pop()!]));

  it.each([
    ['OAuth 190 (400)', 400, 190, 463], ['OAuth 190 (401)', 401, 190, undefined], ['code 102', 400, 102, undefined], ['permission 10', 403, 10, undefined],
    ['permission 200', 403, 200, undefined], ['permission 283', 400, 283, undefined], ['code 3', 400, 3, undefined], ['100/33 on a real lead', 400, 100, 33],
    ['HTTP 429', 429, undefined, undefined], ['rate-limit code 4', 400, 4, undefined], ['HTTP 500', 500, undefined, undefined], ['HTTP 503', 503, undefined, undefined],
    ['ambiguous 4xx', 400, undefined, undefined]
  ])('RETRYABLE Graph failure %s -> 502 (never acknowledged), nothing saved, redelivery then succeeds once', async (_label, status, code, subcode) => {
    fetchMock.mockImplementation(graphError(status, code, subcode));
    const response = await route.POST(post(notification('555000111222331')));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ received: false, retry: true });
    expect(store.leads).toHaveLength(0);
    fetchMock.mockImplementation(goodGraph);
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200); // Meta redelivers again
    expect(store.leads).toHaveLength(1);
  });
  it('network failure and timeout -> 502', async () => {
    fetchMock.mockImplementation(async () => { throw Object.assign(new Error('timeout ' + TOKEN), { name: 'TimeoutError' }); });
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(502);
    fetchMock.mockImplementation(async () => { throw new Error('ECONNRESET'); });
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(502);
    expect(store.leads).toHaveLength(0);
  });
  it('PERMANENT failures stay acknowledged (200, no lead): HTTP 404 and a code-100 request error', async () => {
    fetchMock.mockImplementation(graphError(404));
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    fetchMock.mockImplementation(graphError(400, 100, 2500));
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    expect(store.leads).toHaveLength(0);
  });
  it('a retrieved lead with no usable phone or email is acknowledged without creating a Lead', async () => {
    graph['555000111222390'] = { id: '555000111222390', field_data: [{ name: 'city', values: ['Pune'] }] };
    const response = await route.POST(post(notification('555000111222390')));
    expect(response.status).toBe(200);
    expect(store.leads).toHaveLength(0);
    delete graph['555000111222390'];
  });
  it('a genuine DATABASE failure is NOT acknowledged (502); redelivery after recovery creates exactly one lead', async () => {
    store.failCreate = true;
    const failed = await route.POST(post(notification('555000111222331')));
    expect(failed.status).toBe(502);
    expect(JSON.stringify(await failed.json())).not.toMatch(/LEAK-MARKER|Synthetic|9876543210|db down/);
    expect(store.leads).toHaveLength(0);
    store.failCreate = false;
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    expect((await route.POST(post(notification('555000111222331')))).status).toBe(200);
    expect(store.leads).toHaveLength(1);
  });
  it('a mixed batch: the saved lead stays saved and a retryable sibling makes the whole delivery 502; redelivery is idempotent', async () => {
    graph['555000111222333'] = { id: '555000111222333', field_data: [{ name: 'phone_number', values: ['9111111111'] }] };
    fetchMock.mockImplementation(async (url: string) => (url.includes('/555000111222332') ? graphError(500)() : goodGraph(url)));
    expect((await route.POST(post(notification('555000111222331', '555000111222332')))).status).toBe(502);
    expect(store.leads).toHaveLength(1);
    fetchMock.mockImplementation(goodGraph);
    expect((await route.POST(post(notification('555000111222331', '555000111222332')))).status).toBe(200);
    expect(store.leads).toHaveLength(2);
    delete graph['555000111222333'];
  });
  it('uses the webhook created_time when Graph omits or garbles it, and never invents one', async () => {
    graph['555000111222340'] = { id: '555000111222340', field_data: [{ name: 'phone_number', values: ['9222222222'] }] }; // no created_time
    await route.POST(post(notification('555000111222340')));
    expect(store.leads[0].meta.createdTime.toISOString()).toBe('2023-11-14T22:13:20.000Z'); // webhook 1700000000
    graph['555000111222341'] = { id: '555000111222341', created_time: 'garbage', field_data: [{ name: 'phone_number', values: ['9333333333'] }] };
    await route.POST(post(notification('555000111222341')));
    expect(store.leads[1].meta.createdTime.toISOString()).toBe('2023-11-14T22:13:20.000Z');
    graph['555000111222342'] = { id: '555000111222342', created_time: '2026-10-01T10:00:00+0000', field_data: [{ name: 'phone_number', values: ['9444444444'] }] };
    await route.POST(post(notification('555000111222342')));
    expect(store.leads[2].meta.createdTime.toISOString()).toBe('2026-10-01T10:00:00.000Z'); // Graph wins when valid
    const noTime = { object: 'page', entry: [{ id: '111', changes: [{ field: 'leadgen', value: { leadgen_id: '555000111222343', page_id: '111' } }] }] };
    graph['555000111222343'] = { id: '555000111222343', field_data: [{ name: 'phone_number', values: ['9555555555'] }] };
    await route.POST(post(noTime));
    expect(store.leads[3].meta.createdTime).toBeUndefined();
    for (const id of ['40', '41', '42', '43']) delete graph['5550001112223' + id];
  });
  it('form_id and ad_id come from the webhook payload now that Graph no longer returns them', async () => {
    await route.POST(post(notification('555000111222331')));
    expect(store.leads[0].meta).toMatchObject({ formId: '8001', adId: '7001', pageId: '111' });
  });
  it('an old sample-style event for a different Page is still skipped when META_PAGE_ID is configured', async () => {
    vi.stubEnv('META_PAGE_ID', '111');
    const sample = { object: 'page', entry: [{ id: '0', changes: [{ field: 'leadgen', value: { leadgen_id: '444444444444', page_id: '444444444444', form_id: '444444444444' } }] }] };
    expect((await route.POST(post(sample))).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('operational logs carry ONLY fixed fields (category, stage, retryable, status, Graph code/subcode)', async () => {
    fetchMock.mockImplementation(graphError(400, 190, 463));
    await route.POST(post(notification('555000111222331')));
    fetchMock.mockImplementation(goodGraph);
    graph['555000111222391'] = { id: '555000111222391', field_data: [{ name: 'full_name', values: ['Synthetic Nocontact'] }, { name: 'city', values: ['Pune'] }] };
    await route.POST(post(notification('555000111222391')));
    store.failCreate = true;
    await route.POST(post(notification('555000111222331')));
    store.failCreate = false;
    delete graph['555000111222391'];
    const lines = logs.flatMap(l => l.mock.calls.map((c: unknown[]) => String(c[0])));
    const events = lines.map(l => JSON.parse(l));
    const byCategory = Object.fromEntries(events.map(e => [e.category, e]));
    expect(Object.keys(byCategory).sort()).toEqual(['META_GRAPH_AUTH_ERROR', 'META_LEAD_NO_CONTACT', 'META_LEAD_SAVE_ERROR']);
    expect(byCategory.META_GRAPH_AUTH_ERROR).toEqual({ event: 'META_WEBHOOK_INGEST_FAILURE', category: 'META_GRAPH_AUTH_ERROR', stage: 'GRAPH_RETRIEVAL', retryable: true, status: 400, graphCode: 190, graphSubcode: 463 });
    expect(byCategory.META_LEAD_NO_CONTACT).toMatchObject({ stage: 'NORMALIZATION', retryable: false });
    expect(byCategory.META_LEAD_SAVE_ERROR).toMatchObject({ stage: 'SAVE', retryable: true });
    for (const e of events) expect(Object.keys(e).every(k => ['event', 'category', 'stage', 'retryable', 'status', 'graphCode', 'graphSubcode'].includes(k))).toBe(true);
    expect(lines.join('\n')).not.toMatch(new RegExp(`${TOKEN}|${SECRET}|555000111222|Synthetic|Nocontact|9876543210|one@example|LEAK-MARKER|db down|OAuth`));
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
