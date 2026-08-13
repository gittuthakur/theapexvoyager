import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';

export async function POST(request: Request) {
  const body = await request.json();
  const { tourSlug, fullName, email, phone, dates, guests } = body;

  if (!tourSlug || !fullName || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await connectDB();
    const booking = await Booking.create({
      tourSlug,
      fullName,
      email,
      phone,
      dates,
      guests: guests ? Number(guests) : undefined
    });
    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error('Failed to create booking', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}