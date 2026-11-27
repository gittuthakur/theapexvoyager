import type { LucideIcon } from 'lucide-react';
import { Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhotoFallbackProps {
  /** Visible line under the brand mark, e.g. "Photo unavailable". Omit for the mark alone. */
  message?: string;
  /** The accessible name. Omit for a purely decorative panel (hidden from assistive technology). */
  label?: string;
  icon?: LucideIcon;
  fill?: boolean;
  className?: string;
  /** For very small slots (avatars, tiny thumbnails): the mark only, no text. */
  compact?: boolean;
}

/**
 * The branded "no photo to show" panel, used wherever a photo is missing or failed to load (stay cards, galleries,
 * destination and property cards).
 *
 * It is deliberately NOT a picture of anything: a soft panel, the Apex Voyager mark and a plain-words message. It is
 * a <div>, never an <img>, so it carries no image URL, alt text or dimensions that a crawler, social preview or
 * structured-data builder could mistake for a genuine photograph of the property. Nothing in this repository may use
 * it as an Open Graph or JSON-LD image (see components/ui/PhotoFallback.test.tsx).
 */
export function PhotoFallback({ message, label, icon: Icon = Mountain, fill, className, compact }: PhotoFallbackProps) {
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-photo-fallback=""
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 px-3 text-center',
        fill ? 'absolute inset-0' : className
      )}
    >
      <Icon size={compact ? 18 : 26} strokeWidth={1.6} className="text-apex-500/70" aria-hidden="true" />
      {compact ? null : <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">The Apex Voyager</span>}
      {message && !compact ? <span className="text-xs font-medium text-slate-600">{message}</span> : null}
    </div>
  );
}
