import { internalJson, readInternalJson } from '@/lib/leadsAccess';
import { requireAdmin } from '@/lib/adminGuard';
import { LEAD_SOURCES, validateLeadInput } from '@/lib/leads';
import { createLead, getLeadSummary, listLeadPage, listLeads, serializeLead } from '@/services/leads/lead.service';

export const dynamic = 'force-dynamic';

const FILTERS = ['status', 'source', 'leadType', 'priority', 'destination', 'followUp', 'from', 'to', 'q'] as const;

/** Internal CRM list + dashboard counts. OWNER session required (lib/adminGuard.ts). */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  try {
    const params = new URL(request.url).searchParams;
    const filters = Object.fromEntries(FILTERS.map(k => [k, params.get(k) ?? undefined]));
    if ([...FILTERS, 'pagination', 'cursor', 'page'].some(key => params.getAll(key).length > 1)
      || params.has('page') || (params.has('pagination') && params.get('pagination') !== 'cursor')
      || (params.has('cursor') && params.get('pagination') !== 'cursor')) return internalJson({ error: 'Invalid pagination parameters' }, 400);
    // Unpaged callers retain the established priority-ordered, up-to-200 lead response.
    if (!params.has('pagination')) {
      const leads = await listLeads(filters);
      if (!leads.ok) return internalJson({ error: leads.error }, leads.status);
      return internalJson({ leads: leads.value, summary: await getLeadSummary() });
    }
    const leads = await listLeadPage(filters, params.get('cursor') ?? undefined, auth.identity.userId);
    if (!leads.ok) return internalJson({ error: leads.error }, leads.status);
    return internalJson({ ...leads.value, summary: await getLeadSummary() });
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
