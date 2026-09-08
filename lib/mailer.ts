import nodemailer from 'nodemailer';
import { siteConfig } from '@/config/site.config';
import { formatPriceOrQuote } from '@/lib/pricing';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? siteConfig.contactEmail;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Reused across requests (and across dev hot-reloads, via `global`) — nodemailer pools
// SMTP connections internally, so a fresh transporter per request would pay a new
// TCP/TLS handshake on every submission instead of reusing an open socket.
declare global {
  // eslint-disable-next-line no-var
  var bookingMailTransporter: nodemailer.Transporter | undefined;
}

const transporter =
  global.bookingMailTransporter ??
  nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // A booking submission must never hang on a slow/misconfigured SMTP host — these
    // bound the worst case to a few seconds instead of Node's much longer default
    // socket timeout, since the caller awaits this to guarantee delivery is attempted
    // before responding (see sendBookingConfirmationEmails's doc comment).
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
global.bookingMailTransporter = transporter;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

export interface BookingConfirmationEmailInput {
  referenceId: string;
  type: string;
  name: string;
  email?: string;
  phone: string;
  itemName: string;
  destination?: string;
  dates?: string;
  travelers?: string;
  stayLabel?: string;
  transportLabel?: string;
  paceLabel?: string;
  addOns?: string[];
  total?: number;
  pickupLocation?: string;
  dropLocation?: string;
  specialRequest?: string;
  /** Free-text "anything else we should know?" — admin email only, see the customer send below. */
  notes?: string;
}

/**
 * Best-effort email notification for a saved BookingRequest — an admin heads-up plus,
 * when the visitor left an email, a confirmation with their reference ID. This is the
 * one piece of behavior the old, single-purpose /api/hotel-bookings route had that
 * /api/booking-requests didn't; generalizing it here means every booking type gets a
 * real "manual booking confirmation" touchpoint, not just stays. SMTP failures (or SMTP
 * simply not being configured, e.g. in local dev) are logged and swallowed — the booking
 * record is already saved by the time this runs, so a mail error must never surface as a
 * failed booking to the visitor.
 */
let hasWarnedNotConfigured = false;

/** Every value below comes from a customer-typed field (name, itemName, etc.) and is
 *  interpolated directly into an HTML email body — escape it the same way JSX would,
 *  since this template has no other protection against `<`/`&`/quote injection. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendBookingConfirmationEmails(input: BookingConfirmationEmailInput): Promise<void> {
  if (!isConfigured) {
    if (!hasWarnedNotConfigured) {
      console.warn('SMTP is not configured (ADMIN_EMAIL/SMTP_HOST/SMTP_USER/SMTP_PASS) — skipping booking confirmation emails.');
      hasWarnedNotConfigured = true;
    }
    return;
  }

  const detailRows = [
    ['Reference', input.referenceId],
    ['Type', input.type],
    ['Item', input.itemName],
    input.destination ? ['Destination', input.destination] : null,
    input.dates ? ['Dates', input.dates] : null,
    input.travelers ? ['Travelers', input.travelers] : null,
    input.stayLabel ? ['Stay', input.stayLabel] : null,
    input.transportLabel ? ['Transport', input.transportLabel] : null,
    input.paceLabel ? ['Pace', input.paceLabel] : null,
    input.addOns && input.addOns.length > 0 ? ['Add-ons', input.addOns.join(', ')] : null,
    input.total !== undefined ? ['Total', formatPriceOrQuote(input.total)] : null,
    input.pickupLocation ? ['Pickup Location', input.pickupLocation] : null,
    input.dropLocation ? ['Drop Location', input.dropLocation] : null,
    input.specialRequest ? ['Special Request', input.specialRequest] : null,
    ['Phone', input.phone],
    input.email ? ['Email', input.email] : null
  ].filter((row): row is [string, string] => row !== null);

  const detailHtml = detailRows.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join('\n');
  // Notes may contain sensitive free text (dietary/accessibility/celebration details) —
  // kept out of detailHtml (shared by both sends) and appended to the admin email only.
  const notesHtml = input.notes ? `<p><strong>Special Notes:</strong> ${escapeHtml(input.notes)}</p>` : '';
  const safeName = escapeHtml(input.name);

  const sends: Promise<unknown>[] = [
    transporter.sendMail({
      from: `${siteConfig.name} <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `New ${input.type} booking request — ${input.itemName} (${input.referenceId})`,
      html: `<h2>New booking request</h2><p><strong>Name:</strong> ${safeName}</p>${detailHtml}${notesHtml}`
    })
  ];

  if (input.email) {
    sends.push(
      transporter.sendMail({
        from: `${siteConfig.name} <${SMTP_USER}>`,
        to: input.email,
        subject: `Your ${siteConfig.name} travel request (${input.referenceId})`,
        html: `
          <p>Hi ${safeName},</p>
          <p>Thank you for planning your journey with ${siteConfig.name}. We've received your travel request.</p>
          <p>Our team will review the details and help confirm availability, pricing and next steps.</p>
          ${detailHtml}
          <p>Keep this reference handy: <strong>${input.referenceId}</strong></p>
          <p>— The ${siteConfig.name} Team</p>
        `
      })
    );
  }

  // Parallel, not sequential — two independently-timed-out sends run concurrently so a
  // slow/unreachable SMTP host costs at most ~5s total, not ~5s per recipient.
  const results = await Promise.allSettled(sends);
  for (const result of results) {
    if (result.status === 'rejected') console.error('Failed to send a booking confirmation email', result.reason);
  }
}
