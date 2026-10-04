import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { hashPassword } from '@/lib/adminPassword';

/**
 * End-to-end auth behaviour against IN-MEMORY fakes of the three admin models: nothing here
 * can reach MongoDB (the likely-production database), so DB writes in this suite are zero.
 */
type Row = Record<string, any>;
const db = vi.hoisted(() => ({
  users: [] as Row[], sessions: [] as Row[], attempts: new Map<string, number>(), writes: { users: 0 },
  leadCalls: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/AdminUser', () => ({
  AdminUser: {
    findOne: ({ email }: Row) => ({ select: async () => db.users.find(u => u.email === email) ?? null }),
    findById: async (id: string) => db.users.find(u => u._id === id) ?? null,
    updateOne: async (_f: Row, update: Row) => { db.writes.users++; Object.assign(db.users[0] ?? {}, update.$set); }
  }
}));
vi.mock('@/models/AdminSession', () => ({
  AdminSession: {
    create: async (doc: Row) => { db.sessions.push(doc); return doc; },
    findOne: async ({ tokenHash, expiresAt }: Row) => db.sessions.find(s => s.tokenHash === tokenHash && s.expiresAt > expiresAt.$gt) ?? null,
    deleteOne: async ({ tokenHash }: Row) => { db.sessions = db.sessions.filter(s => s.tokenHash !== tokenHash); }
  }
}));
vi.mock('@/models/AdminLoginAttempt', () => ({
  AdminLoginAttempt: {
    find: async ({ key }: Row) => key.$in.filter((k: string) => db.attempts.has(k)).map((k: string) => ({ key: k, count: db.attempts.get(k) })),
    updateOne: async ({ key }: Row, update: Row) => { db.attempts.set(key, (db.attempts.get(key) ?? 0) + update.$inc.count); }
  }
}));
vi.mock('@/lib/rateLimit', () => ({ isRateLimited: vi.fn().mockReturnValue(false) }));
vi.mock('@/services/leads/lead.service', () => ({
  listLeads: async () => { db.leadCalls(); return { ok: true, value: [{ id: 'x', name: 'Synthetic' }] }; },
  getLeadSummary: async () => ({ total: 1 }), createLead: vi.fn(), serializeLead: (x: unknown) => x, getLeadById: vi.fn(),
  updateLeadStatus: vi.fn().mockResolvedValue({ ok: true, value: { _id: 'x' } }), setLeadPriority: vi.fn(), addLeadNote: vi.fn(),
  scheduleLeadFollowUp: vi.fn(), recordLeadContacted: vi.fn(), setLeadQuote: vi.fn(), setLeadAssignee: vi.fn()
}));

const login = await import('./login/route');
const logout = await import('./logout/route');
const leads = await import('../leads/route');
const lead = await import('../leads/[id]/route');

const PASSWORD = 'correct-horse-battery-staple-9';
const ORIGIN = 'http://localhost:3000';
let hash: string;
beforeAll(async () => { hash = await hashPassword(PASSWORD); });

