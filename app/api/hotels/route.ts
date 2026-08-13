import { NextResponse } from 'next/server';
import { getHotels } from '@/lib/hotels';
import type { HotelCategory } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as HotelCategory | null;
  const destination = searchParams.get('destination') ?? undefined;

  try {
    const hotels = await getHotels({ category: category ?? undefined, destination });
    return NextResponse.json({ hotels });
  } catch (error) {
    console.error('Failed to fetch hotels', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}
