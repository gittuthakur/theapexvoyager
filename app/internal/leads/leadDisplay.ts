import type { InternalLead } from '@/services/leads/lead.service';

export const unavailable = 'Not available';
export const titleCase = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export const leadName = (lead: InternalLead) => lead.name || (lead.captureKind === 'WHATSAPP_CLICK' ? 'WhatsApp click' : 'Name not available');
export const dateLabel = (value?: string, time = false) => value && !Number.isNaN(Date.parse(value))
  ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', ...(time ? { timeStyle: 'short' as const } : {}) }).format(new Date(value))
  : unavailable;
export function travellersLabel(lead: Pick<InternalLead, 'adults' | 'children' | 'infants'>) {
  const counts = [['adults', lead.adults], ['children', lead.children], ['infants', lead.infants]] as const;
  const known = counts.filter(([, count]) => count !== undefined && count !== null);
  return known.length ? known.map(([label, count]) => `${count} ${label}`).join(', ') : unavailable;
}
export function sourceLabel(source: string) {
  return ({ meta: 'Meta', website: 'Website', whatsapp: 'WhatsApp', google: 'Google', instagram: 'Instagram (stored)', manual: 'Manual', direct: 'Direct', referral: 'Referral', other: 'Other' } as Record<string, string>)[source] ?? 'Unknown source';
}
export function captureLabel(lead: InternalLead) {
  if (lead.captureKind === 'WHATSAPP_CLICK') return 'WhatsApp click';
  if (lead.captureKind === 'META_LEAD_AD') return lead.meta?.leadId.startsWith('lc:') ? 'Meta historical import' : 'Meta lead form';
  return lead.captureKind === 'MANUAL' ? 'Manual entry' : 'Website form';
}
export function publisherLabel(lead: InternalLead) {
  const platform = lead.meta?.platform?.toLowerCase();
  return platform === 'fb' || platform === 'facebook' ? 'Facebook' : platform === 'ig' || platform === 'instagram' ? 'Instagram' : 'Unknown';
}
export function acquisitionLabel(lead: InternalLead) {
  if (lead.utmSource) return `${sourceLabel(lead.source)} · UTM-reported`;
  if (lead.captureKind === 'META_LEAD_AD') return `${publisherLabel(lead) === 'Unknown' ? 'Meta · platform unknown' : publisherLabel(lead)}${lead.meta?.leadId.startsWith('lc:') ? ' · imported' : ''}`;
  if (lead.captureKind === 'MANUAL') return `${sourceLabel(lead.source)} · staff-reported`;
  return 'Unknown acquisition source';
}
export const phoneLink = (phone: string) => phone.replace(/[^\d+]/g, '');
export const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`;
