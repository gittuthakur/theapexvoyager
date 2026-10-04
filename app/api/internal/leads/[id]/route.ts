import { internalJson, readInternalJson } from '@/lib/leadsAccess';
import { requireAdmin } from '@/lib/adminGuard';
import type { LeadPriority, LeadStatus } from '@/lib/leads';
import {
  addLeadNote, getLeadById, recordLeadContacted, scheduleLeadFollowUp, serializeLead, setLeadAssignee,
  setLeadPriority, setLeadQuote, updateLeadStatus, type ServiceResult
} from '@/services/leads/lead.service';
import type { LeadDocument } from '@/models/Lead';

export const dynamic = 'force-dynamic';

// Explicit per-action field allowlist - an unknown action or stray key is rejected, so
// this endpoint can never be used to write arbitrary Lead fields.
const ACTION_FIELDS: Record<string, string[]> = {
  set_status: ['action', 'status', 'reopen', 'actor'],
  set_priority: ['action', 'priority', 'actor'],
  add_note: ['action', 'text', 'actor'],
  schedule_follow_up: ['action', 'at', 'actor'],
  record_contacted: ['action', 'actor'],
  set_quote: ['action', 'quotedAmount', 'finalAmount', 'actor'],
  set_assignee: ['action', 'assignedTo', 'actor']
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  try {
    const lead = await getLeadById((await params).id);
    return lead ? internalJson({ lead: serializeLead(lead) }) : internalJson({ error: 'Lead not found' }, 404);
  } catch {
    return internalJson({ error: 'Unable to read lead' }, 503);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ('response' in auth) return auth.response;
  try {
    const { id } = await params;
    const body = await readInternalJson(request);
    const action = typeof body.action === 'string' ? body.action : '';
    const allowed = ACTION_FIELDS[action];
    if (!allowed || Object.keys(body).some(k => !allowed.includes(k))) return internalJson({ error: 'Invalid action fields' }, 400);
    // The audit actor is the authenticated identity - never a client-supplied name.
    const actor = auth.identity.email;

    let result: ServiceResult<LeadDocument>;
    switch (action) {
      case 'set_status': result = await updateLeadStatus(id, body.status as LeadStatus, { actor, reopen: body.reopen === true }); break;
      case 'set_priority': result = await setLeadPriority(id, body.priority as LeadPriority, actor); break;
      case 'add_note': result = await addLeadNote(id, body.text, actor); break;
      case 'schedule_follow_up': result = await scheduleLeadFollowUp(id, 'at' in body ? body.at : undefined, actor); break;
      case 'record_contacted': result = await recordLeadContacted(id, actor); break;
      case 'set_quote': result = await setLeadQuote(id, { quotedAmount: body.quotedAmount, finalAmount: body.finalAmount }, actor); break;
      default: result = await setLeadAssignee(id, body.assignedTo, actor);
    }
    return result.ok ? internalJson({ lead: serializeLead(result.value) }) : internalJson({ error: result.error }, result.status);
  } catch {
    return internalJson({ error: 'Invalid request' }, 400);
  }
}
