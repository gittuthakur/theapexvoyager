/**
 * Narrow public capture for "Customise on WhatsApp" clicks on Transport. A click knows
 * NO contact details, so it is recorded as a WHATSAPP_CLICK lead (no name/phone/email,
 * nothing fabricated) - never as a FORM_SUBMITTED enquiry and never via BookingRequest,
 * whose phone validation stays strict. Strict allowlist: unknown keys are ignored.
 */
import { sanitizeAttribution } from '@/lib/leads';

export const TRANSPORT_CLICK_KIND = 'transport-whatsapp-customise';
const CLICK_ID = /^[A-Za-z0-9_-]{8,64}$/;

const text = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : undefined;
};
const day = (v: unknown): string | undefined | null => {
  if (v === undefined || v === null || v === '') return undefined;
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime()) ? v : null;
};

export function buildTransportClickLead(raw: unknown): { ok: true; payload: Record<string, unknown> } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Invalid request' };
  const r = raw as Record<string, unknown>;
  if (r.kind !== TRANSPORT_CLICK_KIND) return { ok: false, error: 'Unsupported event' };
  if (typeof r.clickId !== 'string' || !CLICK_ID.test(r.clickId)) return { ok: false, error: 'Invalid clickId' };
  const vehicle = text(r.vehicle, 200);
  if (!vehicle) return { ok: false, error: 'vehicle is required' };
  const date = day(r.date);
  const returnDate = day(r.returnDate);
  if (date === null || returnDate === null) return { ok: false, error: 'Invalid date' };

  const pickup = text(r.pickup, 200);
  const destination = text(r.destination, 200);
  const context = [
    `Customise-on-WhatsApp click (no contact details captured)`,
    `Vehicle: ${vehicle}`,
    text(r.serviceType, 60) && `Service: ${text(r.serviceType, 60)}`,
    returnDate && `Return date: ${returnDate}`,
    text(r.travellers, 60) && `Travellers: ${text(r.travellers, 60)}`,
    text(r.driveMode, 60) && `Drive mode: ${text(r.driveMode, 60)}`,
    typeof r.quantity === 'number' && Number.isInteger(r.quantity) && r.quantity > 0 && r.quantity <= 100 ? `Quantity: ${r.quantity}` : undefined
  ].filter(Boolean).join('\n');

  const attribution = sanitizeAttribution(r.attribution);
  return {
    ok: true,
    payload: {
      leadType: 'TRANSPORT',
      captureKind: 'WHATSAPP_CLICK',
      propertyRef: text(r.vehicleSlug, 200) ?? vehicle,
      destination: pickup && destination ? `${pickup} → ${destination}` : destination ?? pickup,
      pickupLocation: pickup,
      travelStartDate: date,
      journeySlug: text(r.journeySlug, 200),
      message: context,
      attribution: { ...attribution, source: 'whatsapp', sourceDetail: TRANSPORT_CLICK_KIND },
      legacyRef: { model: 'WhatsAppClick', id: r.clickId }
    }
  };
}
