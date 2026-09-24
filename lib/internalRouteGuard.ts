import { NextResponse } from 'next/server';
import { isLocalDevelopment } from '@/lib/env';

/**
 * Shared dev-only gate for every route under app/api/internal/*. This project has no
 * admin authentication mechanism today (no session/login/JWT system anywhere in this
 * codebase, audited 2026-09) — rather than fake one, every internal route is gated the
 * same way lib/stays.ts already gates real Google Places spend in dev
 * (isLocalDevelopment()): every real hosting deployment sets NODE_ENV to 'production'
 * (see lib/env.ts's own doc comment), so this 404s in every real deployment regardless
 * of who might otherwise be able to reach the URL. This is a known, reported limitation,
 * not a production-ready access-control model — before any of these routes could ever
 * run against production data, this project needs a real admin auth layer.
 */
export function requireInternalDevAccess(): NextResponse | null {
  if (isLocalDevelopment()) return null;
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
