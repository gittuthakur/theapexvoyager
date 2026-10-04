import { createHash, randomBytes } from 'node:crypto';
import { connectDB } from '@/lib/mongodb';
import { AdminSession } from '@/models/AdminSession';
import { AdminUser, type AdminRole } from '@/models/AdminUser';
import { SESSION_TTL_MS, TOKEN_PATTERN } from '@/lib/adminAuthShared';

export interface AdminIdentity {
  userId: string;
  email: string;
  role: AdminRole;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** The raw token exists only in the returned value (-> Set-Cookie); the DB keeps its hash. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  await connectDB();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await AdminSession.create({ tokenHash: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

/**
 * Resolves a cookie token to an identity, or null. Everything that matters is read from
 * the database on every call - the role and active flag come from AdminUser, never from
 * the cookie - so a forged/edited/expired/revoked token, a deactivated user or a changed
 * role is rejected immediately. Fails closed on any error.
 */
export async function getSession(token: string | undefined, now = new Date()): Promise<AdminIdentity | null> {
  if (!token || !TOKEN_PATTERN.test(token)) return null; // malformed cookies never reach the DB
  try {
    await connectDB();
    const session = await AdminSession.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: now } });
    if (!session) return null;
    const user = await AdminUser.findById(session.userId);
    if (!user || !user.isActive) return null;
    return { userId: String(user._id), email: user.email, role: user.role };
  } catch {
    return null;
  }
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token || !TOKEN_PATTERN.test(token)) return;
  await connectDB();
  await AdminSession.deleteOne({ tokenHash: hashToken(token) });
}

export const hasRole = (identity: AdminIdentity | null, allowed: readonly AdminRole[]): identity is AdminIdentity =>
  !!identity && allowed.includes(identity.role);
