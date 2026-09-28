import { NextResponse } from 'next/server';
import { requireInternalDevAccess } from '@/lib/internalRouteGuard';
import { addExclusion, getExclusions } from '@/services/properties/propertyExclusion.service';
import { EXCLUDED_PLACE_PROVIDERS, type ExcludedPlaceProvider } from '@/models/ExcludedPlace';

export const dynamic = 'force-dynamic';

/** Dev/admin-safe listing + creation for property exclusions — see
 *  lib/internalRouteGuard.ts for the dev-only gating rationale (no real admin auth
 *  exists in this project yet). Deactivation lives under
 *  app/api/internal/property-exclusions/[id]/deactivate. */
export async function GET(request: Request) {
  const denied = requireInternalDevAccess();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get('isActive');

  const exclusions = await getExclusions({
    isActive: isActiveParam === null ? undefined : isActiveParam === 'true'
  });

  return NextResponse.json({ exclusions });
}

export async function POST(request: Request) {
  const denied = requireInternalDevAccess();
  if (denied) return denied;

  let payload: { provider?: string; providerPlaceId?: string; propertyName?: string; reason?: string; requestedBy?: string; notes?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!payload.provider || !EXCLUDED_PLACE_PROVIDERS.includes(payload.provider as ExcludedPlaceProvider)) {
    return NextResponse.json({ error: `provider must be one of: ${EXCLUDED_PLACE_PROVIDERS.join(', ')}` }, { status: 400 });
  }
  if (!payload.providerPlaceId?.trim()) {
    return NextResponse.json({ error: 'providerPlaceId is required' }, { status: 400 });
  }

  const result = await addExclusion({
    provider: payload.provider as ExcludedPlaceProvider,
    providerPlaceId: payload.providerPlaceId,
    propertyName: payload.propertyName,
    reason: payload.reason,
    requestedBy: payload.requestedBy,
    notes: payload.notes
  });

  if (!result.added) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === 'invalid_input' ? 400 : 409 });
  }

  return NextResponse.json({ exclusion: result.exclusion });
}
