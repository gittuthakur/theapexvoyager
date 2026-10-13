import { NextResponse } from 'next/server';
import { runGlobalSearch } from '@/lib/globalSearchServer';
import { parseGlobalSearchQuery } from '@/lib/search/globalSearch';
import { isRateLimited } from '@/lib/rateLimit';
import { createTimings, formatServerTiming } from '@/lib/globalSearchTiming';

// Read-only, per-request, never cached: a publication change must apply on the very next request, so no
// browser, proxy or CDN may keep a copy. Reads only the catalogs' own public loaders; no provider is called.
const HEADERS = { 'Cache-Control': 'private, no-store' };
// Per source address, per minute, using the in-process limiter the other public APIs already use (best effort,
// not a distributed limit - no new paid service). Typing is debounced client-side, so this is generous.
const RATE_LIMIT_PER_MINUTE = 90;

const ERROR_MESSAGES = {
  QUERY_REQUIRED: 'A search query is required.',
  QUERY_TOO_SHORT: 'The search query must be at least 2 characters.',
  QUERY_TOO_LONG: 'The search query must be at most 80 characters.',
  QUERY_INVALID: 'The search query contains characters that are not allowed.'
} as const;

/**
 * The address the rate limit is keyed on. A client can send any `X-Forwarded-For` it likes and most proxies APPEND
 * to it, so the LEFT-most entry is attacker-controlled and must not be trusted. In order of trust: the headers the
 * hosting platform sets itself (Vercel overwrites `x-vercel-forwarded-for` / `x-real-ip`), then the RIGHT-most
 * `X-Forwarded-For` entry (added by the nearest proxy), else one shared "unknown" bucket - a spoofer then shares a
 * bucket with everyone instead of getting a fresh one per request.
 */
function getClientIp(request: Request): string {
  const platform = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip');
  if (platform?.trim()) return platform.split(',')[0].trim();
  const entries = (request.headers.get('x-forwarded-for') ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
  return entries.length > 0 ? entries[entries.length - 1] : 'unknown';
}

function fail(status: number, code: string, message: string, extra: Record<string, string> = {}) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { ...HEADERS, ...extra } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const values = searchParams.getAll('q');
  // A repeated `q` is ambiguous: refuse it rather than guess which one was meant.
  if (values.length > 1) return fail(400, 'QUERY_INVALID', ERROR_MESSAGES.QUERY_INVALID);

  const parsed = parseGlobalSearchQuery(values[0]);
  if (!parsed.ok) return fail(parsed.status, parsed.code, ERROR_MESSAGES[parsed.code]);

  if (isRateLimited(`search:${getClientIp(request)}`, RATE_LIMIT_PER_MINUTE)) {
    return fail(429, 'RATE_LIMITED', 'Too many searches - please slow down.', { 'Retry-After': '60' });
  }

  try {
    // Server-side timing only (connection, per-section time and outcome): see lib/globalSearchTiming.ts for what it is and is not.
    const startedAt = Date.now();
    const timings = createTimings();
    const body = await runGlobalSearch(parsed, undefined, timings);
    return NextResponse.json(body, { status: 200, headers: { ...HEADERS, 'Server-Timing': formatServerTiming(timings, Date.now() - startedAt) } });
  } catch (error) {
    console.error('[api/search] unexpected failure', error);
    return fail(500, 'SEARCH_FAILED', 'Search is temporarily unavailable.');
  }
}
