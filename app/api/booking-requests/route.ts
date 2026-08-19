import { NextResponse, after } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BookingRequest, type BookingRequestType } from '@/models/BookingRequest';
import { generateBookingId } from '@/lib/bookingId';
import { sendBookingConfirmationEmails } from '@/lib/mailer';

const VALID_TYPES: BookingRequestType[] = ['stay', 'journey', 'tour', 'experience', 'transport', 'expert'];

// Saves a booking/enquiry request under a human-readable reference ID before the
// browser is redirected to wa.me — the record of intent (and the ID shown to the
// visitor) even if they never actually send the prefilled WhatsApp message. Mirrors
// the save-then-redirect shape already used by /api/inquiries.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const type = body?.type;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const itemName = typeof body?.itemName === 'string' ? body.itemName.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : undefined;
    const destination = typeof body?.destination === 'string' ? body.destination.trim() : undefined;
    const dates = typeof body?.dates === 'string' ? body.dates.trim() : undefined;
    const travelers = typeof body?.travelers === 'string' ? body.travelers.trim() : undefined;
    const details =
      body?.details && typeof body.details === 'object' && !Array.isArray(body.details) ? body.details : undefined;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }
    if (!itemName) {
      return NextResponse.json({ error: 'itemName is required' }, { status: 400 });
    }

    await connectDB();
    const referenceId = await generateBookingId();

    const bookingRequest = await BookingRequest.create({
      referenceId,
      type,
      name: name.slice(0, 200),
      phone: phone.slice(0, 30),
      email: email?.slice(0, 200),
      itemName: itemName.slice(0, 200),
      destination: destination?.slice(0, 200),
      dates: dates?.slice(0, 100),
      travelers: travelers?.slice(0, 100),
      details
    });

    // Scheduled for after the response is sent — the visitor gets their reference ID (and
    // is about to be redirected to WhatsApp) immediately, without waiting on SMTP, which
    // can take seconds when slow or misconfigured. sendBookingConfirmationEmails never
    // throws (see lib/mailer.ts), so there's nothing here to catch.
    after(() =>
      sendBookingConfirmationEmails({
        referenceId: bookingRequest.referenceId,
        type,
        name: bookingRequest.name,
        email: bookingRequest.email,
        phone: bookingRequest.phone,
        itemName: bookingRequest.itemName,
        destination: bookingRequest.destination,
        dates: bookingRequest.dates,
        travelers: bookingRequest.travelers
      })
    );

    return NextResponse.json({ referenceId: bookingRequest.referenceId }, { status: 201 });
  } catch (error) {
    console.error('Failed to save booking request', error);
    return NextResponse.json({ error: 'Failed to save booking request' }, { status: 500 });
  }
}
