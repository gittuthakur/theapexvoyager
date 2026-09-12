'use client';

import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { trackWhatsAppConversion } from '@/lib/googleAds';
import { STAY_TYPE_LABELS, type StayType } from '@/types/stay';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export interface InquirySelection {
  name: string;
  type: 'stay' | 'destination';
  stayType?: StayType;
  /** Stable slug for the enquired-about entity itself (the stay's slug, or the destination's slug) — lets a lead be traced back to a real record instead of just a display-name string. */
  slug?: string;
  /** The destination this entity belongs to, when known and distinct from `slug` (e.g. a stay's parent destination). */
  destinationSlug?: string;
}

interface InquiryContextValue {
  openInquiryModal: (selection: InquirySelection) => void;
}

const InquiryContext = createContext<InquiryContextValue | null>(null);

// Every stay/destination CTA that should lead with a WhatsApp conversation (rather
// than the existing internal booking flow) calls this instead of linking out directly
// — keeps the "save to Mongo, then redirect to WhatsApp with a prefilled message"
// sequence in one place instead of duplicated at every call site.
export function useInquiryModal(): InquiryContextValue {
  const context = useContext(InquiryContext);
  if (!context) {
    throw new Error('useInquiryModal must be used within a WhatsAppInquiryProvider');
  }
  return context;
}

export function WhatsAppInquiryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<InquirySelection | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function openInquiryModal(next: InquirySelection) {
    setSelection(next);
    setName('');
    setPhone('');
    setDate('');
    setStatus('idle');
    setErrorMessage('');
  }

  function close() {
    setSelection(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selection) return;

    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Name and phone are required.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          selection: selection.name,
          selectionType: selection.type,
          stayType: selection.stayType,
          slug: selection.slug,
          destinationSlug: selection.destinationSlug,
          sourcePage: pathname,
          date: date || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Inquiry save failed with status ${response.status}`);
      }

      const stayLabel = selection.stayType ? ` (${STAY_TYPE_LABELS[selection.stayType]})` : '';
      const datePart = date ? ` Preferred date: ${date}.` : '';
      const messageText = `Hi, I am interested in booking the ${selection.name}${stayLabel}.${datePart}`;

      trackWhatsAppConversion(event.nativeEvent);
      window.open(buildWhatsAppLink({ messageText }), '_blank', 'noopener,noreferrer');
      close();
    } catch (error) {
      console.error('Failed to save inquiry', error);
      setStatus('error');
      setErrorMessage('Something went wrong — please try again, or message us directly on WhatsApp.');
    }
  }

  return (
    <InquiryContext.Provider value={{ openInquiryModal }}>
      {children}
      {selection ? (
        <FloatingOverlay
          open
          onClose={close}
          labelledBy="inquiry-modal-title"
          overlayClassName="bg-black/70 backdrop-blur-sm"
          panelClassName="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-glow"
        >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Enquire on WhatsApp</p>
                <h3 id="inquiry-modal-title" className="mt-1 text-xl font-bold text-slate-900">
                  {selection.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="cursor-hover rounded-full p-1 text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="inquiry-name" className="text-xs text-slate-500">
                  Name
                </label>
                <input
                  id="inquiry-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
              <div>
                <label htmlFor="inquiry-phone" className="text-xs text-slate-500">
                  Phone
                </label>
                <input
                  id="inquiry-phone"
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
              <div>
                <label htmlFor="inquiry-date" className="text-xs text-slate-500">
                  Preferred date (optional)
                </label>
                <input
                  id="inquiry-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>

              {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="cursor-hover flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                <WhatsAppIcon size={16} />
                {status === 'submitting' ? 'Sending…' : 'Continue on WhatsApp'}
              </button>
            </form>
        </FloatingOverlay>
      ) : null}
    </InquiryContext.Provider>
  );
}
