'use client';

import { useId, useState, type FormEvent } from 'react';
import { getAttribution } from '@/lib/leadAttribution';

export interface EnquiryPrefill {
  destination?: string;
  budget?: string;
  nights?: string;
  month?: string;
  travellers?: number;
  journeySlug?: string;
  journeyName?: string;
}

interface AssistantEnquiryFormProps {
  prefill: EnquiryPrefill;
  onDone: () => void;
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-apex-500 focus:outline-none focus:ring-2 focus:ring-apex-500/30';

export default function AssistantEnquiryForm({ prefill, onDone }: AssistantEnquiryFormProps) {
  const uid = useId();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? '').trim();
    const adults = field('adults');
    // The notes carry what the visitor told the assistant, so the team has the context. It never goes to the AI model.
    const context = [prefill.nights && `Nights: ${prefill.nights}`, prefill.month && `Month: ${prefill.month}`, prefill.journeyName && `About: ${prefill.journeyName}`]
      .filter(Boolean)
      .join('. ');
    const message = [field('message'), context].filter(Boolean).join('\n');

    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/assistant/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: field('name'),
          phone: field('phone') || undefined,
          email: field('email') || undefined,
          travelStartDate: field('date') || undefined,
          adults: adults ? Number(adults) : undefined,
          destination: field('destination') || undefined,
          budget: field('budget') || undefined,
          message: message || undefined,
          journeySlug: prefill.journeySlug,
          consent: form.get('consent') === 'on',
          company: field('company'),
          attribution: getAttribution()
        })
      });
      if (response.ok) {
        setStatus('sent');
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? 'We could not send your enquiry. Please try again.');
      setStatus('error');
    } catch {
      setError('We could not send your enquiry. Please check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="space-y-3 p-4 text-sm text-slate-700" role="status">
        <p className="font-semibold text-slate-900">Thank you, we have your enquiry.</p>
        <p>Our team will contact you to confirm dates, availability and hotels. This is an enquiry, not a booking, and no payment has been taken.</p>
        <button type="button" onClick={onDone} className="rounded-full bg-apex-500 px-4 py-2 text-sm font-semibold text-white hover:bg-apex-600">
          Back to chat
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4" noValidate>
      <p className="text-sm font-semibold text-slate-900">
        {prefill.journeyName ? `Enquire about ${prefill.journeyName}` : 'Tell our team about your trip'}
      </p>
      <p className="text-xs text-slate-500">These details go to our team only, not to the AI assistant.</p>

      <div>
        <label htmlFor={`${uid}-name`} className="mb-1 block text-xs font-medium text-slate-700">Name *</label>
        <input id={`${uid}-name`} name="name" required maxLength={200} autoComplete="name" className={inputClass} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-phone`} className="mb-1 block text-xs font-medium text-slate-700">Phone</label>
          <input id={`${uid}-phone`} name="phone" type="tel" maxLength={30} autoComplete="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1 block text-xs font-medium text-slate-700">Email</label>
          <input id={`${uid}-email`} name="email" type="email" maxLength={254} autoComplete="email" className={inputClass} />
        </div>
      </div>
      <p className="text-xs text-slate-500">Please give a phone number or an email.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-dest`} className="mb-1 block text-xs font-medium text-slate-700">Destination</label>
          <input id={`${uid}-dest`} name="destination" maxLength={200} defaultValue={prefill.destination ?? ''} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${uid}-date`} className="mb-1 block text-xs font-medium text-slate-700">Travel date</label>
          <input id={`${uid}-date`} name="date" type="date" min={today} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${uid}-adults`} className="mb-1 block text-xs font-medium text-slate-700">Travellers</label>
          <input id={`${uid}-adults`} name="adults" type="number" min={1} max={50} defaultValue={prefill.travellers ?? ''} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${uid}-budget`} className="mb-1 block text-xs font-medium text-slate-700">Budget</label>
          <input id={`${uid}-budget`} name="budget" maxLength={100} defaultValue={prefill.budget ?? ''} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-message`} className="mb-1 block text-xs font-medium text-slate-700">Anything else?</label>
        <textarea id={`${uid}-message`} name="message" rows={3} maxLength={800} className={inputClass} />
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>I agree that The Apex Voyager India may contact me about this enquiry.</span>
      </label>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-full bg-apex-500 px-5 py-2 text-sm font-semibold text-white hover:bg-apex-600 disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending...' : 'Send enquiry'}
        </button>
        <button type="button" onClick={onDone} className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
