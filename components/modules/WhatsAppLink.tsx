'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { trackWhatsAppConversion } from '@/lib/googleAds';

/** Explicitly opt in customer enquiry links; preserve native anchor navigation. */
export default function WhatsAppLink({ onClick, onAuxClick, ...props }: ComponentProps<'a'>) {
  function track(event: MouseEvent<HTMLAnchorElement>) {
    if (!event.defaultPrevented) trackWhatsAppConversion(event.nativeEvent);
  }

  return <a {...props} onClick={(event) => {
    onClick?.(event);
    track(event);
  }} onAuxClick={(event) => {
    onAuxClick?.(event);
    if (event.button === 1) track(event);
  }} />;
}
