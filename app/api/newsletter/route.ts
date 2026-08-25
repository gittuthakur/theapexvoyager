import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { NewsletterSubscriber } from '@/models/NewsletterSubscriber';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
    const sourcePage = typeof body?.sourcePage === 'string' ? body.sourcePage.trim().slice(0, 300) : undefined;

    if (!rawEmail || !EMAIL_PATTERN.test(rawEmail) || rawEmail.length > 200) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    const email = rawEmail.toLowerCase();

    await connectDB();

    const existing = await NewsletterSubscriber.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ status: 'already_subscribed' }, { status: 200 });
    }

    await NewsletterSubscriber.create({ email, sourcePage });
    return NextResponse.json({ status: 'subscribed' }, { status: 201 });
  } catch (error) {
    console.error('Failed to save newsletter subscriber', error);
    return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 });
  }
}
