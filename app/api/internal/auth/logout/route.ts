import { internalJson } from '@/lib/leadsAccess';
import { buildClearedSessionCookie, isSameOriginRequest, readSessionToken } from '@/lib/adminAuthShared';
import { revokeSession } from '@/services/auth/adminSession.service';

export const dynamic = 'force-dynamic';

/** POST only. Deletes the server-side session (so the old cookie is dead even if replayed)
 *  and clears the cookie. Safe to call without a session. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return internalJson({ error: 'Same-origin access required' }, 403);
  try {
    await revokeSession(readSessionToken(request));
  } catch {
    console.error('Admin logout could not revoke the session');
  }
  const response = internalJson({ ok: true });
  response.headers.append('Set-Cookie', buildClearedSessionCookie());
  return response;
}
