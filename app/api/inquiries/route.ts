import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Inquiry } from '@/models/Inquiry';

// Saves a WhatsApp lead-capture submission before the browser is redirected to
// wa.me — this is the record of intent even if the visitor never actually sends
// the prefilled WhatsApp message.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const selection = typeof body?.selection === 'string' ? body.selection.trim() : '';
    const selectionType = body?.selectionType;
    const stayType = typeof body?.stayType === 'string' ? body.stayType.trim() : undefined;
    const date = typeof body?.date === 'string' ? body.date.trim() : undefined;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }
    if (!selection) {
      return NextResponse.json({ error: 'A selection is required' }, { status: 400 });
    }
    if (selectionType !== 'stay' && selectionType !== 'destination') {
      return NextResponse.json({ error: 'selectionType must be "stay" or "destination"' }, { status: 400 });
    }

    await connectDB();
    const inquiry = await Inquiry.create({
      name: name.slice(0, 200),
      phone: phone.slice(0, 30),
      selection: selection.slice(0, 200),
      selectionType,
      stayType: stayType?.slice(0, 30),
      date: date?.slice(0, 30)
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error('Failed to save inquiry', error);
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
  }
}
