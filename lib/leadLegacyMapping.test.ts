import { describe, expect, it } from 'vitest';
import { bookingRequestToLeadPayload, enquiryToLeadPayload, inquiryToLeadPayload, WHATSAPP_PLACEHOLDER_PHONE } from './leadLegacyMapping';
import { validateLeadInput } from './leads';

describe('legacy -> lead mapping', () => {
  it('maps a destination Inquiry using sourcePage as landing page', () => {
    const p = inquiryToLeadPayload({ _id: 'a1', name: 'N', phone: '9876543210', selection: 'Manali', sourcePage: '/destinations/manali', date: '2026-12-01' });
    const v = validateLeadInput(p);
    expect(v.ok && v.value).toMatchObject({ destination: 'Manali', legacyRef: { model: 'Inquiry', id: 'a1' }, attribution: { landingPage: '/destinations/manali', source: 'website' } });
  });
  it('maps a contact Enquiry with email and budget', () => {
    const v = validateLeadInput(enquiryToLeadPayload({ _id: 'e1', fullName: 'N', email: 'a@b.co', message: 'hello', budgetRange: '50k' }));
    expect(v.ok && v.value).toMatchObject({ email: 'a@b.co', budget: '50k', leadType: 'GENERAL' });
  });
  it('treats the transport WhatsApp placeholder as a WHATSAPP_CLICK with no phone', () => {
    const v = validateLeadInput(bookingRequestToLeadPayload({ referenceId: 'TAP-1', type: 'transport', name: 'WhatsApp Lead', phone: WHATSAPP_PLACEHOLDER_PHONE, itemName: 'Innova', details: { channel: 'whatsapp' } }));
    expect(v.ok && v.value).toMatchObject({ captureKind: 'WHATSAPP_CLICK', leadType: 'TRANSPORT', attribution: { source: 'whatsapp' } });
    expect(v.ok && [v.value.phone, v.value.name]).toEqual([undefined, undefined]);
  });
  it('maps catalog journeys to JOURNEY (slug kept) and trip-planner to CUSTOM_TRIP', () => {
    const cat = validateLeadInput(bookingRequestToLeadPayload({ referenceId: 'T2', type: 'journey', name: 'N', phone: '9876543210', itemName: 'J', details: { source: 'catalog', slug: 'x', travelDate: '2026-11-10', adults: 2, children: 1 } }));
    expect(cat.ok && cat.value).toMatchObject({ leadType: 'JOURNEY', journeySlug: 'x', adults: 2, children: 1 });
    const tp = validateLeadInput(bookingRequestToLeadPayload({ referenceId: 'T3', type: 'journey', name: 'N', phone: '9876543210', itemName: 'Plan', details: { source: 'trip-planner', params: { adults: 3 } } }));
    expect(tp.ok && tp.value).toMatchObject({ leadType: 'CUSTOM_TRIP', adults: 3 });
  });
});
