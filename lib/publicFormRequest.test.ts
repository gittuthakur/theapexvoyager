import { beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => vi.resetModules());

it('rejects oversized streamed input even when content-length lies', async () => {
  const { readPublicForm } = await import('./publicFormRequest');
  const result = await readPublicForm(new Request('https://test.invalid/contact', {
    method: 'POST', headers: { 'content-length': '1' }, body: JSON.stringify({ message: 'x'.repeat(20_001) })
  }));
  expect(result.error?.status).toBe(413);
});

it('rejects invalid JSON and arrays', async () => {
  const { readPublicForm } = await import('./publicFormRequest');
  for (const body of ['{', '[]', 'null']) {
    expect((await readPublicForm(new Request('https://test.invalid/contact', { method: 'POST', body }))).error?.status).toBe(400);
  }
});

it('throttles repeated submissions and provides retry guidance', async () => {
  const { limitPublicForm } = await import('./publicFormRequest');
  const request = new Request('https://test.invalid/contact');
  for (let i = 0; i < 10; i++) expect(limitPublicForm(request, 'test')).toBeNull();
  const response = limitPublicForm(request, 'test');
  expect(response?.status).toBe(429);
  expect(response?.headers.get('Retry-After')).toBe('60');
});

it('accepts international contact numbers and rejects unusable text', async () => {
  const { isContactPhone } = await import('./publicFormRequest');
  expect(isContactPhone('+44 20 7946 0123')).toBe(true);
  expect(isContactPhone('+91 98765 43210')).toBe(true);
  expect(isContactPhone('call me')).toBe(false);
  expect(isContactPhone('123')).toBe(false);
});
