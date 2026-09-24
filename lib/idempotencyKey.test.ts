import { describe, expect, it } from 'vitest';
import { validateIdempotencyKey } from './idempotencyKey';

describe('validateIdempotencyKey', () => {
  it('accepts a valid UUID', () => {
    const result = validateIdempotencyKey('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toEqual({ valid: true, key: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('accepts a valid opaque key at the minimum length (16)', () => {
    const key = 'a'.repeat(16);
    expect(validateIdempotencyKey(key)).toEqual({ valid: true, key });
  });

  it('accepts a valid opaque key at the maximum length (128)', () => {
    const key = 'a'.repeat(128);
    expect(validateIdempotencyKey(key)).toEqual({ valid: true, key });
  });

  it('trims surrounding whitespace before validating', () => {
    const key = 'a'.repeat(16);
    expect(validateIdempotencyKey(`  ${key}  `)).toEqual({ valid: true, key });
  });

  it('rejects a key shorter than 16 characters', () => {
    expect(validateIdempotencyKey('a'.repeat(15))).toEqual({ valid: false });
  });

  it('rejects a key longer than 128 characters', () => {
    expect(validateIdempotencyKey('a'.repeat(129))).toEqual({ valid: false });
  });

  it('rejects disallowed characters', () => {
    expect(validateIdempotencyKey('a'.repeat(15) + '!')).toEqual({ valid: false });
    expect(validateIdempotencyKey('a'.repeat(15) + ' ')).toEqual({ valid: false });
    expect(validateIdempotencyKey('a'.repeat(15) + '/')).toEqual({ valid: false });
  });

  it('rejects embedded whitespace, even if overall length is valid', () => {
    expect(validateIdempotencyKey('abcdefgh ijklmnop')).toEqual({ valid: false });
  });

  it('rejects embedded CR/LF', () => {
    expect(validateIdempotencyKey('a'.repeat(8) + '\r\n' + 'a'.repeat(8))).toEqual({ valid: false });
  });

  it('rejects embedded control characters', () => {
    expect(validateIdempotencyKey('a'.repeat(8) + '\x00' + 'a'.repeat(8))).toEqual({ valid: false });
  });

  it('rejects a non-string input', () => {
    expect(validateIdempotencyKey(12345)).toEqual({ valid: false });
    expect(validateIdempotencyKey(null)).toEqual({ valid: false });
    expect(validateIdempotencyKey(undefined)).toEqual({ valid: false });
    expect(validateIdempotencyKey({})).toEqual({ valid: false });
  });

  it('rejects an empty string', () => {
    expect(validateIdempotencyKey('')).toEqual({ valid: false });
  });
});
