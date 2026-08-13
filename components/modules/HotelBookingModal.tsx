'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { postJSON } from '@/lib/api';
import type { ContactFormStatus } from '@/types';

export interface HotelBookingModalProps {
  hotelName: string;
}

export default function HotelBookingModal({ hotelName }: HotelBookingModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ContactFormStatus>('idle');
  const [error, setError] = useState('');

  function handleClose() {
    setOpen(false);
    setStatus('idle');
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      hotelName,
      userName: form.get('userName'),
      email: form.get('email'),
      phone: form.get('phone'),
      checkInDate: form.get('checkInDate'),
      checkOutDate: form.get('checkOutDate'),
      guests: form.get('guests')
    };

    try {
      await postJSON('/api/hotel-bookings', payload);
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
            <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
            <h3 className="text-xl font-semibold text-white">Booking request received!</h3>
            <p className="text-slate-300">
              Your booking request for <strong>{hotelName}</strong> has been received and is confirmed. A confirmation email is on its way to you.
            </p>
            <Button type="button" className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" name="userName" required />
            <Input label="Email" name="email" type="email" required />
            <Input label="Phone" name="phone" type="tel" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Check-in date" name="checkInDate" type="date" required />
              <Input label="Check-out date" name="checkOutDate" type="date" required />
            </div>
            <Input label="Guests" name="guests" type="number" min={1} defaultValue={1} required />

            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Submitting...' : 'Confirm Booking Request'}
            </Button>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </form>
        )}
      </Modal>
    </>
  );
}
