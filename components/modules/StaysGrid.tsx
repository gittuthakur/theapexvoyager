'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { withPhotoWidth } from '@/lib/placePhotoUrl';
import WhatsAppEnquireButton from '@/components/modules/WhatsAppEnquireButton';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/motion';
import { hotelToStay, dedupeAgainstCurated } from '@/lib/stayMerge';
import { STAY_TYPES, STAY_TYPE_LABELS, type Stay, type StayType } from '@/types/stay';
import type { HotelPackage } from '@/types/hotel';
import { siteConfig } from '@/config/site.config';

export interface StaysGridProps {
  location: string;
  /** The destination's real state (e.g. "Jammu & Kashmir") — forwarded to the stays API so
   *  it never falls back to the Himachal Pradesh-only default for a non-Himachal destination. */
  state?: string;
  /** publiclyListed curated Hotel records for this destination's mapped location(s) — see
   *  lib/stayLocation.ts. Source priority: curated first, Google Places second (this
   *  section's existing data source), honest empty state last — never fabricated. */
  curatedStays?: HotelPackage[];
  destinationSlug?: string;
  /** Stay-mode-aware copy (lib/stayLocation.ts) — falls back to the previous generic
   *  message if not provided. */
  emptyStateMessage?: string;
  /** Forwarded to the stays API purely to label a matched Google result "exact" /
   *  "nearby" / "access-base" for reporting — never loosens the location-safety filter
   *  itself (see lib/placeLocationSafety.ts). */
  stayMode?: 'destination' | 'nearby' | 'access-base';
  /** Scopes both the Google Places fetch and curated matching to a single stay type —
   *  used by /stays/[destination]/[type] combined listing pages, where the whole page
   *  is already about one category. Forwarding it narrows the API's own Google fetch
   *  to that one category too (see app/api/destinations/route.ts's `stayType` param),
   *  which is strictly less Google discovery than fetching all 6 and discarding 5.
   *  When set, the all/type toggle chips are hidden — there's only one type to show. */
  stayTypeFilter?: StayType;
}

