import { NextResponse } from 'next/server';
import { getHotelBySlug } from '@/lib/hotels';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const hotel = await getHotelBySlug(slug);
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    return NextResponse.json({ hotel });
  } catch (error) {
    console.error('Failed to fetch hotel', error);
    return NextResponse.json({ error: 'Failed to fetch hotel' }, { status: 500 });
  }
}
