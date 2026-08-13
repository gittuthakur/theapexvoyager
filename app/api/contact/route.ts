import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectDB } from '@/lib/mongodb';
import { Enquiry } from '@/models/Enquiry';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, message, budgetRange } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();
  await Enquiry.create({ fullName: name, email, phone, message, budgetRange });

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const adminMail = {
    from: `Apex Voyager <${SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: `New contact request from ${name}`,
    html: `
      <h2>New contact request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone ?? 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `
  };

  const guestMail = {
    from: `Apex Voyager <${SMTP_USER}>`,
    to: email,
    subject: 'Thanks for contacting Apex Voyager',
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for reaching out. We received your message and will be in touch shortly.</p>
      <p>— The Apex Voyager Team</p>
    `
  };

  await transporter.sendMail(adminMail);
  await transporter.sendMail(guestMail);

  return NextResponse.json({ success: true });
}
