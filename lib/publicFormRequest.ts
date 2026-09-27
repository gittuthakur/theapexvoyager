import { NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rateLimit';

/** Best-effort per-instance throttling; the hosting proxy must overwrite IP headers. */
export function limitPublicForm(request: Request, scope: string): Response | null {
  const ip = (request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown').slice(0, 100);
  return isRateLimited(`form:${scope}:${ip}`, 10)
    ? NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429, headers: { 'Retry-After': '60' } })
    : null;
}

/** Count actual streamed bytes; Content-Length is not an authoritative size limit. */
export async function readPublicForm(request: Request): Promise<{ body: Record<string, unknown>; error?: never } | { error: Response; body?: never }> {
  const limited = limitPublicForm(request, new URL(request.url).pathname);
  if (limited) return { error: limited };
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 20_000) {
          await reader.cancel().catch(() => {});
          return { error: NextResponse.json({ error: 'Request body too large' }, { status: 413 }) };
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid object');
    return { body: body as Record<string, unknown> };
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 }) };
  }
}

export function isContactPhone(value: string): boolean {
  return /^[+\d\s().-]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, ''));
}
