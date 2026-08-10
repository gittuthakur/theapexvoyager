import { siteConfig } from '@/config/site.config';

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
