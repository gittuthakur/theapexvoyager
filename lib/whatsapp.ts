import { siteConfig } from '@/config/site.config';
import type { BookingRequestType } from '@/models/BookingRequest';

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
  referenceId: string;
  pickup: string;
  destination: string;
  date?: string;
  travelers?: string;
  vehicleName: string;
}

/** Structured WhatsApp message for the /transport "Request This Vehicle" flow — mirrors buildExperienceRequestMessage's shape with route/vehicle-specific fields instead. */
export function buildTransportRequestMessage({
  referenceId,
  pickup,
  destination,
  date,
  travelers,
  vehicleName
}: TransportRequestMessageParams) {
  const lines = [
    `Hi! I'd like to request transport — reference ${referenceId}.`,
    `*Route:* ${pickup} → ${destination}`,
    `*Preferred vehicle:* ${vehicleName}`
  ];
  if (date) lines.push(`*Date:* ${date}`);
  if (travelers) lines.push(`*Travellers:* ${travelers}`);
  lines.push('', 'Please confirm availability and pricing.');
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
  perPerson
}: JourneyRequestMessageParams) {
  return [
    `Hi! I'd like to book my Himalayan journey — reference ${referenceId}.`,
    `*Journey:* ${tierTitle}`,
    `*Destination(s):* ${destinations}`,
    `*Dates:* ${dates}`,
    `*Travellers:* ${travelers}`,
    `*Stay:* ${stayLabel}`,
    `*Transport:* ${transportLabel}`,
    `*Experiences:* ${experiences}`,
    `*Budget:* ${budgetLabel}`,
    `*Estimated Cost:* ${estimatedTotal} (${perPerson} per person)`,
    '',
    'Please confirm availability and next steps.'
  ].join('\n');
}
