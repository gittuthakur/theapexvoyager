import { connectDB } from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { normalizeCustomerEmail } from '@/lib/customerValidation';
import { hashPassword, validatePasswordPolicy } from '@/lib/adminPassword';

export type BootstrapResult = { ok: true } | { ok: false; reason: 'invalid_email' | 'weak_password' | 'owner_exists'; message: string };

/**
 * One-time OWNER creation, invoked only from scripts/bootstrapOwner.ts (there is NO
 * public signup route). Refuses if any OWNER already exists, so re-running is safe; a
 * partial unique index on AdminUser.role='OWNER' backstops a race. The plaintext password
 * is hashed immediately and is never logged, returned or stored.
 */
export async function bootstrapOwner(input: { email: unknown; password: unknown }, options: { dryRun?: boolean } = {}): Promise<BootstrapResult> {
  const email = normalizeCustomerEmail(input.email);
  if (!email) return { ok: false, reason: 'invalid_email', message: 'A valid email address is required' };
  const policy = validatePasswordPolicy(input.password, email);
  if (!policy.ok) return { ok: false, reason: 'weak_password', message: policy.error };

  await connectDB();
  if (await AdminUser.exists({ role: 'OWNER' })) return { ok: false, reason: 'owner_exists', message: 'An OWNER account already exists; nothing was changed' };
  if (options.dryRun) return { ok: true };

  const passwordHash = await hashPassword(input.password as string);
  try {
    await AdminUser.create({ email, passwordHash, role: 'OWNER', isActive: true });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return { ok: false, reason: 'owner_exists', message: 'An OWNER account already exists; nothing was changed' };
    throw error;
  }
  return { ok: true };
}
