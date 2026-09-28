import { MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GoogleMapsButtonProps {
  /** A real URL only — build it with lib/googleMapsLink.ts's buildGoogleMapsUrl, never a
   *  string assembled ad hoc at the call site. `undefined` renders nothing at all rather
   *  than a broken/placeholder link. */
  url?: string;
  className?: string;
  fullWidth?: boolean;
}

/** THE one "View on Google Maps" button every Stay surface renders — a shared component
 *  so the label, icon, safe `target`/`rel`, and focus-visible styling can never drift
 *  between cards and detail pages. Never renders any other label or behavior. */
export function GoogleMapsButton({ url, className, fullWidth }: GoogleMapsButtonProps) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'cursor-hover inline-flex items-center justify-center gap-1.5 rounded-full border border-apex-300 px-4 py-2.5 text-sm font-semibold text-apex-600 transition hover:border-apex-500 hover:bg-apex-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500',
        fullWidth ? 'w-full sm:w-auto' : '',
        className
      )}
    >
      <MapPin size={14} className="shrink-0" />
      <span>View on Google Maps</span>
      <ExternalLink size={12} className="shrink-0" />
    </a>
  );
}
