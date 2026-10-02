import { costingAccessDenied } from '@/lib/journeyCostingAccess';
import { calculateJourneyCosting, validateCosting } from '@/services/pricing/journeyCosting.service';
import { getCostingJourneys } from '@/services/pricing/journeyCostingContext.service';
import { approvedPricePreview, changeCostingStatus, listCostings, saveCosting } from '@/services/pricing/journeyCostingStore.service';
import { COSTING_STATUSES, type CostingStatus } from '@/models/JourneyCosting';

export const dynamic = 'force-dynamic';
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
export async function GET(request: Request) {
  const denied = costingAccessDenied(request); if (denied) return denied;
  try { const [journeys, revisions] = await Promise.all([getCostingJourneys(), listCostings()]); return response({ journeys, revisions, storage: 'LOCAL_ONLY', productionAccess: false }); }
  catch { return response({ error: 'Unable to read local costing or Journey context' }, 503); }
}
async function body(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json') || !request.body) throw new Error('JSON body required');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 250000) { await reader.cancel(); throw new Error('Request too large'); } chunks.push(part.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function POST(request: Request) {
  const denied = costingAccessDenied(request); if (denied) return denied;
  try {
    const payload = await body(request);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid request');
    const allowed: Record<string, string[]> = { calculate: ['action', 'input'], save: ['action', 'input', 'previous'], review: ['action', 'id', 'version', 'status', 'reviewer', 'confirm'], apply: ['action', 'id', 'version', 'confirmation'] };
    const keys = allowed[payload.action]; if (!keys || Object.keys(payload).some(key => !keys.includes(key)) || keys.some(key => !(key in payload))) throw new Error('Invalid action fields');
    if (payload.action === 'calculate' || payload.action === 'save') {
      validateCosting(payload.input);
      if (payload.action === 'calculate') return response({ calculation: calculateJourneyCosting(payload.input) });
      const previous = payload.previous;
      if (previous !== null && (!previous || Object.keys(previous).sort().join(',') !== 'id,version' || typeof previous.id !== 'string' || !Number.isInteger(previous.version) || previous.version < 1)) throw new Error('Invalid previous revision');
      const journey = (await getCostingJourneys()).find(row => row.journeyId === payload.input.journeyId && row.journeySlug === payload.input.journeySlug);
      if (!journey) throw new Error('Journey not found');
      return response({ record: await saveCosting(payload.input, journey, previous) });
    }
    if (typeof payload.id !== 'string' || !/^[a-f\d-]{36}$/.test(payload.id) || !Number.isInteger(payload.version) || payload.version < 1) throw new Error('Invalid revision identity');
    if (payload.action === 'review') {
      if (!COSTING_STATUSES.includes(payload.status) || typeof payload.reviewer !== 'string' || typeof payload.confirm !== 'boolean') throw new Error('Invalid owner review input');
      return response({ record: await changeCostingStatus({ id: payload.id, version: payload.version }, payload.status as CostingStatus, payload.reviewer, payload.confirm) });
    }
    const versions = (await listCostings()).filter(row => row.id === payload.id).sort((a, b) => b.version - a.version);
    const record = versions[0]; if (!record || record.version !== payload.version) throw new Error('Revision conflict');
    const journey = (await getCostingJourneys()).find(row => row.journeyId === record.input.journeyId);
    if (!journey) throw new Error('Journey not found');
    return response({ preview: approvedPricePreview(record, journey, payload.confirmation) });
  } catch (error) {
    // Validation errors contain field names, never costs, notes, supplier names or credentials.
    return response({ error: error instanceof Error && !/mongo|connection|ENOENT|EACCES/i.test(error.message) ? error.message.slice(0, 500) : 'Local costing operation failed' }, 400);
  }
}
