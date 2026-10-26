import { NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rateLimit';

export const ASSISTANT_HEADERS = { 'Cache-Control': 'private, no-store' };

/**
 * The address a rate limit is keyed on. A client can send any X-Forwarded-For it likes and most
 * proxies append to it, so the left-most entry is attacker-controlled. In order of trust: the headers
 * the hosting platform sets itself, then the RIGHT-most X-Forwarded-For entry, else one shared bucket.
 * (Same rule as app/api/search/route.ts.)
 */
export function getClientIp(request: Request): string {
  const platform = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip');
  if (platform?.trim()) return platform.split(',')[0].trim().slice(0, 100);
  const entries = (request.headers.get('x-forwarded-for') ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
  return (entries.length > 0 ? entries[entries.length - 1] : 'unknown').slice(0, 100);
}

export function jsonError(status: number, code: string, message: string, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { ...ASSISTANT_HEADERS, ...extraHeaders } });
}

/** Per-address, per-minute limit using the in-process limiter the other public routes use (best effort, per instance). */
export function limitRequest(request: Request, scope: string, perMinute: number): Response | null {
  return isRateLimited(`assistant:${scope}:${getClientIp(request)}`, perMinute)
    ? jsonError(429, 'RATE_LIMITED', 'Too many requests. Please wait a minute and try again.', { 'Retry-After': '60' })
    : null;
}

/**
 * Counts the bytes that actually arrive (Content-Length is not authoritative) and aborts at the limit,
 * so an oversized body is never fully buffered or handed to JSON.parse.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<{ ok: true; body: unknown } | { ok: false; status: 400 | 413 }> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413 };
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel().catch(() => {});
          return { ok: false, status: 413 };
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, body: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}
