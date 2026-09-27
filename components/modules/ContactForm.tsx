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
    if (status === 'sending') return;
    const formElement = event.currentTarget;
    setStatus('sending');

    const form = new FormData(formElement);
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
      formElement.reset();
      onSuccess?.();
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again or write to us directly.');
    }
  }

  return (
    <form className={glassCardClass(false, 'space-y-6 p-8')} onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name (required)" name="name" maxLength={200} autoComplete="name" required />
        <Input label="Email (required)" name="email" type="email" maxLength={200} autoComplete="email" required />
      </div>
      <Input label="Phone (optional)" name="phone" type="tel" maxLength={30} autoComplete="tel" />
      <Textarea label="Message (required)" name="message" rows={5} maxLength={5000} required />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </Button>
        {message ? (
          <p role={status === 'error' ? 'alert' : 'status'} className={status === 'error' ? 'text-sm text-rose-500' : 'text-sm text-slate-600'}>{message}</p>
        ) : null}
      </div>
    </form>
  );
}
