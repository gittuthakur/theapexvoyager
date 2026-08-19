import { NextResponse } from 'next/server';
import { getPackageBySlug } from '@/lib/packages';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const journey = await getPackageBySlug(slug);
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }
    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Failed to fetch journey', error);
    return NextResponse.json({ error: 'Failed to fetch journey' }, { status: 500 });
  }
}
