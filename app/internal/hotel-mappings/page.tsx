import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocalDevelopment } from '@/lib/env';
import { getMappingCandidates } from '@/services/pricing/hotelMappingRegistry.service';
import { HBX_DESTINATION_MAPPINGS } from '@/config/hbxDestinations.config';
import type { HotelProviderMappingDocument } from '@/models/HotelProviderMapping';
import HotelMappingReviewClient, { type SerializedMapping } from './HotelMappingReviewClient';

export const dynamic = 'force-dynamic';

// noindex/nofollow is defense-in-depth only — the real protection is the notFound()
// guard below, not this metadata. A search engine that somehow reached this URL in a
// real deployment would still get a genuine 404 response, never this page's content.
export const metadata: Metadata = {
  title: 'Hotel Mapping Review (Internal)',
  robots: { index: false, follow: false }
};

function serializeMapping(doc: HotelProviderMappingDocument): SerializedMapping {
  return {
    id: String(doc._id),
    googlePlaceId: doc.googlePlaceId,
    destinationSlug: doc.destinationSlug,
    provider: doc.provider,
    providerHotelId: doc.providerHotelId,
    providerDestinationCode: doc.providerDestinationCode,
    googleHotelName: doc.googleHotelName,
    providerHotelName: doc.providerHotelName,
    googleLatitude: doc.googleLatitude,
    googleLongitude: doc.googleLongitude,
    providerLatitude: doc.providerLatitude,
    providerLongitude: doc.providerLongitude,
    nameSimilarity: doc.nameSimilarity,
    distanceMeters: doc.distanceMeters,
    hasCoordinateAnomaly: doc.hasCoordinateAnomaly,
    status: doc.status,
    confirmedBy: doc.confirmedBy,
    confirmedAt: doc.confirmedAt ? new Date(doc.confirmedAt).toISOString() : undefined,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString()
  };
}

/**
 * Local-development-only internal tool — never a customer-facing page, and never
 * reachable by hiding its nav link alone. Guarded here at the server-component level
 * with `notFound()`, the same isLocalDevelopment() convention every other internal
 * surface in this app already uses (lib/internalRouteGuard.ts's app/api/internal/*
 * routes): every real hosting deployment sets NODE_ENV to 'production' (lib/env.ts's
 * own doc comment), so a request for this route in any real deployment gets Next's
 * genuine 404 page, not this component's markup — the guard runs before any data is
 * fetched or rendered, not just before some UI is hidden.
 */
export default async function HotelMappingReviewPage() {
  if (!isLocalDevelopment()) {
    notFound();
  }

  const [pending, confirmed, rejected, disabled] = await Promise.all([
    getMappingCandidates({ status: 'PENDING_REVIEW' }),
    getMappingCandidates({ status: 'CONFIRMED' }),
    getMappingCandidates({ status: 'REJECTED' }),
    getMappingCandidates({ status: 'DISABLED' })
  ]);

  return (
    <HotelMappingReviewClient
      pending={pending.map(serializeMapping)}
      confirmed={confirmed.map(serializeMapping)}
      rejected={rejected.map(serializeMapping)}
      disabled={disabled.map(serializeMapping)}
      destinations={HBX_DESTINATION_MAPPINGS.map((mapping) => ({ slug: mapping.slug, hbxName: mapping.hbxName }))}
    />
  );
}
