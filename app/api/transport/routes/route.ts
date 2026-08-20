import { NextResponse } from 'next/server';
import { getRoutes } from '@/lib/transport';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin') ?? undefined;
  const destination = searchParams.get('destination') ?? undefined;

  try {
    const routes = await getRoutes({ origin, destination });
    return NextResponse.json({ routes });
  } catch (error) {
    console.error('Failed to fetch transport routes', error);
    return NextResponse.json({ error: 'Failed to fetch transport routes' }, { status: 500 });
  }
}
