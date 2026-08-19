'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { buildExperienceRequestMessage, buildWhatsAppLink } from '@/lib/whatsapp';
import type { Experience } from '@/types/experience';

export interface ExperienceBookingActionsProps {
  experience: Experience;
}

// Since there's no payment gateway yet, both CTAs below hand the request off to
// WhatsApp rather than attempting an online checkout — "Plan This Experience"
// captures a lead first (via the shared BookingRequestModal, same flow tours/stays
// use), "WhatsApp to Book" skips straight to a pre-filled chat for travelers who
// just want to ask a quick question.
export default function ExperienceBookingActions({ experience }: ExperienceBookingActionsProps) {
  const { openBookingRequest } = useBookingRequest();
  const [preferredDate, setPreferredDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [specialRequest, setSpecialRequest] = useState('');

  function handlePlanExperience() {
    openBookingRequest({
      type: 'experience',
      itemName: experience.title,
      destination: experience.location,
      dates: preferredDate || undefined,
      travelers: String(travelers),
      details: { category: experience.category, subCategory: experience.subCategory, specialRequest: specialRequest || undefined },
      buildWhatsAppMessage: (referenceId) =>
        buildExperienceRequestMessage({
          referenceId,
          title: experience.title,
          location: experience.location,
          dates: preferredDate || undefined,
          travelers: String(travelers),
          specialRequest: specialRequest || undefined
        })
    });
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

      <a
        href={quickWhatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-hover inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors duration-300 ease-in-out hover:bg-emerald-100"
      >
        <WhatsAppIcon className="h-4 w-4" />
        WhatsApp to Book
      </a>
    </div>
  );
}
