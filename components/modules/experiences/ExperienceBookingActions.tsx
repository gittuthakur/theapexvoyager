'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useBookingNavigation } from '@/lib/bookingNavigation';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import WhatsAppLink from '@/components/modules/WhatsAppLink';
import type { Experience } from '@/types/experience';

export interface ExperienceBookingActionsProps {
  experience: Experience;
}

// "Plan This Experience" now hands off to the universal Plan My Journey flow
// (source=experience&slug=...) instead of the shared BookingRequestModal lead form, so
// the wizard opens already prefilled with this experience's destination/region. The
// date/travellers/special-request fields below are left in place for the traveler's own
// reference on this page, but — per the booking-context contract (identifiers only in
// the URL) — their values aren't carried into the wizard. The WhatsApp quick-contact
// button below creates no BookingRequest record (a plain wa.me deep link, same as
// WhatsAppButton.tsx elsewhere) — relabelled "Chat on WhatsApp" to match that sibling
// component's honest wording instead of the previous "WhatsApp to Book," which implied
// a completed booking action this button doesn't actually perform.
export default function ExperienceBookingActions({ experience }: ExperienceBookingActionsProps) {
  const { navigateToBooking } = useBookingNavigation();
  const [preferredDate, setPreferredDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [specialRequest, setSpecialRequest] = useState('');

  function handlePlanExperience() {
    navigateToBooking({ source: 'experience', slug: experience.slug });
  }

  const quickWhatsAppHref = buildWhatsAppLink({ tripTitle: experience.title, destination: experience.location });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input type="date" label="Preferred date" value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} />
        <Input
          type="number"
          min={1}
          max={experience.groupSizeMax}
          label="Travellers"
          value={travelers}
          onChange={(event) => setTravelers(Math.max(1, Number(event.target.value) || 1))}
        />
      </div>
      <Textarea
        label="Special request (optional)"
        placeholder="Dietary needs, accessibility, celebration details…"
        rows={2}
        value={specialRequest}
        onChange={(event) => setSpecialRequest(event.target.value)}
      />

      <Button type="button" onClick={handlePlanExperience} className="w-full">
        Plan This Experience <ArrowRight size={18} />
      </Button>

      <WhatsAppLink
        href={quickWhatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-hover inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors duration-300 ease-in-out hover:bg-emerald-100"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Chat on WhatsApp
      </WhatsAppLink>
    </div>
  );
}
