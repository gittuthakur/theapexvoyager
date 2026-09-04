'use client';

import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { postJSON } from '@/lib/api';
import { buildBookingMessage, buildWhatsAppLink } from '@/lib/whatsapp';
import type { BookingRequestType } from '@/models/BookingRequest';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

// Matches lib/bookingId.ts's generateBookingId() output ("TAP-" + digits) across every
// booking type this shared modal serves (Journeys/Trip Planner, Transport, Experts, …).
// Guards against a malformed/unexpected API response shape (missing, non-string, blank,
// or an object/array) being treated as a successful booking — without this, a 2xx
// response with no usable reference renders a "Request received" success screen with a
// literal "reference undefined"/"reference null" baked into the WhatsApp message text.
function isValidReferenceId(value: unknown): value is string {
  return typeof value === 'string' && /^TAP-\d+$/.test(value.trim());
}

export interface BookingRequestInput {
  type: BookingRequestType;
  /** What's being booked/enquired about — a hotel name, package name, vehicle type, expert name, etc. */
  itemName: string;
  destination?: string;
  dates?: string;
  travelers?: string;
  details?: Record<string, unknown>;
  /** Overrides the generic reference-id message with a richer, structured summary (e.g. the trip planner's full journey breakdown) — receives the reference ID once the save succeeds. */
  buildWhatsAppMessage?: (referenceId: string) => string;
}

interface BookingRequestContextValue {
  openBookingRequest: (input: BookingRequestInput) => void;
}

const BookingRequestContext = createContext<BookingRequestContextValue | null>(null);

// The single "generate a TAP-XXXXX reference, save it, then hand off to WhatsApp"
// sequence used by every booking-capable tab (Stays, Journeys, Experiences,
// Transport, Travel Experts) — kept in one place instead of duplicated per CTA.
// Generalizes the same save-then-redirect shape already proven by WhatsAppInquiryModal.
export function useBookingRequest(): BookingRequestContextValue {
  const context = useContext(BookingRequestContext);
  if (!context) {
    throw new Error('useBookingRequest must be used within a BookingRequestProvider');
  }
  return context;
}

type Status = 'form' | 'review' | 'submitting' | 'success';

export function BookingRequestProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<BookingRequestInput | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  function openBookingRequest(next: BookingRequestInput) {
    setInput(next);
    setName('');
    setPhone('');
    setEmail('');
    setStatus('form');
    setErrorMessage('');
    setReferenceId('');
    setWhatsappUrl('');
  }

  function close() {
    setInput(null);
  }

/** Customer details are collected first, then reviewed against the trip context
   *  already captured (route/dates/travelers) before the MongoDB write actually
   *  happens — so a mis-typed phone number or wrong date is caught before an enquiry
   *  reference is generated, not after. */
  function handleContinueToReview(event: FormEvent) {
    event.preventDefault();
    if (!input) return;

    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Name and phone are required.');
      return;
    }

    setErrorMessage('');
    setStatus('review');
  }

  async function handleConfirmSubmit() {
    if (!input) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const { referenceId: newReferenceId } = await postJSON<{ referenceId: unknown }>('/api/booking-requests', {
        type: input.type,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        itemName: input.itemName,
        destination: input.destination,
        dates: input.dates,
        travelers: input.travelers,
        details: input.details
      });

      if (!isValidReferenceId(newReferenceId)) {
        throw new Error('Booking request succeeded but returned no usable reference ID');
      }

      const messageText = input.buildWhatsAppMessage
        ? input.buildWhatsAppMessage(newReferenceId)
        : buildBookingMessage({
            referenceId: newReferenceId,
            type: input.type,
            itemName: input.itemName,
            dates: input.dates,
            travelers: input.travelers
          });

      setReferenceId(newReferenceId);
      setWhatsappUrl(buildWhatsAppLink({ messageText }));
      setStatus('success');
    } catch (error) {
      console.error('Failed to save booking request', error);
      setStatus('review');
      setErrorMessage('Something went wrong — please try again, or message us directly on WhatsApp.');
    }
  }

  return (
    <BookingRequestContext.Provider value={{ openBookingRequest }}>
      {children}
      {input ? (
        <FloatingOverlay
          open
          onClose={close}
          labelledBy="booking-request-modal-title"
          overlayClassName="bg-slate-950/70 backdrop-blur-sm"
          panelClassName="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-glow"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">
                {status === 'success' ? 'Request received' : status === 'review' || status === 'submitting' ? 'Review your request' : 'Request to book'}
              </p>
              <h3 id="booking-request-modal-title" className="mt-1 text-xl font-bold text-slate-900">
                {input.itemName}
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

          {status === 'success' ? (
            <div className="mt-5 space-y-4 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <div>
                <p className="text-sm text-slate-600">Your booking reference is</p>
                <p className="mt-1 text-2xl font-bold tracking-wide text-slate-900">{referenceId}</p>
              </div>
              <p className="text-sm text-slate-600">
                Send us the pre-filled message on WhatsApp and our team will confirm availability and pricing directly with
                you.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="cursor-hover flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]"
              >
                <WhatsAppIcon size={16} />
                Continue on WhatsApp
              </a>
            </div>
          ) : status === 'review' || status === 'submitting' ? (
            <div className="mt-5 space-y-4">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">{input.itemName}</p>
                {input.destination ? (
                  <p className="text-slate-600">
                    <span className="text-slate-500">Route / Destination: </span>
                    {input.destination}
                  </p>
                ) : null}
                {input.dates ? (
                  <p className="text-slate-600">
                    <span className="text-slate-500">Dates: </span>
                    {input.dates}
                  </p>
                ) : null}
                {input.travelers ? (
                  <p className="text-slate-600">
                    <span className="text-slate-500">Travelers: </span>
                    {input.travelers}
                  </p>
                ) : null}
                <hr className="border-slate-200" />
                <p className="text-slate-600">
                  <span className="text-slate-500">Name: </span>
                  {name}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Phone: </span>
                  {phone}
                </p>
                {email ? (
                  <p className="text-slate-600">
                    <span className="text-slate-500">Email: </span>
                    {email}
                  </p>
                ) : null}
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-red-500">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('form')}
                  disabled={status === 'submitting'}
                  className="cursor-hover rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={status === 'submitting'}
                  className="cursor-hover rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'submitting' ? 'Sending…' : 'Confirm & Submit Enquiry'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleContinueToReview} className="mt-5 space-y-4">
              <div>
                <label htmlFor="booking-request-name" className="text-xs text-slate-500">
                  Name
                </label>
                <input
                  id="booking-request-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
              <div>
                <label htmlFor="booking-request-phone" className="text-xs text-slate-500">
                  Phone
                </label>
                <input
                  id="booking-request-phone"
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
              <div>
                <label htmlFor="booking-request-email" className="text-xs text-slate-500">
                  Email (optional)
                </label>
                <input
                  id="booking-request-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-red-500">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                className="cursor-hover flex w-full items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
              >
                Review Request
              </button>
            </form>
          )}
        </FloatingOverlay>
      ) : null}
    </BookingRequestContext.Provider>
  );
}
