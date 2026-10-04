import { connectDB } from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { normalizeCustomerEmail } from '@/lib/customerValidation';
import { MAX_PASSWORD_LENGTH, getDummyHash, verifyPassword } from '@/lib/adminPassword';
import { isLoginBlocked, recordLoginFailure } from './adminRateLimit.service';
import { createSession } from './adminSession.service';

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; status: 400 | 401 | 429 };

/**
 * Credential check. Every failure for a bad email, unknown email, wrong password or
 * inactive account is the same `401` with the same work done (a real scrypt run - against
 * a dummy hash when there is no such user), so neither the response nor its timing says
 * which accounts exist. Nothing here logs the email, password or hash.
 */
export async function login(input: { email: unknown; password: unknown }, ip: string): Promise<LoginResult> {
  const email = normalizeCustomerEmail(input.email);
  const password = input.password;
  if (typeof password !== 'string' || !password || password.length > MAX_PASSWORD_LENGTH) return { ok: false, status: 400 };

  // Throttle on whatever email text was supplied (hashed), valid or not.
  const throttleEmail = email ?? String(input.email ?? '').toLowerCase().slice(0, 200);
  if (await isLoginBlocked(ip, throttleEmail)) return { ok: false, status: 429 };

  await connectDB();
  const user = email ? await AdminUser.findOne({ email }).select('+passwordHash') : null;
  const matches = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !user.isActive || !matches) {
    await recordLoginFailure(ip, throttleEmail);
    return { ok: false, status: 401 };
  }

  const session = await createSession(String(user._id));
  await AdminUser.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { ok: true, ...session };
}
