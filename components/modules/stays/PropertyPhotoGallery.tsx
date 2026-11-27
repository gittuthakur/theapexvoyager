'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { PhotoFallback } from '@/components/ui/PhotoFallback';
import { cn } from '@/lib/utils';

export interface PropertyPhotoGalleryProps {
  /** Every URL here must already belong to this one property's own Google Place ID —
   *  callers must never mix in a destination image or another property's photo (see
   *  lib/stays.ts's getStayByPlaceId, which only ever returns one place's own
   *  `photos[]`, sourced identically to every other Stay card in the app). */
  photos: string[];
  propertyName: string;
}

const EMPTY_PANEL_CLASS = 'h-72 w-full rounded-[1.75rem] border border-slate-200 sm:h-96';

// Main hero photo + thumbnail row, both clickable, opening a full accessible
// lightbox. Photos already live in `photos` (URLs only — cheap strings, not bytes) by
// the time this component mounts, but no *image byte* is requested until something is
// actually rendered on screen: the hero and the first few thumbnails load immediately
// (same as any grid card), while the lightbox's own <img> only ever mounts the
// CURRENTLY active slide (plus its immediate neighbors, for a smooth prev/next
// transition) — never all N photos at once — so opening the gallery costs at most a
// couple of additional Google Photo Media requests, not a bulk download of the whole
// gallery. Every request still hits the existing 30-day-cached /api/places/photo proxy.
//
// Photos that fail to load (an expired Google reference, a 502, a network error) are dropped: the next working photo
// becomes the hero, failed thumbnails disappear, and the lightbox only steps through photos that work. The branded
// panel appears only when no photo at all can be shown. Nothing here changes which photos are requested.
export function PropertyPhotoGallery({ photos, propertyName }: PropertyPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const markFailed = useCallback((photo: string) => setFailed((current) => new Set(current).add(photo)), []);
  const available = photos.filter((photo) => !failed.has(photo));

  if (photos.length === 0) {
    return <PhotoFallback className={EMPTY_PANEL_CLASS} label={`Photos of ${propertyName} unavailable`} message="Photo unavailable" />;
  }
  if (available.length === 0) {
    return <PhotoFallback className={EMPTY_PANEL_CLASS} label={`Photos of ${propertyName} unavailable`} message="Photos temporarily unavailable" />;
  }

  const hero = available[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxIndex(0)}
        className="cursor-hover relative block h-72 w-full overflow-hidden rounded-[1.75rem] border border-slate-200 sm:h-96"
        aria-label={`Open photo gallery for ${propertyName}`}
      >
        <SafeImage
          key={hero}
          src={hero}
          alt={propertyName}
          fill
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-cover"
          priority
          fallback="hidden"
          onFail={() => markFailed(hero)}
        />
      </button>

      {available.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {available.slice(1, 7).map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setLightboxIndex(index + 1)}
              className="cursor-hover relative h-16 overflow-hidden rounded-xl border border-slate-200 sm:h-20"
              aria-label={`View photo ${index + 2} of ${available.length} for ${propertyName}`}
            >
              <SafeImage
                src={photo}
                alt={`${propertyName} photo ${index + 2}`}
                fill
                sizes="120px"
                className="object-cover"
                fallback="hidden"
                onFail={() => markFailed(photo)}
              />
              {index === 5 && available.length > 7 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                  +{available.length - 7}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <Lightbox
          photos={available}
          propertyName={propertyName}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPhotoFail={markFailed}
        />
      ) : null}
    </div>
  );
}

function Lightbox({
  photos,
  propertyName,
  initialIndex,
  onClose,
  onPhotoFail
}: {
  photos: string[];
  propertyName: string;
  initialIndex: number;
  onClose: () => void;
  onPhotoFail: (photo: string) => void;
}) {
  const [requestedIndex, setIndex] = useState(initialIndex);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const count = photos.length;
  // A photo that fails inside the lightbox is removed from `photos`, so the position can fall off the end: clamp it.
  const index = Math.min(requestedIndex, Math.max(0, count - 1));

  const goPrev = useCallback(() => setIndex((current) => (Math.min(current, count - 1) - 1 + count) % count), [count]);
  const goNext = useCallback(() => setIndex((current) => (Math.min(current, count - 1) + 1) % count), [count]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (count > 0 && event.key === 'ArrowLeft') goPrev();
      if (count > 0 && event.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext, count]);

  // If every photo has failed there is nothing left to show: close rather than leave an empty dialog.
  useEffect(() => {
    if (count === 0) onClose();
  }, [count, onClose]);

  // Only the active slide (plus its immediate neighbors, for an instant prev/next
  // transition) is ever mounted — see this file's top comment on photo-request cost.
  const shouldMount = (photoIndex: number) => Math.abs(photoIndex - index) <= 1 || (index === 0 && photoIndex === count - 1) || (index === count - 1 && photoIndex === 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${propertyName} photo gallery`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm font-medium text-white/80">
          {index + 1} / {count}
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close photo gallery"
          className="cursor-hover rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative flex-1 px-2 pb-4 sm:px-4">
        <div className="relative h-full w-full">
          {photos.map((photo, photoIndex) =>
            shouldMount(photoIndex) ? (
              <SafeImage
                key={photo}
                src={photo}
                alt={`${propertyName} photo ${photoIndex + 1} of ${count}`}
                fill
                sizes="100vw"
                className={cn('object-contain transition-opacity duration-200', photoIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none')}
                priority={photoIndex === index}
                fallback="hidden"
                onFail={() => onPhotoFail(photo)}
              />
            ) : null
          )}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="cursor-hover absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-4 sm:p-3"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="cursor-hover absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4 sm:p-3"
            >
              <ChevronRight size={24} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
