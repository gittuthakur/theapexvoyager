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
  const lines = ['Hello The Apex Voyager,', '', 'I would like to customise this transport option.', ''];
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

/**
 * "Customise on WhatsApp" used to open wa.me directly with no record of the lead at
 * all — an analytics/business blind spot (the visitor's intent was never saved
 * anywhere). This saves a lightweight BookingRequest first — reusing the same
 * /api/booking-requests endpoint, TAP-XXXXX reference generator, and BookingRequest
 * model every other transport flow already uses, no new architecture — then opens
 * WhatsApp with that reference in the message. name/phone aren't known at this point
 * (no form was shown, by design), so they're saved as an honest placeholder rather
 * than fabricated: this is a pre-contact WhatsApp lead, not a completed enquiry. If
 * the save fails, the visitor must still reach WhatsApp — only the reference line is
 * dropped from the message.
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
  let referenceId: string | undefined;

  try {
    const result = await postJSON<{ referenceId: string }>('/api/booking-requests', {
      type: 'transport',
      name: 'WhatsApp Lead',
      phone: 'Not provided (WhatsApp)',
      itemName: vehicle.name,
      destination: pickup && destination ? `${pickup} → ${destination}` : destination,
      dates: date,
      travelers,
      details: {
        serviceType: vehicle.serviceType,
        vehicleSlug: vehicle.slug ?? vehicle.id,
        pickup,
        destination,
        date,
        returnDate,
        travellers: travelers,
        driveMode,
        quantity,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-whatsapp-customise',
        channel: 'whatsapp'
      }
    });
    referenceId = result.referenceId;
  } catch (error) {
    console.error('Failed to save WhatsApp customise lead', error);
  }

  const messageText = buildTransportCustomiseMessage({
    referenceId,
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
  const lines = ['Hello The Apex Voyager,', '', 'I submitted a 4x4 transport request.', '', `Reference: ${referenceId}`, `Service: ${fourByFourType}`];
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
