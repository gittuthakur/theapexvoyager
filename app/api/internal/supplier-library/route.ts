import { randomUUID } from 'node:crypto';
import { costingAccessDenied } from '@/lib/journeyCostingAccess';
import { strictObject, boundedText } from '@/lib/internalValidation';
import { readLibrary, saveSupplier, saveRate, verifySupplier, validatePrevious } from '@/services/pricing/supplierLibraryStore.service';
import { getCostingJourneys } from '@/services/pricing/journeyCostingContext.service';
import { listCostings } from '@/services/pricing/journeyCostingStore.service';
import { supplierCoverage } from '@/services/pricing/supplierCoverage.service';
import { makeSnapshot, snapshotFinancials, snapshotWarnings } from '@/services/pricing/supplierLibrary.service';
import { emptyLine } from '@/services/pricing/journeyCosting.service';
import type { SupplierInput, SupplierRateInput, Supplier, RateSelection } from '@/models/SupplierLibrary';
export const dynamic = 'force-dynamic';
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
export async function GET(request: Request) {
  const denied = costingAccessDenied(request); if (denied) return denied;
  try { const [library, journeys, costings] = await Promise.all([readLibrary(), getCostingJourneys(), listCostings()]); return response({ ...library, journeys, coverage: supplierCoverage(journeys, library.suppliers, library.rates, costings), storage: 'LOCAL_ONLY' }); }
  catch { return response({ error: 'Unable to load local supplier library' }, 503); }
}
async function body(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json') || !request.body) throw new Error('JSON required');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 250000) { await reader.cancel(); throw new Error('Request too large'); } chunks.push(part.value); }
  const data = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; } return JSON.parse(new TextDecoder().decode(data));
}
export async function POST(request: Request) {
  const denied = costingAccessDenied(request); if (denied) return denied;
  try {
    const payload = await body(request); if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid request');
    const p = payload as Record<string, unknown>; boundedText(p.action, 'action', 30);
    if (p.action === 'saveSupplier' || p.action === 'saveRate') {
      strictObject(p, ['action', 'input', 'previous'], 'save'); validatePrevious(p.previous);
      return response({ record: p.action === 'saveSupplier' ? await saveSupplier(p.input as SupplierInput, p.previous) : await saveRate(p.input as SupplierRateInput, p.previous) });
    }
    if (p.action === 'verifySupplier') {
      strictObject(p, ['action', 'previous', 'status', 'notes', 'confirmation'], 'verify'); validatePrevious(p.previous); if (!p.previous) throw new Error('Supplier revision required');
      return response({ record: await verifySupplier(p.previous, p.status as Supplier['verificationStatus'], p.notes as string, p.confirmation) });
    }
    if (p.action === 'selectRate') {
      strictObject(p, ['action', 'previous', 'selection', 'explicitSelection'], 'select rate'); validatePrevious(p.previous); if (!p.previous || p.explicitSelection !== true) throw new Error('Explicit rate selection required');
      const previous = p.previous;
      const library = await readLibrary(); const rate = library.rates.find(r => r.id === previous.id && r.version === previous.version);
      if (!rate) throw new Error('Rate revision changed: reload library'); const supplier = library.suppliers.find(s => s.id === rate.input.supplierId); if (!supplier) throw new Error('Supplier not found');
      const snapshot = makeSnapshot(supplier, rate, p.selection as RateSelection); const financials = snapshotFinancials(snapshot);
      return response({ line: { ...emptyLine(randomUUID(), snapshot.selection.category), ...financials, label: rate.input.hotel?.propertyName || rate.input.transport?.vehicleType || rate.input.service?.activityName || rate.input.category, supplierRateSnapshot: snapshot }, warnings: snapshotWarnings(snapshot), supplierVerification: supplier.verificationStatus });
    }
    throw new Error('Unknown library action');
  } catch (e) { return response({ error: e instanceof Error && !/ENOENT|EACCES|mongo|connect/i.test(e.message) ? e.message.slice(0, 300) : 'Local library operation failed' }, 400); }
}
