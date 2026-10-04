/** Pure helpers shared by the admin auth routes/guards: cookie naming + flags, cookie
 *  parsing, and same-origin (CSRF) checks. No DB, no secrets. */

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // absolute 8h; no sliding extension
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url

const isProduction = () => process.env.NODE_ENV === 'production';

/** `__Host-` forces Secure + Path=/ + no Domain in browsers. Plain name in local http dev. */
export const sessionCookieName = () => (isProduction() ? '__Host-apex_admin' : 'apex_admin');

export function buildSessionCookie(token: string, expiresAt: Date): string {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return [`${sessionCookieName()}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAge}`, ...(isProduction() ? ['Secure'] : [])].join('; ');
}

export function buildClearedSessionCookie(): string {
  return [`${sessionCookieName()}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', ...(isProduction() ? ['Secure'] : [])].join('; ');
}

export function readSessionToken(request: Request): string | undefined {
  const name = sessionCookieName();
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=') || undefined;
  }
  return undefined;
}

/**
 * CSRF / origin protection for cookie-authenticated, state-changing requests. The
 * Origin header must name this very host (and https in production). With no Origin, only
 * a browser-asserted `Sec-Fetch-Site: same-origin` is accepted; anything else (including
 * non-browser clients that send neither) is refused. SameSite=Strict is a second layer.
 */
export function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get('host');
  if (!host) return false;
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const parsed = new URL(origin);
      return parsed.host === host && (!isProduction() || parsed.protocol === 'https:');
    } catch {
      return false;
    }
  }
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

export const isStateChanging = (method: string) => !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

export function clientIp(request: Request): string {
  return (request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown').slice(0, 100);
}
