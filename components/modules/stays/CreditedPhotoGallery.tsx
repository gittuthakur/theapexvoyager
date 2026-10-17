'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { PhotoCredit } from '@/components/modules/stays/PhotoCredit';
import { FOCUSABLE_SELECTOR, SWIPE_THRESHOLD_PX, announceSlide, createFocusRestorer, handleLightboxKeyDown, nearbyIndexes, swipeDirection, wrapIndex, type Point } from '@/components/modules/stays/lightboxLogic';
import { withPhotoWidth } from '@/lib/placePhotoUrl';
import type { CreditedGalleryPhoto } from '@/lib/stayPhotoGallery';
import { cn } from '@/lib/utils';

/**
 * The credited Google photo gallery (D1-3b). Used ONLY when GOOGLE_PHOTO_METADATA_MODE=fresh (see
 * components/modules/stays/StayPhotoSection.tsx); the default site keeps using PropertyPhotoGallery unchanged.
 *
 * Every photo here arrives with its genuine credit and a photo-specific Google Maps link (photos without them were
 * already hidden on the server), so every photo that is shown is credited. The hero carries its credit in a caption
 * directly underneath; thumbnails carry none (Google allows that when the larger view shows the full credit), and the
 * full-screen lightbox shows the credit for the current slide. The component makes no network request of its own: the
 * images are the existing protected /api/places/photo URLs, and nothing is stored.
 */
export interface CreditedPhotoGalleryProps {
  photos: CreditedGalleryPhoto[];
  propertyName: string;
}

const THUMBNAIL_WIDTH_PX = 192;
const MAX_THUMBNAILS = 6;

export function CreditedPhotoGallery({ photos, propertyName }: CreditedPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const active = photos[Math.min(activeIndex, photos.length - 1)];

  return (
    <section aria-label={`Photos of ${propertyName}`} className="min-w-0 max-w-full">
      <figure className="m-0 min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setLightboxIndex(Math.min(activeIndex, photos.length - 1))}
          className="cursor-hover relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-apex-600 sm:aspect-[16/9] lg:aspect-auto lg:h-[26rem]"
          aria-label={`Open the full-screen gallery for ${propertyName}, photo ${activeIndex + 1} of ${photos.length}`}
        >
          <SafeImage key={active.src} src={active.src} alt={`${propertyName}, photo ${activeIndex + 1} of ${photos.length}`} fill sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" priority />
        </button>
        <figcaption className="border-t border-slate-200 bg-slate-50 px-4 py-2 sm:px-5">
          <PhotoCredit photo={active} tone="light" />
        </figcaption>
      </figure>

      {photos.length > 1 ? (
        <div className="mt-3 flex min-w-0 max-w-full flex-col gap-3">
          <ul className="grid min-w-0 grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Choose a photo">
            {photos.slice(0, MAX_THUMBNAILS).map((photo, index) => (
              <li key={photo.src} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  aria-label={`Show photo ${index + 1} of ${photos.length}`}
                  className={cn(
                    'cursor-hover relative block h-16 w-full overflow-hidden rounded-xl border-2 sm:h-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-600',
                    index === activeIndex ? 'border-apex-600' : 'border-slate-200'
                  )}
                >
                  <SafeImage src={withPhotoWidth(photo.src, THUMBNAIL_WIDTH_PX)} alt="" fill sizes="120px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setLightboxIndex(Math.min(activeIndex, photos.length - 1))}
            className="cursor-hover inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-apex-500 hover:text-apex-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-600"
          >
            <Images size={16} aria-hidden="true" />
            View all {photos.length} photos
          </button>
        </div>
      ) : null}

      {lightboxIndex !== null ? <CreditedLightbox photos={photos} propertyName={propertyName} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} /> : null}
    </section>
  );
}

export interface CreditedLightboxProps {
  photos: CreditedGalleryPhoto[];
  propertyName: string;
  initialIndex: number;
  onClose: () => void;
}

const ROUND_BUTTON =
  'cursor-hover inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:transition';

export function CreditedLightbox({ photos, propertyName, initialIndex, onClose }: CreditedLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<Point | null>(null);
  const count = photos.length;
  const current = photos[index];

  const goTo = useCallback((next: number) => setIndex(next), []);

  // Open: remember what had focus, move focus into the dialog, lock page scroll. Close: undo all three.
  useEffect(() => {
    const restoreFocus = createFocusRestorer(() => document.activeElement);
    closeButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      restoreFocus();
    };
  }, []);

  // Escape, arrow keys and the Tab focus trap (the logic lives in lightboxLogic.ts so it can be tested without a DOM).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
      handleLightboxKeyDown(event, { count, index, focusables, active: document.activeElement, onClose, onIndexChange: goTo });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [count, index, onClose, goTo]);

  function onTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = swipeStart.current;
    const touch = event.changedTouches[0];
    swipeStart.current = null;
    if (!start || !touch || count < 2) return;
    const direction = swipeDirection(start, { x: touch.clientX, y: touch.clientY }, SWIPE_THRESHOLD_PX);
    if (direction) goTo(wrapIndex(index, direction === 'next' ? 1 : -1, count));
  }

  const visible = nearbyIndexes(index, count);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${propertyName} photo gallery`}
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex max-w-full flex-col overflow-hidden bg-slate-950/95"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-6">
        <span className="text-sm font-medium text-white" aria-hidden="true">
          {index + 1} / {count}
        </span>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close photo gallery" className={ROUND_BUTTON}>
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Announces each slide change to screen readers (position, and who took the photo). */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announceSlide(
          index,
          count,
          current.authors.map((author) => author.displayName)
        )}
      </p>

      <div className="relative min-h-0 flex-1 px-2 sm:px-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="relative h-full w-full">
          {photos.map((photo, photoIndex) =>
            visible.includes(photoIndex) ? (
              <SafeImage
                key={photo.src}
                src={photo.src}
                alt={`${propertyName}, photo ${photoIndex + 1} of ${count}`}
                fill
                sizes="100vw"
                aria-hidden={photoIndex === index ? undefined : true}
                className={cn('object-contain motion-safe:transition-opacity motion-safe:duration-200', photoIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0')}
                priority={photoIndex === index}
              />
            ) : null
          )}
        </div>

        {count > 1 ? (
          <>
            <button type="button" onClick={() => goTo(wrapIndex(index, -1, count))} aria-label="Previous photo" className={cn(ROUND_BUTTON, 'absolute left-2 top-1/2 -translate-y-1/2 sm:left-4')}>
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => goTo(wrapIndex(index, 1, count))} aria-label="Next photo" className={cn(ROUND_BUTTON, 'absolute right-2 top-1/2 -translate-y-1/2 sm:right-4')}>
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {/* The credit for the CURRENT slide, below the image (never over it). A very long credit scrolls INSIDE the credit
          component, while the Google Maps logo stays pinned below the scrolling text, so it is always visible. */}
      <div className="flex max-h-[40vh] min-h-0 min-w-0 flex-col overflow-hidden border-t border-white/10 bg-slate-950 px-4 py-3 sm:px-6">
        <PhotoCredit photo={current} tone="dark" />
      </div>
    </div>
  );
}