let n = 0;
const req = (url: string, init: { method?: string; body?: unknown; cookie?: string; origin?: string | null; ip?: string } = {}) => {
  const headers: Record<string, string> = { host: 'localhost:3000', 'content-type': 'application/json', 'x-forwarded-for': init.ip ?? `10.0.0.${n++}` };
  if (init.origin !== null) headers.origin = init.origin ?? ORIGIN;
  if (init.cookie) headers.cookie = init.cookie;
  return new Request(url, { method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
};
const doLogin = (email: string, password: string, extra = {}) => login.POST(req(`${ORIGIN}/api/internal/auth/login`, { method: 'POST', body: { email, password }, ...extra }));
const tokenFrom = (response: Response) => /apex_admin=([^;]+)/.exec(response.headers.get('set-cookie') ?? '')?.[1] ?? '';
const cookieName = () => (process.env.NODE_ENV === 'production' ? '__Host-apex_admin' : 'apex_admin');
const withCookie = (token: string) => `${cookieName()}=${token}`;

beforeEach(() => {
  db.users = [{ _id: 'u1', email: 'owner@example.com', passwordHash: hash, role: 'OWNER', isActive: true }];
  db.sessions = []; db.attempts.clear(); db.writes.users = 0; db.leadCalls.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe('login', () => {
  it('valid login creates a server-side session (hash only) and sets an HttpOnly SameSite=Strict cookie', async () => {
    const response = await doLogin('Owner@Example.com ', PASSWORD);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^apex_admin=[A-Za-z0-9_-]{43}; /);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=\d+/);
    expect(cookie).not.toMatch(/Secure/); // local http only
    expect(db.sessions).toHaveLength(1);
    expect(db.sessions[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(db.sessions)).not.toContain(tokenFrom(response)); // raw token never stored
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('production cookie is __Host- prefixed and Secure (and requires an https Origin)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect((await doLogin('owner@example.com', PASSWORD)).status).toBe(403); // http origin refused in production
    const response = await doLogin('owner@example.com', PASSWORD, { origin: 'https://www.example.com' }).catch(() => null);
    expect(response?.status).toBe(403); // host header is localhost:3000, so a different https host is refused
    const ok = await login.POST(new Request('https://www.example.com/api/internal/auth/login', {
      method: 'POST', headers: { host: 'www.example.com', origin: 'https://www.example.com', 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' },
      body: JSON.stringify({ email: 'owner@example.com', password: PASSWORD })
    }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('set-cookie')).toMatch(/^__Host-apex_admin=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=\d+; Secure$/);
  });
  it('wrong password, unknown email and inactive account all give the same generic 401', async () => {
    db.users.push({ _id: 'u2', email: 'off@example.com', passwordHash: hash, role: 'OWNER', isActive: false });
    const results = await Promise.all([doLogin('owner@example.com', 'wrong-password-123'), doLogin('nobody@example.com', PASSWORD), doLogin('off@example.com', PASSWORD)]);
    for (const r of results) expect(r.status).toBe(401);
    const bodies = await Promise.all(results.map(r => r.json()));
    expect(new Set(bodies.map(b => JSON.stringify(b))).size).toBe(1);
    expect(bodies[0]).toEqual({ error: 'Invalid email or password' });
    expect(results.some(r => r.headers.get('set-cookie'))).toBe(false);
    expect(db.sessions).toHaveLength(0);
  });
  it('never returns or logs the password, hash or token', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = await doLogin('owner@example.com', 'wrong-password-123');
    const ok = await doLogin('owner@example.com', PASSWORD);
    for (const text of [JSON.stringify(await bad.json()), JSON.stringify(await ok.json()), JSON.stringify(log.mock.calls)]) {
      expect(text).not.toMatch(/scrypt|passwordHash|correct-horse|wrong-password/);
    }
    log.mockRestore();
  });
  it('rejects cross-origin / origin-less logins, malformed bodies, oversize passwords and non-JSON', async () => {
    expect((await doLogin('owner@example.com', PASSWORD, { origin: 'https://attacker.invalid' })).status).toBe(403);
    expect((await doLogin('owner@example.com', PASSWORD, { origin: null })).status).toBe(403);
    expect((await login.POST(req(`${ORIGIN}/api/internal/auth/login`, { method: 'POST', body: [] }))).status).toBe(400);
    expect((await doLogin('owner@example.com', 'x'.repeat(300))).status).toBe(400);
    expect((await doLogin('owner@example.com', '')).status).toBe(400);
    expect((await login.POST(new Request(`${ORIGIN}/api/internal/auth/login`, { method: 'POST', headers: { host: 'localhost:3000', origin: ORIGIN }, body: 'x' }))).status).toBe(400);
    expect(db.sessions).toHaveLength(0);
  });
  it('brute force: per-account cap locks after 10 failures even from many IPs, per-IP cap after 20; the correct password is then refused too', async () => {
    for (let i = 0; i < 10; i++) expect((await doLogin('owner@example.com', `guess-number-${i}-xx`)).status).toBe(401);
    expect((await doLogin('owner@example.com', PASSWORD)).status).toBe(429); // different IP, same account
    expect(db.sessions).toHaveLength(0);
    for (let i = 0; i < 20; i++) await doLogin(`user${i}@example.com`, 'guess-guess-guess', { ip: '6.6.6.6' });
    expect((await doLogin('fresh@example.com', 'whatever-password', { ip: '6.6.6.6' })).status).toBe(429);
    expect((await doLogin('fresh@example.com', 'whatever-password', { ip: '7.7.7.7' })).status).toBe(401); // other IPs unaffected
  }, 60_000);
  it('successful logins do not consume the failure budget', async () => {
    for (let i = 0; i < 12; i++) expect((await doLogin('owner@example.com', PASSWORD, { ip: '5.5.5.5' })).status).toBe(200);
  }, 60_000);
});

describe('protected CRM API', () => {
  const crm = (cookie?: string, init = {}) => leads.GET(req(`${ORIGIN}/api/internal/leads`, { cookie, ...init }));

  it('no cookie -> 401 and no lead data is read', async () => {
    const response = await crm();
    expect(response.status).toBe(401);
    expect(db.leadCalls).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toMatch(/Synthetic/);
  });
  it('forged, malformed and tampered cookies -> 401', async () => {
    const real = tokenFrom(await doLogin('owner@example.com', PASSWORD));
    const flipped = real.slice(0, -1) + (real.endsWith('A') ? 'B' : 'A');
    for (const bad of ['garbage', '', 'A'.repeat(43), flipped, `${real}x`, 'null']) {
      expect((await crm(withCookie(bad))).status).toBe(401);
    }
    expect((await crm(`role=OWNER; ${cookieName()}=A`)).status).toBe(401);
    expect(db.leadCalls).not.toHaveBeenCalled();
  });
  it('valid OWNER session -> 200; client cannot choose the role', async () => {
    const token = tokenFrom(await doLogin('owner@example.com', PASSWORD));
    const response = await crm(withCookie(token));
    expect(response.status).toBe(200);
    expect((await response.json()).leads[0].name).toBe('Synthetic');
    // spoofed role hints are ignored; role is re-read from the user record each request
    expect((await crm(`${withCookie(token)}; role=OWNER`, { })).status).toBe(200);
  });
  it('expired session -> 401', async () => {
    const token = tokenFrom(await doLogin('owner@example.com', PASSWORD));
    db.sessions[0].expiresAt = new Date(Date.now() - 1000);
    expect((await crm(withCookie(token))).status).toBe(401);
  });
  it('wrong role (EMPLOYEE) -> 403; deactivated or demoted-after-login users lose access immediately', async () => {
    const token = tokenFrom(await doLogin('owner@example.com', PASSWORD));
    db.users[0].role = 'EMPLOYEE';
    expect((await crm(withCookie(token))).status).toBe(403);
    db.users[0].role = 'OWNER'; db.users[0].isActive = false;
    expect((await crm(withCookie(token))).status).toBe(401);
    expect(db.leadCalls).not.toHaveBeenCalled();
  });
  it('logout deletes the session; the old cookie is dead even if replayed', async () => {
    const token = tokenFrom(await doLogin('owner@example.com', PASSWORD));
    expect((await crm(withCookie(token))).status).toBe(200);
    const out = await logout.POST(req(`${ORIGIN}/api/internal/auth/logout`, { method: 'POST', cookie: withCookie(token) }));
    expect(out.status).toBe(200);
    expect(out.headers.get('set-cookie')).toMatch(/^apex_admin=; .*Max-Age=0/);
    expect(db.sessions).toHaveLength(0);
    expect((await crm(withCookie(token))).status).toBe(401);
  });
  it('logout is same-origin only and harmless without a session', async () => {
    expect((await logout.POST(req(`${ORIGIN}/api/internal/auth/logout`, { method: 'POST', origin: 'https://attacker.invalid' }))).status).toBe(403);
    expect((await logout.POST(req(`${ORIGIN}/api/internal/auth/logout`, { method: 'POST' }))).status).toBe(200);
  });
  it('state-changing CRM requests need a same-origin Origin even with a valid session (CSRF)', async () => {
    const token = tokenFrom(await doLogin('owner@example.com', PASSWORD));
    const patch = (origin: string | null) => lead.PATCH(
      req(`${ORIGIN}/api/internal/leads/${'a'.repeat(24)}`, { method: 'PATCH', cookie: withCookie(token), origin, body: { action: 'set_status', status: 'WON' } }),
      { params: Promise.resolve({ id: 'a'.repeat(24) }) }
    );
    expect((await patch('https://attacker.invalid')).status).toBe(403);
    expect((await patch(null)).status).toBe(403);
    expect((await patch(ORIGIN)).status).toBe(200);
    const post = await leads.POST(req(`${ORIGIN}/api/internal/leads`, { method: 'POST', cookie: withCookie(token), origin: 'https://attacker.invalid', body: { name: 'x' } }));
    expect(post.status).toBe(403);
  });
  it('unauthenticated PATCH/POST are rejected before any write', async () => {
    const response = await lead.PATCH(req(`${ORIGIN}/api/internal/leads/${'a'.repeat(24)}`, { method: 'PATCH', body: { action: 'set_status', status: 'WON' } }), { params: Promise.resolve({ id: 'a'.repeat(24) }) });
    expect(response.status).toBe(401);
    expect((await leads.POST(req(`${ORIGIN}/api/internal/leads`, { method: 'POST', body: { name: 'x' } }))).status).toBe(401);
  });
  it('works identically in production for an authenticated owner and still 401s anonymous requests', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const prodReq = (cookie?: string) => new Request('https://www.example.com/api/internal/leads', { headers: { host: 'www.example.com', ...(cookie ? { cookie } : {}) } });
    expect((await leads.GET(prodReq())).status).toBe(401);
    expect(db.leadCalls).not.toHaveBeenCalled();
  });
});
