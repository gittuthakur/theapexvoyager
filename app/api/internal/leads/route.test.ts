import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const svc = vi.hoisted(() => ({
  listLeads: vi.fn(), getLeadSummary: vi.fn(), createLead: vi.fn(), serializeLead: vi.fn((x: unknown) => x), getLeadById: vi.fn(),
  updateLeadStatus: vi.fn(), setLeadPriority: vi.fn(), addLeadNote: vi.fn(), scheduleLeadFollowUp: vi.fn(),
  recordLeadContacted: vi.fn(), setLeadQuote: vi.fn(), setLeadAssignee: vi.fn()
}));
vi.mock('@/services/leads/lead.service', () => svc);
const session = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/services/auth/adminSession.service', () => ({ getSession: session.getSession, hasRole: (i: { role: string } | null, allowed: string[]) => !!i && allowed.includes(i.role) }));
const list = await import('./route');
const one = await import('./[id]/route');

const ID = 'a'.repeat(24);
const url = 'http://localhost:3000/api/internal/leads';
const req = (method: string, body?: unknown, origin = 'http://localhost:3000', path = url) =>
  new Request(path, { method, headers: { host: 'localhost:3000', origin, cookie: 'apex_admin=' + 'A'.repeat(43), 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
const ctx = { params: Promise.resolve({ id: ID }) };
beforeEach(() => session.getSession.mockResolvedValue({ userId: 'u1', email: 'owner@example.com', role: 'OWNER' }));
afterEach(() => { vi.unstubAllEnvs(); Object.values(svc).forEach(f => f.mockClear()); session.getSession.mockReset(); });

describe('internal lead API access control', () => {
  it('rejects every handler without a valid session (401) before touching any lead data, in production too', async () => {
    session.getSession.mockResolvedValue(null);
    for (const env of ['development', 'production']) {
      vi.stubEnv('NODE_ENV', env);
      expect((await list.GET(req('GET'))).status).toBe(401);
      const origin = env === 'production' ? 'https://localhost:3000' : 'http://localhost:3000';
      expect((await list.POST(req('POST', { name: 'x' }, origin))).status).toBe(401);
      expect((await one.GET(req('GET'), ctx)).status).toBe(401);
      expect((await one.PATCH(req('PATCH', { action: 'record_contacted' }, origin), ctx)).status).toBe(401);
    }
    for (const fn of Object.values(svc)) expect(fn).not.toHaveBeenCalled();
  });
  it('rejects a non-OWNER role with 403', async () => {
    session.getSession.mockResolvedValue({ userId: 'u2', email: 'staff@example.com', role: 'EMPLOYEE' });
    expect((await list.GET(req('GET'))).status).toBe(403);
    expect((await one.PATCH(req('PATCH', { action: 'record_contacted' }), ctx)).status).toBe(403);
    for (const fn of Object.values(svc)) expect(fn).not.toHaveBeenCalled();
  });
  it('rejects cross-origin writes even with a valid session', async () => {
    expect((await list.POST(req('POST', {}, 'https://attacker.invalid'))).status).toBe(403);
    expect((await one.PATCH(req('PATCH', { action: 'set_status', status: 'WON' }, 'https://attacker.invalid'), ctx)).status).toBe(403);
    expect(svc.createLead).not.toHaveBeenCalled();
    expect(svc.updateLeadStatus).not.toHaveBeenCalled();
  });
  it('an authenticated owner is served, no-store and noindex; audit actor is the session identity', async () => {
    svc.listLeads.mockResolvedValue({ ok: true, value: [] });
    svc.getLeadSummary.mockResolvedValue({ total: 0 });
    const response = await list.GET(req('GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    svc.addLeadNote.mockResolvedValue({ ok: true, value: { _id: ID } });
    await one.PATCH(req('PATCH', { action: 'add_note', text: 'hi', actor: 'spoofed-name' }), ctx);
    expect(svc.addLeadNote).toHaveBeenCalledWith(ID, 'hi', 'owner@example.com');
  });
});

describe('internal lead API validation', () => {
  it('manual create needs a valid source and requirements; forces MANUAL capture and ignores client captureKind/status', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect((await list.POST(req('POST', { name: 'A', phone: '9876543210', leadType: 'GENERAL', message: 'x' }))).status).toBe(400);
    expect((await list.POST(req('POST', { name: 'A', phone: '9876543210', leadType: 'GENERAL', source: 'bogus', message: 'x' }))).status).toBe(400);
    expect((await list.POST(req('POST', { name: 'A', phone: '9876543210', leadType: 'GENERAL', source: 'instagram' }))).status).toBe(400);
    svc.createLead.mockResolvedValue({ ok: true, value: { lead: { _id: 'n' } } });
    const ok = await list.POST(req('POST', { name: 'A', phone: '9876543210', leadType: 'GENERAL', source: 'instagram', message: 'DM enquiry', captureKind: 'FORM_SUBMITTED', status: 'WON' }));
    expect(ok.status).toBe(201);
    const input = svc.createLead.mock.calls[0][0];
    expect(input).toMatchObject({ captureKind: 'MANUAL', attribution: { source: 'instagram' } });
    expect(input).not.toHaveProperty('status');
  });
  it('PATCH allows only the documented actions and fields (no arbitrary Lead mutation)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const bad of [
      { action: 'delete' }, { action: 'set_status', status: 'WON', events: [] }, { action: 'set_status', status: 'WON', name: 'x' },
      { action: 'add_note', text: 'x', legacyRef: {} }, {}, { status: 'WON' }
    ]) expect((await one.PATCH(req('PATCH', bad), ctx)).status).toBe(400);
    expect(Object.values(svc).filter(f => f !== svc.serializeLead).every(f => !f.mock.calls.length)).toBe(true);
  });
  it('routes valid actions to the service and maps service failures to their status', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    svc.updateLeadStatus.mockResolvedValue({ ok: false, error: 'Lead is WON; reopen explicitly to change it', status: 409 });
    const conflict = await one.PATCH(req('PATCH', { action: 'set_status', status: 'FOLLOW_UP' }), ctx);
    expect(conflict.status).toBe(409);
    svc.addLeadNote.mockResolvedValue({ ok: true, value: { _id: ID } });
    expect((await one.PATCH(req('PATCH', { action: 'add_note', text: 'hello', actor: 'owner' }), ctx)).status).toBe(200);
    expect(svc.addLeadNote).toHaveBeenCalledWith(ID, 'hello', 'owner@example.com');
    svc.scheduleLeadFollowUp.mockResolvedValue({ ok: true, value: { _id: ID } });
    await one.PATCH(req('PATCH', { action: 'schedule_follow_up', at: null }), ctx);
    expect(svc.scheduleLeadFollowUp).toHaveBeenCalledWith(ID, null, 'owner@example.com');
  });
  it('rejects oversized and non-JSON bodies', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect((await one.PATCH(req('PATCH', { action: 'add_note', text: 'x'.repeat(25_000) }), ctx)).status).toBe(400);
    const textBody = new Request(url, { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://localhost:3000', cookie: 'apex_admin=' + 'A'.repeat(43), 'content-type': 'text/plain' }, body: 'x' });
    expect((await list.POST(textBody)).status).toBe(400);
  });
});

describe('no public CRM surface', () => {
  const root = join(__dirname, '..', '..', '..', '..');
  const walk = (dir: string): string[] => readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

  it('no public (non-internal) route handler exports GET/PUT/PATCH/DELETE against leads, and none imports the internal serializer', () => {
    const publicRoutes = walk(join(root, 'app', 'api')).filter(p => /route\.ts$/.test(p) && !/[\\/]internal[\\/]/.test(p));
    expect(publicRoutes.length).toBeGreaterThan(5);
    for (const file of publicRoutes) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/serializeLead|listLeads|getLeadById|getLeadSummary|from '@\/models\/Lead'/);
    }
    expect(existsSync(join(root, 'app', 'api', 'leads'))).toBe(false);
  });
  it('the three public enquiry routes expose POST only', () => {
    for (const name of ['inquiries', 'contact', 'booking-requests']) {
      const source = readFileSync(join(root, 'app', 'api', name, 'route.ts'), 'utf8');
      expect(source).toMatch(/export async function POST/);
      expect(source).not.toMatch(/export (async )?function (GET|PUT|PATCH|DELETE)/);
    }
  });
  it('public enquiry responses contain no CRM fields', () => {
    for (const name of ['inquiries', 'contact', 'booking-requests']) {
      const source = readFileSync(join(root, 'app', 'api', name, 'route.ts'), 'utf8');
      expect(source).not.toMatch(/NextResponse\.json\(\{[^}]*(lead|internalNotes|priority|assignedTo|nextFollowUp)/i);
    }
  });
  it('the /internal/leads page checks the session server-side and redirects before rendering the CRM', () => {
    const page = readFileSync(join(root, 'app', 'internal', 'leads', 'page.tsx'), 'utf8');
    expect(page).toContain("getAdminFromCookies(['OWNER'])");
    expect(page.indexOf("redirect('/internal/login')")).toBeLessThan(page.indexOf('<LeadsClient'));
  });
});

describe('backfill dry-run safety', () => {
  const script = readFileSync(join(__dirname, '..', '..', '..', '..', 'scripts', 'backfillLeadsFromLegacy.ts'), 'utf8');
  const dryRun = script.slice(script.indexOf('async function dryRun'), script.indexOf('async function execute'));
  it('the dry-run path performs only reads and prints no row content', () => {
    expect(dryRun.length).toBeGreaterThan(500);
    expect(dryRun).not.toMatch(/\.(insert|update|delete|replace|create|save|bulkWrite|drop)\w*\(/i);
    expect(dryRun).not.toMatch(/console\.log\([^)]*\b(row|name|phone|email|message)\b/);
    expect(script).toMatch(/mongoose\.set\('autoIndex', false\)/);
  });
});
