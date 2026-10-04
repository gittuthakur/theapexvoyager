'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/leadAttribution';

/** Renders nothing; records first-touch UTM/referrer for the visit (see lib/leadAttribution.ts). */
export default function AttributionCapture() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}
