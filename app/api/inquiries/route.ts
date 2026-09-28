import { NextResponse, after } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Inquiry } from '@/models/Inquiry';
import { readPublicForm, isContactPhone } from '@/lib/publicFormRequest';
import { sendBookingConfirmationEmails } from '@/lib/mailer';

// Saves a WhatsApp lead-capture submission before the browser is redirected to
// wa.me — this is the record of intent even if the visitor never actually sends
// the prefilled WhatsApp message.
export async function POST(request: Request) {
  try {
    const parsed = await readPublicForm(request);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const selection = typeof body?.selection === 'string' ? body.selection.trim() : '';
    const selectionType = body?.selectionType;
    const stayType = typeof body?.stayType === 'string' ? body.stayType.trim() : undefined;
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : undefined;
    const destinationSlug = typeof body?.destinationSlug === 'string' ? body.destinationSlug.trim() : undefined;
    const sourcePage = typeof body?.sourcePage === 'string' ? body.sourcePage.trim() : undefined;
    const date = typeof body?.date === 'string' ? body.date.trim() : undefined;

    if (!name || name.length > 200 || !isContactPhone(phone) || phone.length > 30) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }
    if (!selection) {
      return NextResponse.json({ error: 'A selection is required' }, { status: 400 });
    }
    // 'stay' was removed 2026-09: The Apex Voyager India has no booking/pricing agreement
    // with any Stay property, so no enquiry may be submitted for one — this endpoint now
    // fails closed with the same generic 400 a malformed/unrecognized value already got,
    // never a Stay-specific error that would confirm the endpoint used to accept it.
    if (selectionType !== 'destination') {
      return NextResponse.json({ error: 'selectionType must be "destination"' }, { status: 400 });
    }

    await connectDB();
    const inquiry = await Inquiry.create({
      name: name.slice(0, 200),
      phone: phone.slice(0, 30),
      selection: selection.slice(0, 200),
      selectionType,
      stayType: stayType?.slice(0, 30),
      slug: slug?.slice(0, 200),
      destinationSlug: destinationSlug?.slice(0, 200),
      sourcePage: sourcePage?.slice(0, 300),
      date: date?.slice(0, 30)
    });

    after(() => sendBookingConfirmationEmails({
      referenceId: String(inquiry._id), type: selectionType, name: inquiry.name,
      phone: inquiry.phone, itemName: inquiry.selection, dates: inquiry.date
    }));
    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error('Failed to save inquiry');
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
  }
}
