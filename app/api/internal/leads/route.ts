import { internalJson, readInternalJson } from '@/lib/leadsAccess';
import { requireAdmin } from '@/lib/adminGuard';
import { LEAD_SOURCES, validateLeadInput } from '@/lib/leads';
import { createLead, getLeadSummary, listLeads, serializeLead } from '@/services/leads/lead.service';

export const dynamic = 'force-dynamic';

const FILTERS = ['status', 'source', 'leadType', 'priority', 'destination', 'followUp', 'from', 'to', 'q'] as const;

/** Internal CRM list + dashboard counts. OWNER session required (lib/adminGuard.ts). */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  try {
    const params = new URL(request.url).searchParams;
    const filters = Object.fromEntries(FILTERS.map(k => [k, params.get(k) ?? undefined]));
    const [leads, summary] = await Promise.all([listLeads(filters), getLeadSummary()]);
    if (!leads.ok) return internalJson({ error: leads.error }, leads.status);
    return internalJson({ leads: leads.value, summary });
  } catch {
    return internalJson({ error: 'Unable to read leads' }, 503);
  }
}

/** Manual lead entry (Instagram DM, phone call, direct WhatsApp, referral). */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  try {
    const body = await readInternalJson(request);
    const source = body.source;
    if (typeof source !== 'string' || !(LEAD_SOURCES as readonly string[]).includes(source)) return internalJson({ error: 'A valid source is required' }, 400);
    const parsed = validateLeadInput({ ...body, captureKind: 'MANUAL', attribution: { source, sourceDetail: body.sourceDetail } });
    if (!parsed.ok) return internalJson({ error: parsed.error }, 400);
    if (!parsed.value.message) return internalJson({ error: 'Requirements are required' }, 400);
    const result = await createLead(parsed.value, auth.identity.email);
    if (!result.ok) return internalJson({ error: result.error }, result.status);
    return internalJson({ lead: serializeLead(result.value.lead), duplicateOf: result.value.duplicateOf }, 201);
  } catch {
    return internalJson({ error: 'Invalid request' }, 400);
  }
}
