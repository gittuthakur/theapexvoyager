// Local-dev gate for anything that spends real, billed API credits (Google Places).
// `next dev` always sets NODE_ENV to 'development'; `next build`/`next start` and every
// hosting provider's production build set it to 'production', so this alone is a
// reliable signal — no need to inspect the request host. The `window.location` check
// only matters if this ever gets imported into a client component; none of the
// Places-calling code currently is, but this keeps the helper correct if that changes.
export function isLocalDevelopment(): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
  return false;
}
