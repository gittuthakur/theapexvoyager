'use client';

import { ArrowRight, MessageSquare } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

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
        'cursor-hover fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-4 text-sm font-semibold text-white shadow-2xl shadow-emerald-500/20 transition hover:bg-emerald-400',
        className
      )}
    >
      <MessageSquare size={18} />
      Chat on WhatsApp
      <ArrowRight size={18} />
    </button>
  );
}
