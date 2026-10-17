import { ImageOff } from 'lucide-react';
import { PropertyPhotoGallery } from '@/components/modules/stays/PropertyPhotoGallery';
import { CreditedPhotoGallery } from '@/components/modules/stays/CreditedPhotoGallery';
import { fetchFreshPlacePhotos, type EligiblePlaceId } from '@/lib/googlePhotoFetch';
import { getClientIp } from '@/lib/clientIp';
import { resolveStayGallery, type StayGalleryDeps } from '@/lib/stayPhotoGallery';
import type { Stay } from '@/types/stay';

/**
 * The photo area of a GOOGLE-sourced property detail page (D1-3b). It picks what to show from GOOGLE_PHOTO_METADATA_MODE
 * (see lib/stayPhotoGallery.ts for the full rules):
 *
 *   legacy (default) -> the existing PropertyPhotoGallery with the stored photos, byte-for-byte as before; no Google call.
 *   disabled / a failed fresh fetch -> "Photos temporarily unavailable".
 *   fresh, nothing eligible to show -> the existing "Photo unavailable" placeholder.
 *   fresh, qualifying photos -> the credited gallery.
 *
 * In fresh mode a stored, uncredited photo URL is never shown, not even as a fallback.
 *
 * PRECONDITION (see lib/googlePhotoFetch.ts): `eligiblePlaceId` must come from `eligiblePlaceIdFrom(lookup)` on a `found`
 * result of getStayByPlaceIdResult, i.e. after the owner-exclusion list (fail closed) and the published-destination
 * eligibility check. It is never derived from the URL.
 */
export interface StayPhotoSectionProps {
  stay: Stay;
  eligiblePlaceId: EligiblePlaceId | null;
  /** Injected by tests. Production uses the real environment, the trusted client address and the D1-3a fetcher. */
  deps?: Partial<StayGalleryDeps>;
}

async function defaultClientKey(): Promise<string> {
  // Loaded lazily so a legacy page view never touches the request headers, and a test never needs a request context.
  const { headers } = await import('next/headers');
  return getClientIp(await headers());
}

export async function StayPhotoSection({ stay, eligiblePlaceId, deps }: StayPhotoSectionProps) {
  const resolution = await resolveStayGallery(
    { eligiblePlaceId },
    { env: deps?.env ?? process.env, getClientKey: deps?.getClientKey ?? defaultClientKey, fetchPhotos: deps?.fetchPhotos ?? fetchFreshPlacePhotos }
  );

  switch (resolution.kind) {
    case 'credited':
      return <CreditedPhotoGallery photos={resolution.photos} propertyName={stay.name} />;
    case 'unavailable':
      return (
        <div
          role="status"
          className="flex h-72 w-full items-center justify-center rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 px-4 text-center text-slate-600 sm:h-96"
        >
          <div className="flex flex-col items-center gap-2">
            <ImageOff size={32} aria-hidden="true" />
            <span className="text-sm font-medium">Photos temporarily unavailable</span>
          </div>
        </div>
      );
    case 'placeholder':
      return <PropertyPhotoGallery photos={[]} propertyName={stay.name} />;
    default:
      // Legacy: exactly what the page rendered before this feature existed.
      return <PropertyPhotoGallery photos={stay.photos} propertyName={stay.name} />;
  }
}
