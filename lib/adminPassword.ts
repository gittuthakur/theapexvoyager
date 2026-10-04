/**
 * Admin password hashing - Node's built-in scrypt (a memory-hard, established KDF; no
 * custom cryptography, no new dependency). Stored format:
 *   scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>
 * Parameters are stored with each hash so they can be raised later without breaking
 * existing logins. N=2^16, r=8 needs ~64 MiB per hash (OWASP-class scrypt cost).
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const N = 65_536;
const R = 8;
const P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;
// scrypt needs 128*N*r bytes; Node's default maxmem (32 MiB) would reject N=2^16.
const maxmem = (n: number, r: number) => 128 * n * r + 1024 * 1024;

export const MIN_PASSWORD_LENGTH = 14;
export const MAX_PASSWORD_LENGTH = 256;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, keyLen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize('NFKC'), salt, keyLen, { N: n, r, p, maxmem: maxmem(n, r) }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await derive(password, salt, N, R, P, KEY_LEN);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

/** Constant-time comparison; malformed/foreign hashes simply return false (never throw). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, n, r, p, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const [nn, rr, pp] = [Number(n), Number(r), Number(p)];
    // Refuse absurd parameters from a corrupted record (memory-exhaustion guard).
    if (![nn, rr, pp].every(Number.isInteger) || nn < 2 ** 14 || nn > 2 ** 20 || rr < 1 || rr > 16 || pp < 1 || pp > 4) return false;
    const expected = Buffer.from(hash, 'base64');
    if (expected.length < 32) return false;
    const actual = await derive(password, Buffer.from(salt, 'base64'), nn, rr, pp, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;
/** A real hash of a random value, so "no such user" costs the same scrypt work as a wrong password. */
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(24).toString('base64'));
  return dummyHash;
}

export function validatePasswordPolicy(password: unknown, email?: string): { ok: true } | { ok: false; error: string } {
  if (typeof password !== 'string') return { ok: false, error: 'Password is required' };
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  if (password.length > MAX_PASSWORD_LENGTH) return { ok: false, error: 'Password is too long' };
  if (new Set(password).size < 6) return { ok: false, error: 'Password is too repetitive' };
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase()) && email.split('@')[0].length >= 4) return { ok: false, error: 'Password must not contain your email name' };
  return { ok: true };
}
