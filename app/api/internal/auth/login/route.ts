import { internalJson, readInternalJson } from '@/lib/leadsAccess';
import { buildSessionCookie, clientIp, isSameOriginRequest } from '@/lib/adminAuthShared';
import { isRateLimited } from '@/lib/rateLimit';
import { login } from '@/services/auth/adminLogin.service';

export const dynamic = 'force-dynamic';

const GENERIC_FAILURE = { error: 'Invalid email or password' };

/** POST only. Same-origin enforced; failures are one generic message; nothing but
 *  `{ ok: true }` (plus the HttpOnly cookie) is ever returned - no hash, token or role. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return internalJson({ error: 'Same-origin access required' }, 403);
  const ip = clientIp(request);
  // Cheap per-instance guard in front of the durable DB-backed limiter.
  if (isRateLimited(`admin-login:${ip}`, 30)) return internalJson({ error: 'Too many attempts. Please wait and try again.' }, 429);

  let body: Record<string, unknown>;
  try {
    body = await readInternalJson(request, 2_000);
  } catch {
    return internalJson({ error: 'Invalid request' }, 400);
  }
  try {
    const result = await login({ email: body.email, password: body.password }, ip);
    if (!result.ok) {
      if (result.status === 429) return internalJson({ error: 'Too many attempts. Please wait and try again.' }, 429);
      return internalJson(result.status === 400 ? { error: 'Invalid request' } : GENERIC_FAILURE, result.status);
    }
    const response = internalJson({ ok: true });
    response.headers.append('Set-Cookie', buildSessionCookie(result.token, result.expiresAt));
    return response;
  } catch {
    console.error('Admin login failed unexpectedly'); // no email/password/hash in logs
    return internalJson({ error: 'Unable to sign in right now' }, 503);
  }
}
