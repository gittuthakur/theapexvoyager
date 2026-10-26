import { describe, expect, it } from 'vitest';
import { REDACTED, redactContactDetails } from '@/lib/assistant/redact';

describe('redactContactDetails', () => {
  it('removes email addresses', () => {
    expect(redactContactDetails('mail me at jane.doe+trip@example.co.in please')).toBe(`mail me at ${REDACTED} please`);
  });

  it('removes phone numbers in common formats', () => {
    for (const phone of ['9876543210', '+91 98765 43210', '(0172) 555-1234', '098-765-43210', '+91-9876543210']) {
      expect(redactContactDetails(`call ${phone} tomorrow`)).toBe(`call ${REDACTED} tomorrow`);
    }
  });

  it('leaves trip details alone', () => {
    const text = '5 nights in Kashmir for 2 adults, budget 25000 per person, travelling 12-15 May 2027';
    expect(redactContactDetails(text)).toBe(text);
  });

  it('handles several contact details in one message', () => {
    expect(redactContactDetails('a@b.com or 9876543210')).not.toMatch(/@|\d{7}/);
  });
});
