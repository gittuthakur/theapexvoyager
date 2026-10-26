import { describe, expect, it } from 'vitest';
import { MAX_ASSISTANT_CHARS, MAX_USER_CHARS, parseChatRequest, parseModelOutput } from '@/lib/assistant/schema';

const user = (content: string) => ({ role: 'user', content });
const assistant = (content: string) => ({ role: 'assistant', content });

describe('parseChatRequest', () => {
  it('accepts a normal conversation and redacts contact details before anything can use it', () => {
    const result = parseChatRequest({ messages: [assistant('hi'), user('Kashmir, mail me a@b.com or 9876543210')] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages[1].content).not.toMatch(/@|\d{7}/);
      expect(result.messages[1].content).toContain('Kashmir');
    }
  });

  it.each([
    ['not an object', null],
    ['array body', []],
    ['no messages', { messages: [] }],
    ['messages not an array', { messages: 'hi' }],
    ['bad role', { messages: [{ role: 'system', content: 'x' }] }],
    ['non-string content', { messages: [{ role: 'user', content: 5 }] }],
    ['empty content', { messages: [user('   ')] }],
    ['ends with assistant', { messages: [user('hi'), assistant('hello')] }],
    ['too long user message', { messages: [user('a'.repeat(MAX_USER_CHARS + 1))] }],
    ['too many messages', { messages: Array.from({ length: 13 }, (_, i) => (i % 2 ? assistant('a') : user('u'))) }],
    ['too many user turns', { messages: Array.from({ length: 7 }, () => user('hello')) }]
  ])('rejects %s', (_name, body) => {
    expect(parseChatRequest(body).ok).toBe(false);
  });

  it('truncates (not rejects) an overlong assistant turn and drops unknown keys', () => {
    const result = parseChatRequest({ messages: [assistant('a'.repeat(MAX_ASSISTANT_CHARS + 200)), { ...user('hi'), extra: 'x' }], other: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages[0].content.length).toBe(MAX_ASSISTANT_CHARS);
      expect(Object.keys(result.messages[1])).toEqual(['role', 'content']);
    }
  });
});

describe('parseModelOutput', () => {
  const base = { intent: 'search', reply: 'ok', destination: 'Kashmir', nights_min: 4, nights_max: 6, budget_per_person_inr: 30000, travellers: 2, month: 'May' };

  it('parses and clamps a valid answer', () => {
    const out = parseModelOutput(JSON.stringify(base));
    expect(out?.criteria).toEqual({ destination: 'Kashmir', nightsMin: 4, nightsMax: 6, budgetPerPerson: 30000, travellers: 2, month: 'may' });
  });

  it('drops out-of-range or malformed fields instead of trusting them', () => {
    const out = parseModelOutput(
      JSON.stringify({ ...base, nights_min: 400, nights_max: 2.5, budget_per_person_inr: -1, travellers: 9999, month: 'Smarch', destination: '<script>x</script>' })
    );
    expect(out?.criteria.nightsMin).toBeUndefined();
    expect(out?.criteria.nightsMax).toBeUndefined();
    expect(out?.criteria.budgetPerPerson).toBeUndefined();
    expect(out?.criteria.travellers).toBeUndefined();
    expect(out?.criteria.month).toBeUndefined();
    expect(out?.criteria.destination).not.toMatch(/[<>]/);
  });

  it('swaps an inverted nights range', () => {
    const out = parseModelOutput(JSON.stringify({ ...base, nights_min: 7, nights_max: 3 }));
    expect([out?.criteria.nightsMin, out?.criteria.nightsMax]).toEqual([3, 7]);
  });

  it.each(['not json', '[]', '{}', JSON.stringify({ ...base, intent: 'book_now' }), JSON.stringify({ ...base, reply: 5 })])('returns null for %s', (text) => {
    expect(parseModelOutput(text)).toBeNull();
  });
});
