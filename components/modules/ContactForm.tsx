'use client';

import { FormEvent, useState } from 'react';
import { glassCardClass } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { postJSON } from '@/lib/api';
import type { ContactFormStatus } from '@/types';

export interface ContactFormProps {
  apiEndpoint?: string;
  onSuccess?: () => void;
}

export default function ContactForm({ apiEndpoint = '/api/contact', onSuccess }: ContactFormProps) {
  const [status, setStatus] = useState<ContactFormStatus>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      message: form.get('message')
    };

    try {
      await postJSON(apiEndpoint, payload);
      setStatus('success');
      setMessage('Thanks! We received your message and will respond shortly.');
      event.currentTarget.reset();
      onSuccess?.();
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again or write to us directly.');
    }
  }

  return (
    <form className={glassCardClass(false, 'space-y-6 p-8')} onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" name="name" required />
        <Input label="Email" name="email" type="email" required />
      </div>
      <Input label="Phone" name="phone" type="tel" />
      <Textarea label="Message" name="message" rows={5} required />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </Button>
        {message ? (
          <p className={status === 'error' ? 'text-sm text-rose-400' : 'text-sm text-slate-300'}>{message}</p>
        ) : null}
      </div>
    </form>
  );
}
