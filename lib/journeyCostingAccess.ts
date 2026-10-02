import { requireInternalDevAccess } from './internalRouteGuard';

/** Not authentication. Run next dev bound to 127.0.0.1; all hosted production access is disabled. */
export function costingAccessDenied(request: Request): Response | null {
  if (process.env.NODE_ENV !== 'development' || requireInternalDevAccess()) return Response.json({ error: 'Not found' }, { status: 404 });
  const url = new URL(request.url);
  // Next's dev server can normalize request.url to localhost while preserving the actual Host.
  const host = request.headers.get('host') ?? url.host;
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return Response.json({ error: 'Local access only' }, { status: 403 });
  const localOrigin = `${url.protocol}//${host}`;
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || (forwardedHost && forwardedHost !== host)) return Response.json({ error: 'Local access only' }, { status: 403 });
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if ((origin && origin !== localOrigin) || (site && site !== 'same-origin' && site !== 'none') || (request.method !== 'GET' && origin !== localOrigin)) return Response.json({ error: 'Same-origin access required' }, { status: 403 });
  return null;
}
