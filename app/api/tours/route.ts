import { NextResponse } from 'next/server';
import { getTours } from '@/lib/tours';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination') ?? undefined;

  try {
    const tours = await getTours({ destination });
    return NextResponse.json({ tours });
  } catch (error) {
    console.error('Failed to fetch tours', error);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}