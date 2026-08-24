import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectDB } from '@/lib/mongodb';
import { Enquiry } from '@/models/Enquiry';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Reused across requests (and across dev hot-reloads, via `global`) — nodemailer
// pools SMTP connections internally, so a fresh transporter per request would pay
// a new TCP/TLS handshake on every submission instead of reusing an open socket.
declare global {
  // eslint-disable-next-line no-var
  var contactMailTransporter: nodemailer.Transporter | undefined;
}

const transporter =
  global.contactMailTransporter ??
  nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
global.contactMailTransporter = transporter;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Untrusted user input is interpolated into the HTML emails below — escape it so a
// submitted name/phone/message can't inject markup or links into the admin/guest emails.
function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, message, budgetRange } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  await connectDB();
  await Enquiry.create({ fullName: name, email, phone, message, budgetRange });

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone ?? 'N/A');
  const safeMessage = escapeHtml(message);

  const adminMail = {
    from: `Apex Voyager <${SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: `New contact request from ${safeName}`,
    html: `
      <h2>New contact request</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `
  };

  const guestMail = {
    from: `Apex Voyager <${SMTP_USER}>`,
    to: email,
    subject: 'Thanks for contacting Apex Voyager',
    html: `
      <p>Hi ${safeName},</p>
      <p>Thanks for reaching out. We received your message and will be in touch shortly.</p>
      <p>— The Apex Voyager Team</p>
    `
  };

  await Promise.all([transporter.sendMail(adminMail), transporter.sendMail(guestMail)]);

  return NextResponse.json({ success: true });
}
