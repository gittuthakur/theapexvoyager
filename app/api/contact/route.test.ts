import { beforeEach, describe, expect, it, vi } from 'vitest';
const { create, sendMail } = vi.hoisted(() => ({ create: vi.fn(), sendMail: vi.fn() }));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/Enquiry', () => ({ Enquiry: { create } }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }));
const { POST } = await import('./route');
let requestId = 0;
const request = (data: unknown) => new Request('https://test.invalid/api/contact', {
  method: 'POST', headers: { 'x-forwarded-for': `fixture-${requestId++}` }, body: JSON.stringify(data)
});
const fixture = { name: '<img src=x onerror=alert(1)>', email: 'qa@example.invalid', phone: '+44 20 7946 0123', message: '<script>bad</script>' };
beforeEach(() => { create.mockReset().mockResolvedValue({}); sendMail.mockReset().mockResolvedValue({}); });

describe('contact persistence and notifications', () => {
  it('acknowledges a saved enquiry even when both emails fail', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendMail.mockRejectedValue(new Error('private recipient information'));
    expect((await POST(request(fixture))).status).toBe(200);
    expect(create).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(log.mock.calls)).not.toContain('private recipient');
    log.mockRestore();
  });
  it('does not send notifications when persistence fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    create.mockRejectedValue(new Error('database down'));
    expect((await POST(request(fixture))).status).toBe(500);
    expect(sendMail).not.toHaveBeenCalled();
    log.mockRestore();
  });
  it('escapes user input in both email bodies', async () => {
    expect((await POST(request(fixture))).status).toBe(200);
    const messages = sendMail.mock.calls.map(([mail]) => mail.html).join('');
    expect(messages).toContain('&lt;img');
    expect(messages).toContain('&lt;script&gt;');
    expect(messages).not.toContain('<script>');
  });
  it('rejects ambiguous email addresses before persistence or delivery', async () => {
    expect((await POST(request({ ...fixture, email: 'a(b)@example.invalid' }))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it('rejects oversized messages instead of silently truncating them', async () => {
    expect((await POST(request({ ...fixture, message: 'x'.repeat(5001) }))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
