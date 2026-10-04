import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import PrivacyPolicyContent from './PrivacyPolicyContent';
import DataDeletionContent from './DataDeletionContent';
import { metadata as deletionMetadata } from '@/app/data-deletion/page';
import { metadata as privacyMetadata } from '@/app/privacy/page';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const root = join(__dirname, '..', '..');
const privacy = renderToStaticMarkup(<PrivacyPolicyContent />);
const deletion = renderToStaticMarkup(<DataDeletionContent />);

describe('Privacy Policy (/privacy) - Meta Lead Ads update', () => {
  it('explains Meta/Facebook/Instagram lead-form data, CRM use, and that customer data is not sold', () => {
    const t = text(privacy);
    expect(t).toContain('Meta Lead Ads and Instant Forms');
    expect(t).toMatch(/Facebook or Instagram/);
    for (const field of ['name', 'phone / WhatsApp number', 'email address', 'destination or travel interest', 'travel dates', 'traveller details']) expect(t).toContain(field);
    expect(t).toContain('private internal customer-enquiry system (CRM)');
    for (const purpose of ['respond to your enquiry', 'prepare quotations', 'record our communication and follow-up', 'manage travel enquiries and bookings', 'provide customer service']) expect(t).toContain(purpose);
    expect(t).toContain('We do not sell customer personal information.');
  });
  it('does not claim to collect fields we do not collect (no ID, payment or sensitive data)', () => {
    const meta = text(privacy).split('4. Meta Lead Ads')[1].split('5. Cookies')[0];
    expect(meta).not.toMatch(/Aadhaar|passport|PAN\b|payment card|date of birth|gender|address of residence/i);
  });
  it('links to the deletion instructions with clear wording, keeps sections in order and the contact block', () => {
    expect(privacy).toContain('href="/data-deletion"');
    expect(text(privacy)).toContain('User Data Deletion Instructions');
    const headings = [...privacy.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map(m => m[1]);
    expect(headings.map(h => h.split('.')[0])).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(headings[3]).toBe('4. Meta Lead Ads and Instant Forms');
    expect(headings[9]).toBe('10. Contact');
    expect(privacy).toContain('mailto:theapexvoyagertravels@gmail.com');
    expect(privacy).toContain('Last updated: 5 October 2026');
  });
  it('uses purpose-based retention language with no invented universal retention period', () => {
    const retention = text(privacy).split('8. Data Retention')[1].split('9. Your Rights')[0];
    for (const purpose of ['handling your enquiry', 'arranging the travel services', 'booking administration', 'accounting and legal obligations', 'resolving disputes']) expect(retention).toContain(purpose);
    expect(retention).toContain('securely deleted or anonymised');
    expect(retention).not.toMatch(/\b\d+\s*(days?|weeks?|months?|years?)\b/i);
  });
  it('keeps its canonical URL and is not noindex', () => {
    expect(privacyMetadata.alternates?.canonical).toBe('/privacy');
    expect(privacyMetadata.robots).toBeUndefined();
  });
});

describe('User Data Deletion Instructions (/data-deletion)', () => {
  it('has the required title, canonical URL and no noindex', () => {
    expect(deletionMetadata.title).toBe('User Data Deletion Instructions | The Apex Voyager India');
    expect(deletionMetadata.alternates?.canonical).toBe('/data-deletion');
    expect(deletionMetadata.robots).toBeUndefined();
    const source = readFileSync(join(root, 'app', 'data-deletion', 'page.tsx'), 'utf8');
    expect(source).not.toMatch(/noindex|index: false/);
  });
  it('covers website enquiries, Facebook/Instagram lead forms and the internal CRM', () => {
    const t = text(deletion);
    for (const scope of ['Enquiries submitted on our website', 'Facebook Lead Ads and Instant Forms', 'Instagram Lead Ads and Instant Forms', 'private internal CRM']) expect(t).toContain(scope);
  });
  it('gives the deletion contact, what to include, and the exact 30-day aim', () => {
    const t = text(deletion);
    expect(deletion).toContain('mailto:theapexvoyagertravels@gmail.com?subject=Data%20deletion%20request');
    for (const item of ['your name', 'the phone number you used in the enquiry', 'the email address you used in the enquiry']) expect(t).toContain(item);
    expect(t).toContain('We aim to acknowledge and process valid deletion requests within 30 days.');
  });
  it('asks for no sensitive data and does not promise deletion where retention is required', () => {
    const t = text(deletion);
    expect(t).toMatch(/do not send government ID, passport or Aadhaar details, payment card details/i);
    expect(t).toContain('legal, accounting, fraud-prevention, dispute-resolution or other legitimate record-keeping purposes');
    expect(t).toContain('cannot always delete everything');
    expect(t).not.toMatch(/\b(Act|Section \d+|GDPR|DPDP|CCPA)\b/);
  });
  it('is public-facing: no CRM internals, credentials or admin links', () => {
    expect(deletion).not.toMatch(/\/internal|api\/|token|secret|password|META_|login/i);
  });
  it('links back to the privacy policy', () => expect(deletion).toContain('href="/privacy"'));
});

describe('site wiring', () => {
  it('sitemap lists /data-deletion once next to the other legal pages, and keeps /privacy and /terms', () => {
    const sitemap = readFileSync(join(root, 'app', 'sitemap.ts'), 'utf8');
    expect(sitemap.match(/\/data-deletion/g)).toHaveLength(1);
    expect(sitemap).toContain('/privacy');
    expect(sitemap).toContain('/terms');
  });
  it('/terms and the Footer are untouched by this change', () => {
    expect(readFileSync(join(root, 'components', 'modules', 'TermsAndConditionsContent.tsx'), 'utf8')).not.toMatch(/data-deletion/);
    expect(readFileSync(join(root, 'components', 'layout', 'Footer.tsx'), 'utf8')).not.toMatch(/data-deletion/);
  });
});
