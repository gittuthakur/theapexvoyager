'use client';

import { useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Send } from 'lucide-react';
import { postJSON, ApiError } from '@/lib/api';

export interface NewsletterBannerProps {
  heading?: string;
  subtitle?: string;
}

type Status = 'idle' | 'submitting' | 'subscribed' | 'already_subscribed' | 'error';

export default function NewsletterBanner({
  heading = 'Get Travel Inspiration in Your Inbox',
  subtitle = 'Get exclusive travel guides, hidden gems and special offers.'
}: NewsletterBannerProps) {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await postJSON<{ status: 'subscribed' | 'already_subscribed' }>('/api/newsletter', {
        email: email.trim(),
        sourcePage: pathname
      });
      setStatus(response.status);
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof ApiError ? error.message : 'Something went wrong — please try again.');
    }
  }

  const statusMessage =
    status === 'subscribed'
      ? "Thanks — you're on the list!"
      : status === 'already_subscribed'
        ? "You're already subscribed — thanks for being with us!"
        : status === 'error'
          ? errorMessage
          : null;

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-[1440px] flex flex-col items-center rounded-3xl gap-6 border border-slate-300 bg-slate-100 shadow-sm sm:px-10 sm:flex-row sm:justify-between p-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-apex-100 text-apex-600 sm:flex">
            <Send size={24} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{heading}</h2>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            disabled={status === 'submitting'}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            aria-label="Email address"
            aria-describedby={statusMessage ? 'newsletter-status' : undefined}
            className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-md text-slate-900 outline-none transition focus:border-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="cursor-hover inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-apex-500 px-6 py-3 text-md font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      </div>

      {statusMessage ? (
        <p
          id="newsletter-status"
          role="status"
          className={
            status === 'error'
              ? 'mt-4 text-center text-sm text-rose-600 sm:text-right'
              : 'mt-4 text-center text-sm text-emerald-600 sm:text-right'
          }
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
