import { NextResponse } from 'next/server';
import { getExpertBySlug } from '@/lib/experts';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;

  try {
    const expert = await getExpertBySlug(slug);
    if (!expert) {
      return NextResponse.json({ error: 'Travel expert not found' }, { status: 404 });
    }
    return NextResponse.json({ expert });
  } catch (error) {
    console.error(`Failed to fetch travel expert "${slug}"`, error);
    return NextResponse.json({ error: 'Failed to fetch travel expert' }, { status: 500 });
  }
}
