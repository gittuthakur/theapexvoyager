'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { registerBottomOverlay } from '@/lib/bottomOverlay';
import type { TravelPackage } from '@/types';

export interface CompareTrayProps {
  packages: TravelPackage[];
  onRemove: (slug: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

export default function CompareTray({ packages, onRemove, onClear, onCompare }: CompareTrayProps) {
  const isVisible = packages.length > 0;

  useEffect(() => {
    if (!isVisible) return;
    return registerBottomOverlay();
  }, [isVisible]);

  return (
    <AnimatePresence>
      {packages.length > 0 ? (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 sm:px-6"
        >
          <div className="flex w-full max-w-2xl flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {packages.map((pkg) => (
                <span key={pkg.slug} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <SafeImage src={pkg.image} alt={pkg.name} fill sizes="48px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemove(pkg.slug)}
                    aria-label={`Remove ${pkg.name} from comparison`}
                    className="cursor-hover absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-slate-900/70 text-white"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            <p className="text-sm font-medium text-slate-600">
              {packages.length} journey{packages.length === 1 ? '' : 's'} selected
            </p>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClear}
                className="cursor-hover rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={packages.length < 2}
                onClick={onCompare}
                className="cursor-hover rounded-full bg-apex-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:bg-apex-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Compare Journeys
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
