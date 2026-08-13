import { NextResponse } from 'next/server';
import { getTourBySlug } from '@/lib/tours';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const tour = await getTourBySlug(slug);
    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }
    return NextResponse.json({ tour });
  } catch (error) {
    console.error('Failed to fetch tour', error);
    return NextResponse.json({ error: 'Failed to fetch tour' }, { status: 500 });
  }
}