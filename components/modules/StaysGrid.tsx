'use client';

import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { withPhotoWidth } from '@/lib/placePhotoUrl';
import { GoogleMapsButton } from '@/components/ui/GoogleMapsButton';
import { GoogleMapsAttribution } from '@/components/ui/GoogleMapsAttribution';
import { buildGoogleMapsUrl } from '@/lib/googleMapsLink';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/motion';
import { hotelToStay, dedupeAgainstCurated } from '@/lib/stayMerge';
import {
  STAYS_BATCH_SIZE,
  dedupeByPlaceId,
  effectiveVisibleCount,
  hasMore,
  nextVisibleCount,
  resolveGridPhase,
  showingLabel,
  type PagingState
} from '@/lib/stayListPaging';
import { STAY_TYPES, STAY_TYPE_LABELS, type Stay, type StayType } from '@/types/stay';
import type { HotelPackage } from '@/types/hotel';

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
  // Bumped on every successful load so a replaced dataset can never inherit a count earned on the previous one.
  const [dataVersion, setDataVersion] = useState(0);
  // Bumped on every filter change, so returning to a filter the visitor already expanded still starts from one batch.
  const [filterEpoch, setFilterEpoch] = useState(0);
  const [paging, setPaging] = useState<PagingState>({ key: '', count: STAYS_BATCH_SIZE });
  // Tagged with the destination/dataset it was made for, so it is dropped (not re-read) once that context changes.
  const [announcement, setAnnouncement] = useState<{ context: string; text: string }>({ context: '', text: '' });
  const statusLineRef = useRef<HTMLParagraphElement>(null);
  const focusStatusLine = useRef(false);

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
        setDataVersion((version) => version + 1);
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
  // unavailable (e.g. the stays API is rate limited or temporarily unavailable because the
  // owner-exclusion list could not be read, or no Google-sourced stays are cached yet).
  const stays = useMemo(
    () => dedupeByPlaceId(status === 'ready' ? [...curatedAsStays, ...dedupeAgainstCurated(curatedAsStays, googleStays)] : curatedAsStays),
    [status, curatedAsStays, googleStays]
  );

  // The full eligible set is filtered FIRST; only then is the result sliced for display.
  const matchingStays = useMemo(() => (activeType === 'all' ? stays : stays.filter((stay) => stay.stayType === activeType)), [stays, activeType]);
  const availableTypes = STAY_TYPES.filter((stayType) => stays.some((stay) => stay.stayType === stayType));

  // Anything that changes what the grid shows (destination, filters, a replaced dataset, the status flip that adds the
  // live results behind the curated ones) invalidates the revealed count, which then falls back to one batch.
  const pagingKey = [location, state ?? '', destinationSlug ?? '', stayMode ?? '', stayTypeFilter ?? '', activeType, filterEpoch, dataVersion, status].join('|');
  const visibleCount = effectiveVisibleCount(paging, pagingKey, matchingStays.length);
  const announcementContext = [location, state ?? '', destinationSlug ?? '', stayMode ?? '', stayTypeFilter ?? '', dataVersion].join('|');

  // When the last batch is revealed the button unmounts; hand focus to the count line so keyboard focus is not dropped.
  const allShown = !hasMore(visibleCount, matchingStays.length);
  useEffect(() => {
    if (allShown && focusStatusLine.current) {
      focusStatusLine.current = false;
      statusLineRef.current?.focus();
    }
  }, [allShown, visibleCount]);

  const phase = resolveGridPhase(status, curatedAsStays.length, stays.length);

  if (phase === 'skeleton') {
    return <SkeletonGrid count={6} className="sm:grid-cols-2 xl:grid-cols-3" />;
  }

  if (phase === 'error') {
    return <p className="text-sm text-slate-500">We couldn&apos;t load live stays right now — please check back shortly.</p>;
  }

  if (phase === 'empty') {
    return <p className="text-sm text-slate-500">{emptyStateMessage ?? `No stays found near ${location} yet.`}</p>;
  }

  function selectType(next: StayType | 'all') {
    if (next === activeType) return;
    const total = next === 'all' ? stays.length : stays.filter((stay) => stay.stayType === next).length;
    focusStatusLine.current = false;
    setActiveType(next);
    setFilterEpoch((epoch) => epoch + 1);
    setAnnouncement({ context: announcementContext, text: total > STAYS_BATCH_SIZE ? showingLabel(Math.min(STAYS_BATCH_SIZE, total), total) : '' });
  }

  function loadMore() {
    const next = nextVisibleCount(visibleCount, matchingStays.length);
    focusStatusLine.current = next >= matchingStays.length;
    setPaging({ key: pagingKey, count: next });
    setAnnouncement({ context: announcementContext, text: showingLabel(next, matchingStays.length) });
  }

  return (
    <StaysGridView
      stays={matchingStays}
      visibleCount={visibleCount}
      activeType={activeType}
      availableTypes={availableTypes}
      showTypeChips={!stayTypeFilter}
      announcement={announcement.context === announcementContext ? announcement.text : ''}
      statusLineRef={statusLineRef}
      onSelectType={selectType}
      onLoadMore={loadMore}
    />
  );
}

