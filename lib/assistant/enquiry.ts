export const MAX_ENQUIRY_BODY_BYTES = 24_000;

export type EnquiryBuild =
  | { ok: true; bot: false; journeySlug?: string; payload: Record<string, unknown> }
  | { ok: true; bot: true }
  | { ok: false; error: string };

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const text = (value: unknown, max: number): string | undefined | null => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(CONTROL_CHARS, ' ').trim();
  return cleaned.length <= max ? cleaned : null;
};
const wholeNumber = (value: unknown, max: number): number | undefined | null => {
  if (value === undefined || value === null || value === '') return undefined;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
};

/**
 * Turns the assistant's enquiry form into a payload for the EXISTING lead service (services/leads/lead.service.ts
 * captureLead, which runs its own validateLeadInput on top of this). This is a form of its own: nothing here is sent
 * to the AI model. A journey slug marks a JOURNEY lead; without one it is a CUSTOM_TRIP. The source is stamped
 * server-side so a client cannot choose it, and explicit consent is required.
 */
export function buildEnquiryLead(body: unknown, now: Date = new Date()): EnquiryBuild {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Invalid request' };
  const r = body as Record<string, unknown>;

  // Honeypot: a real visitor never sees or fills this field. Acknowledge without storing anything.
  if (typeof r.company === 'string' && r.company.trim() !== '') return { ok: true, bot: true };

  if (r.consent !== true) return { ok: false, error: 'Please agree to be contacted about this enquiry.' };

  const name = text(r.name, 200);
  const phone = text(r.phone, 30);
  const email = text(r.email, 254);
  const message = text(r.message, 1000);
  const destination = text(r.destination, 200);
  const budget = text(r.budget, 100);
  const journeySlug = text(r.journeySlug, 200);
  const date = text(r.travelStartDate, 10);
  const adults = wholeNumber(r.adults, 50);
  const children = wholeNumber(r.children, 50);
  if ([name, phone, email, message, destination, budget, journeySlug, date, adults, children].includes(null)) {
    return { ok: false, error: 'Please check the details you entered.' };
  }
  if (!name) return { ok: false, error: 'Name is required' };
  if (!phone && !email) return { ok: false, error: 'A phone number or email is required' };
  if (journeySlug && !/^[a-z0-9-]+$/i.test(journeySlug)) return { ok: false, error: 'Please check the details you entered.' };
  if (adults !== undefined && adults !== null && adults < 1) return { ok: false, error: 'Please check the details you entered.' };

  if (date) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || parsed < yesterday) {
      return { ok: false, error: 'Please choose a travel date that is today or later.' };
    }
  }

  const rawAttribution = r.attribution && typeof r.attribution === 'object' && !Array.isArray(r.attribution) ? (r.attribution as Record<string, unknown>) : {};
  return {
    ok: true,
    bot: false,
    journeySlug: journeySlug?.toLowerCase(),
    payload: {
      captureKind: 'FORM_SUBMITTED',
      leadType: journeySlug ? 'JOURNEY' : 'CUSTOM_TRIP',
      name,
      phone,
      email,
      destination,
      journeySlug: journeySlug?.toLowerCase(),
      travelStartDate: date,
      adults: adults ?? undefined,
      children: children ?? undefined,
      budget,
      message,
      attribution: { ...rawAttribution, sourceDetail: 'ai-assistant' }
    }
  };
}
