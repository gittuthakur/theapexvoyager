/**
 * Crypto-free Meta Lead Ads provenance types + sanitiser. Kept separate from lib/metaLeads.ts
 * (which uses Node's crypto module for webhook verification) so that browser code importing lib/leads.ts
 * never pulls webhook/HMAC code into a client bundle.
 */
export interface MetaAnswer { name: string; values: string[] }
export interface MetaProvenance {
  leadId: string; pageId?: string; formId?: string; formName?: string;
  campaignId?: string; campaignName?: string; adSetId?: string; adSetName?: string; adId?: string; adName?: string;
  platform?: string; isOrganic?: boolean; createdTime?: Date; answers: MetaAnswer[];
}
export const text = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string' && typeof v !== 'number') return undefined;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : undefined;
};
export const idText = (v: unknown) => { const t = text(v, 40); return t && /^[A-Za-z0-9_.:-]+$/.test(t) ? t : undefined; };

/** Standard/custom questions that are sensitive or unnecessary for a travel enquiry are never stored. */
export const SENSITIVE = /dob|birth|gender|marital|relationship|military|aadhaar|aadhar|passport|(?<![a-z])pan(?![a-z])|id_?number|ssn|street|zip|postal|post_?code|card|account|salary|income|religion|politic|caste|health|medical|(?<!mail[_ -]?)address|pin_?code|government|licen[cs]e|national_?id|nationality|visa/i;

/** Server-trusted provenance sanitiser (used by validateLeadInput only when meta is explicitly allowed). */
export function sanitizeMeta(raw: unknown): MetaProvenance | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const leadId = idText(r.leadId);
  if (!leadId) return undefined;
  const answers = (Array.isArray(r.answers) ? r.answers : []).slice(0, 40).flatMap((a: unknown) => {
    const x = a as { name?: unknown; values?: unknown };
    const name = text(x?.name, 100);
    const values = (Array.isArray(x?.values) ? x.values : []).slice(0, 5).map(v => text(v, 500)).filter((v): v is string => !!v);
    return name && values.length ? [{ name, values }] : [];
  });
  const created = r.createdTime ? new Date(r.createdTime as string) : undefined;
  return {
    leadId, pageId: idText(r.pageId), formId: idText(r.formId), formName: text(r.formName, 120), campaignId: idText(r.campaignId), campaignName: text(r.campaignName, 150),
    adSetId: idText(r.adSetId), adSetName: text(r.adSetName, 150), adId: idText(r.adId), adName: text(r.adName, 150), platform: text(r.platform, 20),
    isOrganic: typeof r.isOrganic === 'boolean' ? r.isOrganic : undefined, createdTime: created && !Number.isNaN(created.getTime()) ? created : undefined, answers
  };
}

