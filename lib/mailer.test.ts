import { afterEach, expect, it, vi } from 'vitest';
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it('escapes booking details and preserves a saved request when delivery fails', async () => {
  vi.stubEnv('SMTP_HOST', 'smtp.example.invalid');
  vi.stubEnv('SMTP_USER', 'fixture@example.invalid');
  vi.stubEnv('SMTP_PASS', 'fixture-not-a-secret');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  sendMail.mockRejectedValue(new Error('private-recipient@example.invalid'));
  const { sendBookingConfirmationEmails } = await import('./mailer');
  await expect(sendBookingConfirmationEmails({ referenceId: 'TAP-99999', type: 'stay', name: '<img>', phone: '9876543210', email: 'qa@example.invalid', itemName: '<script>bad</script>', notes: 'admin-only-note' })).resolves.toBeUndefined();
  expect(sendMail).toHaveBeenCalledTimes(2);
  const [admin, customer] = sendMail.mock.calls.map(([value]) => value);
  expect(admin.html).toContain('&lt;script&gt;');
  expect(customer.html).not.toContain('<img>');
  expect(customer.html).not.toContain('admin-only-note');
  expect(JSON.stringify(log.mock.calls)).not.toContain('private-recipient');
});
