import { describe, expect, it } from 'vitest';
import { SAFE_ASK_FALLBACK, sanitizeReply } from '@/lib/assistant/guard';

describe('sanitizeReply', () => {
  it('keeps an ordinary question', () => {
    expect(sanitizeReply('Which month are you planning to travel?')).toBe('Which month are you planning to travel?');
  });

  it.each([
    'This trip costs ₹25,000 per person.',
    'It is Rs. 20000 only',
    'Around INR 30000',
    'Just $500 for two',
    'Only 15000 per person!',
    'See https://example.com/deal',
    'Visit www.example.com',
    'Your booking is confirmed.',
    'We guarantee snow.',
    'Seats are available on 12 May.',
    'That one is sold out.'
  ])('replaces a reply carrying a price, link or booking claim: %s', (text) => {
    expect(sanitizeReply(text)).toBe(SAFE_ASK_FALLBACK);
  });

  it('replaces an empty reply and truncates long ones', () => {
    expect(sanitizeReply('   ')).toBe(SAFE_ASK_FALLBACK);
    expect(sanitizeReply('a'.repeat(900)).length).toBe(400);
  });

  it('strips control characters', () => {
    expect(sanitizeReply('Hello\u0000 there\u0007')).toBe('Hello there');
  });
});
