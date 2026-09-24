import { NextResponse } from 'next/server';
import { requireInternalDevAccess } from '@/lib/internalRouteGuard';
import { disableMapping } from '@/services/pricing/hotelMappingRegistry.service';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireInternalDevAccess();
  if (denied) return denied;

  const { id } = await params;
  const result = await disableMapping({ mappingId: id });
  if (!result.disabled) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === 'not_found' ? 404 : 409 });
  }

  return NextResponse.json({ mapping: result.mapping });
}
