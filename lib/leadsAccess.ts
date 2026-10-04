/** Shared JSON helpers for the internal lead APIs. Authorization lives in lib/adminGuard.ts. */
export const internalJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });

/** Byte-counted JSON body read (20 KB cap); throws on anything malformed. */
export async function readInternalJson(request: Request, maxBytes = 20_000): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json') || !request.body) throw new Error('JSON body required');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new Error('Request too large'); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request');
  return body as Record<string, unknown>;
}
