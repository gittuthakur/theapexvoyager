import { describe, expect, it } from 'vitest';
import {
  MAX_SPECIAL_REQUEST_LENGTH,
  normalizeCustomerEmail,
  normalizeCustomerName,
  normalizeCustomerPhone,
  normalizeSpecialRequests,
  validateCustomerInput
} from './customerValidation';

describe('normalizeCustomerName', () => {
  it('trims and collapses internal whitespace', () => {
    expect(normalizeCustomerName('  Ravi   Kumar  ')).toBe('Ravi Kumar');
  });

  it('rejects a non-string', () => {
    expect(normalizeCustomerName(123)).toBeNull();
    expect(normalizeCustomerName(undefined)).toBeNull();
  });

  it('rejects an empty (or whitespace-only) name', () => {
    expect(normalizeCustomerName('')).toBeNull();
    expect(normalizeCustomerName('   ')).toBeNull();
  });

  it('rejects an overlong name', () => {
    expect(normalizeCustomerName('a'.repeat(121))).toBeNull();
    expect(normalizeCustomerName('a'.repeat(120))).toBe('a'.repeat(120));
  });

  it('collapses a newline as ordinary whitespace (not a control-character rejection)', () => {
    // \n is whitespace and is collapsed by the same rule as any other run of spaces —
    // only a genuinely non-whitespace control byte (below) is rejected.
    expect(normalizeCustomerName('Ravi\nKumar')).toBe('Ravi Kumar');
  });

  it('rejects a non-whitespace control character', () => {
    expect(normalizeCustomerName('Ravi\x00Kumar')).toBeNull();
  });
});

describe('normalizeCustomerEmail', () => {
  it('lowercases and trims a valid email', () => {
    expect(normalizeCustomerEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });

  it('treats undefined as "not provided"', () => {
    expect(normalizeCustomerEmail(undefined)).toBeUndefined();
  });

  it('treats an empty-after-trim string as "not provided", not invalid', () => {
    expect(normalizeCustomerEmail('   ')).toBeUndefined();
  });

  it('rejects a malformed email', () => {
    expect(normalizeCustomerEmail('not-an-email')).toBeNull();
    expect(normalizeCustomerEmail('missing@domain')).toBeNull();
  });

  it('rejects a non-string', () => {
    expect(normalizeCustomerEmail(12345)).toBeNull();
  });

  it('rejects an email over the 200-character max', () => {
    const longEmail = `${'a'.repeat(196)}@a.co`; // 201 chars total
    expect(longEmail.length).toBe(201);
    expect(normalizeCustomerEmail(longEmail)).toBeNull();
  });
});

describe('normalizeCustomerPhone', () => {
  it('accepts a valid 10-digit Indian mobile number', () => {
    expect(normalizeCustomerPhone('9876543210')).toBe('9876543210');
  });

  it('strips only spaces/hyphens — a lossless, non-ambiguous normalization', () => {
    expect(normalizeCustomerPhone('+91-98765-43210')).toBe('+919876543210');
    expect(normalizeCustomerPhone('98765 43210')).toBe('9876543210');
  });

  it('rejects an invalid number rather than guessing/altering it', () => {
    expect(normalizeCustomerPhone('12345')).toBeNull();
    expect(normalizeCustomerPhone('not-a-phone')).toBeNull();
  });

  it('rejects a non-string', () => {
    expect(normalizeCustomerPhone(9876543210)).toBeNull();
  });
});

describe('normalizeSpecialRequests', () => {
  it('treats undefined and empty-after-trim as "not provided"', () => {
    expect(normalizeSpecialRequests(undefined)).toBeUndefined();
    expect(normalizeSpecialRequests('   ')).toBeUndefined();
  });

  it('trims a valid request', () => {
    expect(normalizeSpecialRequests('  Vegetarian meals please  ')).toBe('Vegetarian meals please');
  });

  it('rejects control characters, including newlines', () => {
    expect(normalizeSpecialRequests('Line one\nLine two')).toBeNull();
  });

  it('rejects HTML-tag-shaped content (plain text only)', () => {
    expect(normalizeSpecialRequests('<script>alert(1)</script>')).toBeNull();
    expect(normalizeSpecialRequests('a < b')).toBeNull();
  });

  it('rejects content over the max length', () => {
    expect(normalizeSpecialRequests('a'.repeat(MAX_SPECIAL_REQUEST_LENGTH + 1))).toBeNull();
    expect(normalizeSpecialRequests('a'.repeat(MAX_SPECIAL_REQUEST_LENGTH))).toBe('a'.repeat(MAX_SPECIAL_REQUEST_LENGTH));
  });

  it('rejects a non-string', () => {
    expect(normalizeSpecialRequests(42)).toBeNull();
  });
});

describe('validateCustomerInput', () => {
  const VALID = { name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com' };

  it('accepts a fully valid customer', () => {
    const result = validateCustomerInput(VALID);
    expect(result).toEqual({ valid: true, customer: { name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com' } });
  });

  it('includes specialRequests only when provided', () => {
    const result = validateCustomerInput({ ...VALID, specialRequests: 'Window seat' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.customer.specialRequests).toBe('Window seat');
  });

  it('rejects an invalid name and reports the field', () => {
    expect(validateCustomerInput({ ...VALID, name: '' })).toEqual({ valid: false, field: 'name' });
  });

  it('rejects an invalid phone and reports the field', () => {
    expect(validateCustomerInput({ ...VALID, phone: '123' })).toEqual({ valid: false, field: 'phone' });
  });

  it('rejects a missing email (required for this endpoint)', () => {
    const { email: _email, ...withoutEmail } = VALID;
    expect(validateCustomerInput(withoutEmail)).toEqual({ valid: false, field: 'email' });
  });

  it('rejects an invalid specialRequests and reports the field', () => {
    expect(validateCustomerInput({ ...VALID, specialRequests: 'a'.repeat(1001) })).toEqual({ valid: false, field: 'specialRequests' });
  });

  it('ignores unknown/extra keys — never spreads the raw input through', () => {
    const result = validateCustomerInput({ ...VALID, __proto__: { polluted: true }, totalMinorUnits: 1, status: 'CONFIRMED' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(Object.keys(result.customer).sort()).toEqual(['email', 'name', 'phone']);
    }
  });
});
