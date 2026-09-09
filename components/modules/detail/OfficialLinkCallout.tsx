import { ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OfficialLinkCalloutProps {
  label: string;
  url: string;
  description?: string;
  /** Pre-formatted, e.g. "10 September 2026" — this component never computes or assumes one. */
  lastVerified?: string;
  className?: string;
}

/**
 * Generic outbound link to an external official authority (a government portal, a permit
 * office, a district advisory page — not specific to pilgrimage content). Always opens in a
 * new tab with safe `rel` attributes, always names the destination as external, and never
 * renders a status claim of its own — presence of a URL here is a pointer to where to check,
 * not a statement that anything is currently open, available or safe.
 */
export default function OfficialLinkCallout({ label, url, description, lastVerified, className }: OfficialLinkCalloutProps) {
  if (!url) return null;

  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <ShieldCheck size={14} className="text-apex-500" aria-hidden="true" />
          Official source
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{label}</p>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
        {lastVerified ? <p className="mt-2 text-xs text-slate-500">Last verified: {lastVerified}</p> : null}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`${label} — opens the official external website in a new tab`}
        className="cursor-hover inline-flex shrink-0 items-center gap-2 rounded-xl border border-apex-200 bg-white px-4 py-2.5 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:bg-apex-50"
      >
        Visit official site <ExternalLink size={15} aria-hidden="true" />
      </a>
    </div>
  );
}
