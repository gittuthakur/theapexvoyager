import { NextResponse } from 'next/server';
import { requireInternalDevAccess } from '@/lib/internalRouteGuard';
import { confirmMapping } from '@/services/pricing/hotelMappingRegistry.service';

export const dynamic = 'force-dynamic';

const REASON_STATUS: Record<string, number> = {
  not_found: 404,
  invalid_status: 409,
  coordinate_anomaly: 409,
  conflict_google_place: 409,
  conflict_provider_hotel: 409
};

/** The only route that can ever set a mapping to CONFIRMED — a human-triggered review
 *  action, never automatic. `confirmedBy` is required so every confirmation is
 *  attributable (models/HotelProviderMapping.ts's confirmedBy field). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireInternalDevAccess();
  if (denied) return denied;

  const { id } = await params;

  let payload: { confirmedBy?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!payload.confirmedBy) {
    return NextResponse.json({ error: 'confirmedBy is required — every confirmation must be attributable to a reviewer' }, { status: 400 });
  }

  const result = await confirmMapping({ mappingId: id, confirmedBy: payload.confirmedBy });
  if (!result.confirmed) {
    return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 409 });
  }

  return NextResponse.json({ mapping: result.mapping });
}
