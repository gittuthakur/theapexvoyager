'use client';

import { ArrowRight } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export interface WhatsAppButtonProps {
  phoneNumber?: string;
  messageText?: string;
  tripTitle?: string;
  destination?: string;
  dates?: string;
  className?: string;
}

export default function WhatsAppButton({
  phoneNumber,
  messageText,
  tripTitle,
  destination,
  dates,
  className
}: WhatsAppButtonProps) {
  function openChat() {
    const url = buildWhatsAppLink({ phoneNumber, messageText, tripTitle, destination, dates });
    window.open(url, '_blank');
  }

  return (
    <button
      type="button"
      onClick={openChat}
      className={cn(
        'cursor-hover fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-4 font-semibold text-white shadow-2xl shadow-[#25D366]/20 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]',
        className
      )}
    >
      <WhatsAppIcon size={22} />
      Chat on WhatsApp
      <ArrowRight size={22} />
    </button>
  );
}
