import { NextResponse } from 'next/server';
import { requireInternalDevAccess } from '@/lib/internalRouteGuard';
import { getMappingCandidates } from '@/services/pricing/hotelMappingRegistry.service';
import type { HotelMappingStatus } from '@/models/HotelProviderMapping';
import type { StayPricingProviderId } from '@/services/pricing/stayPricing.types';

export const dynamic = 'force-dynamic';

/**
 * Dev/admin-safe review queue listing — see lib/internalRouteGuard.ts for the
 * dev-only gating rationale (no real admin auth exists in this project yet). Never
 * mutates anything; the confirm/reject/disable actions live under
 * app/api/internal/hotel-mappings/[id]/*.
 */
export async function GET(request: Request) {
  const denied = requireInternalDevAccess();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as HotelMappingStatus | null;
  const destinationSlug = searchParams.get('destinationSlug') ?? undefined;
  const provider = (searchParams.get('provider') as StayPricingProviderId | null) ?? undefined;

  const mappings = await getMappingCandidates({
    status: status ?? 'PENDING_REVIEW',
    destinationSlug,
    provider
  });

  return NextResponse.json({ mappings });
}
