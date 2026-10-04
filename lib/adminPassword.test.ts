import { describe, expect, it } from 'vitest';
import { hashPassword, validatePasswordPolicy, verifyPassword } from './adminPassword';

const PASSWORD = 'correct-horse-battery-staple-9';

describe('admin password hashing (scrypt)', () => {
  it('hashes with a random salt, never contains the plaintext, and verifies', async () => {
    const [a, b] = await Promise.all([hashPassword(PASSWORD), hashPassword(PASSWORD)]);
    expect(a).not.toBe(b); // unique salt per hash
    expect(a).not.toContain(PASSWORD);
    expect(a.startsWith('scrypt$65536$8$1$')).toBe(true);
    expect(await verifyPassword(PASSWORD, a)).toBe(true);
  });
  it('rejects wrong passwords, near-misses and Unicode-normalisation-equal inputs only', async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await verifyPassword('wrong', hash)).toBe(false);
    expect(await verifyPassword(PASSWORD + ' ', hash)).toBe(false);
    expect(await verifyPassword(PASSWORD.toUpperCase(), hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });
  it('returns false (never throws) for malformed, foreign or dangerous stored hashes', async () => {
    for (const bad of ['', 'plaintext', 'bcrypt$x$y', 'scrypt$1$1$1$AAAA$AAAA', 'scrypt$65536$8$1$$', 'scrypt$999999999$8$1$AAAA$' + 'A'.repeat(88), 'scrypt$abc$8$1$AAAA$AAAA']) {
      expect(await verifyPassword(PASSWORD, bad)).toBe(false);
    }
  });
});

describe('password policy', () => {
  it('requires length, variety and no email name', () => {
    expect(validatePasswordPolicy(PASSWORD, 'owner@example.com').ok).toBe(true);
    for (const weak of ['short', 'aaaaaaaaaaaaaaaaaaaa', 12345678901234, undefined, 'x'.repeat(300), 'MyOwnerPassword2026!']) {
      expect(validatePasswordPolicy(weak, 'owner@example.com').ok).toBe(false);
    }
  });
});
