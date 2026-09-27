import { expect, it, vi } from 'vitest';
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/NewsletterSubscriber', () => ({ NewsletterSubscriber: {
  findOne: () => ({ lean: async () => null }), create
} }));
const { POST } = await import('./route');
it('treats a concurrent unique-email collision as an existing subscription', async () => {
  create.mockRejectedValue({ code: 11000 });
  const response = await POST(new Request('https://test.invalid/api/newsletter', { method: 'POST', body: JSON.stringify({ email: 'QA@example.invalid' }) }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'already_subscribed' });
  expect(create).toHaveBeenCalledWith({ email: 'qa@example.invalid', sourcePage: undefined });
});
