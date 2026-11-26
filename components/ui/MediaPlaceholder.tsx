import type { LucideIcon } from 'lucide-react';
import { PhotoFallback } from '@/components/ui/PhotoFallback';

export interface MediaPlaceholderProps {
  /** Shown as visible text under the icon (e.g. a destination name) — omit for an
   *  icon-only placeholder. Always present as the element's accessible name either way. */
  label?: string;
  icon?: LucideIcon;
  fill?: boolean;
  className?: string;
}

/**
 * A neutral "no verified photo" state — deliberately never a substituted real photograph
 * of something else. Used wherever a Destination or Stay has no image whose subject can
 * actually be confirmed, so the absence of a verified photo is honestly visible instead
 * of being papered over with an unrelated real one.
 *
 * Shares its look with SafeImage's own load-failure state (PhotoFallback) so a photo that
 * was never available and a photo that failed to load read the same way.
 */
export function MediaPlaceholder({ label, icon, fill, className }: MediaPlaceholderProps) {
  return <PhotoFallback fill={fill} className={className} icon={icon} label={label ?? 'Photo not available'} message={label} />;
}
