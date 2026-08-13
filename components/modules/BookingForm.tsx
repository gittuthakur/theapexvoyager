'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { postJSON } from '@/lib/api';
import type { ContactFormStatus } from '@/types';

export interface BookingFormProps {
  tourSlug: string;
  price: string;
}

export default function BookingForm({ tourSlug, price }: BookingFormProps) {
  const [status, setStatus] = useState<ContactFormStatus>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');

    const form = new FormData(event.currentTarget);
    const payload = {
      tourSlug,
      fullName: form.get('fullName'),
      email: form.get('email'),
      phone: form.get('phone'),
      dates: form.get('dates'),
      guests: form.get('guests')
    };

    try {
      await postJSON('/api/bookings', payload);
      setStatus('success');
      setMessage('Booking request received! Our team will confirm availability shortly.');
      event.currentTarget.reset();
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again or contact us directly.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Ready to confirm?</p>
      <p className="text-3xl font-semibold text-white">{price}</p>

      <Input label="Full name" name="fullName" required />
      <Input label="Email" name="email" type="email" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" name="phone" type="tel" />
        <Input label="Guests" name="guests" type="number" min={1} defaultValue={1} />
      </div>
      <Input label="Preferred dates" name="dates" placeholder="e.g. 12–21 Oct 2026" />

      <Button type="submit" className="w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting...' : 'Confirm Booking Request'}
      </Button>

      {message ? (
        <p className={status === 'error' ? 'text-sm text-rose-400' : 'text-sm text-slate-300'}>{message}</p>
      ) : null}
    </form>
  );
}
