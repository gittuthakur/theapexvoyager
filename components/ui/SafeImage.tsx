'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SafeImageProps = Omit<ImageProps, 'onError'>;

/** Drops in for next/image; on a failed load (e.g. a 404) it swaps to a themed placeholder instead of a broken-image icon. */
export function SafeImage({ alt, className, fill, unoptimized, src, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  // Bytes behind /api/places/photo are already-compressed JPEGs proxied straight from
  // Google — running them through Next's image optimizer (an extra sharp re-encode on
  // the server, per unique width) adds latency and CPU for an image that isn't getting
  // any smaller or sharper. Callers can still force it back on via an explicit prop.
  const isPlacesProxyPhoto = typeof src === 'string' && src.startsWith('/api/places/photo');

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400',
          fill ? 'absolute inset-0' : className
        )}
      >
        <ImageOff size={28} aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized={unoptimized ?? isPlacesProxyPhoto}
      onError={() => setFailed(true)}
    />
  );
}
