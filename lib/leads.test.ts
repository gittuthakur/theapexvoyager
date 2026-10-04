import { describe, expect, it } from 'vitest';
import {
  checkStatusTransition, followUpBucket, inferSource, normalizePhone, normalizeSource, sanitizeAttribution, sortLeads,
  toPublicLeadAck, validateLeadInput, type LeadStatus
} from './leads';

const base = { name: 'Fixture Person', phone: '+91 98765 43210', leadType: 'JOURNEY' };
const NOW = new Date(2026, 9, 4, 12, 0, 0);

describe('phone normalization', () => {
  it.each(['9876543210', '+91 98765 43210', '09876543210', '91-9876543210', '(98765) 43210'])('collapses %s to the same key', raw => {
    expect(normalizePhone(raw)).toBe('9876543210');
  });
  it.each(['Not provided (WhatsApp)', '12', 'abc', '', '1'.repeat(16)])('rejects %s', raw => expect(normalizePhone(raw)).toBeUndefined());
});

describe('validateLeadInput', () => {
  it('accepts a minimal valid lead and normalizes fields', () => {
    const result = validateLeadInput({ ...base, email: ' QA@Example.COM ', journeySlug: ' Manali-Premium ', unexpected: 'dropped', aadhaar: '1234' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({ email: 'qa@example.com', journeySlug: 'manali-premium', captureKind: 'FORM_SUBMITTED' });
      expect(JSON.stringify(result.value)).not.toMatch(/aadhaar|1234|unexpected/);
    }
  });
  it.each([
    [{ ...base, name: '' }, 'Name'],
    [{ ...base, phone: 'nope' }, 'phone'],
    [{ name: 'X', leadType: 'JOURNEY' }, 'required'],
    [{ ...base, leadType: 'BOGUS' }, 'leadType'],
    [{ ...base, priority: 'MAX' }, 'priority'],
    [{ ...base, adults: -1 }, 'counts'],
    [{ ...base, adults: 1.5 }, 'counts'],
    [{ ...base, children: '2' }, 'counts'],
    [{ ...base, travelStartDate: '2026-13-45' }, 'date'],
    [{ ...base, travelStartDate: '2026-11-10', travelEndDate: '2026-11-01' }, 'before'],
    [{ ...base, email: 'not-an-email' }, 'email'],
    [{ ...base, captureKind: 'HACK' }, 'captureKind'],
    [null, 'Invalid'],
    [[], 'Invalid']
  ])('rejects malformed payload %#', (payload, fragment) => {
    const result = validateLeadInput(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.toLowerCase()).toContain(String(fragment).toLowerCase());
  });
  it('allows a contactless WHATSAPP_CLICK but not a contactless form', () => {
    expect(validateLeadInput({ name: 'WhatsApp visitor', leadType: 'TRANSPORT', captureKind: 'WHATSAPP_CLICK' }).ok).toBe(true);
    expect(validateLeadInput({ name: 'Someone', leadType: 'GENERAL', captureKind: 'FORM_SUBMITTED' }).ok).toBe(false);
  });
  it('strips control characters and bounds free text', () => {
    const result = validateLeadInput({ ...base, message: `hi\u0000\u0007 there ${'x'.repeat(6000)}` });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.message!.length).toBeLessThanOrEqual(5000);
      expect(result.value.message).not.toMatch(/[\u0000\u0007]/);
    }
  });
});

describe('UTM / source attribution', () => {
  it('preserves the five UTM tags, landing page and referrer; drops unknown keys', () => {
    const a = sanitizeAttribution({ utmSource: 'meta', utmMedium: 'paid', utmCampaign: 'winter', utmContent: 'a', utmTerm: 't', landingPage: '/x', referrer: 'https://google.com', evil: 'x' });
    expect(a).toMatchObject({ utmSource: 'meta', utmMedium: 'paid', utmCampaign: 'winter', utmContent: 'a', utmTerm: 't', landingPage: '/x', referrer: 'https://google.com', source: 'meta' });
    expect(a).not.toHaveProperty('evil');
  });
  it('infers source from UTM and respects an explicit one', () => {
    expect(inferSource('instagram')).toBe('instagram');
    expect(inferSource('facebook')).toBe('meta');
    expect(inferSource('google')).toBe('google');
    expect(inferSource('newsletter')).toBe('other');
    expect(sanitizeAttribution({ source: 'referral', utmSource: 'google' }).source).toBe('referral');
    expect(normalizeSource('nonsense')).toBeUndefined();
  });
  it('returns {} for non-objects', () => expect(sanitizeAttribution('x')).toEqual({}));
});

