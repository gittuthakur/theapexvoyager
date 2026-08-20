'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { markInternalNavigation } from '@/lib/navigationHistory';

// Renders nothing — mounted once in the root layout purely so BackButton can tell
// "the user actually navigated within the app" apart from "this is the first page
// load in this tab" (a direct URL, refresh, or new tab). The very first pathname this
// effect sees is the page the tab loaded on, not a navigation, so only later changes count.
//
// Compares the actual pathname VALUE across renders rather than a "have I run before"
// boolean ref — React 18 Strict Mode deliberately double-invokes effects once on mount
// in development to surface missing cleanup, which would flip a boolean flag on the
// very first load and wrongly mark it as a navigation. Comparing values is immune to
// that: both mount invocations see the same (unchanged) pathname, so neither counts.
export default function NavigationTracker() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      markInternalNavigation();
    }
    previousPathname.current = pathname;
  }, [pathname]);

  return null;
}
