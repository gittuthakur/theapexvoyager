import { cookies } from 'next/headers';
import { internalJson } from '@/lib/leadsAccess';
import { isSameOriginRequest, isStateChanging, readSessionToken, sessionCookieName } from '@/lib/adminAuthShared';
import { getSession, hasRole, type AdminIdentity } from '@/services/auth/adminSession.service';
import type { AdminRole } from '@/models/AdminUser';

/**
 * Server-side authorization for every protected API handler (each handler calls this
 * itself - nothing relies on proxy/middleware or on hidden UI). Order matters:
 *  1. cookie-authenticated writes must pass the same-origin (CSRF) check -> 403
 *  2. a valid server-side session is required -> 401
 *  3. the role (read from the DB, never the client) must be allowed -> 403
 */
export async function requireAdmin(request: Request, roles: readonly AdminRole[] = ['OWNER']): Promise<{ identity: AdminIdentity } | { response: Response }> {
  if (isStateChanging(request.method) && !isSameOriginRequest(request)) return { response: internalJson({ error: 'Same-origin access required' }, 403) };
  const identity = await getSession(readSessionToken(request));
  if (!identity) return { response: internalJson({ error: 'Authentication required' }, 401) };
  if (!hasRole(identity, roles)) return { response: internalJson({ error: 'Forbidden' }, 403) };
  return { identity };
}

/** For server components: the allowed identity, or null (-> caller redirects to login).
 *  No cookie means no database access at all. */
export async function getAdminFromCookies(roles: readonly AdminRole[] = ['OWNER']): Promise<AdminIdentity | null> {
  const token = (await cookies()).get(sessionCookieName())?.value;
  const identity = await getSession(token);
  return hasRole(identity, roles) ? identity : null;
}
