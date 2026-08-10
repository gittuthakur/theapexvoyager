'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SafeImageProps = Omit<ImageProps, 'onError'>;

/** Drops in for next/image; on a failed load (e.g. a 404) it swaps to a themed placeholder instead of a broken-image icon. */
export function SafeImage({ alt, className, fill, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-600',
          fill ? 'absolute inset-0' : className
        )}
      >
        <ImageOff size={28} aria-hidden="true" />
      </div>
    );
  }

  return <Image {...props} alt={alt} fill={fill} className={className} onError={() => setFailed(true)} />;
}
