'use client';

import WhatsAppEnquireButton from '@/components/modules/WhatsAppEnquireButton';
import { CATEGORY_TO_STAY_TYPE } from '@/types/stay';
import { siteConfig } from '@/config/site.config';
import type { HotelPackage } from '@/types';

export interface HotelBookingModalProps {
  hotel: HotelPackage;
}

// Was its own "Plan This Stay" -> navigateToBooking(...) -> /plan-my-journey wizard,
// with a second, never-opened internal <Modal>/form (dead code — nothing ever set its
// `open` state to true). Investigated 2026-09: /plan-my-journey's own final step
// (components/modules/trip-planner/ChoiceCard.tsx) builds its WhatsApp handoff via
// buildJourneyRequestMessage — the same "estimated pricing, WhatsApp-lead, no live
// inventory/pricing/payment" pattern as every other flow in this app, not a genuinely
// live booking system. So routing a curated Stay's own CTA through that multi-step,
// destination/dates/travellers/budget/transport/experiences wizard added friction
// without adding any real capability this simpler, purpose-built Stay enquiry flow
// doesn't already have. Now a thin wrapper over the exact same shared
// WhatsAppEnquireButton/WhatsAppInquiryModal flow every Google-Places-backed Stay
// already uses — so a curated property that becomes publiclyListed in the future
// (see lib/hotels.ts) gets the identical honest "Check Price & Availability" CTA,
// disclaimer, fields and message automatically, with zero further code changes.
export default function HotelBookingModal({ hotel }: HotelBookingModalProps) {
  return (
    <WhatsAppEnquireButton
      className="w-full"
      label="Check Price & Availability"
      selection={{
        name: hotel.title,
        type: 'stay',
        stayType: CATEGORY_TO_STAY_TYPE[hotel.category],
        slug: hotel.slug,
        location: hotel.location,
        url: `${siteConfig.url}/stays/${hotel.slug}`
      }}
    />
  );
}
