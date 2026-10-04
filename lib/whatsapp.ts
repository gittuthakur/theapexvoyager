import { siteConfig } from '@/config/site.config';
import type { BookingRequestType } from '@/models/BookingRequest';
import { postJSON } from '@/lib/api';
import { trackWhatsAppConversion } from '@/lib/googleAds';

export interface WhatsAppLinkParams {
  phoneNumber?: string;
  messageText?: string;
  tripTitle?: string;
  destination?: string;
  dates?: string;
}

export function buildWhatsAppMessage({ messageText, tripTitle, destination, dates }: WhatsAppLinkParams) {
  if (messageText) return messageText;

  const parts = [`Hi there! I am interested in ${destination ?? 'an Apex Voyager tour'}`];
  if (tripTitle) parts.push(` - ${tripTitle}`);
  if (dates) parts.push(` for ${dates}`);
  parts.push('. Please help me book this trip.');
  return parts.join('');
}

export function buildWhatsAppLink(params: WhatsAppLinkParams = {}) {
  const phoneNumber = params.phoneNumber ?? siteConfig.whatsappNumber;
  const message = buildWhatsAppMessage(params);
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

/** YYYY-MM-DD in the browser's local calendar date — never UTC, so a late-evening IST
 *  visitor's "today" matches what their own `<input type="date">` shows, not a
 *  UTC-shifted one. Used both as the check-in field's `min` and as the check-in-not-
 *  before-today validation rule, so the two can never disagree. */
export function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A practical Indian mobile number: an optional country code (+91/91) or a leading
 *  trunk 0, then a real 10-digit mobile number (starts 6-9) — spaces/hyphens ignored so
 *  "98765 43210" and "+91-98765-43210" both validate. Deliberately not a strict E.164
 *  parser: this only needs to catch obviously-wrong input before a WhatsApp handoff,
 *  not validate every real-world number format. */
export function isValidIndianPhone(raw: string): boolean {
  const digits = raw.replace(/[\s-]/g, '');
  return /^(?:\+91|91|0)?[6-9]\d{9}$/.test(digits);
}

/** "2026-10-12" -> "12 Oct 2026" — used only for the human-readable WhatsApp message,
 *  never for comparisons (those stay on the raw ISO strings, which sort correctly as
 *  plain text). Falls back to the raw value if it's ever somehow not a real date,
 *  rather than showing "Invalid Date". */
export function formatDisplayDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_VERB: Record<BookingRequestType, string> = {
  stay: 'book',
  journey: 'book',
  tour: 'book',
  experience: 'enquire about',
  transport: 'request',
  expert: 'talk to an expert about'
};

export interface BookingMessageParams {
  referenceId: string;
  type: BookingRequestType;
  itemName: string;
  dates?: string;
  travelers?: string;
}

/** Structured WhatsApp message for the unified booking-request flow — always leads with the reference ID so support can look the request up instantly. */
export function buildBookingMessage({ referenceId, type, itemName, dates, travelers }: BookingMessageParams) {
  const parts = [`Hi, I'd like to ${TYPE_VERB[type]} "${itemName}" — reference ${referenceId}.`];
  if (travelers) parts.push(` Travelers: ${travelers}.`);
  if (dates) parts.push(` Dates: ${dates}.`);
  parts.push(' Please assist.');
  return parts.join('');
}

export interface ExperienceRequestMessageParams {
  referenceId: string;
  title: string;
  location: string;
  dates?: string;
  travelers?: string;
  specialRequest?: string;
}

/** Richer than buildBookingMessage for the /experiences detail page's "Plan This Experience" flow — adds location and any special request on top of the base reference/dates/travellers fields. */
export function buildExperienceRequestMessage({ referenceId, title, location, dates, travelers, specialRequest }: ExperienceRequestMessageParams) {
  const lines = [`Hi! I'd like to plan this experience — reference ${referenceId}.`, `*Experience:* ${title}`, `*Location:* ${location}`];
  if (dates) lines.push(`*Preferred date:* ${dates}`);
  if (travelers) lines.push(`*Travellers:* ${travelers}`);
  if (specialRequest) lines.push(`*Special request:* ${specialRequest}`);
  lines.push('', 'Please confirm availability and next steps.');
  return lines.join('\n');
}

export interface TransportRequestMessageParams {
  referenceId?: string;
  pickup?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  travelers?: string;
  driveMode?: string;
  quantity?: number;
  vehicleName: string;
}

/**
 * Structured WhatsApp message for every /transport request path — the "Customise on
 * WhatsApp" CTAs (TransportCard.tsx, TransportDetail.tsx) and, via
 * BookingRequestModal's `buildWhatsAppMessage` override, the "Request This
 * Vehicle"/"Check Availability"/"Request Quote" flow once a reference ID exists.
 * Carries whatever the visitor already entered in the hero search (pickup/
 * destination/date/travellers/driveMode/quantity) so they don't have to retype it.
 * Falls back to a pickup-only line for services with no drop-off (Self-Drive, Bike).
 * `referenceId`/`pickup`/`destination` are optional since the pre-save WhatsApp CTA
 * may be clicked straight from the fleet grid without a specific route searched.
 */
export function buildTransportRequestMessage({
  referenceId,
  pickup,
  destination,
  date,
  returnDate,
  travelers,
  driveMode,
  quantity,
  vehicleName
}: TransportRequestMessageParams) {
  const lines = [
    referenceId
      ? `Hi! I'd like to request transport — reference ${referenceId}.`
      : `Hi! I'd like to request transport.`,
    ...(pickup && destination ? [`*Route:* ${pickup} → ${destination}`] : pickup ? [`*Pickup:* ${pickup}`] : []),
    `*Preferred vehicle:* ${vehicleName}`
  ];
  if (date) lines.push(`*Date:* ${date}`);
  if (returnDate) lines.push(`*Return date:* ${returnDate}`);
  if (travelers) lines.push(`*Travellers:* ${travelers}`);
  if (driveMode) lines.push(`*Drive mode:* ${driveMode}`);
  if (quantity && quantity > 1) lines.push(`*Quantity:* ${quantity}`);
  lines.push('', 'Please confirm availability and pricing.');
  return lines.join('\n');
}

export interface TransportCustomiseMessageParams {
  referenceId?: string;
  serviceType?: string;
  vehicleName: string;
  pickup?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  travelers?: string;
  driveMode?: string;
  quantity?: number;
}

/** Structured WhatsApp message for the "Customise on WhatsApp" lead-tracking flow
 *  (see `openTransportWhatsAppLead` below) — a distinct template from
 *  `buildTransportRequestMessage` above since this one always leads with the just-created
 *  reference where it exists, matching the brief's exact wording. */
export function buildTransportCustomiseMessage({
  referenceId,
  serviceType,
  vehicleName,
  pickup,
  destination,
  date,
  returnDate,
  travelers,
  driveMode,
  quantity
}: TransportCustomiseMessageParams) {
  const lines = ['Hello The Apex Voyager India,', '', 'I would like to customise this transport option.', ''];
  if (referenceId) lines.push(`Reference: ${referenceId}`);
  if (serviceType) lines.push(`Service: ${serviceType}`);
  lines.push(`Vehicle: ${vehicleName}`);
  if (pickup && destination) lines.push(`Route: ${pickup} → ${destination}`);
  else if (pickup) lines.push(`Pickup: ${pickup}`);
  else if (destination) lines.push(`Destination: ${destination}`);
  if (date) lines.push(`Date: ${date}`);
  if (returnDate) lines.push(`Return date: ${returnDate}`);
  if (travelers) lines.push(`Travellers: ${travelers}`);
  if (driveMode) lines.push(`Drive mode: ${driveMode}`);
  if (quantity && quantity > 1) lines.push(`Quantity: ${quantity}`);
  lines.push('', 'Please help me customise this trip.');
  return lines.join('\n');
}

export interface TransportWhatsAppLeadVehicle {
  name: string;
  slug?: string;
  id: string;
  serviceType?: string;
}

export interface OpenTransportWhatsAppLeadParams {
  vehicle: TransportWhatsAppLeadVehicle;
  pickup?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  travelers?: string;
  driveMode?: string;
  quantity?: number;
  journeyContext?: { from?: string; journeySlug?: string };
}

// A double click (or an impatient re-click) on the same vehicle/route reuses one clickId for
// a few seconds, so the server's idempotent WHATSAPP_CLICK capture records it once.
const CLICK_REUSE_MS = 10_000;
const recentClicks = new Map<string, { id: string; at: number }>();

function clickIdFor(key: string): string {
  const now = Date.now();
  const recent = recentClicks.get(key);
  if (recent && now - recent.at < CLICK_REUSE_MS) return recent.id;
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `click_${now}_${Math.random().toString(36).slice(2)}`;
  recentClicks.set(key, { id, at: now });
  if (recentClicks.size > 50) recentClicks.clear();
  return id;
}

/**
 * "Customise on WhatsApp" has no form, so no name/phone/email is known at click time.
 * Previously this forced a placeholder phone through /api/booking-requests, whose
 * (correctly strict) validation always rejected it - so nothing was ever saved. It now
 * records a contactless WHATSAPP_CLICK event via /api/lead-events (no fabricated
 * customer data, not a qualified enquiry) and opens WhatsApp immediately - the capture
 * is fire-and-forget, so a CRM failure can never delay or block the handoff. The
 * Google Ads conversion fires exactly as before.
 */
export async function openTransportWhatsAppLead({
  vehicle,
  pickup,
  destination,
  date,
  returnDate,
  travelers,
  driveMode,
  quantity,
  journeyContext
}: OpenTransportWhatsAppLeadParams): Promise<void> {
  const key = [vehicle.id, pickup, destination, date, returnDate].join('|');
  postJSON('/api/lead-events', {
    kind: 'transport-whatsapp-customise',
    clickId: clickIdFor(key),
    vehicle: vehicle.name,
    vehicleSlug: vehicle.slug ?? vehicle.id,
    serviceType: vehicle.serviceType,
    pickup,
    destination,
    date,
    returnDate,
    travellers: travelers,
    driveMode,
    quantity,
    journeySlug: journeyContext?.journeySlug
  }).catch(() => {
    console.error('WhatsApp click capture failed');
  });

  const messageText = buildTransportCustomiseMessage({
    serviceType: vehicle.serviceType,
    vehicleName: vehicle.name,
    pickup,
    destination,
    date,
    returnDate,
    travelers,
    driveMode,
    quantity
  });

  trackWhatsAppConversion();
  window.open(buildWhatsAppLink({ messageText }), '_blank', 'noopener,noreferrer');
}

export interface FourByFourRequestMessageParams {
  referenceId: string;
  fourByFourType: string;
  pickup?: string;
  destination?: string;
  startDate?: string;
  returnDate?: string;
  travellers?: string;
  vehicleName?: string;
  luggage?: string;
  pickupTime?: string;
  stops?: string;
  specialRequirements?: string;
  expeditionPreferences?: string;
}

/** Structured WhatsApp message for the "4x4 Himalayan Vehicles" guided journeys
 *  (With Driver / Self-Drive / Expeditions) — mirrors buildTransportCustomiseMessage's
 *  shape but adds the requirement-step fields (pickup time, stops, luggage, special
 *  requirements, expedition preferences) those popups collect that no existing
 *  builder covers. Always ends by asking for availability/fare confirmation, never
 *  implying the booking is already confirmed. */
export function buildFourByFourRequestMessage({
  referenceId,
  fourByFourType,
  pickup,
  destination,
  startDate,
  returnDate,
  travellers,
  vehicleName,
  luggage,
  pickupTime,
  stops,
  specialRequirements,
  expeditionPreferences
}: FourByFourRequestMessageParams) {
  const lines = ['Hello The Apex Voyager India,', '', 'I submitted a 4x4 transport request.', '', `Reference: ${referenceId}`, `Service: ${fourByFourType}`];
  if (pickup && destination) lines.push(`Route: ${pickup} → ${destination}`);
  else if (pickup) lines.push(`Pickup: ${pickup}`);
  else if (destination) lines.push(`Destination: ${destination}`);
  if (startDate && returnDate) lines.push(`Dates: ${startDate} – ${returnDate}`);
  else if (startDate) lines.push(`Date: ${startDate}`);
  if (travellers) lines.push(`Travellers: ${travellers}`);
  lines.push(`Vehicle: ${vehicleName ?? 'To be arranged'}`);
  if (pickupTime) lines.push(`Pickup time: ${pickupTime}`);
  if (luggage) lines.push(`Luggage: ${luggage}`);
  if (stops) lines.push(`Stops / via: ${stops}`);
  if (specialRequirements) lines.push(`Requirements: ${specialRequirements}`);
  if (expeditionPreferences) lines.push(`Expedition preferences: ${expeditionPreferences}`);
  lines.push('', 'Please confirm availability and final fare.');
  return lines.join('\n');
}

export interface JourneyRequestMessageParams {
  referenceId: string;
  tierTitle: string;
  destinations: string;
  dates: string;
  travelers: string;
  stayLabel: string;
  transportLabel: string;
  experiences: string;
  budgetLabel: string;
  estimatedTotal: string;
  perPerson: string;
  pickup?: string;
  drop?: string;
  notes?: string;
}

export interface ExpertRequestMessageParams {
  referenceId: string;
  expertName?: string;
  destination: string;
  travelDate?: string;
  travelers?: string;
  travellerType?: string;
  tripType?: string;
  needHelpWith?: string;
  requirements?: string;
}

/** Structured consultation summary for the Travel Experts trip planner (spec §10/§15) — every field the traveller shared laid out on its own line, so a specialist has full context before the first reply. */
export function buildExpertRequestMessage({
  referenceId,
  expertName,
  destination,
  travelDate,
  travelers,
  travellerType,
  tripType,
  needHelpWith,
  requirements
}: ExpertRequestMessageParams) {
  const lines = [
    expertName
      ? `Hi! I'd like to plan a trip with ${expertName} — reference ${referenceId}.`
      : `Hi! I'd like help planning a trip — reference ${referenceId}.`,
    `*Destination:* ${destination}`
  ];
  if (travelDate) lines.push(`*When:* ${travelDate}`);
  if (travelers) lines.push(`*Travellers:* ${travelers}`);
  if (travellerType) lines.push(`*Travelling as:* ${travellerType}`);
  if (tripType) lines.push(`*Trip type:* ${tripType}`);
  if (needHelpWith) lines.push(`*Need help with:* ${needHelpWith}`);
  if (requirements) lines.push(`*Additional requirements:* ${requirements}`);
  lines.push('', 'Please help me plan this journey.');
  return lines.join('\n');
}

/** Full structured trip-planner summary — every wizard answer laid out as its own line so the sales team gets complete lead context without a manual follow-up call. */
export function buildJourneyRequestMessage({
  referenceId,
  tierTitle,
  destinations,
  dates,
  travelers,
  stayLabel,
  transportLabel,
  experiences,
  budgetLabel,
  estimatedTotal,
  perPerson,
  pickup,
  drop,
  notes
}: JourneyRequestMessageParams) {
  const lines = [
    `Hi! I'd like to book my Himalayan journey — reference ${referenceId}.`,
    `*Journey:* ${tierTitle}`,
    `*Destination(s):* ${destinations}`,
    `*Dates:* ${dates}`,
    `*Travellers:* ${travelers}`,
    `*Stay:* ${stayLabel}`,
    `*Transport:* ${transportLabel}`
  ];
  if (pickup) lines.push(`*Pickup:* ${pickup}`);
  if (drop) lines.push(`*Drop:* ${drop}`);
  lines.push(
    `*Experiences:* ${experiences}`,
    `*Budget:* ${budgetLabel}`,
    `*Estimated Cost:* ${estimatedTotal} (${perPerson} per person)`
  );
  if (notes) lines.push(`*Notes:* ${notes}`);
  lines.push('', 'Please confirm availability and next steps.');
  return lines.join('\n');
}
