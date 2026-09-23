'use client';

import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { buildWhatsAppLink, buildStayEnquiryMessage, todayDateString, isValidIndianPhone, formatDisplayDate } from '@/lib/whatsapp';
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
  /** Real property address/location (e.g. a Google Place's formattedAddress, or a curated Hotel's location) — `type: 'stay'` only. Never fabricated; left undefined when the source record has none. */
  location?: string;
  /** Absolute URL of this exact entity's own page (never the page the CTA was clicked from, e.g. a listing/search page) — `type: 'stay'` only, used so the team can open the exact property. */
  url?: string;
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

type StayField = 'name' | 'phone' | 'checkIn' | 'checkOut' | 'adults' | 'rooms' | 'children';
type StayFieldErrors = Partial<Record<StayField, string>>;

export function WhatsAppInquiryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<InquirySelection | null>(null);

  // Shared by both flows.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Destination flow only — unchanged from before this feature.
  const [date, setDate] = useState('');

  // Stay flow only — this is the improved, "price/availability enquiry, not an instant
  // booking" flow. Sensible non-zero defaults (1 adult, 1 room) so a first-time visitor
  // isn't shown a validation error before touching anything; children genuinely can be 0.
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('1');
  const [rooms, setRooms] = useState('1');
  // Named distinctly from the component's own `children` prop above.
  const [childrenGuests, setChildrenGuests] = useState('0');
  const [fieldErrors, setFieldErrors] = useState<StayFieldErrors>({});

  function openInquiryModal(next: InquirySelection) {
    setSelection(next);
    setName('');
    setPhone('');
    setDate('');
    setCheckIn('');
    setCheckOut('');
    setAdults('1');
    setChildrenGuests('0');
    setRooms('1');
    setStatus('idle');
    setErrorMessage('');
    setFieldErrors({});
  }

  function close() {
    setSelection(null);
  }

  function validateStayFields(): StayFieldErrors {
    const errors: StayFieldErrors = {};
    const today = todayDateString();

    if (!name.trim()) errors.name = 'Name is required.';
    if (!phone.trim()) errors.phone = 'Phone is required.';
    else if (!isValidIndianPhone(phone)) errors.phone = 'Enter a valid Indian mobile number.';

    if (!checkIn) errors.checkIn = 'Check-in date is required.';
    else if (checkIn < today) errors.checkIn = 'Check-in cannot be earlier than today.';

    if (!checkOut) errors.checkOut = 'Check-out date is required.';
    else if (checkIn && checkOut <= checkIn) errors.checkOut = 'Check-out must be later than check-in.';

    const adultsCount = Number(adults);
    if (adults.trim() === '' || !Number.isFinite(adultsCount) || adultsCount < 1) {
      errors.adults = 'At least 1 adult is required.';
    }

    const roomsCount = Number(rooms);
    if (rooms.trim() === '' || !Number.isFinite(roomsCount) || roomsCount < 1) {
      errors.rooms = 'At least 1 room is required.';
    }

    if (childrenGuests.trim() !== '') {
      const childrenCount = Number(childrenGuests);
      if (!Number.isFinite(childrenCount) || childrenCount < 0) {
        errors.children = 'Children cannot be negative.';
      }
    }

    return errors;
  }

  async function handleDestinationSubmit(event: FormEvent) {
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

  async function handleStaySubmit(event: FormEvent) {
    if (!selection) return;

    const errors = validateStayFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
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
          date: `${checkIn} to ${checkOut}`
        })
      });

      if (!response.ok) {
        throw new Error(`Inquiry save failed with status ${response.status}`);
      }

      const messageText = buildStayEnquiryMessage({
        propertyName: selection.name,
        stayType: selection.stayType ? STAY_TYPE_LABELS[selection.stayType] : '',
        location: selection.location ?? '',
        checkIn: formatDisplayDate(checkIn),
        checkOut: formatDisplayDate(checkOut),
        adults,
        children: childrenGuests.trim() === '' ? '0' : childrenGuests,
        rooms,
        customerName: name.trim(),
        phone: phone.trim(),
        propertyUrl: selection.url ?? ''
      });

      trackWhatsAppConversion(event.nativeEvent);
      window.open(buildWhatsAppLink({ messageText }), '_blank', 'noopener,noreferrer');
      close();
    } catch (error) {
      console.error('Failed to save inquiry', error);
      setStatus('error');
      setErrorMessage('Something went wrong — please try again, or message us directly on WhatsApp.');
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selection) return;
    if (selection.type === 'stay') {
      void handleStaySubmit(event);
    } else {
      void handleDestinationSubmit(event);
    }
  }

  const isStay = selection?.type === 'stay';

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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">
                  {isStay ? 'STAY ENQUIRY' : 'Enquire on WhatsApp'}
                </p>
                <h3 id="inquiry-modal-title" className="mt-1 text-xl font-bold text-slate-900">
                  {selection.name}
                </h3>
                {isStay ? (
                  <p className="mt-2 text-sm text-slate-600">
                    This is an enquiry, not an instant booking. Price and availability will be confirmed by our team.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="cursor-hover shrink-0 rounded-full p-1 text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div>
                <label htmlFor="inquiry-name" className="text-xs text-slate-500">
                  Name
                </label>
                <input
                  id="inquiry-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={isStay && Boolean(fieldErrors.name)}
                  aria-describedby={isStay && fieldErrors.name ? 'inquiry-name-error' : undefined}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                />
                {isStay && fieldErrors.name ? (
                  <p id="inquiry-name-error" role="alert" className="mt-1 text-xs text-red-500">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="inquiry-phone" className="text-xs text-slate-500">
                  Phone
                </label>
                <input
                  id="inquiry-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  aria-invalid={isStay && Boolean(fieldErrors.phone)}
                  aria-describedby={isStay && fieldErrors.phone ? 'inquiry-phone-error' : undefined}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                />
                {isStay && fieldErrors.phone ? (
                  <p id="inquiry-phone-error" role="alert" className="mt-1 text-xs text-red-500">
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </div>

              {isStay ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="inquiry-checkin" className="text-xs text-slate-500">
                        Check-in
                      </label>
                      <input
                        id="inquiry-checkin"
                        required
                        type="date"
                        min={todayDateString()}
                        value={checkIn}
                        onChange={(event) => setCheckIn(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.checkIn)}
                        aria-describedby={fieldErrors.checkIn ? 'inquiry-checkin-error' : undefined}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                      />
                      {fieldErrors.checkIn ? (
                        <p id="inquiry-checkin-error" role="alert" className="mt-1 text-xs text-red-500">
                          {fieldErrors.checkIn}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label htmlFor="inquiry-checkout" className="text-xs text-slate-500">
                        Check-out
                      </label>
                      <input
                        id="inquiry-checkout"
                        required
                        type="date"
                        min={checkIn || todayDateString()}
                        value={checkOut}
                        onChange={(event) => setCheckOut(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.checkOut)}
                        aria-describedby={fieldErrors.checkOut ? 'inquiry-checkout-error' : undefined}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                      />
                      {fieldErrors.checkOut ? (
                        <p id="inquiry-checkout-error" role="alert" className="mt-1 text-xs text-red-500">
                          {fieldErrors.checkOut}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="inquiry-adults" className="text-xs text-slate-500">
                        Adults
                      </label>
                      <input
                        id="inquiry-adults"
                        required
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={adults}
                        onChange={(event) => setAdults(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.adults)}
                        aria-describedby={fieldErrors.adults ? 'inquiry-adults-error' : undefined}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                      />
                      {fieldErrors.adults ? (
                        <p id="inquiry-adults-error" role="alert" className="mt-1 text-xs text-red-500">
                          {fieldErrors.adults}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label htmlFor="inquiry-children" className="text-xs text-slate-500">
                        Children
                      </label>
                      <input
                        id="inquiry-children"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={childrenGuests}
                        onChange={(event) => setChildrenGuests(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.children)}
                        aria-describedby={fieldErrors.children ? 'inquiry-children-error' : undefined}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                      />
                      {fieldErrors.children ? (
                        <p id="inquiry-children-error" role="alert" className="mt-1 text-xs text-red-500">
                          {fieldErrors.children}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label htmlFor="inquiry-rooms" className="text-xs text-slate-500">
                        Rooms
                      </label>
                      <input
                        id="inquiry-rooms"
                        required
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={rooms}
                        onChange={(event) => setRooms(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.rooms)}
                        aria-describedby={fieldErrors.rooms ? 'inquiry-rooms-error' : undefined}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                      />
                      {fieldErrors.rooms ? (
                        <p id="inquiry-rooms-error" role="alert" className="mt-1 text-xs text-red-500">
                          {fieldErrors.rooms}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="inquiry-date" className="text-xs text-slate-500">
                    Preferred date (optional)
                  </label>
                  <input
                    id="inquiry-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-500"
                  />
                </div>
              )}

              {errorMessage ? (
                <p role="alert" className="text-sm text-red-500">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="cursor-hover flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-700"
              >
                <WhatsAppIcon size={16} />
                {status === 'submitting' ? 'Sending…' : isStay ? 'Send Enquiry on WhatsApp' : 'Continue on WhatsApp'}
              </button>
            </form>
        </FloatingOverlay>
      ) : null}
    </InquiryContext.Provider>
  );
}
