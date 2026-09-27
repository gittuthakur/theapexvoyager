import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { NewsletterSubscriber } from '@/models/NewsletterSubscriber';
import { readPublicForm } from '@/lib/publicFormRequest';
import { normalizeCustomerEmail } from '@/lib/customerValidation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const parsed = await readPublicForm(request);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
    const sourcePage = typeof body?.sourcePage === 'string' ? body.sourcePage.trim().slice(0, 300) : undefined;

    if (!rawEmail || !EMAIL_PATTERN.test(rawEmail) || !normalizeCustomerEmail(rawEmail)) {
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
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return NextResponse.json({ status: 'already_subscribed' }, { status: 200 });
    }
    console.error('Failed to save newsletter subscriber');
    return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 });
  }
}
