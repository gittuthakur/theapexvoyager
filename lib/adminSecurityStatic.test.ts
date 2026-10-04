import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const m = vi.hoisted(() => ({ cookieGet: vi.fn(), connectDB: vi.fn(), findOne: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: m.cookieGet }) }));
vi.mock('@/lib/mongodb', () => ({ connectDB: m.connectDB }));
vi.mock('@/models/AdminSession', () => ({ AdminSession: { findOne: m.findOne } }));
vi.mock('@/models/AdminUser', () => ({ AdminUser: { findById: vi.fn() } }));

const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const walk = (dir: string): string[] => readdirSync(join(root, dir)).flatMap(n => {
  const p = join(dir, n);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p.replace(/\\/g, '/')];
});

describe('internal route inventory: only the CRM + auth are enabled in production', () => {
  const ENABLED = /^app\/(api\/)?internal\/(leads|auth|login)\//;
  const others = [...walk('app/internal'), ...walk('app/api/internal')].filter(f => /(page|route)\.tsx?$/.test(f) && !ENABLED.test(f));

  it('finds the existing tools to check', () => expect(others.length).toBeGreaterThanOrEqual(14));
  it.each(others)('%s keeps its development-only guard and is not wired to admin auth', file => {
    const source = read(file);
    expect(source, file).toMatch(/isLocalDevelopment|requireInternalDevAccess|costingAccessDenied|NODE_ENV/);
    expect(source, file).not.toMatch(/adminGuard|adminSession/);
  });
});

describe('no public signup / insecure auth patterns', () => {
  const authFiles = [
    ...walk('services/auth').filter(f => !f.endsWith('.test.ts')), ...walk('app/api/internal/auth').filter(f => !f.endsWith('.test.ts')),
    ...walk('app/internal/login'), 'lib/adminAuthShared.ts', 'lib/adminGuard.ts', 'lib/adminPassword.ts',
    'models/AdminUser.ts', 'models/AdminSession.ts', 'models/AdminLoginAttempt.ts', 'scripts/bootstrapOwner.ts'
  ];
  it('has no signup/register/reset route or page anywhere under app/', () => {
    const all = walk('app').map(f => f.toLowerCase());
    expect(all.filter(f => /sign-?up|register|create-?account|reset-?password|forgot/.test(f))).toEqual([]);
    expect(read('app/internal/login/LoginForm.tsx')).not.toMatch(/create account|sign ?up|register|forgot/i);
  });
  it.each(authFiles)('%s uses no browser storage, NEXT_PUBLIC secrets, URL tokens or hard-coded credentials', file => {
    const source = read(file);
    expect(source, file).not.toMatch(/localStorage|sessionStorage|NEXT_PUBLIC_|searchParams|req(uest)?\.url.*token|btoa\(|Basic /);
    expect(source, file).not.toMatch(/password\s*[:=]\s*['"][^'"\s]{6,}['"]/i);
  });
  it('never sends a password hash or token in any response body', () => {
    for (const file of walk('app/api/internal/auth').filter(f => /route\.ts$/.test(f))) {
      expect(read(file), file).not.toMatch(/passwordHash|tokenHash|\{ ?token|token:/);
    }
    expect(read('models/AdminUser.ts')).toMatch(/passwordHash: \{[^}]*select: false/);
  });
  it('the login form posts only to the same-origin login API and does not persist credentials', () => {
    const form = read('app/internal/login/LoginForm.tsx');
    expect(form).toContain("'/api/internal/auth/login'");
    expect(form).toMatch(/autoComplete="current-password"/);
  });
});

describe('private pages are not cached or indexed', () => {
  it('login and CRM pages are noindex and dynamic', () => {
    for (const f of ['app/internal/login/page.tsx', 'app/internal/leads/page.tsx']) {
      expect(read(f)).toMatch(/index: false, follow: false/);
      expect(read(f)).toContain("dynamic = 'force-dynamic'");
    }
  });
  it('next.config sets no-store + noindex for /internal and /api/internal; robots disallows /internal/; sitemap omits it', () => {
    const config = read('next.config.mjs');
    for (const source of ['/internal/:path*', '/api/internal/:path*']) {
      const block = config.slice(config.indexOf(source));
      expect(block.slice(0, 300)).toMatch(/private, no-store/);
      expect(block.slice(0, 300)).toMatch(/noindex/);
    }
    expect(read('app/robots.ts')).toContain("'/internal/'");
    expect(read('app/sitemap.ts')).not.toMatch(/internal/);
  });
});

describe('server component guard', () => {
  beforeEach(() => { Object.values(m).forEach(f => f.mockReset()); });

  it('no cookie, or a malformed one, resolves to null without touching the database', async () => {
    const { getAdminFromCookies } = await import('./adminGuard');
    m.cookieGet.mockReturnValue(undefined);
    expect(await getAdminFromCookies()).toBeNull();
    m.cookieGet.mockReturnValue({ value: 'tampered' });
    expect(await getAdminFromCookies()).toBeNull();
    expect(m.connectDB).not.toHaveBeenCalled();
    expect(m.findOne).not.toHaveBeenCalled();
  });
  it('fails closed when the database errors', async () => {
    const { getAdminFromCookies } = await import('./adminGuard');
    m.cookieGet.mockReturnValue({ value: 'A'.repeat(43) });
    m.connectDB.mockRejectedValue(new Error('down'));
    expect(await getAdminFromCookies()).toBeNull();
  });
  it('lists the inventory used by this suite (documentation of what is enabled)', () => {
    const enabled = [...walk('app/internal'), ...walk('app/api/internal')].filter(f => /(page|route)\.tsx?$/.test(f)).map(f => relative('app', f).replace(/\\/g, '/'));
    expect(enabled.filter(f => /adminGuard/.test(read(`app/${f}`)) || /getAdminFromCookies/.test(read(`app/${f}`))).sort()).toEqual([
      'api/internal/leads/[id]/route.ts', 'api/internal/leads/route.ts', 'internal/leads/page.tsx', 'internal/login/page.tsx'
    ]);
  });
});
