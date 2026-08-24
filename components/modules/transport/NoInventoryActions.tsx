import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export interface NoInventoryActionsProps {
  onRequestCustomVehicle: () => void;
  /** Defaults to "Request a Custom Vehicle" — override for e.g. "Request Local Transport". */
  requestLabel?: string;
  modifyHref?: string;
  modifyLabel?: string;
}

/**
 * The 3 actions a "we couldn't find a verified match" state should always offer —
 * shared by every catalog section's empty state so a dead end never loses the lead:
 * request a custom vehicle (still captures it via the existing BookingRequestModal),
 * talk to a human on WhatsApp right now, or go back and change the search.
 */
export default function NoInventoryActions({ onRequestCustomVehicle, requestLabel = 'Request a Custom Vehicle', modifyHref = '#transport-hero-search', modifyLabel = 'Modify Search' }: NoInventoryActionsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onRequestCustomVehicle}
        className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
      >
        {requestLabel}
      </button>
      <a
        href={buildWhatsAppLink({ messageText: 'Hi! I need help finding suitable transport for my trip.' })}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]"
      >
        <WhatsAppIcon size={16} />
        WhatsApp Travel Expert
      </a>
      <a
        href={modifyHref}
        className="cursor-hover inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
      >
        {modifyLabel}
      </a>
    </div>
  );
}
