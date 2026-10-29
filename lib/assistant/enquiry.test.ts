import { describe, expect, it } from 'vitest';
import { buildEnquiryLead } from '@/lib/assistant/enquiry';
import { validateLeadInput } from '@/lib/leads';

const NOW = new Date('2027-03-05T10:00:00.000Z');
const valid = { name: 'Asha Rao', phone: '+91 98765 43210', consent: true };

function built(body: unknown) {
  const result = buildEnquiryLead(body, NOW);
  if (!result.ok || result.bot) throw new Error(`expected a lead payload, got ${JSON.stringify(result)}`);
  return result;
}

describe('buildEnquiryLead', () => {
  it('maps a package enquiry to a JOURNEY lead and a general one to CUSTOM_TRIP, stamped with a server-side source', () => {
    const custom = built(valid);
    expect(custom.payload).toMatchObject({ leadType: 'CUSTOM_TRIP', captureKind: 'FORM_SUBMITTED', attribution: { sourceDetail: 'ai-assistant' } });
    const journey = built({ ...valid, journeySlug: 'Fixture-Kashmir-Escape' });
    expect(journey.payload).toMatchObject({ leadType: 'JOURNEY', journeySlug: 'fixture-kashmir-escape' });
    expect(journey.journeySlug).toBe('fixture-kashmir-escape');
  });

  it('cannot be told its own source by the client', () => {
    const result = built({ ...valid, attribution: { sourceDetail: 'something-else', utmSource: 'google' } });
    expect(result.payload.attribution).toMatchObject({ sourceDetail: 'ai-assistant', utmSource: 'google' });
  });

  it('produces a payload the existing lead validator accepts', () => {
    const result = built({ ...valid, email: 'asha@example.com', destination: 'Kashmir', travelStartDate: '2027-04-10', adults: 2, children: 1, budget: 'Up to 30000 per person', message: 'Hello' });
    const parsed = validateLeadInput(result.payload);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toMatchObject({ leadType: 'CUSTOM_TRIP', adults: 2, children: 1, destination: 'Kashmir' });
  });

  it('requires explicit consent, a name, and a phone or email', () => {
    expect(buildEnquiryLead({ ...valid, consent: false }, NOW)).toMatchObject({ ok: false });
    expect(buildEnquiryLead({ ...valid, consent: 'true' }, NOW)).toMatchObject({ ok: false });
    expect(buildEnquiryLead({ ...valid, name: '  ' }, NOW)).toMatchObject({ ok: false, error: 'Name is required' });
    expect(buildEnquiryLead({ name: 'A', consent: true }, NOW)).toMatchObject({ ok: false });
  });

  it('rejects malformed or oversized fields', () => {
    for (const patch of [
      { name: 'a'.repeat(201) },
      { message: 'a'.repeat(1001) },
      { budget: 'a'.repeat(101) },
      { adults: 0 },
      { adults: 51 },
      { adults: 2.5 },
      { adults: '2' },
      { children: -1 },
      { phone: 5 },
      { journeySlug: 'bad slug!' },
      { travelStartDate: '2027-13-40' },
      { travelStartDate: 'tomorrow' },
      { travelStartDate: '2020-01-01' }
    ]) {
      expect(buildEnquiryLead({ ...valid, ...patch }, NOW)).toMatchObject({ ok: false });
    }
  });

  it('accepts today as a travel date', () => {
    expect(buildEnquiryLead({ ...valid, travelStartDate: '2027-03-05' }, NOW)).toMatchObject({ ok: true });
  });

  it('acknowledges a honeypot hit without producing anything to store', () => {
    expect(buildEnquiryLead({ ...valid, company: 'Spam Inc' }, NOW)).toEqual({ ok: true, bot: true });
  });

  it('rejects non-object bodies', () => {
    for (const body of [null, 'x', 5, []]) expect(buildEnquiryLead(body, NOW)).toMatchObject({ ok: false });
  });
});
