import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectDB } from '@/lib/mongodb';
import { HotelBooking } from '@/models/HotelBooking';
import { siteConfig } from '@/config/site.config';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? siteConfig.contactEmail;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function POST(request: Request) {
  const body = await request.json();
  const { hotelName, userName, email, phone, checkInDate, checkOutDate, guests } = body;

  if (!hotelName || !userName || !email || !phone || !checkInDate || !checkOutDate || !guests) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();
  const booking = await HotelBooking.create({
    hotelName,
    userName,
    email,
    phone,
    checkInDate,
    checkOutDate,
    guests: Number(guests)
  });

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
    subject: `New hotel booking request — ${hotelName}`,
    html: `
      <h2>New hotel booking request</h2>
      <p><strong>Guest name:</strong> ${userName}</p>
      <p><strong>Hotel:</strong> ${hotelName}</p>
      <p><strong>Check-in:</strong> ${checkInDate}</p>
      <p><strong>Check-out:</strong> ${checkOutDate}</p>
      <p><strong>Guests:</strong> ${guests}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
    `
  };

  const guestMail = {
    from: `Apex Voyager <${SMTP_USER}>`,
    to: email,
    subject: `Your booking request for ${hotelName} is confirmed`,
    html: `
      <p>Hi ${userName},</p>
      <p>Thanks for booking with The Apex Voyager! Your booking request for <strong>${hotelName}</strong> has been received and is confirmed.</p>
      <p><strong>Check-in:</strong> ${checkInDate}<br/>
      <strong>Check-out:</strong> ${checkOutDate}<br/>
      <strong>Guests:</strong> ${guests}</p>
      <p>Our team will reach out shortly with further details.</p>
      <p>— The Apex Voyager Team</p>
    `
  };

  await transporter.sendMail(adminMail);
  await transporter.sendMail(guestMail);

  return NextResponse.json({ success: true, booking }, { status: 201 });
}
