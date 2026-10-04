import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ exists: vi.fn(), create: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/AdminUser', () => ({ AdminUser: m }));
const { bootstrapOwner } = await import('./adminBootstrap.service');

const PASSWORD = 'correct-horse-battery-staple-9';
let stored: { email: string; passwordHash: string; role: string; isActive: boolean }[] = [];
beforeEach(() => {
  stored = [];
  m.exists.mockReset().mockImplementation(async (q: { role: string }) => (stored.some(u => u.role === q.role) ? { _id: 'x' } : null));
  m.create.mockReset().mockImplementation(async (doc: (typeof stored)[number]) => { stored.push(doc); return doc; });
});

describe('bootstrapOwner (mocked model - no database is touched)', () => {
  it('creates exactly one OWNER with a scrypt hash and no plaintext, normalising the email', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await bootstrapOwner({ email: '  Owner@Example.COM ', password: PASSWORD })).toEqual({ ok: true });
    expect(m.create).toHaveBeenCalledTimes(1);
    expect(stored[0]).toMatchObject({ email: 'owner@example.com', role: 'OWNER', isActive: true });
    expect(stored[0].passwordHash.startsWith('scrypt$')).toBe(true);
    expect(JSON.stringify(stored)).not.toContain(PASSWORD);
    expect(JSON.stringify([...log.mock.calls, ...err.mock.calls])).not.toContain(PASSWORD);
    log.mockRestore(); err.mockRestore();
  });
  it('is safe to run twice: the second run refuses and changes nothing', async () => {
    await bootstrapOwner({ email: 'owner@example.com', password: PASSWORD });
    const again = await bootstrapOwner({ email: 'other@example.com', password: PASSWORD + '!' });
    expect(again).toMatchObject({ ok: false, reason: 'owner_exists' });
    expect(stored).toHaveLength(1);
  });
  it('maps a unique-index race (11000) to owner_exists', async () => {
    m.create.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
    expect(await bootstrapOwner({ email: 'owner@example.com', password: PASSWORD })).toMatchObject({ ok: false, reason: 'owner_exists' });
  });
  it('rejects invalid emails and weak passwords before any database access', async () => {
    for (const email of ['', 'nope', 42, undefined]) expect(await bootstrapOwner({ email, password: PASSWORD })).toMatchObject({ ok: false, reason: 'invalid_email' });
    for (const password of ['short', 'aaaaaaaaaaaaaaaaaaaa', undefined, 'owner@example.com']) {
      expect(await bootstrapOwner({ email: 'owner@example.com', password })).toMatchObject({ ok: false, reason: 'weak_password' });
    }
    expect(m.exists).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });
  it('dry run validates and checks for an existing OWNER but never writes', async () => {
    expect(await bootstrapOwner({ email: 'owner@example.com', password: PASSWORD }, { dryRun: true })).toEqual({ ok: true });
    expect(m.create).not.toHaveBeenCalled();
    stored.push({ email: 'a@b.co', passwordHash: 'x', role: 'OWNER', isActive: true });
    expect(await bootstrapOwner({ email: 'owner@example.com', password: PASSWORD }, { dryRun: true })).toMatchObject({ ok: false, reason: 'owner_exists' });
  });
});