export interface StaysGridViewProps {
  /** Every stay matching the active filter, in display order. Only the first `visibleCount` are rendered. */
  stays: Stay[];
  visibleCount: number;
  activeType: StayType | 'all';
  availableTypes: StayType[];
  showTypeChips: boolean;
  /** Text for the polite live region. Empty until the visitor acts, so nothing is announced on first render. */
  announcement: string;
  statusLineRef?: Ref<HTMLParagraphElement>;
  onSelectType: (type: StayType | 'all') => void;
  onLoadMore: () => void;
}

// Presentational half of StaysGrid, exported so the rendering rules can be tested against the real markup.
export function StaysGridView({ stays, visibleCount, activeType, availableTypes, showTypeChips, announcement, statusLineRef, onSelectType, onLoadMore }: StaysGridViewProps) {
  const total = stays.length;
  const shown = Math.min(visibleCount, total);
  const paged = total > STAYS_BATCH_SIZE;

  return (
    // This section runs much taller than a typical fade-in block (a full hotel grid,
    // often several rows), so the shared `viewportOnce` 30%-visible threshold can
    // require scrolling deep into it before it's ever satisfied — on shorter viewports
    // that never happens naturally, leaving the grid stuck at opacity: 0. `amount: 0`
    // triggers as soon as any part of it enters the viewport, same fade/once behavior
    // otherwise. Scoped to this component only — lib/motion.ts's viewportOnce (used
    // elsewhere) is untouched.
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0 }} variants={fadeInUp}>
      {showTypeChips ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectType('all')}
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
              onClick={() => onSelectType(stayType)}
              className={cn(
                'cursor-hover rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out',
                activeType === stayType ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              )}
            >
              {STAY_TYPE_LABELS[stayType]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {stays.slice(0, shown).map((stay, index) => (
          <StayCard key={`${stay.placeId}-${index}`} stay={stay} priority={index < 4} />
        ))}
      </div>

      {paged ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p ref={statusLineRef} tabIndex={-1} data-stays-count className="text-sm text-slate-600 outline-none">
            {showingLabel(shown, total)}
          </p>
          {shown < total ? (
            <button
              type="button"
              onClick={onLoadMore}
              className="cursor-hover min-h-11 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-apex-500 hover:text-apex-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
            >
              Load more stays
            </button>
          ) : null}
        </div>
      ) : null}
      {/* Polite, and only ever filled by an explicit visitor action, so it is never announced on load or re-announced by re-renders. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-stays-live>
        {announcement}
      </div>
    </motion.div>
  );
}

// Exported so server-rendered catalog/search listings can render the exact same card
// (safe photo fallback, honest "View on Google Maps" action, Google attribution) rather
// than a second, divergent card template.
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
  // `stay.placeId` is only a real Google Place ID when `source === 'google'` — a curated
  // Stay's `placeId` is the synthetic `curated:${slug}` key (lib/stayMerge.ts's
  // hotelToStay), never a real one to build a Maps link from.
  const mapsUrl = buildGoogleMapsUrl({ googleMapsUri: stay.googleMapsUri, placeId: stay.source === 'google' ? stay.placeId : undefined });

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1">
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
              {/* Provenance (AGENTS.md Phase C section 22: never imply The Apex Voyager verified a rating that actually
                  came from Google) is carried by this card's single GoogleMapsAttribution below, so the old
                  " · Google" suffix here would be a second, duplicate Google label on the same card. */}
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

      <div className="space-y-2 p-5 pt-3">
        <GoogleMapsButton url={mapsUrl} fullWidth />
        {/* The "sourced from Google" attribution is about THIS CARD'S OWN displayed
            name/address/photos, not about whether a Maps link exists — a curated Stay's
            content is The Apex Voyager India's own catalog data even when it also has a
            real Google Maps link, so this only ever shows for a genuinely
            Google-sourced record (source === 'google'). */}
        {mapsUrl && stay.source === 'google' ? <GoogleMapsAttribution variant="card" prefix="Property information sourced from" /> : null}
      </div>
    </article>
  );
}
