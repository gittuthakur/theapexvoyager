import { NextResponse } from 'next/server';
import { getVehicles } from '@/lib/transport';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? undefined;
  const serviceArea = searchParams.get('serviceArea') ?? undefined;
  const minSeatsParam = searchParams.get('minSeats');
  const minSeats = minSeatsParam ? Number(minSeatsParam) : undefined;

  try {
    const vehicles = await getVehicles({
      category,
      serviceArea,
      minSeats: Number.isFinite(minSeats) ? minSeats : undefined
    });
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Failed to fetch transport vehicles', error);
    return NextResponse.json({ error: 'Failed to fetch transport vehicles' }, { status: 500 });
  }
}
