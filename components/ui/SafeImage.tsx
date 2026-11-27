'use client';

import { useState, type RefCallback } from 'react';
import Image, { type ImageProps } from 'next/image';
import { PhotoFallback } from '@/components/ui/PhotoFallback';

export type SafeImageProps = Omit<ImageProps, 'onError'> & {
  /**
   * What to show when the image cannot be loaded.
   *  - 'branded' (default): the Apex Voyager photo-unavailable panel, in the image's own space.
   *  - 'hidden': render nothing, so the caller can drop that slot (thumbnails, gallery items) instead of showing
   *    several identical placeholders in a row.
   */
  fallback?: 'branded' | 'hidden';
  /** Called once when the image fails, so a parent can remove the slot or promote another photo. */
  onFail?: () => void;
  /** Visible message inside the branded panel. */
  fallbackMessage?: string;
};

/**
 * Drops in for next/image. A failed load (404, 502, an expired Google photo reference, a network error) never shows a
 * broken-image icon or an empty box: it becomes the branded panel, or nothing at all when `fallback="hidden"`.
 *
 * It also catches an image that had ALREADY failed before this component became interactive: a server-rendered <img>
 * can error before React attaches its handler, and that early error would otherwise be missed.
 */
export function SafeImage({ alt, className, fill, unoptimized, src, fallback = 'branded', onFail, fallbackMessage, ...props }: SafeImageProps) {
  // Keyed by source, so a new `src` (e.g. the gallery moving to another photo) starts fresh instead of staying failed.
  const sourceKey = typeof src === 'string' ? src : JSON.stringify(src);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === sourceKey;

  function markFailed() {
    setFailedSource(sourceKey);
    onFail?.();
  }

  // A slot this small (an avatar, a tiny thumbnail) only has room for the mark, not the text.
  const smallSlot = typeof props.sizes === 'string' && /^\s*\d+px\s*$/.test(props.sizes) && parseInt(props.sizes, 10) <= 128;

  // Bytes behind /api/places/photo are already-compressed JPEGs proxied straight from
  // Google — running them through Next's image optimizer (an extra sharp re-encode on
  // the server, per unique width) adds latency and CPU for an image that isn't getting
  // any smaller or sharper. Callers can still force it back on via an explicit prop.
  const isPlacesProxyPhoto = typeof src === 'string' && src.startsWith('/api/places/photo');

  const checkAlreadyFailed: RefCallback<HTMLImageElement> = (image) => {
    // `complete` with no pixels means the load already ended in an error (a still-loading or lazy image is not complete).
    if (image && image.complete && image.naturalWidth === 0 && image.currentSrc !== '') markFailed();
  };

  if (failed) {
    if (fallback === 'hidden') return null;
    return <PhotoFallback fill={fill} className={className} label={alt ? `Photo of ${alt} unavailable` : undefined} message={fallbackMessage ?? 'Photo unavailable'} compact={smallSlot} />;
  }

  return (
    <Image
      {...props}
      ref={checkAlreadyFailed}
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized={unoptimized ?? isPlacesProxyPhoto}
      onError={markFailed}
    />
  );
}
