'use client';

import { useState, type ReactNode } from 'react';
import { SafeImage } from '@/components/ui/SafeImage';

export interface PhotoThumbnailsProps {
  /** The photo URLs, in display order. A failed one is removed; the rest keep their order. */
  photos: string[];
  /** Alt text for the photo at this position in `photos` (0-based, original order, unaffected by removals). */
  altFor: (index: number) => string;
  /** Optional per-photo URL rewrite (e.g. a smaller width for a thumbnail slot). */
  srcFor?: (photo: string) => string;
  sizes: string;
  /** Class for the wrapper around the whole row. */
  rowClassName?: string;
  /** Class for each thumbnail's own box. */
  itemClassName: string;
  children?: never;
}

/**
 * A row of thumbnails that shows only the photos that actually load. A photo that fails is dropped (no icon, no empty
 * box), and when none remain the whole row disappears, so a card with several unusable photos shows nothing extra
 * instead of a row of identical placeholders. The hero/main photo is handled separately and is never affected.
 */
export function PhotoThumbnails({ photos, altFor, srcFor, sizes, rowClassName, itemClassName }: PhotoThumbnailsProps): ReactNode {
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const visible = photos.map((photo, index) => ({ photo, index })).filter(({ photo }) => !failed.has(photo));
  if (visible.length === 0) return null;

  return (
    <div className={rowClassName}>
      {visible.map(({ photo, index }) => (
        <span key={photo} className={itemClassName}>
          <SafeImage
            src={srcFor ? srcFor(photo) : photo}
            alt={altFor(index)}
            fill
            sizes={sizes}
            className="object-cover"
            fallback="hidden"
            onFail={() => setFailed((current) => new Set(current).add(photo))}
          />
        </span>
      ))}
    </div>
  );
}
