import { createHash } from 'node:crypto';
import { connectDB } from '@/lib/mongodb';
import { AdminLoginAttempt } from '@/models/AdminLoginAttempt';

/**
 * Durable, cross-instance brute-force limiter backed by the existing MongoDB (no new
 * service). Fixed 15-minute windows of FAILED logins, tracked per client IP and per
 * (hashed) email. Guarantees: an attacker on one IP gets <= 20 guesses / 15 min total,
 * and any single account sees <= 10 failed guesses / 15 min across ALL IPs. Limitation:
 * the per-account cap can be used to lock the owner out for <= 15 min (an availability
 * trade-off, never a confidentiality one); a distributed attacker is bounded by the
 * per-account cap, not the IP cap. Success does not reset a counter.
 */
export const WINDOW_MS = 15 * 60 * 1000;
export const LIMITS = { ip: 20, account: 10 } as const;

const digest = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 32);

function keys(ip: string, email: string, now: number) {
  const bucket = Math.floor(now / WINDOW_MS);
  return [
    { key: `ip:${digest(ip)}:${bucket}`, limit: LIMITS.ip },
    { key: `acct:${digest(email)}:${bucket}`, limit: LIMITS.account }
  ];
}

export async function isLoginBlocked(ip: string, email: string, now = Date.now()): Promise<boolean> {
  await connectDB();
  const entries = keys(ip, email, now);
  const rows: { key: string; count: number }[] = await AdminLoginAttempt.find({ key: { $in: entries.map(e => e.key) } });
  return entries.some(e => (rows.find(r => r.key === e.key)?.count ?? 0) >= e.limit);
}

export async function recordLoginFailure(ip: string, email: string, now = Date.now()): Promise<void> {
  await connectDB();
  const expiresAt = new Date((Math.floor(now / WINDOW_MS) + 1) * WINDOW_MS + 60_000);
  await Promise.all(keys(ip, email, now).map(e =>
    AdminLoginAttempt.updateOne({ key: e.key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true })
  ));
}
