import { describe, expect, it } from 'vitest';
import { acquisitionLabel, captureLabel, publisherLabel, travellersLabel, dateLabel } from './leadDisplay';
import type { InternalLead } from '@/services/leads/lead.service';
const lead = (extra: Partial<InternalLead> = {}) => ({ source: 'website', captureKind: 'FORM_SUBMITTED', ...extra }) as InternalLead;
describe('CRM evidence and missing values', () => {
  it('does not fabricate traveller counts', () => {
    expect(travellersLabel({})).toBe('Not available');
    expect(travellersLabel({ adults: 2 })).toBe('2 adults');
    expect(travellersLabel({ adults: 2, children: 0 })).toBe('2 adults, 0 children');
  });
  it('keeps capture separate from acquisition', () => {
    expect(captureLabel(lead())).toBe('Website form');
    expect(acquisitionLabel(lead())).toBe('Unknown acquisition source');
    expect(acquisitionLabel(lead({ captureKind: 'WHATSAPP_CLICK', source: 'whatsapp' }))).toBe('Unknown acquisition source');
  });
  it('never derives platform from campaign names or a stored source', () => {
    const m = { leadId: '123', campaignName: 'Instagram campaign', answers: [] };
    expect(publisherLabel(lead({ meta: m, source: 'instagram' }))).toBe('Unknown');
    expect(publisherLabel(lead({ meta: { ...m, platform: 'ig' } }))).toBe('Instagram');
  });
  it('identifies synthetic imported references', () => {
    expect(captureLabel(lead({ captureKind: 'META_LEAD_AD', meta: { leadId: 'lc:example', answers: [] } }))).toBe('Meta historical import');
  });
  it('labels UTMs and staff assertions, without claiming Google Ads', () => {
    expect(acquisitionLabel(lead({ source: 'google', utmSource: 'google' }))).toBe('Google · UTM-reported');
    expect(acquisitionLabel(lead({ captureKind: 'MANUAL', source: 'instagram' }))).toContain('staff-reported');
  });
  it('formats timestamps in India time and handles missing dates', () => {
    expect(dateLabel()).toBe('Not available');
    expect(dateLabel('invalid')).toBe('Not available');
    expect(dateLabel('2026-10-08T20:00:00Z')).toContain('9 Oct 2026');
  });
});
