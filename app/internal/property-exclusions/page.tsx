import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocalDevelopment } from '@/lib/env';
import { getExclusions } from '@/services/properties/propertyExclusion.service';
import type { ExcludedPlaceDocument } from '@/models/ExcludedPlace';
import PropertyExclusionReviewClient, { type SerializedExclusion } from './PropertyExclusionReviewClient';

export const dynamic = 'force-dynamic';

// noindex/nofollow is defense-in-depth only — the real protection is the notFound()
// guard below, same convention as app/internal/hotel-mappings/page.tsx.
export const metadata: Metadata = {
  title: 'Property Exclusions (Internal)',
  robots: { index: false, follow: false }
};

function serialize(doc: ExcludedPlaceDocument): SerializedExclusion {
  return {
    id: String(doc._id),
    provider: doc.provider,
    providerPlaceId: doc.providerPlaceId,
    propertyName: doc.propertyName,
    reason: doc.reason,
    requestedBy: doc.requestedBy,
    requestDate: doc.requestDate ? new Date(doc.requestDate).toISOString() : undefined,
    notes: doc.notes,
    isActive: doc.isActive,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString()
  };
}

/**
 * Local-development-only internal tool for managing property-owner exclusion requests —
 * same isLocalDevelopment()/notFound() gate as every other app/internal page in this
 * codebase (this project has no real admin auth layer yet; see
 * lib/internalRouteGuard.ts's own doc comment on that being a known, reported
 * limitation, not something this page can silently fix).
 */
export default async function PropertyExclusionsPage() {
  if (!isLocalDevelopment()) {
    notFound();
  }

  const [active, inactive] = await Promise.all([getExclusions({ isActive: true }), getExclusions({ isActive: false })]);

  return <PropertyExclusionReviewClient active={active.map(serialize)} inactive={inactive.map(serialize)} />;
}
