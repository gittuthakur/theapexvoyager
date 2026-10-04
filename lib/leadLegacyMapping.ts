/**
 * Pure mappers from the three legacy enquiry shapes (Inquiry, BookingRequest, Enquiry)
 * to a raw lead payload for validateLeadInput. Shared by the public routes' live mirror
 * and the backfill script so both produce identical Leads. Nothing here reads the DB.
 */
import { sanitizeAttribution, type Attribution } from '@/lib/leads';

type Rec = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100 ? v : undefined);
const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : undefined);

/** The transport WhatsApp "customise" flow saves this placeholder instead of a phone. */
export const WHATSAPP_PLACEHOLDER_PHONE = 'Not provided (WhatsApp)';

function withPage(attribution: Attribution, page?: string): Attribution {
  return page && !attribution.landingPage ? { ...attribution, landingPage: page.slice(0, 300) } : attribution;
}

export function inquiryToLeadPayload(row: Rec, rawAttribution?: unknown): Rec {
  const attribution = withPage(sanitizeAttribution(rawAttribution), str(row.sourcePage));
  return {
    name: row.name, phone: row.phone, leadType: 'GENERAL', captureKind: 'FORM_SUBMITTED',
    destination: str(row.selection), travelStartDate: isoDate(row.date), propertyRef: undefined,
    message: `Destination enquiry via WhatsApp lead form${str(row.slug) ? ` (${str(row.slug)})` : ''}`,
    attribution: { source: 'website', ...attribution },
    legacyRef: row._id ? { model: 'Inquiry', id: String(row._id) } : undefined
  };
}

export function enquiryToLeadPayload(row: Rec, rawAttribution?: unknown): Rec {
  return {
    name: row.fullName, phone: str(row.phone), email: row.email, leadType: 'GENERAL', captureKind: 'FORM_SUBMITTED',
    message: row.message, budget: str(row.budgetRange),
    attribution: { source: 'website', ...sanitizeAttribution(rawAttribution) },
    legacyRef: row._id ? { model: 'Enquiry', id: String(row._id) } : undefined
  };
}

const BOOKING_TYPE_TO_LEAD: Record<string, string> = { journey: 'JOURNEY', tour: 'JOURNEY', experience: 'GENERAL', transport: 'TRANSPORT', expert: 'CUSTOM_TRIP', stay: 'STAY' };

export function bookingRequestToLeadPayload(row: Rec, rawAttribution?: unknown): Rec {
  const details = (row.details && typeof row.details === 'object' ? row.details : {}) as Rec;
  const type = String(row.type);
  const isPlaceholder = row.phone === WHATSAPP_PLACEHOLDER_PHONE;
  const tripPlanner = type === 'journey' && details.source === 'trip-planner';
  const params = (details.params && typeof details.params === 'object' ? details.params : {}) as Rec;
  const message = [str(details.specialRequest), str(details.requirements), str(details.notes), str(details.needHelpWith)].filter(Boolean).join('\n') || undefined;
  return {
    name: isPlaceholder ? undefined : row.name,
    phone: isPlaceholder ? undefined : row.phone,
    email: str(row.email),
    captureKind: isPlaceholder ? 'WHATSAPP_CLICK' : 'FORM_SUBMITTED',
    leadType: tripPlanner ? 'CUSTOM_TRIP' : (BOOKING_TYPE_TO_LEAD[type] ?? 'GENERAL'),
    destination: str(row.destination) ?? str(row.itemName),
    journeySlug: type === 'journey' && !tripPlanner ? str(details.slug) : str(details.journeySlug),
    propertyRef: undefined,
    travelStartDate: isoDate(details.travelDate) ?? isoDate(details.date),
    adults: num(details.adults) ?? num(params.adults),
    children: num(details.children) ?? num(params.children),
    budget: str(details.budget),
    pickupLocation: str(details.pickupLocation) ?? str(details.pickup),
    travelStyle: str(details.tripType),
    message: [str(row.itemName) ? `Re: ${str(row.itemName)}` : undefined, str(row.travelers) ? `Travellers: ${str(row.travelers)}` : undefined, message].filter(Boolean).join('\n') || undefined,
    attribution: { source: isPlaceholder ? 'whatsapp' : 'website', ...sanitizeAttribution(rawAttribution) },
    legacyRef: row.referenceId ? { model: 'BookingRequest', id: String(row.referenceId) } : undefined
  };
}
