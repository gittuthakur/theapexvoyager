'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { postJSON } from '@/lib/api';
import { buildBookingMessage, buildWhatsAppLink } from '@/lib/whatsapp';

export interface HotelBookingModalProps {
  hotelName: string;
  destination?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
}

type Status = 'form' | 'sending' | 'success' | 'error';

export default function HotelBookingModal({
  hotelName,
  destination,
  defaultCheckIn,
  defaultCheckOut,
  defaultGuests
}: HotelBookingModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('form');
  const [error, setError] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  function handleClose() {
    setOpen(false);
    setStatus('form');
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');

    const form = new FormData(event.currentTarget);
    const checkInDate = String(form.get('checkInDate') ?? '');
    const checkOutDate = String(form.get('checkOutDate') ?? '');
    const guests = String(form.get('guests') ?? '');

    try {
      const { referenceId: newReferenceId } = await postJSON<{ referenceId: string }>('/api/booking-requests', {
        type: 'stay',
        name: form.get('userName'),
        phone: form.get('phone'),
        email: form.get('email'),
        itemName: hotelName,
        destination,
        dates: `${checkInDate} to ${checkOutDate}`,
        travelers: `${guests} guest${guests === '1' ? '' : 's'}`,
        details: { checkInDate, checkOutDate, guests }
      });

      const messageText = buildBookingMessage({
        referenceId: newReferenceId,
        type: 'stay',
        itemName: hotelName,
        dates: `${checkInDate} to ${checkOutDate}`,
        travelers: `${guests} guest${guests === '1' ? '' : 's'}`
      });

      setReferenceId(newReferenceId);
      setWhatsappUrl(buildWhatsAppLink({ messageText }));
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again or contact us directly.');
    }
  }

  return (
    <>
      <Button type="button" className="w-full" onClick={() => setOpen(true)}>
        Book Now
      </Button>

      <Modal open={open} onClose={handleClose} title={status === 'success' ? undefined : `Book ${hotelName}`}>
        {status === 'success' ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <div>
              <p className="text-slate-600">Your booking reference is</p>
              <p className="mt-1 text-2xl font-bold tracking-wide text-slate-900">{referenceId}</p>
            </div>
            <p className="text-slate-600">
              Send us the pre-filled message on WhatsApp and our team will confirm availability and pricing for{' '}
              <strong>{hotelName}</strong> directly with you.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="cursor-hover flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]"
            >
              <WhatsAppIcon size={16} />
              Continue on WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" name="userName" required />
            <Input label="Email" name="email" type="email" required />
            <Input label="Phone" name="phone" type="tel" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Check-in date" name="checkInDate" type="date" defaultValue={defaultCheckIn} required />
              <Input label="Check-out date" name="checkOutDate" type="date" defaultValue={defaultCheckOut} required />
            </div>
            <Input label="Guests" name="guests" type="number" min={1} defaultValue={defaultGuests ?? 1} required />

            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Submitting...' : 'Get My Booking Reference'}
            </Button>

            {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          </form>
        )}
      </Modal>
    </>
  );
}
