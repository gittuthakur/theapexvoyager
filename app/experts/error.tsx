'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function ExpertsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Travel Experts page failed to render', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-14 sm:px-10 lg:px-16">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-glow">
        <p className="text-lg font-semibold text-slate-900">We couldn&apos;t load our travel experts right now.</p>
        <p className="mt-3 text-sm text-slate-600">Something went wrong loading this page. Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          className="cursor-hover mt-6 inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/20 transition-all duration-300 ease-in-out hover:bg-apex-400"
        >
          <RotateCcw size={16} />
          Try again
        </button>
      </div>
    </main>
  );
}