export default function StaysGrid({ location, state, curatedStays = [], destinationSlug, emptyStateMessage, stayMode, stayTypeFilter }: StaysGridProps) {
  const [googleStays, setGoogleStays] = useState<Stay[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeType, setActiveType] = useState<StayType | 'all'>(stayTypeFilter ?? 'all');

  const curatedAsStays = useMemo(() => curatedStays.map((hotel) => hotelToStay(hotel, destinationSlug)), [curatedStays, destinationSlug]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    const stayModeParam = stayMode ? `&stayMode=${encodeURIComponent(stayMode)}` : '';
    const destinationSlugParam = destinationSlug ? `&destinationSlug=${encodeURIComponent(destinationSlug)}` : '';
    const stayTypeParam = stayTypeFilter ? `&stayType=${encodeURIComponent(stayTypeFilter)}` : '';
    fetch(`/api/destinations?type=stays&location=${encodeURIComponent(location)}${stateParam}${stayModeParam}${destinationSlugParam}${stayTypeParam}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((data: { stays: Stay[] }) => {
        if (cancelled) return;
        setGoogleStays(data.stays ?? []);
        setStatus('ready');
      })
      .catch((error) => {
        console.error('Failed to load stays', error);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [location, state, stayMode, destinationSlug, stayTypeFilter]);

  // publiclyListed curated stays render immediately without waiting on the Google
  // Places round trip — they're already-verified data, not something that should be
  // hidden behind a loading skeleton just because a supplementary source is slow or
  // unavailable (e.g. production has no GOOGLE_PLACES_API_KEY configured today).
  const stays = status === 'ready' ? [...curatedAsStays, ...dedupeAgainstCurated(curatedAsStays, googleStays)] : curatedAsStays;

  const visibleStays = activeType === 'all' ? stays : stays.filter((stay) => stay.stayType === activeType);
  const availableTypes = STAY_TYPES.filter((stayType) => stays.some((stay) => stay.stayType === stayType));

  if (status === 'loading' && curatedAsStays.length === 0) {
    return <SkeletonGrid count={6} className="sm:grid-cols-2 xl:grid-cols-3" />;
  }

  if (status === 'error' && curatedAsStays.length === 0) {
    return <p className="text-sm text-slate-500">We couldn't load live stays right now — please check back shortly.</p>;
  }

  if (stays.length === 0) {
    return <p className="text-sm text-slate-500">{emptyStateMessage ?? `No stays found near ${location} yet.`}</p>;
  }

  return (
    // This section runs much taller than a typical fade-in block (a full hotel grid,
    // often several rows), so the shared `viewportOnce` 30%-visible threshold can
    // require scrolling deep into it before it's ever satisfied — on shorter viewports
    // that never happens naturally, leaving the grid stuck at opacity: 0. `amount: 0`
    // triggers as soon as any part of it enters the viewport, same fade/once behavior
    // otherwise. Scoped to this component only — lib/motion.ts's viewportOnce (used
    // elsewhere) is untouched.
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0 }} variants={fadeInUp}>
      {stayTypeFilter ? null : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveType('all')}
            className={cn(
              'cursor-hover rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out',
              activeType === 'all' ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            )}
          >
            All Stays
          </button>
          {availableTypes.map((stayType) => (
            <button
              key={stayType}
              type="button"
              onClick={() => setActiveType(stayType)}
              className={cn(
                'cursor-hover rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out',
                activeType === stayType ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              )}
            >
              {STAY_TYPE_LABELS[stayType]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visibleStays.map((stay, index) => (
          <StayCard key={`${stay.placeId}-${index}`} stay={stay} priority={index < 4} />
        ))}
      </div>
    </motion.div>
  );
}

// Exported so server-rendered catalog/search listings can render the exact same card
// (safe photo fallback, honest "Contact for pricing", Google attribution) rather than
// a second, divergent card template.
// Google-backed stays have a real, canonical detail page (/stays/property/<placeId>
// — see app/stays/[...segments]/page.tsx's getStayByPlaceId); curated stays reuse the
// existing curated Hotel detail page at /stays/<hotel-slug>. `stay.placeId` for a
// curated Stay is `curated:${hotel.slug}` (see lib/stayMerge.ts's hotelToStay), which
// isn't a resolvable route on its own, so the two sources need different hrefs.
function stayDetailHref(stay: Stay): string {
  return stay.source === 'google' ? `/stays/property/${stay.placeId}` : `/stays/${stay.slug}`;
}

// Phase P2A — slot-appropriate widths for this card's own two photo slots, rewritten
// onto whatever `w` a stored/mock photo URL already carries (see lib/placePhotoUrl.ts's
// own doc comment on why this happens at render time, not at discovery time). Each
// value gives roughly 1.8–3x headroom over the slot's CSS pixel size for a sharp look
// on standard-to-high-DPR phones, while still cutting the byte count dramatically
// versus the previous flat 1200px request for every slot regardless of size.
const CARD_PHOTO_WIDTH_PX = 640; // main photo slot: h-48 tall, up to 360px wide (see `sizes` below)
const CARD_THUMBNAIL_WIDTH_PX = 192; // secondary thumbnail slot: h-14 w-14 (56x56px)

export function StayCard({ stay, priority = false }: { stay: Stay; priority?: boolean }) {
  const href = stayDetailHref(stay);

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1">
      {/* Only the image + name are inside the Link — WhatsAppEnquireButton below is a
          <button>, and interactive content must never nest inside an <a> (HTML5's
          content model forbids it, and it breaks keyboard/screen-reader navigation). */}
      <Link href={href} className="cursor-hover block">
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <span className="absolute left-3 top-3 z-10 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold text-white">
            {STAY_TYPE_LABELS[stay.stayType]}
          </span>
          {stay.rating ? (
            <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#0a0a0a]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {stay.rating.toFixed(1)}
              {stay.userRatingCount ? <span className="text-slate-300"> ({stay.userRatingCount})</span> : null}
              {/* Provenance disclosure — see AGENTS.md Phase C section 22: never imply The
                  Apex Voyager verified a rating that actually came from Google. */}
              {stay.source === 'google' ? <span className="text-slate-300"> · Google</span> : null}
            </span>
          ) : null}
          {stay.photos[0] ? (
            <SafeImage
              src={withPhotoWidth(stay.photos[0], CARD_PHOTO_WIDTH_PX)}
              alt={stay.name}
              fill
              sizes="(min-width: 1280px) 360px, 90vw"
              className="object-cover"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-600">No photo available</div>
          )}
        </div>

        <div className="space-y-3 p-5 pb-0">
          <h3 className="text-lg font-bold text-slate-900">{stay.name}</h3>
          {stay.formattedAddress ? (
            <p className="flex items-center gap-1.5 truncate text-sm text-slate-500">
              <MapPin size={14} className="shrink-0 text-apex-600" />
              <span className="truncate">{stay.formattedAddress}</span>
            </p>
          ) : null}

          {stay.photos.length > 1 ? (
            <div className="flex gap-1.5">
              {stay.photos.slice(1, 4).map((photo, index) => (
                <span key={photo} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                  <SafeImage src={withPhotoWidth(photo, CARD_THUMBNAIL_WIDTH_PX)} alt={`${stay.name} photo ${index + 2}`} fill sizes="40px" className="object-cover" />
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="space-y-3 p-5 pt-3">
        <div className="flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Starting from</p>
            <p className="text-md font-bold text-slate-900">
              {stay.customPrice ? `₹${stay.customPrice.toLocaleString('en-IN')} / night` : 'Contact for pricing'}
            </p>
          </div>
          <WhatsAppEnquireButton
            selection={{
              name: stay.name,
              type: 'stay',
              stayType: stay.stayType,
              slug: stay.slug,
              destinationSlug: stay.destinationSlug,
              location: stay.formattedAddress,
              url: `${siteConfig.url}${href}`
            }}
          />
        </div>
      </div>
    </article>
  );
}
