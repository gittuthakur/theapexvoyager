'use client';

import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

export interface NewsletterBannerProps {
  heading?: string;
  subtitle?: string;
}

export default function NewsletterBanner({
  heading = 'Get Travel Inspiration in Your Inbox',
  subtitle = 'Get exclusive travel guides, hidden gems and special offers.'
}: NewsletterBannerProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail('');
  }

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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            aria-label="Email address"
            className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-md text-slate-900 outline-none transition focus:border-apex-400"
          />
          <button
            type="submit"
            className="cursor-hover inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-apex-500 px-6 py-3 text-md font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Subscribe
          </button>
        </form>
      </div>

      {submitted ? <p className="mt-4 text-center text-sm text-emerald-600 sm:text-right">Thanks — you're on the list!</p> : null}
    </div>
  );
}
