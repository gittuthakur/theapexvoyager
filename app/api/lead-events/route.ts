import { NextResponse } from 'next/server';
import { readPublicForm } from '@/lib/publicFormRequest';
import { buildTransportClickLead } from '@/lib/leadEvents';
import { toPublicLeadAck } from '@/lib/leads';
import { captureLead } from '@/services/leads/lead.service';

export const dynamic = 'force-dynamic';

/**
 * POST-only. Records a Transport "Customise on WhatsApp" click as a WHATSAPP_CLICK lead
 * (no contact details exist at click time). Idempotent on the client-generated clickId,
 * so a double click or retry never creates a second record. The response is a bare
 * acknowledgement - nothing from the CRM is ever returned.
 */
export async function POST(request: Request) {
  const parsed = await readPublicForm(request);
  if (parsed.error) return parsed.error;
  const built = buildTransportClickLead(parsed.body);
  if (!built.ok) return NextResponse.json({ error: built.error }, { status: 400 });
  try {
    const result = await captureLead(built.payload, 'website');
    if (!result.ok) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    return NextResponse.json(toPublicLeadAck(), { status: 202 });
  } catch {
    console.error('WhatsApp click capture failed');
    return NextResponse.json({ error: 'Unable to record event' }, { status: 500 });
  }
}
