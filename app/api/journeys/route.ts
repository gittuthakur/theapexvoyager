import { NextResponse } from 'next/server';
import { getAllPackages } from '@/lib/packages';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination')?.toLowerCase() ?? undefined;
  const category = searchParams.get('category')?.toLowerCase() ?? undefined;

  try {
    const all = await getAllPackages();
    const journeys = all.filter((pkg) => {
      const matchesDestination = destination ? pkg.destination.toLowerCase().includes(destination) : true;
      const matchesCategory = category ? pkg.category.toLowerCase() === category : true;
      return matchesDestination && matchesCategory;
    });
    return NextResponse.json({ journeys });
  } catch (error) {
    console.error('Failed to fetch journeys', error);
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}