describe('status transitions', () => {
  it('rejects same-state and un-reopened exits from a terminal status; allows explicit reopen', () => {
    expect(checkStatusTransition('NEW', 'NEW').ok).toBe(false);
    expect(checkStatusTransition('NEW', 'QUALIFIED').ok).toBe(true);
    for (const closed of ['WON', 'LOST', 'SPAM'] as LeadStatus[]) {
      expect(checkStatusTransition(closed, 'FOLLOW_UP').ok).toBe(false);
      expect(checkStatusTransition(closed, 'FOLLOW_UP', true).ok).toBe(true);
    }
    expect(checkStatusTransition('QUOTE_SENT', 'WON').ok).toBe(true);
    expect(checkStatusTransition('NEW', 'BOGUS' as LeadStatus).ok).toBe(false);
  });
});

describe('follow-up buckets and ordering', () => {
  const day = (offset: number, hour = 9) => new Date(2026, 9, 4 + offset, hour);
  it('buckets by calendar day', () => {
    expect(followUpBucket('FOLLOW_UP', day(-1), NOW)).toBe('OVERDUE');
    expect(followUpBucket('FOLLOW_UP', day(0, 8), NOW)).toBe('DUE_TODAY');
    expect(followUpBucket('FOLLOW_UP', day(0, 18), NOW)).toBe('DUE_TODAY');
    expect(followUpBucket('FOLLOW_UP', day(2), NOW)).toBe('UPCOMING');
    expect(followUpBucket('NEW', undefined, NOW)).toBe('NONE');
  });
  it('WON / LOST / SPAM never appear overdue', () => {
    for (const s of ['WON', 'LOST', 'SPAM'] as LeadStatus[]) expect(followUpBucket(s, day(-30), NOW)).toBe('CLOSED');
  });
  it('orders overdue, NEW, upcoming, rest, closed', () => {
    const mk = (id: string, status: LeadStatus, next: Date | undefined, created: number) => ({ id, status, nextFollowUpAt: next, createdAt: new Date(2026, 9, created) });
    const sorted = sortLeads([
      mk('closed', 'WON', undefined, 3), mk('rest', 'QUALIFIED', undefined, 3), mk('upcoming', 'FOLLOW_UP', day(3), 1),
      mk('new', 'NEW', undefined, 2), mk('overdue-late', 'CONTACTED', day(-1), 1), mk('overdue-early', 'CONTACTED', day(-5), 1)
    ], NOW).map(l => l.id);
    expect(sorted).toEqual(['overdue-early', 'overdue-late', 'new', 'upcoming', 'rest', 'closed']);
  });
});

describe('public privacy', () => {
  it('the only public lead response is a bare acknowledgement', () => {
    expect(toPublicLeadAck()).toEqual({ received: true });
  });
});

describe('WHATSAPP_CLICK leads carry no fabricated identity', () => {
  it('validates without a name, phone or email and stores none', () => {
    const result = validateLeadInput({ leadType: 'TRANSPORT', captureKind: 'WHATSAPP_CLICK', message: 'click' });
    expect(result.ok).toBe(true);
    if (result.ok) expect([result.value.name, result.value.phone, result.value.email]).toEqual([undefined, undefined, undefined]);
  });
  it('still requires a name and a contact for forms and manual leads', () => {
    expect(validateLeadInput({ leadType: 'TRANSPORT', captureKind: 'FORM_SUBMITTED', phone: '9876543210' }).ok).toBe(false);
    expect(validateLeadInput({ leadType: 'TRANSPORT', captureKind: 'MANUAL', name: 'X' }).ok).toBe(false);
  });
});
