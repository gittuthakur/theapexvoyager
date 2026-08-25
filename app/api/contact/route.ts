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
// Also strips CR/LF so a crafted `name` can't fold extra header-like lines into the
// (unescaped) email `subject` built from it below.
function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[&<>"']/g, (char) => {
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
  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : undefined;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const budgetRange = typeof body?.budgetRange === 'string' ? body.budgetRange.trim() : undefined;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 200) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const boundedName = name.slice(0, 200);
    const boundedPhone = phone?.slice(0, 30);
    const boundedMessage = message.slice(0, 5000);
    const boundedBudgetRange = budgetRange?.slice(0, 100);

    await connectDB();
    await Enquiry.create({
      fullName: boundedName,
      email,
      phone: boundedPhone,
      message: boundedMessage,
      budgetRange: boundedBudgetRange
    });

    const safeName = escapeHtml(boundedName);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(boundedPhone ?? 'N/A');
    const safeMessage = escapeHtml(boundedMessage);

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
  } catch (error) {
    console.error('Failed to save contact enquiry', error);
    return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 });
  }
}
