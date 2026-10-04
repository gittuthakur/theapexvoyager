'use client';

import { useState, type FormEvent } from 'react';

const inputCls = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/internal/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full navigation so the server re-reads the session cookie
      if (response.ok) { window.location.href = '/internal/leads'; return; }
      setError(response.status === 429 ? 'Too many attempts. Please wait a few minutes and try again.' : response.status === 401 ? 'Invalid email or password.' : 'Unable to sign in right now.');
    } catch {
      setError('Unable to sign in right now.');
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-12 text-slate-900">
      <h1 className="text-2xl font-bold">Internal sign in</h1>
      <p className="mt-1 text-sm text-slate-600">Authorised staff only.</p>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4" noValidate>
        <label className="block text-sm font-medium">Email
          <input name="email" type="email" autoComplete="username" maxLength={200} className={`${inputCls} mt-1`} />
        </label>
        <label className="block text-sm font-medium">Password
          <input name="password" type="password" autoComplete="current-password" maxLength={256} className={`${inputCls} mt-1`} />
        </label>
        {error ? <p role="alert" className="break-words rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
