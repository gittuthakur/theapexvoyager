'use client';

import { useInquiryModal, type InquirySelection } from '@/components/modules/WhatsAppInquiryModal';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export interface WhatsAppEnquireButtonProps {
  selection: InquirySelection;
  label?: string;
  className?: string;
}

export default function WhatsAppEnquireButton({ selection, label = 'Customise on WhatsApp', className }: WhatsAppEnquireButtonProps) {
  const { openInquiryModal } = useInquiryModal();

  return (
    <button
      type="button"
      onClick={() => openInquiryModal(selection)}
      className={cn(
        'cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]',
        className
      )}
    >
      <WhatsAppIcon size={18} />
      {label}
    </button>
  );
}
