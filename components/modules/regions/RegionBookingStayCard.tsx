import { Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { GoogleMapsButton } from '@/components/ui/GoogleMapsButton';
import { buildGoogleMapsUrl } from '@/lib/googleMapsLink';
import type { RegionBookingStayCardProps } from '@/services/providers/booking/booking.mapper';

// The designed-but-dataless Booking.com stay variant — bookingMode "affiliate". Only
// ever rendered when bookingContext.accommodations is non-empty, which never happens
// today (see services/providers/booking/bookingAccommodation.service.ts) — kept, not
// deleted, so the visual slot is ready the moment a real integration lands. Renders no
// price and no commercial call-to-action of any kind — there is no active Booking.com
// affiliate integration today (2026-09: Stays vertical made commercial-CTA-free
// sitewide), and `providerUrl` is preserved on the props type for that future
// integration's own commercial UI, not rendered here as if one already exists. Shows the
// same informational "View on Google Maps" action every other Stay surface uses, but
// ONLY when real Google place data is actually present — never fabricated from
// `providerUrl` (a Booking.com URL, not a Maps one).
export default function RegionBookingStayCard({ name, photoUrl, rating, googleMapsUri, placeId }: RegionBookingStayCardProps) {
  const mapsUrl = buildGoogleMapsUrl({ googleMapsUri, placeId });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {photoUrl ? <SafeImage src={photoUrl} alt={name} fill sizes="(min-width: 1024px) 360px, 45vw" className="object-cover" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        {rating ? (
          <span className="inline-flex items-center gap-1 text-sm text-amber-500">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        ) : null}
        <div className="flex-1" />
        {/* name/photo/rating above are Booking.com-sourced, never Google's — a Maps link
            alone (when googleMapsUri/placeId are ever populated) proves nothing about
            the rest of this content's provenance, so no "sourced from Google"
            attribution is shown here (see lib/googleMapsLink.ts's own doc comment). */}
        <div className="mt-3">
          <GoogleMapsButton url={mapsUrl} fullWidth />
        </div>
      </div>
    </div>
  );
}
