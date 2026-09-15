'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';

export interface PropertyPhotoGalleryProps {
  /** Every URL here must already belong to this one property's own Google Place ID —
   *  callers must never mix in a destination image or another property's photo (see
   *  lib/stays.ts's getStayByPlaceId, which only ever returns one place's own
   *  `photos[]`, sourced identically to every other Stay card in the app). */
  photos: string[];
  propertyName: string;
}

// Main hero photo + thumbnail row, both clickable, opening a full accessible
// lightbox. Photos already live in `photos` (URLs only — cheap strings, not bytes) by
// the time this component mounts, but no *image byte* is requested until something is
// actually rendered on screen: the hero and the first few thumbnails load immediately
// (same as any grid card), while the lightbox's own <img> only ever mounts the
// CURRENTLY active slide (plus its immediate neighbors, for a smooth prev/next
// transition) — never all N photos at once — so opening the gallery costs at most a
// couple of additional Google Photo Media requests, not a bulk download of the whole
// gallery. Every request still hits the existing 30-day-cached /api/places/photo proxy.
export function PropertyPhotoGallery({ photos, propertyName }: PropertyPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 sm:h-96">
        <div className="flex flex-col items-center gap-2">
          <ImageOff size={32} aria-hidden="true" />
          <span className="text-sm font-medium">Photo unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxIndex(0)}
        className="cursor-hover relative block h-72 w-full overflow-hidden rounded-[1.75rem] border border-slate-200 sm:h-96"
        aria-label={`Open photo gallery for ${propertyName}`}
      >
        <SafeImage src={photos[0]} alt={propertyName} fill sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" priority />
      </button>

      {photos.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.slice(1, 7).map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setLightboxIndex(index + 1)}
              className="cursor-hover relative h-16 overflow-hidden rounded-xl border border-slate-200 sm:h-20"
              aria-label={`View photo ${index + 2} of ${photos.length} for ${propertyName}`}
            >
              <SafeImage src={photo} alt={`${propertyName} photo ${index + 2}`} fill sizes="120px" className="object-cover" />
              {index === 5 && photos.length > 7 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                  +{photos.length - 7}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <Lightbox photos={photos} propertyName={propertyName} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      ) : null}
    </div>
  );
}

function Lightbox({
  photos,
  propertyName,
  initialIndex,
  onClose
}: {
  photos: string[];
  propertyName: string;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const goPrev = useCallback(() => setIndex((current) => (current - 1 + photos.length) % photos.length), [photos.length]);
  const goNext = useCallback(() => setIndex((current) => (current + 1) % photos.length), [photos.length]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Only the active slide (plus its immediate neighbors, for an instant prev/next
  // transition) is ever mounted — see this file's top comment on photo-request cost.
  const shouldMount = (photoIndex: number) => Math.abs(photoIndex - index) <= 1 || (index === 0 && photoIndex === photos.length - 1) || (index === photos.length - 1 && photoIndex === 0);

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
          {index + 1} / {photos.length}
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
                alt={`${propertyName} photo ${photoIndex + 1} of ${photos.length}`}
                fill
                sizes="100vw"
                className={cn('object-contain transition-opacity duration-200', photoIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none')}
                priority={photoIndex === index}
              />
            ) : null
          )}
        </div>

        {photos.length > 1 ? (
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
