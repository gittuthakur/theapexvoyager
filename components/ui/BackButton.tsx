'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasInternalNavigationHistory } from '@/lib/navigationHistory';

export interface BackButtonProps {
  /** Where to go when there's no real navigation history to go back to (a direct URL open, refresh, or new tab) — the nearest parent in the existing route hierarchy. */
  fallbackHref: string;
  label: string;
  className?: string;
}

// Same visual treatment as the "Back to X" links this replaces across detail pages,
// but actually respects browser history instead of always landing on one fixed route.
// `window.history.length` looks like the obvious "has the user navigated" check, but it
// isn't reliable (some browsers/embeddings already report > 1 on a fresh direct load) —
// hasInternalNavigationHistory() tracks real in-app route changes instead (see
// lib/navigationHistory.ts + components/NavigationTracker.tsx).
export default function BackButton({ fallbackHref, label, className }: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (hasInternalNavigationHistory()) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors duration-300 ease-in-out hover:text-slate-900',
        className
      )}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
