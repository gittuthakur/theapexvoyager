import { NextResponse } from 'next/server';
import { buildEnquiryLead, MAX_ENQUIRY_BODY_BYTES } from '@/lib/assistant/enquiry';
import { ASSISTANT_HEADERS, jsonError, limitRequest, readJsonBody } from '@/lib/assistant/http';
import { toPublicLeadAck } from '@/lib/leads';
import { getPackageBySlug } from '@/lib/packages';
import { captureLead } from '@/services/leads/lead.service';

export const dynamic = 'force-dynamic';

const ENQUIRY_LIMIT_PER_MINUTE = 5;

/**
 * Saves an assistant enquiry through the existing lead service (captureLead -> Lead), exactly as app/api/lead-events
 * does. It does not involve the AI model, so it works while the assistant is switched off, and the response is a bare
 * acknowledgement: nothing from the CRM is ever returned.
 */
export async function POST(request: Request) {
  const limited = limitRequest(request, 'enquiry', ENQUIRY_LIMIT_PER_MINUTE);
  if (limited) return limited;

  const read = await readJsonBody(request, MAX_ENQUIRY_BODY_BYTES);
  if (!read.ok) return jsonError(read.status, read.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_REQUEST', 'Please check the details you entered.');

  const built = buildEnquiryLead(read.body);
  if (!built.ok) return jsonError(400, 'INVALID_ENQUIRY', built.error);
  if (built.bot) return NextResponse.json(toPublicLeadAck(), { status: 201, headers: ASSISTANT_HEADERS });

  try {
    // A package reference must be a real, published journey; anything else is refused rather than stored.
    if (built.journeySlug && !(await getPackageBySlug(built.journeySlug))) {
      return jsonError(400, 'INVALID_ENQUIRY', 'Please check the details you entered.');
    }
    const result = await captureLead(built.payload, 'website');
    if (!result.ok) return jsonError(400, 'INVALID_ENQUIRY', result.error);
    return NextResponse.json(toPublicLeadAck(), { status: 201, headers: ASSISTANT_HEADERS });
  } catch {
    console.error('[api/assistant/enquiry] save failed');
    return jsonError(500, 'ENQUIRY_FAILED', 'We could not save your enquiry. Please try again or use WhatsApp.');
  }
}
