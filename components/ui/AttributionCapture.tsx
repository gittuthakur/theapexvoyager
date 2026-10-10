'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttribution } from '@/lib/leadAttribution';

/** Renders nothing; records first-touch UTM/referrer for the visit (see lib/leadAttribution.ts). */
function Capture() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => { captureAttribution(); }, [pathname, search]);
  return null;
}

export default function AttributionCapture() { return <Suspense fallback={null}><Capture /></Suspense>; }
