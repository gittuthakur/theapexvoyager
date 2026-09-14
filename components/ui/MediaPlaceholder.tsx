import type { LucideIcon } from 'lucide-react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaPlaceholderProps {
  /** Shown as visible text under the icon (e.g. a destination name) — omit for an
   *  icon-only placeholder. Always present as the element's accessible name either way. */
  label?: string;
  icon?: LucideIcon;
  fill?: boolean;
  className?: string;
}

/**
 * A neutral "no verified photo" state — a themed gradient plus icon, deliberately never
 * a substituted real photograph of something else. Used wherever a Destination or Stay
 * has no image whose subject can actually be confirmed, so the absence of a verified
 * photo is honestly visible instead of being papered over with an unrelated real one.
 * Visually mirrors SafeImage's own load-failure state for consistency.
 */
export function MediaPlaceholder({ label, icon: Icon = ImageOff, fill, className }: MediaPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label ?? 'Photo not available'}
      className={cn(
        'flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400',
        fill ? 'absolute inset-0' : className
      )}
    >
      <Icon size={28} aria-hidden="true" />
      {label ? (
        <span className="px-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      ) : null}
    </div>
  );
}
